# Remotion MCP Server

MCP Server for AI-powered video generation using [Remotion](https://remotion.dev).

## Features

- 🎬 **Video Generation** - Create videos from JSON scene descriptions
- 🖼️ **Image Generation** - Render still frames from scenes
- 📝 **Template System** - Create and manage custom Remotion templates
- 📚 **MCP Resources** - Built-in documentation for AI assistants
- 🔄 **Dynamic Bundling** - Templates are bundled on-the-fly
- 🌐 **HTTP Output** - Files served via local HTTP server with tokens

## Quick Start

```bash
git clone https://github.com/nic01asFr/remotion-mcp-server.git
cd remotion-mcp-server
npm install
npm run build
```

## MCP Configuration

Add to your Claude Desktop config (`%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "remotion": {
      "command": "node",
      "args": ["C:/path/to/remotion-mcp-server/dist/index.js"]
    }
  }
}
```

## Tools

| Tool | Description |
|------|-------------|
| `remotion_render_video` | Generate video from scenes |
| `remotion_render_image` | Generate static image from a scene |
| `remotion_create_template` | Create a new Remotion template |
| `remotion_list_templates` | List available templates |
| `remotion_get_template` | Get template details and code |
| `remotion_delete_template` | Delete a custom template |
| `remotion_status` | Get service status |

## Resources

AI assistants can read these to learn Remotion:

- `remotion://docs/getting-started` - Getting started guide
- `remotion://docs/api` - API reference
- `remotion://docs/animations` - Animation techniques
- `remotion://docs/scene-types` - Scene type reference
- `remotion://examples/text-scene` - Text scene example
- `remotion://examples/image-scene` - Image scene example
- `remotion://examples/full-template` - Complete template example

## Usage Examples

### Render an image

```json
{
  "scene": {
    "type": "text",
    "duration": 3,
    "content": {
      "title": "Hello World",
      "subtitle": "Generated with Remotion MCP"
    }
  },
  "theme": {
    "primaryColor": "#FFFFFF",
    "backgroundColor": "#1a1a2e"
  },
  "settings": {
    "width": 1920,
    "height": 1080
  }
}
```

### Render a video

```json
{
  "scenes": [
    {
      "type": "text",
      "duration": 2,
      "content": { "title": "Welcome", "subtitle": "to the demo" }
    },
    {
      "type": "text", 
      "duration": 2,
      "content": { "title": "AI-Powered", "subtitle": "Video Generation" }
    },
    {
      "type": "outro",
      "duration": 1.5,
      "content": { "text": "Thanks!" }
    }
  ],
  "theme": {
    "primaryColor": "#00FF88",
    "backgroundColor": "#0a0a1a"
  },
  "settings": {
    "width": 1280,
    "height": 720,
    "fps": 30,
    "format": "mp4"
  }
}
```

## Scene Types

| Type | Description | Content Properties |
|------|-------------|-------------------|
| `title` | Big title with animation | `title`, `subtitle`, `animation` |
| `text` | Text content with styling | `title`, `subtitle`, `text`, `variant` |
| `counter` | Animated number counter | `value`, `suffix`, `prefix`, `label` |
| `image` | Image with Ken Burns effect | `url`, `animation` (zoom-in/zoom-out/pan) |
| `split` | Image + text side by side | `title`, `subtitle`, `imageUrl`, `imagePosition` |
| `list` | Animated bullet points | `title`, `items[]` |
| `stats` | Multiple statistics | `title`, `stats[]` (value, label, suffix) |
| `intro` | Logo/brand intro | `title`, `subtitle`, `logoUrl` |
| `outro` | Closing with CTA | `title`, `subtitle`, `text`, `cta` |
| `cta` | Call-to-action with QR code | `title`, `subtitle`, `url`, `qrCode`, `qrSize`, `qrPosition` |

## Theme Properties

| Property | Description | Default |
|----------|-------------|---------|
| `primaryColor` | Main text color | `#FFFFFF` |
| `secondaryColor` | Subtitle color | `#AAAAAA` |
| `backgroundColor` | Background color | `#000000` |
| `fontFamily` | Font family | `Arial` |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `URL_PORT` | HTTP server port | `8081` |
| `URL_TTL_SECONDS` | File expiration time | `3600` |
| `URL_MAX_FILES` | Max cached files | `100` |
| `URL_MAX_DISK_BYTES` | Max disk usage | `1GB` |
| `REMOTION_CONCURRENCY` | Render concurrency | `2` |
| `REMOTION_LOG_LEVEL` | Log level | `error` |

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│   MCP Client    │────▶│  MCP Server  │────▶│   Bundler   │
│ (Claude, etc.)  │     │   (stdio)    │     │  (dynamic)  │
└─────────────────┘     └──────────────┘     └─────────────┘
                              │                     │
                              ▼                     ▼
                        ┌──────────────┐     ┌─────────────┐
                        │ HTTP Server  │◀────│  Renderer   │
                        │  (port 8081) │     │ (Remotion)  │
                        └──────────────┘     └─────────────┘
```

## Development

```bash
npm run dev    # Watch mode with tsx
npm run build  # Compile TypeScript
npm start      # Run compiled version
```

## License

MIT - Note: [Remotion requires a license](https://remotion.dev/license) for companies with 4+ employees.
