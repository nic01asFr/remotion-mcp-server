/**
 * Bundle the universal Remotion template
 * 
 * This script compiles the template source into a bundle
 * that can be used by @remotion/renderer
 */

import { bundle } from '@remotion/bundler';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('[Bundle] Starting template bundling...');
  
  const entryPoint = path.resolve(__dirname, '../templates/universal/src/index.ts');
  const outputDir = path.resolve(__dirname, '../templates/universal/bundle');
  
  console.log(`[Bundle] Entry: ${entryPoint}`);
  console.log(`[Bundle] Output: ${outputDir}`);
  
  try {
    const bundleLocation = await bundle({
      entryPoint,
      outDir: outputDir,
      webpackOverride: (config) => {
        return {
          ...config,
          resolve: {
            ...config.resolve,
            extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
          },
        };
      },
    });
    
    console.log(`[Bundle] Success! Bundle created at: ${bundleLocation}`);
  } catch (error) {
    console.error('[Bundle] Failed:', error);
    process.exit(1);
  }
}

main();
