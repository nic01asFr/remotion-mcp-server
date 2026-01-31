/**
 * Stats Scene - Multiple statistics displayed together
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { Background, Theme, DEFAULT_COLORS } from '../components/Background';
import { AnimatedText, AnimatedCounter } from '../components/animations';

interface Stat {
  value: string | number;
  label: string;
  suffix?: string;
}

export interface StatsSceneProps {
  content: {
    title?: string;
    stats?: Stat[];
    variant?: 'dark' | 'light';
  };
  theme: Theme;
}

export const StatsScene: React.FC<StatsSceneProps> = ({ content, theme }) => {
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
      <AbsoluteFill style={{ 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: 60,
      }}>
        <div style={{ width: '100%', maxWidth: 1200 }}>
          {content.title && (
            <div style={{ marginBottom: 60, textAlign: 'center' }}>
              <AnimatedText
                text={content.title}
                color={accentColor}
                fontSize={48}
                fontWeight="bold"
                delay={0}
                animation="slide"
              />
            </div>
          )}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center',
            gap: 80,
            flexWrap: 'wrap',
          }}>
            {stats.map((stat, i) => {
              const delay = 10 + i * 8;
              const progress = spring({
                frame: frame - delay,
                fps,
                config: { damping: 15, stiffness: 100 },
              });
              const scale = interpolate(progress, [0, 1], [0.8, 1]);
              const opacity = interpolate(frame - delay, [0, 15], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              
              const numValue = typeof stat.value === 'string'
                ? parseInt(stat.value, 10) || 0
                : stat.value;
              
              return (
                <div
                  key={i}
                  style={{
                    textAlign: 'center',
                    transform: `scale(${scale})`,
                    opacity,
                  }}
                >
                  <AnimatedCounter
                    value={numValue}
                    suffix={stat.suffix || ''}
                    color={accentColor}
                    fontSize={72}
                    delay={delay}
                  />
                  <p style={{
                    color: textColor,
                    fontSize: 24,
                    marginTop: 10,
                    opacity: 0.8,
                  }}>
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
