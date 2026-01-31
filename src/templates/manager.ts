/**
 * Template Manager
 * 
 * Gère les templates Remotion créés par l'assistant.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface TemplateMetadata {
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  inputSchema?: Record<string, unknown>;
}

export interface Template extends TemplateMetadata {
  code: string;
}

export class TemplateManager {
  private templatesDir: string;
  private templates: Map<string, Template> = new Map();

  constructor(templatesDir: string) {
    this.templatesDir = templatesDir;
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.templatesDir, { recursive: true });
    await this.loadTemplates();

    if (!this.templates.has('universal')) {
      await this.createDefaultTemplate();
    }

    console.error(`[TemplateManager] ${this.templates.size} templates loaded`);
  }

  private async loadTemplates(): Promise<void> {
    try {
      const files = await fs.readdir(this.templatesDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(
            path.join(this.templatesDir, file),
            'utf-8'
          );
          const template = JSON.parse(content) as Template;
          this.templates.set(template.name, template);
        }
      }
    } catch {
      // Ignore
    }
  }

  private async saveTemplate(template: Template): Promise<void> {
    const filepath = path.join(this.templatesDir, `${template.name}.json`);
    await fs.writeFile(filepath, JSON.stringify(template, null, 2));
  }

  async create(params: {
    name: string;
    description?: string;
    code: string;
    inputSchema?: Record<string, unknown>;
  }): Promise<Template> {
    const name = params.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    if (this.templates.has(name)) {
      throw new Error(`Template '${name}' already exists`);
    }

    if (!params.code.includes('export')) {
      throw new Error('Template must export a Main component');
    }

    const now = new Date().toISOString();
    const template: Template = {
      name,
      description: params.description,
      code: params.code,
      inputSchema: params.inputSchema,
      createdAt: now,
      updatedAt: now,
    };

    await this.saveTemplate(template);
    this.templates.set(name, template);
    await this.prepareBundle(template);

    return template;
  }

  async delete(name: string): Promise<void> {
    if (name === 'universal') {
      throw new Error("Cannot delete 'universal' template");
    }
    if (!this.templates.has(name)) {
      throw new Error(`Template '${name}' not found`);
    }

    await fs.unlink(path.join(this.templatesDir, `${name}.json`)).catch(() => {});
    await fs.rm(path.join(this.templatesDir, name), { recursive: true, force: true }).catch(() => {});
    this.templates.delete(name);
  }

  get(name: string): Template | undefined {
    return this.templates.get(name);
  }

  list(): TemplateMetadata[] {
    return Array.from(this.templates.values()).map(({ code, ...meta }) => meta);
  }

  getServeUrl(name: string): string {
    return `file://${path.join(this.templatesDir, name, 'bundle')}`;
  }

  private async prepareBundle(template: Template): Promise<void> {
    const srcDir = path.join(this.templatesDir, template.name, 'src');
    await fs.mkdir(srcDir, { recursive: true });

    await fs.writeFile(path.join(srcDir, 'Composition.tsx'), template.code);
    
    await fs.writeFile(
      path.join(srcDir, 'Root.tsx'),
      `import React from 'react';
import { Composition } from 'remotion';
import { Main } from './Composition';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Main"
    component={Main}
    durationInFrames={300}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{ scenes: [], theme: {} }}
  />
);
`
    );

    await fs.writeFile(
      path.join(srcDir, 'index.ts'),
      `import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';
registerRoot(RemotionRoot);
`
    );
  }

  private async createDefaultTemplate(): Promise<void> {
    const code = `import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  Img,
  AbsoluteFill,
} from 'remotion';

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
    <AbsoluteFill style={{
      backgroundColor: theme.backgroundColor || '#000',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: theme.fontFamily || 'Arial',
    }}>
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
  const scale = interpolate(frame, [0, durationInFrames], 
    content.animation === 'zoom-out' ? [1.2, 1] : [1, 1.2]);

  return (
    <AbsoluteFill style={{ backgroundColor: theme.backgroundColor || '#000' }}>
      <Img src={content.url} style={{
        width: '100%', height: '100%', objectFit: 'cover',
        transform: \`scale(\${scale})\`,
      }} />
    </AbsoluteFill>
  );
};

const OutroScene: React.FC<{ content: any; theme: Theme }> = ({ content, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, fps * 0.3], [0, 1]);

  return (
    <AbsoluteFill style={{
      backgroundColor: theme.backgroundColor || '#000',
      justifyContent: 'center', alignItems: 'center',
      fontFamily: theme.fontFamily || 'Arial',
    }}>
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

    await this.create({
      name: 'universal',
      description: 'Default template with text, image, and outro scenes',
      code,
    });
  }
}
