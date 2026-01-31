/**
 * MCP Resources - Documentation Remotion
 * 
 * Fournit les connaissances à l'assistant pour créer des templates.
 */

export interface Resource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export const resources: Resource[] = [
  {
    uri: 'remotion://docs/getting-started',
    name: 'Getting Started with Remotion Templates',
    description: 'Guide complet pour créer des templates vidéo avec Remotion',
    mimeType: 'text/markdown',
  },
  {
    uri: 'remotion://docs/api',
    name: 'Remotion API Reference',
    description: 'APIs principales: useCurrentFrame, interpolate, spring, Sequence',
    mimeType: 'text/markdown',
  },
  {
    uri: 'remotion://docs/animations',
    name: 'Animations and Transitions',
    description: 'Comment créer des animations fluides',
    mimeType: 'text/markdown',
  },
  {
    uri: 'remotion://docs/scene-types',
    name: 'Scene Types Reference',
    description: 'Types de scènes standards et leur structure',
    mimeType: 'text/markdown',
  },
  {
    uri: 'remotion://examples/text-scene',
    name: 'Example: Text Scene',
    description: 'Composant de scène texte avec animations',
    mimeType: 'text/x.typescript',
  },
  {
    uri: 'remotion://examples/image-scene',
    name: 'Example: Image Scene',
    description: 'Composant de scène image avec zoom/pan',
    mimeType: 'text/x.typescript',
  },
  {
    uri: 'remotion://examples/full-template',
    name: 'Example: Complete Template',
    description: 'Template complet prêt à personnaliser',
    mimeType: 'text/x.typescript',
  },
];

/**
 * Contenu des resources
 */
export const resourceContents: Record<string, string> = {

// ============================================================================
// GETTING STARTED
// ============================================================================
'remotion://docs/getting-started': `# Créer des Templates Remotion

## Structure d'un Template

Un template Remotion est un composant React qui reçoit des \`inputProps\` et génère une vidéo frame par frame.

\`\`\`tsx
import React from 'react';
import { useCurrentFrame, useVideoConfig, AbsoluteFill } from 'remotion';

interface MainProps {
  scenes: Scene[];
  theme: Theme;
}

export const Main: React.FC<MainProps> = ({ scenes, theme }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  
  return (
    <AbsoluteFill style={{ backgroundColor: theme.backgroundColor }}>
      {/* Contenu de la vidéo */}
    </AbsoluteFill>
  );
};
\`\`\`

## Concepts Clés

### 1. Frame-Based Rendering
Remotion rend chaque frame indépendamment. Le hook \`useCurrentFrame()\` retourne le numéro de frame actuel (0-indexed).

### 2. Composition
La vidéo est composée de \`Sequence\` qui définissent quand chaque élément apparaît.

### 3. InputProps
Les templates reçoivent des props qui permettent de personnaliser le contenu sans modifier le code.

## Pattern Standard

\`\`\`tsx
// 1. Définir les interfaces
interface Scene {
  type: 'text' | 'image' | 'video' | 'outro';
  duration: number; // en secondes
  content: Record<string, unknown>;
}

interface Theme {
  primaryColor: string;
  backgroundColor: string;
  fontFamily: string;
}

// 2. Créer les composants de scène
const TextScene: React.FC<{ content: any; theme: Theme }> = ...
const ImageScene: React.FC<{ content: any; theme: Theme }> = ...

// 3. Assembler dans Main
export const Main: React.FC<{ scenes: Scene[]; theme: Theme }> = ({ scenes, theme }) => {
  const { fps } = useVideoConfig();
  let currentFrame = 0;
  
  return (
    <AbsoluteFill>
      {scenes.map((scene, i) => {
        const from = currentFrame;
        const duration = Math.ceil(scene.duration * fps);
        currentFrame += duration;
        
        return (
          <Sequence key={i} from={from} durationInFrames={duration}>
            {scene.type === 'text' && <TextScene content={scene.content} theme={theme} />}
            {scene.type === 'image' && <ImageScene content={scene.content} theme={theme} />}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
\`\`\`
`,

// ============================================================================
// API REFERENCE
// ============================================================================
'remotion://docs/api': `# Remotion API Reference

## Hooks

### useCurrentFrame()
Retourne le numéro de frame actuel (0-indexed).

\`\`\`tsx
const frame = useCurrentFrame(); // 0, 1, 2, ...
\`\`\`

### useVideoConfig()
Retourne la configuration de la vidéo.

\`\`\`tsx
const { width, height, fps, durationInFrames } = useVideoConfig();
// { width: 1920, height: 1080, fps: 30, durationInFrames: 300 }
\`\`\`

## Fonctions d'Animation

### interpolate(value, inputRange, outputRange, options?)
Mappe une valeur d'une plage à une autre.

\`\`\`tsx
// Fade in sur 30 frames
const opacity = interpolate(frame, [0, 30], [0, 1], {
  extrapolateRight: 'clamp', // Bloque à 1 après frame 30
});

// Déplacement de gauche à droite
const x = interpolate(frame, [0, 60], [-100, 0]);
\`\`\`

**Options:**
- \`extrapolateLeft\`: 'extend' | 'clamp' | 'identity'
- \`extrapolateRight\`: 'extend' | 'clamp' | 'identity'
- \`easing\`: Fonction d'easing (voir Easing)

### spring(options)
Animation physique naturelle (rebond).

\`\`\`tsx
const scale = spring({
  frame,
  fps,
  config: {
    damping: 100,   // Amortissement (10-200)
    stiffness: 200, // Rigidité (100-400)
    mass: 1,        // Masse (0.5-5)
  },
});
\`\`\`

### interpolateColors(value, inputRange, outputRange)
Interpole entre des couleurs.

\`\`\`tsx
const color = interpolateColors(frame, [0, 60], ['#ff0000', '#0000ff']);
\`\`\`

## Easing

\`\`\`tsx
import { Easing } from 'remotion';

// Easings de base
Easing.linear
Easing.ease
Easing.quad
Easing.cubic
Easing.sin
Easing.exp
Easing.bounce

// Modificateurs
Easing.in(Easing.cubic)    // Accélère
Easing.out(Easing.cubic)   // Décélère
Easing.inOut(Easing.cubic) // Les deux

// Bezier personnalisé
Easing.bezier(0.25, 0.1, 0.25, 1)
\`\`\`

## Composants

### AbsoluteFill
Container plein écran avec position absolute.

\`\`\`tsx
<AbsoluteFill style={{ backgroundColor: '#000' }}>
  {children}
</AbsoluteFill>
\`\`\`

### Sequence
Définit quand un élément apparaît dans la timeline.

\`\`\`tsx
<Sequence from={0} durationInFrames={60}>
  <Scene1 />
</Sequence>
<Sequence from={60} durationInFrames={90}>
  <Scene2 />
</Sequence>
\`\`\`

### Img
Image qui attend le chargement avant render.

\`\`\`tsx
<Img src="https://..." style={{ objectFit: 'cover' }} />
\`\`\`

### OffthreadVideo
Vidéo synchronisée avec la timeline.

\`\`\`tsx
<OffthreadVideo src="https://..." />
\`\`\`

### Audio
Audio synchronisé.

\`\`\`tsx
<Audio src="https://..." volume={0.5} />
\`\`\`
`,

// ============================================================================
// ANIMATIONS
// ============================================================================
'remotion://docs/animations': `# Animations et Transitions

## Patterns d'Animation

### Fade In
\`\`\`tsx
const FadeIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });
  return <div style={{ opacity }}>{children}</div>;
};
\`\`\`

### Slide In
\`\`\`tsx
const SlideIn: React.FC<{ 
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
}> = ({ children, direction = 'left' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const progress = spring({ frame, fps, config: { damping: 100, stiffness: 200 } });
  
  const offset = {
    left: { x: -100, y: 0 },
    right: { x: 100, y: 0 },
    up: { x: 0, y: -100 },
    down: { x: 0, y: 100 },
  }[direction];
  
  const x = interpolate(progress, [0, 1], [offset.x, 0]);
  const y = interpolate(progress, [0, 1], [offset.y, 0]);
  
  return (
    <div style={{ transform: \`translate(\${x}%, \${y}%)\` }}>
      {children}
    </div>
  );
};
\`\`\`

### Scale/Pop
\`\`\`tsx
const PopIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const scale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 100 },
  });
  
  return <div style={{ transform: \`scale(\${scale})\` }}>{children}</div>;
};
\`\`\`

### Typewriter
\`\`\`tsx
const Typewriter: React.FC<{ text: string; speed?: number }> = ({ 
  text, 
  speed = 2 
}) => {
  const frame = useCurrentFrame();
  const chars = Math.floor(frame / speed);
  return <span>{text.slice(0, chars)}</span>;
};
\`\`\`

### Stagger (Animation en cascade)
\`\`\`tsx
const StaggeredList: React.FC<{ items: string[] }> = ({ items }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  return (
    <div>
      {items.map((item, i) => {
        const delay = i * 5; // 5 frames entre chaque
        const itemFrame = Math.max(0, frame - delay);
        
        const opacity = interpolate(itemFrame, [0, 15], [0, 1], {
          extrapolateRight: 'clamp',
        });
        const y = interpolate(itemFrame, [0, 15], [20, 0], {
          extrapolateRight: 'clamp',
        });
        
        return (
          <div 
            key={i} 
            style={{ 
              opacity, 
              transform: \`translateY(\${y}px)\` 
            }}
          >
            {item}
          </div>
        );
      })}
    </div>
  );
};
\`\`\`

## Transitions entre Scènes

### Crossfade
\`\`\`tsx
const CrossfadeTransition: React.FC<{
  scene1: React.ReactNode;
  scene2: React.ReactNode;
  transitionDuration: number; // frames
}> = ({ scene1, scene2, transitionDuration }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  
  const transitionStart = durationInFrames - transitionDuration;
  
  const opacity1 = interpolate(
    frame,
    [transitionStart, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  
  const opacity2 = interpolate(
    frame,
    [transitionStart, durationInFrames],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: opacity1 }}>{scene1}</AbsoluteFill>
      <AbsoluteFill style={{ opacity: opacity2 }}>{scene2}</AbsoluteFill>
    </AbsoluteFill>
  );
};
\`\`\`

### Wipe
\`\`\`tsx
const WipeTransition: React.FC<{
  children: React.ReactNode;
  direction?: 'left' | 'right';
}> = ({ children, direction = 'right' }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  
  const progress = interpolate(frame, [0, 30], [0, 100], {
    extrapolateRight: 'clamp',
  });
  
  const clipPath = direction === 'right'
    ? \`inset(0 \${100 - progress}% 0 0)\`
    : \`inset(0 0 0 \${100 - progress}%)\`;
  
  return <div style={{ clipPath }}>{children}</div>;
};
\`\`\`
`,

// ============================================================================
// SCENE TYPES
// ============================================================================
'remotion://docs/scene-types': `# Types de Scènes Standards

## Structure d'une Scène

\`\`\`typescript
interface Scene {
  type: 'text' | 'image' | 'video' | 'split' | 'logo' | 'outro';
  duration: number; // secondes
  content: SceneContent;
  transition?: 'fade' | 'slide' | 'none';
}
\`\`\`

## Scene Types

### text
Affiche du texte avec titre et/ou sous-titre.

\`\`\`typescript
{
  type: 'text',
  duration: 3,
  content: {
    title: 'Titre Principal',
    subtitle: 'Sous-titre optionnel',
    align: 'center' | 'left' | 'right',
  }
}
\`\`\`

### image
Affiche une image avec animation optionnelle.

\`\`\`typescript
{
  type: 'image',
  duration: 5,
  content: {
    url: 'https://...',
    fit: 'cover' | 'contain' | 'fill',
    animation: 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'none',
    overlay: {
      text: 'Caption optionnel',
      position: 'bottom' | 'top',
    }
  }
}
\`\`\`

### video
Embed une vidéo.

\`\`\`typescript
{
  type: 'video',
  duration: 10, // ou 'auto' pour durée de la vidéo
  content: {
    url: 'https://...',
    startFrom: 0, // secondes
    volume: 1,
  }
}
\`\`\`

### split
Écran divisé avec deux contenus.

\`\`\`typescript
{
  type: 'split',
  duration: 5,
  content: {
    layout: 'horizontal' | 'vertical',
    left: { type: 'image', url: '...' },
    right: { type: 'text', title: '...' },
    ratio: 0.5, // 0-1, proportion du premier élément
  }
}
\`\`\`

### logo
Affiche un logo avec animation.

\`\`\`typescript
{
  type: 'logo',
  duration: 2,
  content: {
    url: 'https://...',
    animation: 'fade' | 'scale' | 'spin',
    size: 200, // pixels
  }
}
\`\`\`

### outro
Scène de fin.

\`\`\`typescript
{
  type: 'outro',
  duration: 3,
  content: {
    text: 'Merci !',
    subtext: 'www.example.com',
    logo: 'https://...',
  }
}
\`\`\`

## Theme

\`\`\`typescript
interface Theme {
  primaryColor: string;      // Couleur principale (titres)
  secondaryColor: string;    // Couleur secondaire (sous-titres)
  backgroundColor: string;   // Fond
  accentColor?: string;      // Accents
  fontFamily: string;        // Police principale
  fontFamilySecondary?: string; // Police secondaire
}
\`\`\`

**Exemple:**
\`\`\`typescript
{
  primaryColor: '#FFFFFF',
  secondaryColor: '#AAAAAA',
  backgroundColor: '#1a1a2e',
  accentColor: '#e94560',
  fontFamily: 'Inter',
}
\`\`\`
`,

// ============================================================================
// EXAMPLE: TEXT SCENE
// ============================================================================
'remotion://examples/text-scene': `// TextScene.tsx - Composant de scène texte

import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  AbsoluteFill,
} from 'remotion';

interface TextSceneProps {
  content: {
    title: string;
    subtitle?: string;
    align?: 'left' | 'center' | 'right';
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    fontFamily: string;
  };
}

export const TextScene: React.FC<TextSceneProps> = ({ content, theme }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Fade in au début
  const fadeIn = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Fade out à la fin
  const fadeOut = interpolate(
    frame,
    [durationInFrames - fps * 0.5, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp' }
  );

  const opacity = Math.min(fadeIn, fadeOut);

  // Animation scale avec spring
  const scale = spring({
    frame,
    fps,
    config: { damping: 100, stiffness: 200 },
  });

  // Animation du sous-titre (légèrement décalée)
  const subtitleOpacity = interpolate(
    frame,
    [fps * 0.3, fps * 0.8],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const subtitleY = interpolate(
    frame,
    [fps * 0.3, fps * 0.8],
    [20, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.backgroundColor,
        justifyContent: 'center',
        alignItems: content.align === 'left' ? 'flex-start' : 
                   content.align === 'right' ? 'flex-end' : 'center',
        padding: 80,
        fontFamily: theme.fontFamily,
      }}
    >
      <div
        style={{
          opacity,
          transform: \`scale(\${scale})\`,
          textAlign: content.align || 'center',
        }}
      >
        <h1
          style={{
            color: theme.primaryColor,
            fontSize: 72,
            fontWeight: 'bold',
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {content.title}
        </h1>

        {content.subtitle && (
          <p
            style={{
              color: theme.secondaryColor,
              fontSize: 36,
              margin: 0,
              marginTop: 24,
              opacity: subtitleOpacity,
              transform: \`translateY(\${subtitleY}px)\`,
            }}
          >
            {content.subtitle}
          </p>
        )}
      </div>
    </AbsoluteFill>
  );
};
`,

// ============================================================================
// EXAMPLE: IMAGE SCENE
// ============================================================================
'remotion://examples/image-scene': `// ImageScene.tsx - Composant de scène image

import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Img,
  AbsoluteFill,
} from 'remotion';

interface ImageSceneProps {
  content: {
    url: string;
    fit?: 'cover' | 'contain' | 'fill';
    animation?: 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'none';
    overlay?: {
      text: string;
      position?: 'top' | 'bottom';
    };
  };
  theme: {
    primaryColor: string;
    backgroundColor: string;
    fontFamily: string;
  };
}

export const ImageScene: React.FC<ImageSceneProps> = ({ content, theme }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  // Calcul de l'animation selon le type
  let transform = '';
  
  switch (content.animation) {
    case 'zoom-in':
      const scaleIn = interpolate(frame, [0, durationInFrames], [1, 1.2]);
      transform = \`scale(\${scaleIn})\`;
      break;
      
    case 'zoom-out':
      const scaleOut = interpolate(frame, [0, durationInFrames], [1.2, 1]);
      transform = \`scale(\${scaleOut})\`;
      break;
      
    case 'pan-left':
      const panLeft = interpolate(frame, [0, durationInFrames], [0, -10]);
      transform = \`translateX(\${panLeft}%) scale(1.1)\`;
      break;
      
    case 'pan-right':
      const panRight = interpolate(frame, [0, durationInFrames], [0, 10]);
      transform = \`translateX(\${panRight}%) scale(1.1)\`;
      break;
      
    default:
      transform = 'none';
  }

  // Fade in/out
  const fadeIn = interpolate(frame, [0, fps * 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - fps * 0.3, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp' }
  );
  const opacity = Math.min(fadeIn, fadeOut);

  // Overlay animation
  const overlayOpacity = interpolate(
    frame,
    [fps * 0.5, fps * 1],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: theme.backgroundColor }}>
      {/* Image principale */}
      <AbsoluteFill style={{ opacity, overflow: 'hidden' }}>
        <Img
          src={content.url}
          style={{
            width: '100%',
            height: '100%',
            objectFit: content.fit || 'cover',
            transform,
          }}
        />
      </AbsoluteFill>

      {/* Overlay optionnel */}
      {content.overlay && (
        <AbsoluteFill
          style={{
            justifyContent: content.overlay.position === 'top' ? 'flex-start' : 'flex-end',
            padding: 40,
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(0,0,0,0.6)',
              padding: '16px 32px',
              borderRadius: 8,
              opacity: overlayOpacity,
            }}
          >
            <p
              style={{
                color: theme.primaryColor,
                fontSize: 28,
                margin: 0,
                fontFamily: theme.fontFamily,
              }}
            >
              {content.overlay.text}
            </p>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
`,

// ============================================================================
// EXAMPLE: FULL TEMPLATE
// ============================================================================
'remotion://examples/full-template': `// Template Complet - Prêt à personnaliser
// Copiez ce code et adaptez-le à vos besoins

import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  Img,
  AbsoluteFill,
} from 'remotion';

// ============================================================================
// TYPES
// ============================================================================

interface Scene {
  type: 'text' | 'image' | 'outro';
  duration: number;
  content: Record<string, any>;
}

interface Theme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontFamily: string;
}

interface MainProps {
  scenes: Scene[];
  theme: Theme;
}

// ============================================================================
// SCENE COMPONENTS
// ============================================================================

const TextScene: React.FC<{ content: any; theme: Theme }> = ({ content, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const scale = spring({
    frame,
    fps,
    config: { damping: 100, stiffness: 200 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.backgroundColor,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: theme.fontFamily,
      }}
    >
      <div style={{ opacity, transform: \`scale(\${scale})\`, textAlign: 'center' }}>
        <h1 style={{ color: theme.primaryColor, fontSize: 72, margin: 0 }}>
          {content.title}
        </h1>
        {content.subtitle && (
          <p style={{ color: theme.secondaryColor, fontSize: 36, marginTop: 20 }}>
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
    <AbsoluteFill style={{ backgroundColor: theme.backgroundColor }}>
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
        backgroundColor: theme.backgroundColor,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: theme.fontFamily,
      }}
    >
      <p style={{ color: theme.primaryColor, fontSize: 60, opacity }}>
        {content.text || 'Thank you'}
      </p>
    </AbsoluteFill>
  );
};

// ============================================================================
// MAIN COMPOSITION
// ============================================================================

export const Main: React.FC<MainProps> = ({ scenes, theme }) => {
  const { fps } = useVideoConfig();

  // Calcul des positions de chaque scène
  let currentFrame = 0;

  return (
    <AbsoluteFill>
      {scenes.map((scene, index) => {
        const durationInFrames = Math.ceil(scene.duration * fps);
        const from = currentFrame;
        currentFrame += durationInFrames;

        return (
          <Sequence key={index} from={from} durationInFrames={durationInFrames}>
            {scene.type === 'text' && <TextScene content={scene.content} theme={theme} />}
            {scene.type === 'image' && <ImageScene content={scene.content} theme={theme} />}
            {scene.type === 'outro' && <OutroScene content={scene.content} theme={theme} />}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

// ============================================================================
// EXEMPLE D'UTILISATION (inputProps)
// ============================================================================
/*
{
  "scenes": [
    {
      "type": "text",
      "duration": 3,
      "content": {
        "title": "Bienvenue",
        "subtitle": "Présentation du projet"
      }
    },
    {
      "type": "image",
      "duration": 5,
      "content": {
        "url": "https://example.com/photo.jpg",
        "animation": "zoom-in"
      }
    },
    {
      "type": "outro",
      "duration": 2,
      "content": {
        "text": "Merci !"
      }
    }
  ],
  "theme": {
    "primaryColor": "#FFFFFF",
    "secondaryColor": "#AAAAAA",
    "backgroundColor": "#1a1a2e",
    "fontFamily": "Inter"
  }
}
*/
`,

};

/**
 * Get resource content by URI
 */
export function getResourceContent(uri: string): string | undefined {
  return resourceContents[uri];
}
