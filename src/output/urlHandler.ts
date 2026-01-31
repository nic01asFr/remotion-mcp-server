/**
 * URL Output Handler
 * 
 * Standalone mode: serves files locally via integrated HTTP server.
 */

import express, { Express, Request, Response } from 'express';
import { randomUUID, randomBytes } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Server } from 'http';
import {
  OutputHandler,
  FileData,
  OutputResult,
  OutputStatus,
} from './handler.js';
import { UrlOutputConfig } from '../config/index.js';

interface FileEntry {
  id: string;
  filename: string;
  filepath: string;
  token: string;
  mimeType: string;
  size: number;
  createdAt: number;
  expiresAt: number;
  lastAccessedAt: number;
  metadata?: Record<string, unknown>;
}

export class UrlHandler implements OutputHandler {
  private config: UrlOutputConfig;
  private app: Express;
  private server: Server | null = null;
  private files: Map<string, FileEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private ready = false;

  constructor(config: UrlOutputConfig) {
    this.config = config;
    this.app = express();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'ok', mode: 'url' });
    });

    this.app.get('/files/:filename', (req: Request, res: Response) => {
      const { filename } = req.params;
      const { token } = req.query;

      const entry = Array.from(this.files.values()).find(
        (f) => f.filename === filename
      );

      if (!entry) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      if (entry.token !== token) {
        res.status(403).json({ error: 'Invalid token' });
        return;
      }

      if (Date.now() > entry.expiresAt) {
        res.status(410).json({ error: 'File expired' });
        return;
      }

      entry.lastAccessedAt = Date.now();
      res.setHeader('Content-Type', entry.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${entry.filename}"`);
      res.sendFile(entry.filepath);
    });

    this.app.get('/status', (_req: Request, res: Response) => {
      res.json(this.getStatus());
    });
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.config.serveDir, { recursive: true });

    try {
      const existingFiles = await fs.readdir(this.config.serveDir);
      for (const file of existingFiles) {
        await fs.unlink(path.join(this.config.serveDir, file));
      }
    } catch {
      // Ignore
    }

    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.config.port, () => {
          console.error(`[UrlHandler] HTTP server on port ${this.config.port}`);
          this.ready = true;

          this.cleanupInterval = setInterval(() => {
            this.cleanup().catch(console.error);
          }, 5 * 60 * 1000);

          resolve();
        });

        this.server.on('error', reject);
      } catch (err) {
        reject(err);
      }
    });
  }

  async store(file: FileData): Promise<OutputResult> {
    if (!this.ready) {
      throw new Error('UrlHandler not initialized');
    }

    await this.enforceQuotas(file.buffer.length);

    const id = randomUUID();
    const token = randomBytes(16).toString('hex');
    const ext = this.getExtension(file.mimeType);
    const filename = `${id}${ext}`;
    const filepath = path.join(this.config.serveDir, filename);

    await fs.writeFile(filepath, file.buffer);

    const now = Date.now();
    const entry: FileEntry = {
      id,
      filename,
      filepath,
      token,
      mimeType: file.mimeType,
      size: file.buffer.length,
      createdAt: now,
      expiresAt: now + this.config.ttlSeconds * 1000,
      lastAccessedAt: now,
      metadata: file.metadata,
    };

    this.files.set(id, entry);

    const baseUrl = this.config.baseUrl || `http://localhost:${this.config.port}`;
    const url = `${baseUrl}/files/${filename}?token=${token}`;

    return {
      url,
      metadata: file.metadata,
      expiresAt: new Date(entry.expiresAt).toISOString(),
    };
  }

  getStatus(): OutputStatus {
    const diskUsageBytes = Array.from(this.files.values()).reduce(
      (sum, f) => sum + f.size,
      0
    );

    return {
      mode: 'url',
      ready: this.ready,
      details: {
        diskUsageBytes,
        fileCount: this.files.size,
        port: this.config.port,
      },
    };
  }

  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(() => {
          console.error('[UrlHandler] HTTP server closed');
          resolve();
        });
      });
    }
  }

  private async enforceQuotas(incomingSize: number): Promise<void> {
    await this.cleanup();

    let currentSize = Array.from(this.files.values()).reduce(
      (sum, f) => sum + f.size,
      0
    );

    if (incomingSize > this.config.maxDiskBytes) {
      throw new Error(`File too large: ${incomingSize} bytes`);
    }

    while (currentSize + incomingSize > this.config.maxDiskBytes && this.files.size > 0) {
      const lru = this.findLRU();
      if (lru) {
        await this.removeFile(lru.id);
        currentSize -= lru.size;
      } else {
        break;
      }
    }

    while (this.files.size >= this.config.maxFiles) {
      const lru = this.findLRU();
      if (lru) {
        await this.removeFile(lru.id);
      } else {
        break;
      }
    }
  }

  private async cleanup(): Promise<void> {
    const now = Date.now();
    const expired: string[] = [];

    for (const [id, entry] of this.files) {
      if (now > entry.expiresAt) {
        expired.push(id);
      }
    }

    for (const id of expired) {
      await this.removeFile(id);
    }
  }

  private findLRU(): FileEntry | null {
    let lru: FileEntry | null = null;
    for (const entry of this.files.values()) {
      if (!lru || entry.lastAccessedAt < lru.lastAccessedAt) {
        lru = entry;
      }
    }
    return lru;
  }

  private async removeFile(id: string): Promise<void> {
    const entry = this.files.get(id);
    if (!entry) return;

    try {
      await fs.unlink(entry.filepath);
    } catch {
      // Ignore
    }

    this.files.delete(id);
  }

  private getExtension(mimeType: string): string {
    const map: Record<string, string> = {
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'image/gif': '.gif',
      'image/png': '.png',
      'image/jpeg': '.jpg',
    };
    return map[mimeType] || '.bin';
  }
}
