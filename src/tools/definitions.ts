/**
 * MCP Tools Definitions
 * 
 * Tools pour le rendu vidéo et la gestion des templates.
 */

export const tools = [
  // ============================================================================
  // TEMPLATE MANAGEMENT TOOLS
  // ============================================================================
  {
    name: 'remotion_create_template',
    description: `Create a new Remotion video template from React/TypeScript code.

The template must export a 'Main' component that receives { scenes, theme } props.

Before creating a template, read the documentation resources:
- remotion://docs/getting-started
- remotion://docs/api
- remotion://examples/full-template`,
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Template name (slug, e.g., "corporate-intro")',
        },
        description: {
          type: 'string',
          description: 'What this template does',
        },
        code: {
          type: 'string',
          description: 'React/Remotion component code (TSX). Must export Main component.',
        },
        inputSchema: {
          type: 'object',
          description: 'JSON Schema describing the expected inputProps',
        },
      },
      required: ['name', 'code'],
    },
  },
  {
    name: 'remotion_list_templates',
    description: 'List all available video templates with their metadata and input schemas',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'remotion_get_template',
    description: 'Get a template details including its source code',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Template name',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'remotion_delete_template',
    description: 'Delete a custom template (cannot delete "universal")',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Template name to delete',
        },
      },
      required: ['name'],
    },
  },

  // ============================================================================
  // RENDER TOOLS
  // ============================================================================
  {
    name: 'remotion_render_video',
    description: 'Generate a video from scenes and theme. Returns a URL to the rendered video.',
    inputSchema: {
      type: 'object',
      properties: {
        template: {
          type: 'string',
          description: 'Template to use (default: "universal"). Use remotion_list_templates to see options.',
          default: 'universal',
        },
        scenes: {
          type: 'array',
          description: 'List of scenes to compose into a video',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['text', 'image', 'video', 'split', 'outro'],
                description: 'Type of scene',
              },
              duration: {
                type: 'number',
                description: 'Duration in seconds',
              },
              content: {
                type: 'object',
                description: 'Scene-specific content',
                properties: {
                  title: { type: 'string' },
                  subtitle: { type: 'string' },
                  text: { type: 'string' },
                  url: { type: 'string' },
                  animation: { type: 'string' },
                },
              },
            },
            required: ['type', 'duration'],
          },
        },
        theme: {
          type: 'object',
          description: 'Visual theme for the video',
          properties: {
            primaryColor: { type: 'string', description: 'Primary color (hex)' },
            secondaryColor: { type: 'string', description: 'Secondary color (hex)' },
            backgroundColor: { type: 'string', description: 'Background color (hex)' },
            fontFamily: { type: 'string', description: 'Font family name' },
          },
        },
        settings: {
          type: 'object',
          description: 'Render settings',
          properties: {
            width: { type: 'number', default: 1920 },
            height: { type: 'number', default: 1080 },
            fps: { type: 'number', default: 30 },
            format: { type: 'string', enum: ['mp4', 'webm', 'gif'], default: 'mp4' },
          },
        },
      },
      required: ['scenes'],
    },
  },
  {
    name: 'remotion_render_image',
    description: 'Generate a static image (thumbnail, preview) from a scene. Returns a URL to the image.',
    inputSchema: {
      type: 'object',
      properties: {
        scene: {
          type: 'object',
          description: 'Scene to render as image',
          properties: {
            type: { type: 'string', enum: ['text', 'image', 'split', 'outro'] },
            duration: { type: 'number' },
            content: { type: 'object' },
          },
          required: ['type', 'duration'],
        },
        theme: {
          type: 'object',
          description: 'Visual theme',
        },
        settings: {
          type: 'object',
          properties: {
            width: { type: 'number', default: 1920 },
            height: { type: 'number', default: 1080 },
            format: { type: 'string', enum: ['png', 'jpeg'], default: 'png' },
          },
        },
        frame: {
          type: 'number',
          description: 'Frame number to render (default: 0)',
          default: 0,
        },
        template: {
          type: 'string',
          description: 'Template to use (default: "universal")',
          default: 'universal',
        },
      },
      required: ['scene'],
    },
  },
  {
    name: 'remotion_status',
    description: 'Get service status: output handler, templates count, render config',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];
