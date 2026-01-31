/**
 * Split Scene - Image + text side by side
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Img } from 'remotion';
import { Background, Theme, DEFAULT_COLORS } from '../components/Background';
import { AnimatedText, FadeIn } from '../components/animations';

export interface SplitSceneProps {
  content: {
    title?: string;
    subtitle?: string;
    text?: string;
    imageUrl?: string;
    imagePosition?: 'left' | 'right';
    variant?: 'dark' | 'light';
    titleColor?: string;
  };
  theme: Theme;
}

export const SplitScene: React.FC<SplitSceneProps> = ({ content, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const variant = content.variant || 'dark';
  const isDark = variant === 'dark';
  const titleColor = content.titleColor || theme.primaryColor || DEFAULT_COLORS.primary;
  const textColor = isDark ? DEFAULT_COLORS.white : DEFAULT_COLORS.dark;
  const imagePosition = content.imagePosition || 'right';
  
  const imageProgress = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 80 },
  });
  const imageX = interpolate(imageProgress, [0, 1], [imagePosition === 'left' ? -100 : 100, 0]);
  const imageOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  
  const textContent = (
    <div style={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center',
      padding: 60,
    }}>
      {content.title && (
        <AnimatedText
          text={content.title}
          color={titleColor}
          fontSize={52}
          fontWeight="bold"
          delay={10}
          animation="slide"
        />
      )}
      {content.subtitle && (
        <div style={{ marginTop: 16 }}>
          <AnimatedText
            text={content.subtitle}
            color={textColor}
            fontSize={28}
            fontWeight="normal"
            delay={18}
            animation="fade"
          />
        </div>
      )}
      {content.text && (
        <FadeIn delay={25}>
          <p style={{ 
            color: textColor, 
            fontSize: 22, 
            marginTop: 24,
            lineHeight: 1.6,
            opacity: 0.85,
          }}>
            {content.text}
          </p>
        </FadeIn>
      )}
    </div>
  );
  
  const imageContent = (
    <div style={{ 
      flex: 1,
      overflow: 'hidden',
      transform: `translateX(${imageX}px)`,
      opacity: imageOpacity,
    }}>
      {content.imageUrl ? (
        <Img
          src={content.imageUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          backgroundColor: titleColor,
          opacity: 0.2,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <span style={{ color: textColor, opacity: 0.5 }}>Image</span>
        </div>
      )}
    </div>
  );
  
  return (
    <AbsoluteFill style={{ fontFamily: theme.fontFamily || 'Arial, sans-serif' }}>
      <Background variant={variant} theme={theme} animated={false} />
      <AbsoluteFill style={{ 
        flexDirection: 'row',
        display: 'flex',
      }}>
        {imagePosition === 'left' ? (
          <>
            {imageContent}
            {textContent}
          </>
        ) : (
          <>
            {textContent}
            {imageContent}
          </>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
