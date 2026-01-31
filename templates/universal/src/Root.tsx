/**
 * Root Component - Remotion Composition Definition
 */

import React from 'react';
import { Composition } from 'remotion';
import { Main, MainProps } from './Main';

const DEFAULT_FPS = 30;
const DEFAULT_WIDTH = 1920;
const DEFAULT_HEIGHT = 1080;
const DEFAULT_DURATION_SEC = 10;

const calculateDuration = (scenes: MainProps['scenes'], fps: number): number => {
  if (!scenes || scenes.length === 0) {
    return DEFAULT_DURATION_SEC * fps;
  }
  const totalSeconds = scenes.reduce((acc, scene) => acc + (scene.duration || 3), 0);
  return Math.round(totalSeconds * fps);
};

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="Main"
        component={Main}
        durationInFrames={DEFAULT_DURATION_SEC * DEFAULT_FPS}
        fps={DEFAULT_FPS}
        width={DEFAULT_WIDTH}
        height={DEFAULT_HEIGHT}
        defaultProps={{
          scenes: [],
          theme: {
            primaryColor: '#E85D04',
            secondaryColor: '#ffffff',
            backgroundColor: '#1a1a1a',
            fontFamily: 'Arial, Helvetica, sans-serif',
          },
        }}
        calculateMetadata={async ({ props, defaultProps }) => {
          const scenes = props?.scenes || defaultProps.scenes;
          const fps = DEFAULT_FPS;
          return {
            durationInFrames: calculateDuration(scenes, fps),
            fps,
            width: DEFAULT_WIDTH,
            height: DEFAULT_HEIGHT,
          };
        }}
      />
    </>
  );
};

export default Root;
