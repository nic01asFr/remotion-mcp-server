/**
 * RemotionMCP Server
 * 
 * MCP Server for video generation using Remotion.
 * Implements the BigApp pattern with dual output modes (url/storage).
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
import { TemplateManager } from './templates/manager.js';
import { resources, getResourceContent } from './resources/index.js';

export class RemotionMcpServer {
  private server: Server;
  private renderEngine: RenderEngine;
  private outputHandler: OutputHandler;
  private templateManager: TemplateManager;

  constructor() {
    this.server = new Server(
      {
        name: 'remotion-mcp',
        version: '1.0.0',
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
    this.templateManager = new TemplateManager(
      config.render.workDir.replace('/work', '/templates')
    );
  }

  async initialize(): Promise<void> {
    console.error('[RemotionMCP] Initializing...');
    console.error(`[RemotionMCP] Output mode: ${config.outputMode}`);

    await this.templateManager.initialize();
    await this.renderEngine.initialize();
    await this.outputHandler.initialize();

    this.registerHandlers();

    console.error('[RemotionMCP] Ready');
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

      // Check if it's a template source request
      const templateMatch = uri.match(/^remotion:\/\/templates\/(.+)\/source$/);
      if (templateMatch) {
        const template = this.templateManager.get(templateMatch[1]);
        if (!template) {
          throw new Error(`Template '${templateMatch[1]}' not found`);
        }
        return {
          contents: [{
            uri,
            mimeType: 'text/x.typescript',
            text: template.code,
          }],
        };
      }

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
          // Template management tools
          case 'remotion_create_template':
            return await this.handleCreateTemplate(args as any);

          case 'remotion_list_templates':
            return this.handleListTemplates();

          case 'remotion_get_template':
            return this.handleGetTemplate(args as { name: string });

          case 'remotion_delete_template':
            return await this.handleDeleteTemplate(args as { name: string });

          // Render tools
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
        return {
          content: [{ type: 'text', text: `Error: ${message}` }],
          isError: true,
        };
      }
    });
  }

  // ==========================================================================
  // TEMPLATE HANDLERS
  // ==========================================================================

  private async handleCreateTemplate(params: {
    name: string;
    description?: string;
    code: string;
    inputSchema?: Record<string, unknown>;
  }) {
    const template = await this.templateManager.create(params);
    return {
      content: [{
        type: 'text',
        text: `✅ Template '${template.name}' created successfully.\n\nYou can now use it with remotion_render_video by specifying template: "${template.name}"`,
      }],
    };
  }

  private handleListTemplates() {
    const templates = this.templateManager.list();
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(templates, null, 2),
      }],
    };
  }

  private handleGetTemplate(params: { name: string }) {
    const template = this.templateManager.get(params.name);
    if (!template) {
      throw new Error(`Template '${params.name}' not found`);
    }
    return {
      content: [{
        type: 'text',
        text: `# Template: ${template.name}\n\n${template.description || ''}\n\n## Code\n\n\`\`\`tsx\n${template.code}\n\`\`\`\n\n## Input Schema\n\n\`\`\`json\n${JSON.stringify(template.inputSchema, null, 2)}\n\`\`\``,
      }],
    };
  }

  private async handleDeleteTemplate(params: { name: string }) {
    await this.templateManager.delete(params.name);
    return {
      content: [{
        type: 'text',
        text: `✅ Template '${params.name}' deleted.`,
      }],
    };
  }

  // ==========================================================================
  // RENDER HANDLERS
  // ==========================================================================

  private async handleRenderVideo(params: RenderVideoParams) {
    console.error('[RemotionMCP] Rendering video...');

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
    const status = {
      server: 'remotion-mcp',
      version: '1.0.0',
      output: this.outputHandler.getStatus(),
      templates: this.templateManager.list().length,
      render: {
        concurrency: config.render.concurrency,
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
