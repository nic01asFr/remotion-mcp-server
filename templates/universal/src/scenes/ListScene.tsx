/**
 * List Scene - Animated bullet points
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { Background, Theme, DEFAULT_COLORS } from '../components/Background';
import { AnimatedText } from '../components/animations';

export interface ListSceneProps {
  content: {
    title?: string;
    items?: string[];
    variant?: 'dark' | 'light';
    titleColor?: string;
  };
  theme: Theme;
}

export const ListScene: React.FC<ListSceneProps> = ({ content, theme }) => {
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
      <AbsoluteFill style={{ 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: 80,
      }}>
        <div style={{ maxWidth: '80%' }}>
          {content.title && (
            <div style={{ marginBottom: 50, textAlign: 'center' }}>
              <AnimatedText
                text={content.title}
                color={titleColor}
                fontSize={52}
                fontWeight="bold"
                delay={0}
                animation="slide"
              />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {items.map((item, i) => {
              const delay = 15 + i * 8;
              const progress = spring({
                frame: frame - delay,
                fps,
                config: { damping: 15, stiffness: 100 },
              });
              const x = interpolate(progress, [0, 1], [100, 0]);
              const opacity = interpolate(frame - delay, [0, 12], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 20,
                    transform: `translateX(${x}px)`,
                    opacity,
                  }}
                >
                  <div style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: titleColor,
                    flexShrink: 0,
                  }} />
                  <span style={{
                    color: textColor,
                    fontSize: 32,
                  }}>
                    {item}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
