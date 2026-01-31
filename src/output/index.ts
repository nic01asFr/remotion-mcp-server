/**
 * Output Module
 */

export * from './handler.js';
export { UrlHandler } from './urlHandler.js';
export { StorageHandler } from './storageHandler.js';

import { OutputHandler } from './handler.js';
import { UrlHandler } from './urlHandler.js';
import { StorageHandler } from './storageHandler.js';
import { config } from '../config/index.js';

/**
 * Create the appropriate OutputHandler based on configuration
 */
export function createOutputHandler(): OutputHandler {
  if (config.outputMode === 'storage') {
    console.error('[Output] Using StorageHandler (integrated mode)');
    return new StorageHandler(config.storage);
  } else {
    console.error('[Output] Using UrlHandler (standalone mode)');
    return new UrlHandler(config.url);
  }
}
