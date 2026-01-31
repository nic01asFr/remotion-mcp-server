/**
 * Text Scene - Generic text content
 */

import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Background, Theme, DEFAULT_COLORS } from '../components/Background';
import { AnimatedText, FadeIn } from '../components/animations';

export interface TextSceneProps {
  content: {
    title?: string;
    subtitle?: string;
    text?: string;
    titleColor?: string;
    animation?: 'fade' | 'slide' | 'scale';
    variant?: 'dark' | 'light';
  };
  theme: Theme;
}

export const TextScene: React.FC<TextSceneProps> = ({ content, theme }) => {
  const variant = content.variant || 'dark';
  const isDark = variant === 'dark';
  const titleColor = content.titleColor || theme.primaryColor || DEFAULT_COLORS.primary;
  const textColor = isDark ? DEFAULT_COLORS.white : DEFAULT_COLORS.dark;
  const animation = content.animation || 'slide';
  
  return (
    <AbsoluteFill style={{ fontFamily: theme.fontFamily || 'Arial, sans-serif' }}>
      <Background variant={variant} theme={theme} />
      <AbsoluteFill style={{ 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: 80,
      }}>
        <div style={{ textAlign: 'center', maxWidth: '80%' }}>
          {content.title && (
            <AnimatedText
              text={content.title}
              color={titleColor}
              fontSize={64}
              fontWeight="bold"
              delay={0}
              animation={animation}
            />
          )}
          {content.subtitle && (
            <div style={{ marginTop: 20 }}>
              <AnimatedText
                text={content.subtitle}
                color={textColor}
                fontSize={32}
                fontWeight="normal"
                delay={10}
                animation={animation}
              />
            </div>
          )}
          {content.text && (
            <FadeIn delay={20}>
              <p style={{ 
                color: textColor, 
                fontSize: 24, 
                marginTop: 30,
                lineHeight: 1.6,
                opacity: 0.9,
              }}>
                {content.text}
              </p>
            </FadeIn>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
