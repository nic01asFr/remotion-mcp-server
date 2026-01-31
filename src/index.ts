#!/usr/bin/env node
/**
 * RemotionMCP - Entry Point
 * 
 * BigApp MCP Server for video generation with Remotion.
 * 
 * Usage:
 *   # Standalone mode (default)
 *   node dist/index.js
 * 
 *   # With Storage Service (injected by BigMCP)
 *   STORAGE_ENDPOINT=https://api.bigfolder.cloud/mcp \
 *   STORAGE_API_KEY=bf_xxx \
 *   node dist/index.js
 */

import { RemotionMcpServer } from './server.js';

async function main() {
  const server = new RemotionMcpServer();
  await server.run();
}

main().catch((error) => {
  console.error('[RemotionMCP] Fatal error:', error);
  process.exit(1);
});
