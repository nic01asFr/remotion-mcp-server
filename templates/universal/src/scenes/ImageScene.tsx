/**
 * Image Scene - Display image with Ken Burns effect
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Img } from 'remotion';
import { Background, Theme } from '../components/Background';

export interface ImageSceneProps {
  content: {
    url?: string;
    animation?: 'zoom-in' | 'zoom-out' | 'pan' | 'none';
    title?: string;
    subtitle?: string;
  };
  theme: Theme;
}

export const ImageScene: React.FC<ImageSceneProps> = ({ content, theme }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  
  const animation = content.animation || 'zoom-in';
  
  let scale = 1;
  let translateX = 0;
  
  if (animation === 'zoom-in') {
    scale = interpolate(frame, [0, durationInFrames], [1, 1.15], {
      extrapolateRight: 'clamp',
    });
  } else if (animation === 'zoom-out') {
    scale = interpolate(frame, [0, durationInFrames], [1.15, 1], {
      extrapolateRight: 'clamp',
    });
  } else if (animation === 'pan') {
    translateX = interpolate(frame, [0, durationInFrames], [-20, 20], {
      extrapolateRight: 'clamp',
    });
    scale = 1.1;
  }
  
  if (!content.url) {
    return (
      <AbsoluteFill style={{ fontFamily: theme.fontFamily || 'Arial, sans-serif' }}>
        <Background variant="dark" theme={theme} />
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ color: '#666', fontSize: 24 }}>No image URL provided</p>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }
  
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Img
        src={content.url}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale}) translateX(${translateX}px)`,
        }}
      />
      {(content.title || content.subtitle) && (
        <AbsoluteFill style={{
          background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.8) 100%)',
          justifyContent: 'flex-end',
          alignItems: 'center',
          padding: 60,
          fontFamily: theme.fontFamily || 'Arial, sans-serif',
        }}>
          <div style={{ textAlign: 'center' }}>
            {content.title && (
              <h2 style={{ 
                color: '#fff', 
                fontSize: 48, 
                margin: 0,
                textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              }}>
                {content.title}
              </h2>
            )}
            {content.subtitle && (
              <p style={{ 
                color: 'rgba(255,255,255,0.8)', 
                fontSize: 24, 
                marginTop: 10,
              }}>
                {content.subtitle}
              </p>
            )}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
