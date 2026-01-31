/**
 * Dynamic Remotion Bundler
 * 
 * Creates and bundles Remotion projects on-the-fly from template code.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';

// Suppress console.log to stderr for MCP compatibility
const log = (...args: unknown[]) => console.error('[Bundler]', ...args);

interface BundleResult {
  bundlePath: string;
  cleanup: () => Promise<void>;
}

export class DynamicBundler {
  private cacheDir: string;
  private bundleCache: Map<string, string> = new Map();
  private bundler: typeof import('@remotion/bundler') | null = null;

  constructor(cacheDir: string) {
    this.cacheDir = cacheDir;
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.cacheDir, { recursive: true });
    
    try {
      this.bundler = await import('@remotion/bundler');
      log('Bundler loaded');
    } catch (err) {
      log('Bundler not available:', err);
    }
  }

  async bundle(templateCode: string, templateName: string): Promise<BundleResult> {
    // Check cache first
    const cacheKey = `${templateName}-${this.hashCode(templateCode)}`;
    const cachedPath = this.bundleCache.get(cacheKey);
    
    if (cachedPath) {
      try {
        await fs.access(cachedPath);
        log(`Using cached bundle for ${templateName}`);
        return {
          bundlePath: cachedPath,
          cleanup: async () => {}, // Don't cleanup cached bundles
        };
      } catch {
        this.bundleCache.delete(cacheKey);
      }
    }

    if (!this.bundler) {
      throw new Error('Bundler not available');
    }

    const projectDir = path.join(this.cacheDir, `project-${randomUUID()}`);
    const bundleDir = path.join(this.cacheDir, `bundle-${cacheKey}`);

    try {
      // Create project structure
      await this.createProjectStructure(projectDir, templateCode);

      log(`Bundling ${templateName}...`);
      
      // Bundle the project
      const bundlePath = await this.bundler.bundle({
        entryPoint: path.join(projectDir, 'src', 'index.ts'),
        outDir: bundleDir,
        onProgress: (progress) => {
          // Silent progress - don't pollute stdout
        },
      });

      // Cache the result
      this.bundleCache.set(cacheKey, bundlePath);

      log(`Bundle complete: ${bundlePath}`);

      return {
        bundlePath,
        cleanup: async () => {
          // Cleanup project dir but keep bundle for cache
          await fs.rm(projectDir, { recursive: true, force: true }).catch(() => {});
        },
      };
    } catch (err) {
      // Cleanup on error
      await fs.rm(projectDir, { recursive: true, force: true }).catch(() => {});
      await fs.rm(bundleDir, { recursive: true, force: true }).catch(() => {});
      throw err;
    }
  }

  private async createProjectStructure(projectDir: string, templateCode: string): Promise<void> {
    const srcDir = path.join(projectDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });

    // Create package.json
    await fs.writeFile(
      path.join(projectDir, 'package.json'),
      JSON.stringify({
        name: 'remotion-template',
        version: '1.0.0',
        type: 'module',
        dependencies: {
          remotion: '^4.0.0',
          react: '^18.2.0',
          'react-dom': '^18.2.0',
        },
      }, null, 2)
    );

    // Create remotion.config.ts
    await fs.writeFile(
      path.join(projectDir, 'remotion.config.ts'),
      `import { Config } from '@remotion/cli/config';
Config.setVideoImageFormat('png');
`
    );

    // Create the main composition file
    await fs.writeFile(
      path.join(srcDir, 'Template.tsx'),
      templateCode
    );

    // Create the entry point (Root.tsx)
    await fs.writeFile(
      path.join(srcDir, 'Root.tsx'),
      `import React from 'react';
import { Composition } from 'remotion';
import { Main } from './Template';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Main"
        component={Main}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          scenes: [],
          theme: {},
        }}
      />
    </>
  );
};
`
    );

    // Create index.ts entry point
    await fs.writeFile(
      path.join(srcDir, 'index.ts'),
      `import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';

registerRoot(RemotionRoot);
`
    );

    // Create tsconfig.json
    await fs.writeFile(
      path.join(projectDir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          module: 'ESNext',
          moduleResolution: 'bundler',
          jsx: 'react-jsx',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
        },
        include: ['src/**/*'],
      }, null, 2)
    );
  }

  private hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  async cleanup(): Promise<void> {
    // Optionally cleanup all cached bundles
    // await fs.rm(this.cacheDir, { recursive: true, force: true }).catch(() => {});
  }
}
