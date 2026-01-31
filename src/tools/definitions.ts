/**
 * MCP Tools Definitions
 * 
 * Outils simplifiés pour le rendu vidéo Remotion.
 */

export const tools = [
  // ============================================================================
  // RENDER TOOLS
  // ============================================================================
  {
    name: 'remotion_render_video',
    description: `Generate a professional video from scenes. Returns a URL to the rendered video.

Available scene types:
- "title": Big title with optional subtitle (content: title, subtitle, animation)
- "text": Text content with styling (content: title, subtitle, text, variant: dark|light)
- "counter": Animated number counter (content: value, suffix, label)
- "image": Display an image with Ken Burns effect (content: url, animation: zoom-in|zoom-out|pan)
- "split": Image + text side by side (content: title, subtitle, imageUrl, imagePosition: left|right)
- "list": Animated bullet points (content: title, items: string[])
- "stats": Multiple statistics (content: stats: [{value, label}])
- "intro": Logo/brand intro (content: title, subtitle, logoUrl)
- "outro": Closing with CTA (content: title, subtitle, text, cta)
- "cta": Call-to-action with QR code (content: title, subtitle, url, qrCode: boolean, qrSize, qrPosition)

Animation options for text: "fade", "slide", "scale", "typewriter"`,
    inputSchema: {
      type: 'object',
      properties: {
        scenes: {
          type: 'array',
          description: 'List of scenes to compose into a video',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['title', 'text', 'counter', 'image', 'split', 'list', 'stats', 'intro', 'outro', 'cta'],
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
                  // Text content
                  title: { type: 'string', description: 'Main title text' },
                  subtitle: { type: 'string', description: 'Subtitle text' },
                  text: { type: 'string', description: 'Body text' },
                  
                  // Media
                  url: { type: 'string', description: 'Image or video URL' },
                  imageUrl: { type: 'string', description: 'Image URL for split scenes' },
                  logoUrl: { type: 'string', description: 'Logo URL for intro' },
                  
                  // Counter
                  value: { type: 'string', description: 'Number value for counter' },
                  suffix: { type: 'string', description: 'Suffix after number (e.g., "+", "%")' },
                  prefix: { type: 'string', description: 'Prefix before number' },
                  label: { type: 'string', description: 'Label below counter' },
                  
                  // List
                  items: { 
                    type: 'array', 
                    items: { type: 'string' },
                    description: 'List items for list scene' 
                  },
                  
                  // Stats
                  stats: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        value: { type: 'string' },
                        label: { type: 'string' },
                        suffix: { type: 'string' },
                      },
                    },
                    description: 'Statistics for stats scene',
                  },
                  
                  // CTA
                  cta: { type: 'string', description: 'Call-to-action button text' },
                  
                  // QR Code
                  qrCode: { type: 'boolean', description: 'Show QR code (for cta scene)' },
                  qrSize: { type: 'number', description: 'QR code size in pixels (default: 180)' },
                  qrPosition: { type: 'string', enum: ['left', 'right', 'center'], description: 'QR code position' },
                  
                  // Styling
                  variant: { 
                    type: 'string', 
                    enum: ['dark', 'light'],
                    description: 'Color variant (dark or light background)',
                  },
                  titleColor: { type: 'string', description: 'Title color override (hex)' },
                  
                  // Animation
                  animation: { 
                    type: 'string',
                    enum: ['fade', 'slide', 'scale', 'typewriter', 'zoom-in', 'zoom-out', 'pan'],
                    description: 'Animation type',
                  },
                  
                  // Position
                  imagePosition: {
                    type: 'string',
                    enum: ['left', 'right'],
                    description: 'Image position for split scenes',
                  },
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
            primaryColor: { type: 'string', description: 'Primary/accent color (hex)' },
            secondaryColor: { type: 'string', description: 'Secondary text color (hex)' },
            backgroundColor: { type: 'string', description: 'Background color (hex)' },
            fontFamily: { type: 'string', description: 'Font family name' },
          },
        },
        settings: {
          type: 'object',
          description: 'Render settings',
          properties: {
            width: { type: 'number', default: 1920, description: 'Video width' },
            height: { type: 'number', default: 1080, description: 'Video height' },
            fps: { type: 'number', default: 30, description: 'Frames per second' },
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
            type: { 
              type: 'string', 
              enum: ['title', 'text', 'counter', 'image', 'split', 'list', 'stats', 'intro', 'outro'],
            },
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
          description: 'Frame number to render (default: 15 for fade-in visibility)',
          default: 15,
        },
      },
      required: ['scene'],
    },
  },
  {
    name: 'remotion_status',
    description: 'Get service status: output handler configuration, supported scene types, and render settings',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];
