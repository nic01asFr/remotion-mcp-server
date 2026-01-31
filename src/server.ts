/**
 * RemotionMCP Server
 * 
 * MCP Server for video generation using Remotion.
 * Simplified version - all scenes supported via universal template.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { config } from './config/index.js';
import { createOutputHandler, OutputHandler } from './output/index.js';
import { RenderEngine, RenderVideoParams, RenderImageParams } from './render/index.js';
import { tools } from './tools/index.js';
import { resources, getResourceContent } from './resources/index.js';

export class RemotionMcpServer {
  private server: Server;
  private renderEngine: RenderEngine;
  private outputHandler: OutputHandler;

  constructor() {
    this.server = new Server(
      {
        name: 'remotion-mcp',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.renderEngine = new RenderEngine(config.render);
    this.outputHandler = createOutputHandler();
  }

  async initialize(): Promise<void> {
    console.error('[RemotionMCP] Initializing v2.0.0...');
    console.error(`[RemotionMCP] Output mode: ${config.outputMode}`);

    await this.renderEngine.initialize();
    await this.outputHandler.initialize();

    this.registerHandlers();

    console.error('[RemotionMCP] Ready - 9 scene types available');
  }

  private registerHandlers(): void {
    // List tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools,
    }));

    // List resources (documentation)
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources,
    }));

    // Read resource content
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      // Get documentation content
      const content = getResourceContent(uri);
      if (!content) {
        throw new Error(`Resource not found: ${uri}`);
      }

      return {
        contents: [{
          uri,
          mimeType: 'text/markdown',
          text: content,
        }],
      };
    });

    // Call tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'remotion_render_video':
            return await this.handleRenderVideo(args as unknown as RenderVideoParams);

          case 'remotion_render_image':
            return await this.handleRenderImage(args as unknown as RenderImageParams);

          case 'remotion_status':
            return this.handleStatus();

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[RemotionMCP] Error in ${name}:`, message);
        return {
          content: [{ type: 'text', text: `Error: ${message}` }],
          isError: true,
        };
      }
    });
  }

  // ==========================================================================
  // RENDER HANDLERS
  // ==========================================================================

  private async handleRenderVideo(params: RenderVideoParams) {
    console.error('[RemotionMCP] Rendering video...');
    console.error(`[RemotionMCP] Scenes: ${params.scenes?.length || 0}`);
    
    if (params.scenes) {
      const sceneTypes = params.scenes.map(s => s.type).join(', ');
      console.error(`[RemotionMCP] Scene types: ${sceneTypes}`);
    }

    const result = await this.renderEngine.renderVideo(params);

    const output = await this.outputHandler.store({
      buffer: result.buffer,
      mimeType: result.mimeType,
      filename: `video-${Date.now()}.${params.settings?.format || 'mp4'}`,
      metadata: result.metadata,
    });

    return {
      content: [{ type: 'text', text: this.formatOutput(output.url, result.metadata) }],
    };
  }

  private async handleRenderImage(params: RenderImageParams) {
    console.error('[RemotionMCP] Rendering image...');
    console.error(`[RemotionMCP] Scene type: ${params.scene?.type}`);

    const result = await this.renderEngine.renderImage(params);

    const output = await this.outputHandler.store({
      buffer: result.buffer,
      mimeType: result.mimeType,
      filename: `image-${Date.now()}.${params.settings?.format || 'png'}`,
      metadata: result.metadata,
    });

    return {
      content: [{ type: 'text', text: this.formatOutput(output.url, result.metadata) }],
    };
  }

  private handleStatus() {
    const supportedScenes = [
      'title', 'text', 'counter', 'image', 'split', 
      'list', 'stats', 'intro', 'outro'
    ];
    
    const status = {
      server: 'remotion-mcp',
      version: '2.0.0',
      output: this.outputHandler.getStatus(),
      supportedScenes,
      render: {
        concurrency: config.render.concurrency,
        defaultFps: 30,
        defaultWidth: 1920,
        defaultHeight: 1080,
      },
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(status, null, 2) }],
    };
  }

  private formatOutput(
    url: string,
    metadata: { duration?: number; width?: number; height?: number; fps?: number }
  ): string {
    let output = url;
    const parts: string[] = [];

    if (metadata.duration) parts.push(`${metadata.duration}s`);
    if (metadata.width && metadata.height) parts.push(`${metadata.width}×${metadata.height}`);
    if (metadata.fps) parts.push(`${metadata.fps}fps`);

    if (parts.length > 0) {
      output += `\n📹 ${parts.join(' • ')}`;
    }

    return output;
  }

  async run(): Promise<void> {
    await this.initialize();

    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.error('[RemotionMCP] Server running on stdio');

    const shutdown = async () => {
      console.error('[RemotionMCP] Shutting down...');
      await this.outputHandler.shutdown();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }
}
