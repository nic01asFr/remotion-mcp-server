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
  type: 'title' | 'text' | 'counter' | 'image' | 'split' | 'list' | 'stats' | 'intro' | 'outro' | 'cta';
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
    log('Initialized with 9 scene types');
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

          log(`Rendering video: ${params.scenes.length} scenes, ${durationInFrames} frames, ${width}x${height}`);
          log(`Scene types: ${params.scenes.map(s => s.type).join(', ')}`);

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

          log(`Rendering image: ${params.scene.type}, ${width}x${height}`);

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
            frame: params.frame ?? 15,
            inputProps,
            imageFormat: format,
            logLevel: 'error',
          });
        } finally {
          await cleanup();
        }
      } else {
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

// ============================================================================
// TYPES
// ============================================================================

interface Scene {
  type: 'title' | 'text' | 'counter' | 'image' | 'split' | 'list' | 'stats' | 'intro' | 'outro' | 'cta';
  duration: number;
  content: Record<string, any>;
}

interface Theme {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_COLORS = {
  dark: '#1a1a1a',
  light: '#f5f5f5',
  primary: '#E85D04',
  white: '#ffffff',
};

// ============================================================================
// BACKGROUND COMPONENT
// ============================================================================

const Background: React.FC<{ variant?: 'dark' | 'light'; theme: Theme }> = ({ variant = 'dark', theme }) => {
  const frame = useCurrentFrame();
  const isDark = variant === 'dark';
  const bgColor = theme.backgroundColor || (isDark ? DEFAULT_COLORS.dark : DEFAULT_COLORS.light);
  const accentColor = theme.primaryColor || DEFAULT_COLORS.primary;

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute',
        top: '-30%',
        left: '-20%',
        width: '70%',
        height: '70%',
        borderRadius: '50%',
        background: \`radial-gradient(circle, \${accentColor}25 0%, transparent 70%)\`,
        transform: \`translate(\${Math.sin(frame * 0.02) * 20}px, \${Math.cos(frame * 0.02) * 15}px)\`,
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-30%',
        right: '-20%',
        width: '80%',
        height: '80%',
        borderRadius: '50%',
        background: \`radial-gradient(circle, \${accentColor}18 0%, transparent 70%)\`,
        transform: \`translate(\${Math.cos(frame * 0.015) * 25}px, \${Math.sin(frame * 0.015) * 20}px)\`,
      }} />
    </AbsoluteFill>
  );
};

// ============================================================================
// ANIMATED TEXT COMPONENT
// ============================================================================

const AnimatedText: React.FC<{
  text: string;
  color: string;
  fontSize: number;
  fontWeight?: string | number;
  delay?: number;
  animation?: 'fade' | 'slide' | 'scale';
}> = ({ text, color, fontSize, fontWeight = 'bold', delay = 0, animation = 'slide' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(' ');

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: fontSize * 0.2 }}>
      {words.map((word, i) => {
        const wordDelay = delay + i * 3;
        let opacity = 1;
        let transform = 'none';

        if (animation === 'fade') {
          opacity = interpolate(frame - wordDelay, [0, 12], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
        } else if (animation === 'slide') {
          const progress = spring({ frame: frame - wordDelay, fps, config: { damping: 15, stiffness: 150 } });
          const y = interpolate(progress, [0, 1], [30, 0]);
          opacity = interpolate(frame - wordDelay, [0, 8], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          transform = \`translateY(\${y}px)\`;
        } else if (animation === 'scale') {
          const scale = spring({ frame: frame - wordDelay, fps, config: { damping: 12, stiffness: 180 } });
          opacity = interpolate(frame - wordDelay, [0, 8], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          transform = \`scale(\${scale})\`;
        }

        return (
          <span key={i} style={{ color, fontSize, fontWeight, opacity, transform, display: 'inline-block' }}>
            {word}
          </span>
        );
      })}
    </div>
  );
};

// ============================================================================
// ANIMATED COUNTER COMPONENT
// ============================================================================

const AnimatedCounter: React.FC<{
  value: number;
  suffix?: string;
  prefix?: string;
  color: string;
  fontSize: number;
  delay?: number;
}> = ({ value, suffix = '', prefix = '', color, fontSize, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 30, stiffness: 60 },
    durationInFrames: 45,
  });

  const displayValue = Math.floor(interpolate(progress, [0, 1], [0, value]));
  const scale = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 100 } });
  const opacity = interpolate(frame - delay, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{ color, fontSize, fontWeight: 'bold', transform: \`scale(\${Math.min(scale, 1.05)})\`, opacity }}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </div>
  );
};

// ============================================================================
// SCENE COMPONENTS
// ============================================================================

const TitleScene: React.FC<{ content: any; theme: Theme }> = ({ content, theme }) => {
  const variant = content.variant || 'dark';
  const isDark = variant === 'dark';
  const titleColor = content.titleColor || theme.primaryColor || DEFAULT_COLORS.primary;
  const subtitleColor = isDark ? DEFAULT_COLORS.white : DEFAULT_COLORS.dark;

  return (
    <AbsoluteFill style={{ fontFamily: theme.fontFamily || 'Arial, sans-serif' }}>
      <Background variant={variant} theme={theme} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 60 }}>
        <div style={{ textAlign: 'center' }}>
          {content.title && <AnimatedText text={content.title} color={titleColor} fontSize={80} delay={0} animation={content.animation || 'slide'} />}
          {content.subtitle && (
            <div style={{ marginTop: 24 }}>
              <AnimatedText text={content.subtitle} color={subtitleColor} fontSize={36} fontWeight="normal" delay={12} animation={content.animation || 'slide'} />
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const TextScene: React.FC<{ content: any; theme: Theme }> = ({ content, theme }) => {
  const frame = useCurrentFrame();
  const variant = content.variant || 'dark';
  const isDark = variant === 'dark';
  const titleColor = content.titleColor || theme.primaryColor || DEFAULT_COLORS.primary;
  const textColor = isDark ? DEFAULT_COLORS.white : DEFAULT_COLORS.dark;
  const textOpacity = interpolate(frame - 20, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ fontFamily: theme.fontFamily || 'Arial, sans-serif' }}>
      <Background variant={variant} theme={theme} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 80 }}>
        <div style={{ textAlign: 'center', maxWidth: '80%' }}>
          {content.title && <AnimatedText text={content.title} color={titleColor} fontSize={64} delay={0} animation={content.animation || 'slide'} />}
          {content.subtitle && (
            <div style={{ marginTop: 20 }}>
              <AnimatedText text={content.subtitle} color={textColor} fontSize={32} fontWeight="normal" delay={10} animation={content.animation || 'slide'} />
            </div>
          )}
          {content.text && (
            <p style={{ color: textColor, fontSize: 24, marginTop: 30, lineHeight: 1.6, opacity: textOpacity * 0.9 }}>
              {content.text}
            </p>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const CounterScene: React.FC<{ content: any; theme: Theme }> = ({ content, theme }) => {
  const variant = content.variant || 'dark';
  const isDark = variant === 'dark';
  const counterColor = content.titleColor || theme.primaryColor || DEFAULT_COLORS.primary;
  const labelColor = isDark ? DEFAULT_COLORS.white : DEFAULT_COLORS.dark;
  const numValue = typeof content.value === 'string' ? parseInt(content.value, 10) || 0 : content.value || 0;

  return (
    <AbsoluteFill style={{ fontFamily: theme.fontFamily || 'Arial, sans-serif' }}>
      <Background variant={variant} theme={theme} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <AnimatedCounter value={numValue} suffix={content.suffix || ''} prefix={content.prefix || ''} color={counterColor} fontSize={140} delay={5} />
          {content.label && (
            <div style={{ marginTop: 16 }}>
              <AnimatedText text={content.label} color={labelColor} fontSize={40} fontWeight="normal" delay={15} animation="fade" />
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const ImageScene: React.FC<{ content: any; theme: Theme }> = ({ content, theme }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const animation = content.animation || 'zoom-in';

  let scale = 1;
  let translateX = 0;

  if (animation === 'zoom-in') {
    scale = interpolate(frame, [0, durationInFrames], [1, 1.15], { extrapolateRight: 'clamp' });
  } else if (animation === 'zoom-out') {
    scale = interpolate(frame, [0, durationInFrames], [1.15, 1], { extrapolateRight: 'clamp' });
  } else if (animation === 'pan') {
    translateX = interpolate(frame, [0, durationInFrames], [-20, 20], { extrapolateRight: 'clamp' });
    scale = 1.1;
  }

  if (!content.url) {
    return (
      <AbsoluteFill style={{ fontFamily: theme.fontFamily || 'Arial, sans-serif' }}>
        <Background variant="dark" theme={theme} />
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ color: '#666', fontSize: 24 }}>No image URL provided</p>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Img src={content.url} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: \`scale(\${scale}) translateX(\${translateX}px)\` }} />
      {(content.title || content.subtitle) && (
        <AbsoluteFill style={{ background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.8) 100%)', justifyContent: 'flex-end', alignItems: 'center', padding: 60, fontFamily: theme.fontFamily || 'Arial, sans-serif' }}>
          <div style={{ textAlign: 'center' }}>
            {content.title && <h2 style={{ color: '#fff', fontSize: 48, margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{content.title}</h2>}
            {content.subtitle && <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 24, marginTop: 10 }}>{content.subtitle}</p>}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

const SplitScene: React.FC<{ content: any; theme: Theme }> = ({ content, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const variant = content.variant || 'dark';
  const isDark = variant === 'dark';
  const titleColor = content.titleColor || theme.primaryColor || DEFAULT_COLORS.primary;
  const textColor = isDark ? DEFAULT_COLORS.white : DEFAULT_COLORS.dark;
  const imagePosition = content.imagePosition || 'right';

  const imageProgress = spring({ frame, fps, config: { damping: 20, stiffness: 80 } });
  const imageX = interpolate(imageProgress, [0, 1], [imagePosition === 'left' ? -100 : 100, 0]);
  const imageOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const textOpacity = interpolate(frame - 25, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const textContent = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 60 }}>
      {content.title && <AnimatedText text={content.title} color={titleColor} fontSize={52} delay={10} animation="slide" />}
      {content.subtitle && (
        <div style={{ marginTop: 16 }}>
          <AnimatedText text={content.subtitle} color={textColor} fontSize={28} fontWeight="normal" delay={18} animation="fade" />
        </div>
      )}
      {content.text && <p style={{ color: textColor, fontSize: 22, marginTop: 24, lineHeight: 1.6, opacity: textOpacity * 0.85 }}>{content.text}</p>}
    </div>
  );

  const imageContent = (
    <div style={{ flex: 1, overflow: 'hidden', transform: \`translateX(\${imageX}px)\`, opacity: imageOpacity }}>
      {content.imageUrl ? (
        <Img src={content.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', backgroundColor: titleColor, opacity: 0.2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <span style={{ color: textColor, opacity: 0.5 }}>Image</span>
        </div>
      )}
    </div>
  );

  return (
    <AbsoluteFill style={{ fontFamily: theme.fontFamily || 'Arial, sans-serif' }}>
      <Background variant={variant} theme={theme} />
      <AbsoluteFill style={{ flexDirection: 'row', display: 'flex' }}>
        {imagePosition === 'left' ? <>{imageContent}{textContent}</> : <>{textContent}{imageContent}</>}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const ListScene: React.FC<{ content: any; theme: Theme }> = ({ content, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const variant = content.variant || 'dark';
  const isDark = variant === 'dark';
  const titleColor = content.titleColor || theme.primaryColor || DEFAULT_COLORS.primary;
  const textColor = isDark ? DEFAULT_COLORS.white : DEFAULT_COLORS.dark;
  const items = content.items || [];

  return (
    <AbsoluteFill style={{ fontFamily: theme.fontFamily || 'Arial, sans-serif' }}>
      <Background variant={variant} theme={theme} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 80 }}>
        <div style={{ maxWidth: '80%' }}>
          {content.title && (
            <div style={{ marginBottom: 50, textAlign: 'center' }}>
              <AnimatedText text={content.title} color={titleColor} fontSize={52} delay={0} animation="slide" />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {items.map((item: string, i: number) => {
              const delay = 15 + i * 8;
              const progress = spring({ frame: frame - delay, fps, config: { damping: 15, stiffness: 100 } });
              const x = interpolate(progress, [0, 1], [100, 0]);
              const opacity = interpolate(frame - delay, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 20, transform: \`translateX(\${x}px)\`, opacity }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: titleColor, flexShrink: 0 }} />
                  <span style={{ color: textColor, fontSize: 32 }}>{item}</span>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const StatsScene: React.FC<{ content: any; theme: Theme }> = ({ content, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const variant = content.variant || 'dark';
  const isDark = variant === 'dark';
  const accentColor = theme.primaryColor || DEFAULT_COLORS.primary;
  const textColor = isDark ? DEFAULT_COLORS.white : DEFAULT_COLORS.dark;
  const stats = content.stats || [];

  return (
    <AbsoluteFill style={{ fontFamily: theme.fontFamily || 'Arial, sans-serif' }}>
      <Background variant={variant} theme={theme} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 60 }}>
        <div style={{ width: '100%', maxWidth: 1200 }}>
          {content.title && (
            <div style={{ marginBottom: 60, textAlign: 'center' }}>
              <AnimatedText text={content.title} color={accentColor} fontSize={48} delay={0} animation="slide" />
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 80, flexWrap: 'wrap' }}>
            {stats.map((stat: any, i: number) => {
              const delay = 10 + i * 8;
              const progress = spring({ frame: frame - delay, fps, config: { damping: 15, stiffness: 100 } });
              const scale = interpolate(progress, [0, 1], [0.8, 1]);
              const opacity = interpolate(frame - delay, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
              const numValue = typeof stat.value === 'string' ? parseInt(stat.value, 10) || 0 : stat.value;

              return (
                <div key={i} style={{ textAlign: 'center', transform: \`scale(\${scale})\`, opacity }}>
                  <AnimatedCounter value={numValue} suffix={stat.suffix || ''} color={accentColor} fontSize={72} delay={delay} />
                  <p style={{ color: textColor, fontSize: 24, marginTop: 10, opacity: 0.8 }}>{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const IntroScene: React.FC<{ content: any; theme: Theme }> = ({ content, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const variant = content.variant || 'dark';
  const isDark = variant === 'dark';
  const titleColor = content.titleColor || theme.primaryColor || DEFAULT_COLORS.primary;
  const subtitleColor = isDark ? DEFAULT_COLORS.white : DEFAULT_COLORS.dark;

  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const logoRotation = interpolate(frame, [0, 20], [180, 0], { extrapolateRight: 'clamp' });
  const logoOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ fontFamily: theme.fontFamily || 'Arial, sans-serif' }}>
      <Background variant={variant} theme={theme} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          {content.logoUrl ? (
            <div style={{ transform: \`scale(\${logoScale}) rotate(\${logoRotation}deg)\`, opacity: logoOpacity, marginBottom: 40 }}>
              <Img src={content.logoUrl} style={{ width: 150, height: 150, objectFit: 'contain' }} />
            </div>
          ) : (
            <div style={{
              width: 120, height: 120, borderRadius: '50%', backgroundColor: titleColor,
              transform: \`scale(\${logoScale})\`, opacity: logoOpacity, marginBottom: 40,
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              boxShadow: \`0 10px 40px \${titleColor}50\`,
            }}>
              <span style={{ color: '#fff', fontSize: 48, fontWeight: 'bold' }}>{content.title?.charAt(0) || '?'}</span>
            </div>
          )}
          {content.title && <AnimatedText text={content.title} color={titleColor} fontSize={72} delay={15} animation="scale" />}
          {content.subtitle && (
            <div style={{ marginTop: 20 }}>
              <AnimatedText text={content.subtitle} color={subtitleColor} fontSize={32} fontWeight="normal" delay={25} animation="fade" />
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const OutroScene: React.FC<{ content: any; theme: Theme }> = ({ content, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const variant = content.variant || 'dark';
  const isDark = variant === 'dark';
  const accentColor = content.titleColor || theme.primaryColor || DEFAULT_COLORS.primary;
  const textColor = isDark ? DEFAULT_COLORS.white : DEFAULT_COLORS.dark;

  const ctaScale = spring({ frame: frame - 25, fps, config: { damping: 10, stiffness: 150 } });
  const ctaPulse = 1 + Math.sin(frame * 0.1) * 0.02;
  const ctaOpacity = interpolate(frame - 25, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const textOpacity = interpolate(frame - 20, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ fontFamily: theme.fontFamily || 'Arial, sans-serif' }}>
      <Background variant={variant} theme={theme} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '80%' }}>
          {content.title && <AnimatedText text={content.title} color={accentColor} fontSize={64} delay={0} animation="scale" />}
          {content.subtitle && (
            <div style={{ marginTop: 16 }}>
              <AnimatedText text={content.subtitle} color={textColor} fontSize={32} fontWeight="normal" delay={12} animation="fade" />
            </div>
          )}
          {content.text && <p style={{ color: textColor, fontSize: 28, marginTop: 30, opacity: textOpacity * 0.9 }}>{content.text}</p>}
          {content.cta && (
            <div style={{ marginTop: 40, transform: \`scale(\${ctaScale * ctaPulse})\`, opacity: ctaOpacity }}>
              <div style={{
                display: 'inline-block', backgroundColor: accentColor, color: '#fff',
                fontSize: 24, fontWeight: 'bold', padding: '16px 48px', borderRadius: 50,
                boxShadow: \`0 8px 30px \${accentColor}60\`,
              }}>
                {content.cta}
              </div>
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============================================================================
// CTA SCENE WITH QR CODE
// ============================================================================

// Simple QR Code generator component (SVG-based)
const QRCodeSVG: React.FC<{ value: string; size?: number; fgColor?: string; bgColor?: string }> = ({ 
  value, size = 180, fgColor = '#000000', bgColor = '#ffffff' 
}) => {
  // QR Code matrix generator (simplified for common use cases)
  const generateMatrix = (text: string): boolean[][] => {
    const size = Math.max(21, Math.ceil(text.length / 2) + 17);
    const matrix: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
    
    // Add finder patterns (corners)
    const addFinderPattern = (row: number, col: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
          const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          if (row + r < size && col + c < size) {
            matrix[row + r][col + c] = isOuter || isInner;
          }
        }
      }
    };
    
    addFinderPattern(0, 0);
    addFinderPattern(0, size - 7);
    addFinderPattern(size - 7, 0);
    
    // Add timing patterns
    for (let i = 8; i < size - 8; i++) {
      matrix[6][i] = i % 2 === 0;
      matrix[i][6] = i % 2 === 0;
    }
    
    // Encode data (simplified - uses character codes to create pattern)
    let dataIndex = 0;
    for (let row = size - 1; row >= 9; row -= 2) {
      for (let col = size - 1; col >= 9; col--) {
        if (!matrix[row][col] && dataIndex < text.length) {
          matrix[row][col] = text.charCodeAt(dataIndex) % 2 === 1;
          dataIndex++;
        }
        if (row > 0 && !matrix[row - 1][col] && dataIndex < text.length) {
          matrix[row - 1][col] = text.charCodeAt(dataIndex) % 3 !== 0;
          dataIndex++;
        }
      }
    }
    
    return matrix;
  };

  const matrix = generateMatrix(value);
  const cellSize = size / matrix.length;

  return (
    <svg width={size} height={size} viewBox={\`0 0 \${size} \${size}\`}>
      <rect width={size} height={size} fill={bgColor} />
      {matrix.map((row, rowIndex) =>
        row.map((cell, colIndex) =>
          cell ? (
            <rect
              key={\`\${rowIndex}-\${colIndex}\`}
              x={colIndex * cellSize}
              y={rowIndex * cellSize}
              width={cellSize}
              height={cellSize}
              fill={fgColor}
            />
          ) : null
        )
      )}
    </svg>
  );
};

const CTAScene: React.FC<{ content: any; theme: Theme }> = ({ content, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const variant = content.variant || 'dark';
  const isDark = variant === 'dark';
  const accentColor = content.titleColor || theme.primaryColor || DEFAULT_COLORS.primary;
  const textColor = isDark ? DEFAULT_COLORS.white : DEFAULT_COLORS.dark;
  const showQR = content.qrCode !== false && content.url;
  const qrSize = content.qrSize || 180;
  const qrPosition = content.qrPosition || 'right';

  const qrScale = spring({ frame: frame - 20, fps, config: { damping: 12, stiffness: 100 } });
  const qrOpacity = interpolate(frame - 20, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const buttonScale = spring({ frame: frame - 30, fps, config: { damping: 10, stiffness: 150 } });
  const buttonPulse = 1 + Math.sin(frame * 0.1) * 0.02;
  const buttonOpacity = interpolate(frame - 30, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const textSection = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: qrPosition === 'center' ? 'center' : 'flex-start' }}>
      {content.title && <AnimatedText text={content.title} color={accentColor} fontSize={56} delay={0} animation="scale" />}
      {content.subtitle && (
        <div style={{ marginTop: 16 }}>
          <AnimatedText text={content.subtitle} color={textColor} fontSize={28} fontWeight="normal" delay={10} animation="fade" />
        </div>
      )}
      {content.url && (
        <div style={{ marginTop: 24, opacity: interpolate(frame - 15, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
          <span style={{ color: accentColor, fontSize: 24, fontWeight: 'bold' }}>{content.url}</span>
        </div>
      )}
      {content.cta && (
        <div style={{ marginTop: 30, transform: \`scale(\${buttonScale * buttonPulse})\`, opacity: buttonOpacity }}>
          <div style={{
            display: 'inline-block', backgroundColor: accentColor, color: '#fff',
            fontSize: 22, fontWeight: 'bold', padding: '14px 40px', borderRadius: 50,
            boxShadow: \`0 8px 30px \${accentColor}60\`,
          }}>
            {content.cta}
          </div>
        </div>
      )}
    </div>
  );

  const qrSection = showQR && (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      transform: \`scale(\${qrScale})\`, opacity: qrOpacity,
      padding: qrPosition === 'center' ? '40px 0 0 0' : '0 60px',
    }}>
      <div style={{
        backgroundColor: '#ffffff', padding: 16, borderRadius: 16,
        boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
      }}>
        <QRCodeSVG value={content.url} size={qrSize} fgColor="#000000" bgColor="#ffffff" />
      </div>
      <p style={{ color: textColor, fontSize: 16, marginTop: 12, opacity: 0.7 }}>Scannez pour accéder</p>
    </div>
  );

  return (
    <AbsoluteFill style={{ fontFamily: theme.fontFamily || 'Arial, sans-serif' }}>
      <Background variant={variant} theme={theme} />
      <AbsoluteFill style={{
        justifyContent: 'center', alignItems: 'center', padding: 80,
        flexDirection: qrPosition === 'center' ? 'column' : 'row',
      }}>
        {qrPosition === 'left' && qrSection}
        {textSection}
        {qrPosition !== 'left' && qrSection}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const Main: React.FC<{ scenes: Scene[]; theme: Theme }> = ({ scenes, theme }) => {
  const { fps } = useVideoConfig();

  const finalTheme: Theme = {
    primaryColor: theme.primaryColor || '#E85D04',
    secondaryColor: theme.secondaryColor || '#ffffff',
    backgroundColor: theme.backgroundColor || '#1a1a1a',
    fontFamily: theme.fontFamily || 'Arial, Helvetica, sans-serif',
  };

  if (!scenes || scenes.length === 0) {
    return (
      <AbsoluteFill style={{ backgroundColor: finalTheme.backgroundColor, justifyContent: 'center', alignItems: 'center', fontFamily: finalTheme.fontFamily }}>
        <p style={{ color: finalTheme.secondaryColor, fontSize: 32 }}>No scenes provided</p>
      </AbsoluteFill>
    );
  }

  // Precalculate frame positions to avoid mutation during render
  const sceneFrames: Array<{ from: number; duration: number }> = [];
  let frameAccumulator = 0;
  for (const scene of scenes) {
    const durationFrames = Math.round(scene.duration * fps);
    sceneFrames.push({ from: frameAccumulator, duration: durationFrames });
    frameAccumulator += durationFrames;
  }

  const renderScene = (scene: Scene) => {
    const props = { content: scene.content, theme: finalTheme };
    switch (scene.type) {
      case 'title': return <TitleScene {...props} />;
      case 'text': return <TextScene {...props} />;
      case 'counter': return <CounterScene {...props} />;
      case 'image': return <ImageScene {...props} />;
      case 'split': return <SplitScene {...props} />;
      case 'list': return <ListScene {...props} />;
      case 'stats': return <StatsScene {...props} />;
      case 'intro': return <IntroScene {...props} />;
      case 'outro': return <OutroScene {...props} />;
      case 'cta': return <CTAScene {...props} />;
      default: return <TextScene {...props} />;
    }
  };

  return (
    <AbsoluteFill>
      {scenes.map((scene, index) => (
        <Sequence 
          key={index} 
          from={sceneFrames[index].from} 
          durationInFrames={sceneFrames[index].duration} 
          name={\`Scene \${index + 1}: \${scene.type}\`}
        >
          {renderScene(scene)}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
`;
  }
}
