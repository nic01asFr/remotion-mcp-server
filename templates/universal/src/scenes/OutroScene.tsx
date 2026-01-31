/**
 * Outro Scene - Closing with CTA
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { Background, Theme, DEFAULT_COLORS } from '../components/Background';
import { AnimatedText, FadeIn } from '../components/animations';

export interface OutroSceneProps {
  content: {
    title?: string;
    subtitle?: string;
    text?: string;
    cta?: string;
    variant?: 'dark' | 'light';
    titleColor?: string;
  };
  theme: Theme;
}

export const OutroScene: React.FC<OutroSceneProps> = ({ content, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const variant = content.variant || 'dark';
  const isDark = variant === 'dark';
  const accentColor = content.titleColor || theme.primaryColor || DEFAULT_COLORS.primary;
  const textColor = isDark ? DEFAULT_COLORS.white : DEFAULT_COLORS.dark;
  
  const ctaScale = spring({
    frame: frame - 25,
    fps,
    config: { damping: 10, stiffness: 150 },
  });
  const ctaPulse = 1 + Math.sin(frame * 0.1) * 0.02;
  const ctaOpacity = interpolate(frame - 25, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  
  return (
    <AbsoluteFill style={{ fontFamily: theme.fontFamily || 'Arial, sans-serif' }}>
      <Background variant={variant} theme={theme} />
      <AbsoluteFill style={{ 
        justifyContent: 'center', 
        alignItems: 'center',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '80%' }}>
          {content.title && (
            <AnimatedText
              text={content.title}
              color={accentColor}
              fontSize={64}
              fontWeight="bold"
              delay={0}
              animation="scale"
            />
          )}
          
          {content.subtitle && (
            <div style={{ marginTop: 16 }}>
              <AnimatedText
                text={content.subtitle}
                color={textColor}
                fontSize={32}
                fontWeight="normal"
                delay={12}
                animation="fade"
              />
            </div>
          )}
          
          {content.text && (
            <FadeIn delay={20}>
              <p style={{ 
                color: textColor, 
                fontSize: 28, 
                marginTop: 30,
                opacity: 0.9,
              }}>
                {content.text}
              </p>
            </FadeIn>
          )}
          
          {content.cta && (
            <div style={{
              marginTop: 40,
              transform: `scale(${ctaScale * ctaPulse})`,
              opacity: ctaOpacity,
            }}>
              <div style={{
                display: 'inline-block',
                backgroundColor: accentColor,
                color: '#fff',
                fontSize: 24,
                fontWeight: 'bold',
                padding: '16px 48px',
                borderRadius: 50,
                boxShadow: `0 8px 30px ${accentColor}60`,
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
