# BigRemotionMCP Dockerfile
FROM node:20-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Production
FROM node:20-slim

# Chrome dependencies for Remotion
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    fonts-noto-color-emoji \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

RUN mkdir -p /tmp/remotion-mcp/work /tmp/remotion-mcp/serve /tmp/remotion-mcp/templates

ENV NODE_ENV=production
ENV URL_PORT=8081
ENV URL_SERVE_DIR=/tmp/remotion-mcp/serve
ENV REMOTION_WORK_DIR=/tmp/remotion-mcp/work

EXPOSE 8081

RUN groupadd -r bigmcp && useradd -r -g bigmcp bigmcp
RUN chown -R bigmcp:bigmcp /app /tmp/remotion-mcp
USER bigmcp

CMD ["node", "dist/index.js"]
