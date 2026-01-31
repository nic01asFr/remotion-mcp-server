/**
 * BigRemotionMCP Configuration
 * 
 * Configuration is loaded from environment variables.
 * When running via BigMCP, storage config is injected automatically.
 */

import * as os from 'os';
import * as path from 'path';

export interface UrlOutputConfig {
  port: number;
  maxDiskBytes: number;
  maxFiles: number;
  ttlSeconds: number;
  baseUrl: string;
  serveDir: string;
}

export interface StorageOutputConfig {
  endpoint: string;
  apiKey: string;
}

export interface RenderConfig {
  concurrency: number;
  timeoutPerFrame: number;
  logLevel: 'verbose' | 'info' | 'warn' | 'error';
  workDir: string;
}

export interface Config {
  outputMode: 'url' | 'storage';
  url: UrlOutputConfig;
  storage: StorageOutputConfig;
  render: RenderConfig;
}

function getEnvString(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

function getEnvInt(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

// Get platform-appropriate temp directory
function getTempDir(): string {
  return path.join(os.tmpdir(), 'remotion-mcp');
}

export function loadConfig(): Config {
  // Determine output mode
  // If STORAGE_ENDPOINT is set (injected by BigMCP), use storage mode
  const storageEndpoint = getEnvString('STORAGE_ENDPOINT', '');
  const outputMode = storageEndpoint ? 'storage' : 'url';
  
  const tempDir = getTempDir();

  return {
    outputMode: outputMode as 'url' | 'storage',

    url: {
      port: getEnvInt('URL_PORT', 8081),
      maxDiskBytes: getEnvInt('URL_MAX_DISK_BYTES', 1024 * 1024 * 1024), // 1GB
      maxFiles: getEnvInt('URL_MAX_FILES', 100),
      ttlSeconds: getEnvInt('URL_TTL_SECONDS', 3600), // 1 hour
      baseUrl: getEnvString('URL_BASE_URL', ''),
      serveDir: getEnvString('URL_SERVE_DIR', path.join(tempDir, 'serve')),
    },

    storage: {
      endpoint: storageEndpoint,
      apiKey: getEnvString('STORAGE_API_KEY', ''),
    },

    render: {
      concurrency: getEnvInt('REMOTION_CONCURRENCY', 2),
      timeoutPerFrame: getEnvInt('REMOTION_TIMEOUT_PER_FRAME', 30000), // 30s
      logLevel: getEnvString('REMOTION_LOG_LEVEL', 'error') as Config['render']['logLevel'],
      workDir: getEnvString('REMOTION_WORK_DIR', path.join(tempDir, 'work')),
    },
  };
}

export const config = loadConfig();
