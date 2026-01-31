/**
 * Remotion Render Engine
 * 
 * Uses dynamic bundling to render videos/images from template code.
 */

import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { RenderConfig } from '../config/index.js';
import { DynamicBundler } from './bundler.js';

// Redirect logs to stderr for MCP compatibility
const log = (...args: unknown[]) => console.error('[RenderEngine]', ...args);

export interface Scene {
  type: 'text' | 'image' | 'video' | 'split' | 'outro';
  duration: number;
  content: Record<string, unknown>;
}

export interface Theme {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
}

export interface RenderVideoParams {
  scenes: Scene[];
  theme?: Theme;
  settings?: {
    width?: number;
    height?: number;
    fps?: number;
    format?: 'mp4' | 'webm' | 'gif';
  };
}

export interface RenderImageParams {
  scene: Scene;
  theme?: Theme;
  settings?: {
    width?: number;
    height?: number;
    format?: 'png' | 'jpeg';
  };
  frame?: number;
}

export interface RenderResult {
  buffer: Buffer;
  mimeType: string;
  metadata: {
    duration?: number;
    width: number;
    height: number;
    fps?: number;
  };
}

export class RenderEngine {
  private config: RenderConfig;
  private renderer: typeof import('@remotion/renderer') | null = null;
  private bundler: DynamicBundler;
  private defaultTemplateCode: string;

  constructor(config: RenderConfig) {
    this.config = config;
    this.bundler = new DynamicBundler(path.join(config.workDir, 'bundles'));
    this.defaultTemplateCode = this.getDefaultTemplateCode();
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.config.workDir, { recursive: true });
    
    try {
      this.renderer = await import('@remotion/renderer');
      log('Remotion renderer loaded');
    } catch (err) {
      log('Remotion not available, using mock mode');
    }

    await this.bundler.initialize();
    log('Initialized');
  }

  async renderVideo(params: RenderVideoParams, templateCode?: string): Promise<RenderResult> {
    const workDir = path.join(this.config.workDir, randomUUID());
    const format = params.settings?.format || 'mp4';
    const outputPath = path.join(workDir, `output.${format}`);

    const width = params.settings?.width || 1920;
    const height = params.settings?.height || 1080;
    const fps = params.settings?.fps || 30;

    const totalDuration = params.scenes.reduce((sum, s) => sum + s.duration, 0);
    const durationInFrames = Math.ceil(totalDuration * fps);

    try {
      await fs.mkdir(workDir, { recursive: true });

      if (this.renderer) {
        const code = templateCode || this.defaultTemplateCode;
        const { bundlePath, cleanup } = await this.bundler.bundle(code, 'universal');

        try {
          const inputProps = { scenes: params.scenes, theme: params.theme || {} };

          log(`Rendering video: ${durationInFrames} frames, ${width}x${height}`);

          // Use selectComposition to get proper VideoConfig
          const composition = await this.renderer.selectComposition({
            serveUrl: bundlePath,
            id: 'Main',
            inputProps,
          });

          await this.renderer.renderMedia({
            composition: {
              ...composition,
              width,
              height,
              fps,
              durationInFrames,
            },
            serveUrl: bundlePath,
            codec: this.getCodec(format),
            outputLocation: outputPath,
            inputProps,
            logLevel: 'error',
            concurrency: this.config.concurrency,
          });
        } finally {
          await cleanup();
        }
      } else {
        // Mock mode
        log('Mock render:', params);
        const mockData = Buffer.from(`Mock video: ${JSON.stringify(params)}`);
        await fs.writeFile(outputPath, mockData);
      }

      const buffer = await fs.readFile(outputPath);

      return {
        buffer,
        mimeType: this.getMimeType(format),
        metadata: { duration: totalDuration, width, height, fps },
      };
    } finally {
      await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  async renderImage(params: RenderImageParams, templateCode?: string): Promise<RenderResult> {
    const workDir = path.join(this.config.workDir, randomUUID());
    const format = params.settings?.format || 'png';
    const outputPath = path.join(workDir, `output.${format}`);

    const width = params.settings?.width || 1920;
    const height = params.settings?.height || 1080;

    try {
      await fs.mkdir(workDir, { recursive: true });

      if (this.renderer) {
        const code = templateCode || this.defaultTemplateCode;
        const { bundlePath, cleanup } = await this.bundler.bundle(code, 'universal');

        try {
          const inputProps = { scenes: [params.scene], theme: params.theme || {} };

          log(`Rendering image: ${width}x${height}`);

          // Use selectComposition to get proper VideoConfig
          const composition = await this.renderer.selectComposition({
            serveUrl: bundlePath,
            id: 'Main',
            inputProps,
          });

          await this.renderer.renderStill({
            composition: {
              ...composition,
              width,
              height,
              fps: 30,
              durationInFrames: Math.ceil(params.scene.duration * 30),
            },
            serveUrl: bundlePath,
            output: outputPath,
            frame: params.frame ?? 15, // Default to frame 15 to capture after fade-in animation
            inputProps,
            imageFormat: format,
            logLevel: 'error',
          });
        } finally {
          await cleanup();
        }
      } else {
        // Mock
        const mockData = Buffer.from(`Mock image: ${JSON.stringify(params)}`);
        await fs.writeFile(outputPath, mockData);
      }

      const buffer = await fs.readFile(outputPath);

      return {
        buffer,
        mimeType: format === 'jpeg' ? 'image/jpeg' : 'image/png',
        metadata: { width, height },
      };
    } finally {
      await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  private getCodec(format: string): 'h264' | 'vp8' | 'gif' {
    if (format === 'webm') return 'vp8';
    if (format === 'gif') return 'gif';
    return 'h264';
  }

  private getMimeType(format: string): string {
    return format === 'webm' ? 'video/webm' : format === 'gif' ? 'image/gif' : 'video/mp4';
  }

  private getDefaultTemplateCode(): string {
    return `import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring, Sequence, Img, AbsoluteFill } from 'remotion';

interface Scene {
  type: 'text' | 'image' | 'outro';
  duration: number;
  content: Record<string, any>;
}

interface Theme {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
}

const TextScene: React.FC<{ content: any; theme: Theme }> = ({ content, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, fps * 0.5], [0, 1], { extrapolateRight: 'clamp' });
  const scale = spring({ frame, fps, config: { damping: 100, stiffness: 200 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.backgroundColor || '#000',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: theme.fontFamily || 'Arial',
      }}
    >
      <div style={{ opacity, transform: \`scale(\${scale})\`, textAlign: 'center' }}>
        <h1 style={{ color: theme.primaryColor || '#fff', fontSize: 72, margin: 0 }}>
          {content.title}
        </h1>
        {content.subtitle && (
          <p style={{ color: theme.secondaryColor || '#aaa', fontSize: 36, marginTop: 20 }}>
            {content.subtitle}
          </p>
        )}
      </div>
    </AbsoluteFill>
  );
};

const ImageScene: React.FC<{ content: any; theme: Theme }> = ({ content, theme }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const scale = interpolate(
    frame,
    [0, durationInFrames],
    content.animation === 'zoom-out' ? [1.2, 1] : [1, 1.2]
  );

  return (
    <AbsoluteFill style={{ backgroundColor: theme.backgroundColor || '#000' }}>
      <Img
        src={content.url}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: \`scale(\${scale})\`,
        }}
      />
    </AbsoluteFill>
  );
};

const OutroScene: React.FC<{ content: any; theme: Theme }> = ({ content, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, fps * 0.3], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.backgroundColor || '#000',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: theme.fontFamily || 'Arial',
      }}
    >
      <p style={{ color: theme.primaryColor || '#fff', fontSize: 60, opacity }}>
        {content.text || 'Thank you'}
      </p>
    </AbsoluteFill>
  );
};

export const Main: React.FC<{ scenes: Scene[]; theme: Theme }> = ({ scenes, theme }) => {
  const { fps } = useVideoConfig();
  let currentFrame = 0;

  return (
    <AbsoluteFill>
      {scenes.map((scene, i) => {
        const duration = Math.ceil(scene.duration * fps);
        const from = currentFrame;
        currentFrame += duration;

        return (
          <Sequence key={i} from={from} durationInFrames={duration}>
            {scene.type === 'text' && <TextScene content={scene.content} theme={theme} />}
            {scene.type === 'image' && <ImageScene content={scene.content} theme={theme} />}
            {scene.type === 'outro' && <OutroScene content={scene.content} theme={theme} />}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
`;
  }
}
