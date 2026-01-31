# Setup Instructions

## Option 1: Use the ZIP (Recommended)

Le ZIP contient les fichiers JSON corrects. Extraire et utiliser directement.

```bash
unzip remotion-mcp-server.zip
cd remotion-mcp-server
npm install
npm run dev
```

## Option 2: Clone from GitHub

Après clonage, remplacer package.json et tsconfig.json avec le contenu ci-dessous:

```bash
git clone https://github.com/nic01asFr/remotion-mcp-server.git
cd remotion-mcp-server
# Copier package.json et tsconfig.json depuis le ZIP ou ci-dessous
npm install
npm run dev
```

### package.json

```json
{
  "name": "remotion-mcp-server",
  "version": "1.0.0",
  "description": "MCP Server for AI-powered video generation with Remotion",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "remotion": "^4.0.0",
    "@remotion/renderer": "^4.0.0",
    "express": "^4.18.0",
    "uuid": "^9.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/express": "^4.17.0",
    "@types/uuid": "^9.0.0",
    "typescript": "^5.0.0",
    "tsx": "^4.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "license": "MIT"
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## MCP Configuration

```json
{
  "mcpServers": {
    "remotion": {
      "command": "node",
      "args": ["/path/to/remotion-mcp-server/dist/index.js"]
    }
  }
}
```
