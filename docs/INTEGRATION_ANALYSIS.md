# Technical Integration Analysis - Remotion MCP Server v3

## Current Architecture

```
remotion-mcp-server/
├── src/
│   ├── render/
│   │   ├── engine.ts      # Inline template code + orchestration
│   │   └── bundler.ts     # Temp project creation + bundling
│   ├── tools/
│   │   └── definitions.ts # MCP tool definitions
│   └── server.ts          # MCP server
├── templates/
│   └── universal/
│       ├── src/           # Template source files
│       └── bundle/        # Generated bundle (gitignored)
```

### Render Flow
1. User calls `remotion_render_video` with scenes
2. `engine.ts` generates inline template code
3. `bundler.ts` creates a temporary Remotion project
4. Bundler compiles, renderer generates video

---

## Feature Analysis

### 1. External Assets (Images, Videos, Audio)

**Feasibility:** ✅ EASY

Remotion natively supports external URLs:
```tsx
<Img src="https://example.com/image.png" />
<OffthreadVideo src="https://example.com/video.mp4" />
<Audio src="https://example.com/audio.mp3" />
```

**Required Changes:**
- Add `OffthreadVideo` and `Audio` imports to template
- Create `MediaScene` component with video support
- Add `audio` settings for background music

**Effort:** 2-3h

---

### 2. Transitions Between Scenes

**Feasibility:** ⚠️ MODERATE

Package: `@remotion/transitions`

**Problem:** Current architecture uses `<Sequence>`:
```tsx
// Current
{scenes.map((scene, index) => (
  <Sequence from={sceneFrames[index].from} durationInFrames={...}>
    {renderScene(scene)}
  </Sequence>
))}
```

Transitions require `<TransitionSeries>`:
```tsx
// Required
<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={60}>
    <SceneA />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition 
    presentation={fade()} 
    timing={linearTiming({ durationInFrames: 15 })} 
  />
  <TransitionSeries.Sequence durationInFrames={60}>
    <SceneB />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

**Duration Calculation:**
Total = Scene1 + Scene2 - Transition
Example: 60 + 60 - 15 = 105 frames

**Required Changes:**
- Add `@remotion/transitions` dependency
- Refactor `Main` component to use `TransitionSeries`
- Handle duration calculation with overlap

**Effort:** 6-8h

---

### 3. Google Fonts

**Feasibility:** ⚠️ MODERATE

Each font is a separate import:
```tsx
import { loadFont } from '@remotion/google-fonts/Montserrat';
```

**Solution: Predefined Font List**
```tsx
import { loadFont as loadMontserrat } from '@remotion/google-fonts/Montserrat';
import { loadFont as loadRoboto } from '@remotion/google-fonts/Roboto';
// ... 10 fonts

const FONTS = {
  'Montserrat': loadMontserrat,
  'Roboto': loadRoboto,
  // ...
};
```

**Required Changes:**
- Add `@remotion/google-fonts` dependency
- Create font loader component
- Map font names to loaders

**Effort:** 4h

---

### 4. QR Codes

**Feasibility:** ✅ EASY (Already Implemented)

Current: Custom SVG-based QR generator
Improvement: Use `react-qr-code` for standards-compliant codes

**Effort:** 1h

---

### 5. Background Audio

**Feasibility:** ✅ EASY

```tsx
const Main = ({ scenes, theme, settings }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  
  let volume = settings?.audio?.volume || 0.5;
  
  // Fade in
  if (settings?.audio?.fadeIn) {
    const fadeInFrames = settings.audio.fadeIn * fps;
    volume *= interpolate(frame, [0, fadeInFrames], [0, 1], { extrapolateRight: 'clamp' });
  }
  
  // Fade out
  if (settings?.audio?.fadeOut) {
    const fadeOutFrames = settings.audio.fadeOut * fps;
    const fadeStart = durationInFrames - fadeOutFrames;
    volume *= interpolate(frame, [fadeStart, durationInFrames], [1, 0], { extrapolateLeft: 'clamp' });
  }
  
  return (
    <AbsoluteFill>
      {settings?.audio?.url && (
        <Audio src={settings.audio.url} volume={volume} />
      )}
      {/* Scenes */}
    </AbsoluteFill>
  );
};
```

**Effort:** 2h

---

## Dependencies to Add

### bundler.ts - Project dependencies
```typescript
dependencies: {
  remotion: '^4.0.0',
  '@remotion/renderer': '^4.0.0',
  '@remotion/transitions': '^4.0.0',      // For transitions
  '@remotion/google-fonts': '^4.0.0',     // For fonts
  'react-qr-code': '^2.0.12',             // For QR codes
  react: '^18.2.0',
  'react-dom': '^18.2.0',
}
```

### Template imports
```tsx
import { 
  useCurrentFrame, 
  useVideoConfig, 
  interpolate, 
  spring, 
  Sequence, 
  Img, 
  AbsoluteFill,
  OffthreadVideo,  // NEW
  Audio,           // NEW
} from 'remotion';

// Transitions
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';

// QR Code
import QRCode from 'react-qr-code';

// Fonts
import { loadFont as loadMontserrat } from '@remotion/google-fonts/Montserrat';
```

---

## Implementation Sprints

### Sprint 1 (3h) - Quick Wins
- [x] CTA Scene with QR Code
- [ ] Improve QR with react-qr-code
- [ ] MediaScene with video support

### Sprint 2 (6h) - Audio & Content
- [ ] Background audio with fade
- [ ] Testimonial scene
- [ ] Google Fonts (10 fonts)

### Sprint 3 (8h) - Transitions
- [ ] Global transitions (fade, slide, wipe)
- [ ] Duration calculation with overlap
- [ ] Main component refactoring

### Sprint 4 (6h) - Advanced Scenes
- [ ] Timeline scene
- [ ] Comparison scene
- [ ] Code scene with syntax highlighting
