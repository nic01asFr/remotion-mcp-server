/**
 * Animation utilities for Remotion
 * All animations driven by useCurrentFrame() - NO CSS transitions
 */

import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';

// ============================================================================
// FADE IN
// ============================================================================

export interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}

export const FadeIn: React.FC<FadeInProps> = ({ children, delay = 0, duration = 0.5 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const durationFrames = Math.round(duration * fps);
  const opacity = interpolate(
    frame,
    [delay, delay + durationFrames],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  
  return <div style={{ opacity }}>{children}</div>;
};

// ============================================================================
// SLIDE IN
// ============================================================================

export interface SlideInProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  duration?: number;
}

export const SlideIn: React.FC<SlideInProps> = ({ 
  children, 
  direction = 'up', 
  delay = 0,
  duration = 0.5 
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const durationFrames = Math.round(duration * fps);
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200, stiffness: 100 },
    durationInFrames: durationFrames,
  });
  
  const offsets = {
    up: { x: 0, y: 50 },
    down: { x: 0, y: -50 },
    left: { x: 50, y: 0 },
    right: { x: -50, y: 0 },
  };
  
  const { x, y } = offsets[direction];
  const translateX = interpolate(progress, [0, 1], [x, 0]);
  const translateY = interpolate(progress, [0, 1], [y, 0]);
  const opacity = interpolate(progress, [0, 0.5, 1], [0, 0.8, 1]);
  
  return (
    <div style={{ 
      transform: `translate(${translateX}px, ${translateY}px)`,
      opacity,
    }}>
      {children}
    </div>
  );
};

// ============================================================================
// SCALE IN
// ============================================================================

export interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}

export const ScaleIn: React.FC<ScaleInProps> = ({ children, delay = 0, duration = 0.5 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const durationFrames = Math.round(duration * fps);
  const scale = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 100 },
    durationInFrames: durationFrames,
  });
  
  const opacity = interpolate(frame - delay, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  
  return (
    <div style={{ 
      transform: `scale(${scale})`,
      opacity,
    }}>
      {children}
    </div>
  );
};

// ============================================================================
// ANIMATED TEXT (word by word)
// ============================================================================

export interface AnimatedTextProps {
  text: string;
  color?: string;
  fontSize?: number;
  fontWeight?: string | number;
  delay?: number;
  stagger?: number;
  animation?: 'fade' | 'slide' | 'scale' | 'typewriter';
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  color = '#ffffff',
  fontSize = 48,
  fontWeight = 'bold',
  delay = 0,
  stagger = 3,
  animation = 'slide',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const words = text.split(' ');
  
  if (animation === 'typewriter') {
    const charsPerFrame = 2;
    const visibleChars = Math.floor((frame - delay) * charsPerFrame);
    const displayText = text.substring(0, Math.max(0, visibleChars));
    
    return (
      <span style={{ color, fontSize, fontWeight }}>
        {displayText}
        {visibleChars < text.length && (
          <span style={{ opacity: frame % 15 < 8 ? 1 : 0 }}>|</span>
        )}
      </span>
    );
  }
  
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: fontSize * 0.2 }}>
      {words.map((word, i) => {
        const wordDelay = delay + i * stagger;
        
        let opacity = 1;
        let transform = 'none';
        
        if (animation === 'fade') {
          opacity = interpolate(frame - wordDelay, [0, 12], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
        } else if (animation === 'slide') {
          const progress = spring({
            frame: frame - wordDelay,
            fps,
            config: { damping: 15, stiffness: 150 },
          });
          const y = interpolate(progress, [0, 1], [30, 0]);
          opacity = interpolate(frame - wordDelay, [0, 8], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          transform = `translateY(${y}px)`;
        } else if (animation === 'scale') {
          const scale = spring({
            frame: frame - wordDelay,
            fps,
            config: { damping: 12, stiffness: 180 },
          });
          opacity = interpolate(frame - wordDelay, [0, 8], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          transform = `scale(${scale})`;
        }
        
        return (
          <span
            key={i}
            style={{
              color,
              fontSize,
              fontWeight,
              opacity,
              transform,
              display: 'inline-block',
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

// ============================================================================
// ANIMATED COUNTER
// ============================================================================

export interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  color?: string;
  fontSize?: number;
  delay?: number;
  duration?: number;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  suffix = '',
  prefix = '',
  color = '#ffffff',
  fontSize = 120,
  delay = 0,
  duration = 1.5,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const durationFrames = Math.round(duration * fps);
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 30, stiffness: 60 },
    durationInFrames: durationFrames,
  });
  
  const displayValue = Math.floor(interpolate(progress, [0, 1], [0, value]));
  
  const scale = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  
  const opacity = interpolate(frame - delay, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  
  return (
    <div style={{
      color,
      fontSize,
      fontWeight: 'bold',
      transform: `scale(${Math.min(scale, 1.05)})`,
      opacity,
    }}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </div>
  );
};
