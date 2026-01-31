/**
 * Main Component - Orchestrates all scenes
 */

import React from 'react';
import { useVideoConfig, Sequence, AbsoluteFill } from 'remotion';

import { Theme } from './components/Background';
import {
  TitleScene,
  TextScene,
  CounterScene,
  ImageScene,
  SplitScene,
  ListScene,
  StatsScene,
  IntroScene,
  OutroScene,
} from './scenes';

export interface SceneConfig {
  type: 'title' | 'text' | 'counter' | 'image' | 'split' | 'list' | 'stats' | 'intro' | 'outro';
  duration: number;
  content: Record<string, any>;
}

export interface MainProps {
  scenes: SceneConfig[];
  theme?: Theme;
}

const renderScene = (scene: SceneConfig, theme: Theme) => {
  const props = { content: scene.content, theme };
  
  switch (scene.type) {
    case 'title':
      return <TitleScene {...props} />;
    case 'text':
      return <TextScene {...props} />;
    case 'counter':
      return <CounterScene {...props} />;
    case 'image':
      return <ImageScene {...props} />;
    case 'split':
      return <SplitScene {...props} />;
    case 'list':
      return <ListScene {...props} />;
    case 'stats':
      return <StatsScene {...props} />;
    case 'intro':
      return <IntroScene {...props} />;
    case 'outro':
      return <OutroScene {...props} />;
    default:
      return <TextScene {...props} />;
  }
};

export const Main: React.FC<MainProps> = ({ scenes, theme = {} }) => {
  const { fps } = useVideoConfig();
  
  const finalTheme: Theme = {
    primaryColor: theme.primaryColor || '#E85D04',
    secondaryColor: theme.secondaryColor || '#ffffff',
    backgroundColor: theme.backgroundColor || '#1a1a1a',
    fontFamily: theme.fontFamily || 'Arial, Helvetica, sans-serif',
  };
  
  if (!scenes || scenes.length === 0) {
    return (
      <AbsoluteFill style={{ 
        backgroundColor: finalTheme.backgroundColor,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: finalTheme.fontFamily,
      }}>
        <p style={{ color: finalTheme.secondaryColor, fontSize: 32 }}>
          No scenes provided
        </p>
      </AbsoluteFill>
    );
  }
  
  let currentFrame = 0;
  
  return (
    <AbsoluteFill>
      {scenes.map((scene, index) => {
        const durationFrames = Math.round(scene.duration * fps);
        const fromFrame = currentFrame;
        currentFrame += durationFrames;
        
        return (
          <Sequence
            key={index}
            from={fromFrame}
            durationInFrames={durationFrames}
            name={`Scene ${index + 1}: ${scene.type}`}
          >
            {renderScene(scene, finalTheme)}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export default Main;
