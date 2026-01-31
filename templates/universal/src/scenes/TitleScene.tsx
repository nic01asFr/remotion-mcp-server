/**
 * Title Scene - Big title with optional subtitle
 */

import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Background, Theme, DEFAULT_COLORS } from '../components/Background';
import { AnimatedText } from '../components/animations';

export interface TitleSceneProps {
  content: {
    title?: string;
    subtitle?: string;
    titleColor?: string;
    animation?: 'fade' | 'slide' | 'scale';
    variant?: 'dark' | 'light';
  };
  theme: Theme;
}

export const TitleScene: React.FC<TitleSceneProps> = ({ content, theme }) => {
  const variant = content.variant || 'dark';
  const isDark = variant === 'dark';
  const titleColor = content.titleColor || theme.primaryColor || DEFAULT_COLORS.primary;
  const subtitleColor = isDark ? DEFAULT_COLORS.white : DEFAULT_COLORS.dark;
  const animation = content.animation || 'slide';
  
  return (
    <AbsoluteFill style={{ fontFamily: theme.fontFamily || 'Arial, sans-serif' }}>
      <Background variant={variant} theme={theme} />
      <AbsoluteFill style={{ 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: 60,
      }}>
        <div style={{ textAlign: 'center' }}>
          {content.title && (
            <AnimatedText
              text={content.title}
              color={titleColor}
              fontSize={80}
              fontWeight="bold"
              delay={0}
              animation={animation}
            />
          )}
          {content.subtitle && (
            <div style={{ marginTop: 24 }}>
              <AnimatedText
                text={content.subtitle}
                color={subtitleColor}
                fontSize={36}
                fontWeight="normal"
                delay={12}
                animation={animation}
              />
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
