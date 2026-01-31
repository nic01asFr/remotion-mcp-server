/**
 * Background components for Remotion scenes
 */

import React from 'react';
import { useCurrentFrame, AbsoluteFill } from 'remotion';

export interface Theme {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
}

export const DEFAULT_COLORS = {
  dark: '#1a1a1a',
  light: '#f5f5f5',
  primary: '#E85D04',
  primaryLight: '#FF8C42',
  white: '#ffffff',
};

export interface BackgroundProps {
  variant?: 'dark' | 'light';
  theme?: Theme;
  animated?: boolean;
}

function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export const Background: React.FC<BackgroundProps> = ({ 
  variant = 'dark', 
  theme = {},
  animated = true,
}) => {
  const frame = useCurrentFrame();
  const isDark = variant === 'dark';
  
  const bgColor = theme.backgroundColor || (isDark ? DEFAULT_COLORS.dark : DEFAULT_COLORS.light);
  const accentColor = theme.primaryColor || DEFAULT_COLORS.primary;
  const accentLight = theme.primaryColor 
    ? adjustBrightness(theme.primaryColor, 20) 
    : DEFAULT_COLORS.primaryLight;
  
  const accentOpacity = isDark ? '25' : '12';
  const accentLightOpacity = isDark ? '18' : '08';
  
  return (
    <AbsoluteFill style={{ backgroundColor: bgColor, overflow: 'hidden' }}>
      {animated && (
        <>
          {/* Top-left gradient blob */}
          <div style={{
            position: 'absolute',
            top: '-30%',
            left: '-20%',
            width: '70%',
            height: '70%',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${accentColor}${accentOpacity} 0%, transparent 70%)`,
            transform: `translate(${Math.sin(frame * 0.02) * 20}px, ${Math.cos(frame * 0.02) * 15}px)`,
          }} />
          
          {/* Bottom-right gradient blob */}
          <div style={{
            position: 'absolute',
            bottom: '-30%',
            right: '-20%',
            width: '80%',
            height: '80%',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${accentLight}${accentLightOpacity} 0%, transparent 70%)`,
            transform: `translate(${Math.cos(frame * 0.015) * 25}px, ${Math.sin(frame * 0.015) * 20}px)`,
          }} />
          
          {/* Floating particles */}
          {[...Array(6)].map((_, i) => {
            const x = 15 + (i * 15) % 70;
            const baseY = 10 + (i * 20) % 80;
            const y = baseY + Math.sin((frame + i * 25) * 0.025) * 8;
            const size = 3 + (i % 3) * 2;
            const particleOpacity = 0.2 + (i % 3) * 0.1;
            
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${x}%`,
                  top: `${y}%`,
                  width: size,
                  height: size,
                  borderRadius: '50%',
                  backgroundColor: accentColor,
                  opacity: particleOpacity,
                }}
              />
            );
          })}
        </>
      )}
    </AbsoluteFill>
  );
};
