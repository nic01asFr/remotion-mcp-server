/**
 * Storage Output Handler
 * 
 * Integrated mode: delegates storage to external Storage Service.
 * The Storage Service (e.g., BigFolder) handles:
 * - File storage
 * - URL generation
 * - User namespace isolation (via API key)
 * - Quota management
 */

import {
  OutputHandler,
  FileData,
  OutputResult,
  OutputStatus,
} from './handler.js';
import { StorageOutputConfig } from '../config/index.js';

/**
 * Simple MCP Client for calling storage_store tool
 */
class StorageClient {
  private endpoint: string;
  private apiKey: string;

  constructor(endpoint: string, apiKey: string) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
  }

  async callTool(name: string, params: Record<string, unknown>): Promise<{ url: string }> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name,
          arguments: params,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Storage service error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json() as {
      result?: {
        content?: Array<{ type: string; text?: string }>;
      };
      error?: { message: string };
    };

    if (result.error) {
      throw new Error(`Storage service error: ${result.error.message}`);
    }

    // Extract URL from response
    // Expected format: { content: [{ type: "text", text: "https://..." }] }
    const content = result.result?.content;
    if (!content || content.length === 0) {
      throw new Error('Invalid storage service response: no content');
    }

    const textContent = content.find((c) => c.type === 'text');
    if (!textContent || !textContent.text) {
      throw new Error('Invalid storage service response: no URL');
    }

    return { url: textContent.text };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/list',
          params: {},
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export class StorageHandler implements OutputHandler {
  private config: StorageOutputConfig;
  private client: StorageClient | null = null;
  private ready = false;
  private error: string | null = null;

  constructor(config: StorageOutputConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (!this.config.endpoint) {
      this.error = 'No storage endpoint configured';
      throw new Error(this.error);
    }

    if (!this.config.apiKey) {
      this.error = 'No storage API key configured';
      throw new Error(this.error);
    }

    this.client = new StorageClient(this.config.endpoint, this.config.apiKey);

    // Test connection
    const healthy = await this.client.healthCheck();
    if (!healthy) {
      this.error = 'Cannot connect to storage service';
      throw new Error(this.error);
    }

    console.log(`[StorageHandler] Connected to ${this.config.endpoint}`);
    this.ready = true;
  }

  async store(file: FileData): Promise<OutputResult> {
    if (!this.ready || !this.client) {
      throw new Error('StorageHandler not initialized');
    }

    // Call storage_store tool
    const result = await this.client.callTool('storage_store', {
      data: file.buffer.toString('base64'),
      mimeType: file.mimeType,
      filename: file.filename,
    });

    return {
      url: result.url,
      metadata: file.metadata,
    };
  }

  getStatus(): OutputStatus {
    return {
      mode: 'storage',
      ready: this.ready,
      details: {
        endpoint: this.config.endpoint,
        error: this.error || undefined,
      },
    };
  }

  async shutdown(): Promise<void> {
    // Nothing to cleanup for storage handler
    console.log('[StorageHandler] Shutdown');
  }
}
