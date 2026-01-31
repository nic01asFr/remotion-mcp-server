/**
 * Intro Scene - Logo/brand introduction
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Img } from 'remotion';
import { Background, Theme, DEFAULT_COLORS } from '../components/Background';
import { AnimatedText } from '../components/animations';

export interface IntroSceneProps {
  content: {
    title?: string;
    subtitle?: string;
    logoUrl?: string;
    variant?: 'dark' | 'light';
    titleColor?: string;
  };
  theme: Theme;
}

export const IntroScene: React.FC<IntroSceneProps> = ({ content, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const variant = content.variant || 'dark';
  const isDark = variant === 'dark';
  const titleColor = content.titleColor || theme.primaryColor || DEFAULT_COLORS.primary;
  const subtitleColor = isDark ? DEFAULT_COLORS.white : DEFAULT_COLORS.dark;
  
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  const logoRotation = interpolate(frame, [0, 20], [180, 0], {
    extrapolateRight: 'clamp',
  });
  const logoOpacity = interpolate(frame, [0, 10], [0, 1], {
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
        <div style={{ textAlign: 'center' }}>
          {content.logoUrl ? (
            <div style={{
              transform: `scale(${logoScale}) rotate(${logoRotation}deg)`,
              opacity: logoOpacity,
              marginBottom: 40,
            }}>
              <Img
                src={content.logoUrl}
                style={{
                  width: 150,
                  height: 150,
                  objectFit: 'contain',
                }}
              />
            </div>
          ) : (
            <div style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              backgroundColor: titleColor,
              transform: `scale(${logoScale})`,
              opacity: logoOpacity,
              marginBottom: 40,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: `0 10px 40px ${titleColor}50`,
            }}>
              <span style={{ 
                color: '#fff', 
                fontSize: 48, 
                fontWeight: 'bold' 
              }}>
                {content.title?.charAt(0) || '?'}
              </span>
            </div>
          )}
          
          {content.title && (
            <AnimatedText
              text={content.title}
              color={titleColor}
              fontSize={72}
              fontWeight="bold"
              delay={15}
              animation="scale"
            />
          )}
          
          {content.subtitle && (
            <div style={{ marginTop: 20 }}>
              <AnimatedText
                text={content.subtitle}
                color={subtitleColor}
                fontSize={32}
                fontWeight="normal"
                delay={25}
                animation="fade"
              />
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
