/**
 * Output Handler Interface
 * 
 * Defines the contract for storing rendered files and returning URLs.
 * Two implementations:
 * - UrlHandler: Serves files locally via HTTP (standalone mode)
 * - StorageHandler: Delegates to external Storage Service (integrated mode)
 */

export interface FileData {
  /** File content as Buffer */
  buffer: Buffer;
  
  /** MIME type (e.g., "video/mp4", "image/png") */
  mimeType: string;
  
  /** Suggested filename */
  filename: string;
  
  /** Optional metadata about the file */
  metadata?: FileMetadata;
}

export interface FileMetadata {
  /** Duration in seconds (for video/audio) */
  duration?: number;
  
  /** Width in pixels */
  width?: number;
  
  /** Height in pixels */
  height?: number;
  
  /** Frames per second (for video) */
  fps?: number;
  
  /** Additional custom metadata */
  [key: string]: unknown;
}

export interface OutputResult {
  /** Public URL to access the file */
  url: string;
  
  /** Metadata about the stored file */
  metadata?: FileMetadata;
  
  /** Expiration time (ISO string) for temporary URLs */
  expiresAt?: string;
}

export interface OutputStatus {
  /** Current mode */
  mode: 'url' | 'storage';
  
  /** Whether the handler is ready */
  ready: boolean;
  
  /** Mode-specific details */
  details: {
    /** For URL mode: current disk usage */
    diskUsageBytes?: number;
    /** For URL mode: number of files */
    fileCount?: number;
    /** For URL mode: HTTP server port */
    port?: number;
    /** For Storage mode: endpoint */
    endpoint?: string;
    /** Error message if not ready */
    error?: string;
  };
}

/**
 * OutputHandler interface
 */
export interface OutputHandler {
  initialize(): Promise<void>;
  store(file: FileData): Promise<OutputResult>;
  getStatus(): OutputStatus;
  shutdown(): Promise<void>;
}
