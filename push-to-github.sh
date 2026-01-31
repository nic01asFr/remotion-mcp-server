#!/bin/bash
# Script pour pousser le code vers GitHub
# Usage: ./push-to-github.sh

REPO_URL="https://github.com/nic01asFr/remotion-mcp-server.git"

echo "🚀 Pushing Remotion MCP Server to GitHub..."

# Init git repo
git init
git add .
git commit -m "Complete implementation: MCP Server for AI video generation with Remotion

Features:
- 7 MCP tools for video rendering and template management
- 7 MCP resources with Remotion documentation for AI learning
- Dual output modes (URL standalone / Storage integrated)
- Template creation by AI assistants
- Mock mode for development without Remotion dependencies

Tools:
- remotion_create_template: Create custom Remotion templates
- remotion_list_templates: List available templates
- remotion_get_template: Get template source code
- remotion_delete_template: Delete templates
- remotion_render_video: Generate video from scenes
- remotion_render_image: Generate static images
- remotion_status: Service status"

# Add remote and force push (replacing empty repo)
git branch -M main
git remote add origin $REPO_URL 2>/dev/null || git remote set-url origin $REPO_URL
git push -u origin main --force

echo "✅ Done! View at: $REPO_URL"
