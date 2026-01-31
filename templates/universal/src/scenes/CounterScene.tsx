/**
 * Counter Scene - Animated number counter
 */

import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Background, Theme, DEFAULT_COLORS } from '../components/Background';
import { AnimatedCounter, AnimatedText } from '../components/animations';

export interface CounterSceneProps {
  content: {
    value?: string | number;
    suffix?: string;
    prefix?: string;
    label?: string;
    titleColor?: string;
    variant?: 'dark' | 'light';
  };
  theme: Theme;
}

export const CounterScene: React.FC<CounterSceneProps> = ({ content, theme }) => {
  const variant = content.variant || 'dark';
  const isDark = variant === 'dark';
  const counterColor = content.titleColor || theme.primaryColor || DEFAULT_COLORS.primary;
  const labelColor = isDark ? DEFAULT_COLORS.white : DEFAULT_COLORS.dark;
  
  const numValue = typeof content.value === 'string' 
    ? parseInt(content.value, 10) || 0 
    : content.value || 0;
  
  return (
    <AbsoluteFill style={{ fontFamily: theme.fontFamily || 'Arial, sans-serif' }}>
      <Background variant={variant} theme={theme} />
      <AbsoluteFill style={{ 
        justifyContent: 'center', 
        alignItems: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <AnimatedCounter
            value={numValue}
            suffix={content.suffix || ''}
            prefix={content.prefix || ''}
            color={counterColor}
            fontSize={140}
            delay={5}
          />
          {content.label && (
            <div style={{ marginTop: 16 }}>
              <AnimatedText
                text={content.label}
                color={labelColor}
                fontSize={40}
                fontWeight="normal"
                delay={15}
                animation="fade"
              />
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
