# Remotion MCP Server v3 - Roadmap

## Overview

This document outlines planned features and improvements for the Remotion MCP Server.

## Current State (v2.1.0)

### Available Scene Types
- `title` - Big title with animation
- `text` - Text content with styling
- `counter` - Animated number counter
- `image` - Image with Ken Burns effect
- `split` - Image + text side by side
- `list` - Animated bullet points
- `stats` - Multiple statistics
- `intro` - Logo/brand intro
- `outro` - Closing with CTA
- `cta` - Call-to-action with QR code

---

## Phase 1: Asset Loading (Priority: High)

### External URLs Support
Remotion natively supports external URLs:
```tsx
<Img src="https://example.com/image.png" />
<OffthreadVideo src="https://example.com/video.mp4" />
<Audio src="https://example.com/audio.mp3" />
```

### MediaScene Enhancement
```typescript
{
  type: "media",
  content: {
    url: string,           // Image or video URL
    mediaType: "image" | "video",
    fit: "cover" | "contain" | "fill",
    overlay?: {
      title?: string,
      subtitle?: string,
      position: "top" | "center" | "bottom",
      gradient?: boolean
    },
    kenBurns?: "zoom-in" | "zoom-out" | "pan-left" | "pan-right" | "none"
  }
}
```

**Effort:** 2h

---

## Phase 2: Audio Support (Priority: Medium)

### Background Music
```typescript
settings: {
  audio?: {
    url: string,
    volume?: number,      // 0-1
    startFrom?: number,   // seconds
    fadeIn?: number,      // fade in duration
    fadeOut?: number      // fade out duration
  }
}
```

**Effort:** 2h

---

## Phase 3: Transitions (Priority: Medium)

### Available Transitions
Package: `@remotion/transitions`

- `fade()` - Cross-fade
- `slide()` - Directional slide
- `wipe()` - Wipe effect
- `flip()` - 3D flip
- `clockWipe()` - Circular wipe

### Global Transition Setting
```typescript
settings: {
  transition?: {
    type: "fade" | "slide" | "wipe" | "none",
    duration: number,
    direction?: "from-left" | "from-right" | "from-top" | "from-bottom"
  }
}
```

**Effort:** 6-8h (requires Main component refactoring)

---

## Phase 4: Google Fonts (Priority: Medium)

### Predefined Fonts Approach
```typescript
theme: {
  fontFamily: "Montserrat" | "Roboto" | "Open Sans" | "Lato" | "Poppins" | ...
}
```

Top 10 fonts to include:
1. Montserrat
2. Roboto
3. Open Sans
4. Lato
5. Poppins
6. Raleway
7. Inter
8. Nunito
9. Playfair Display
10. Source Sans Pro

**Effort:** 4h

---

## Phase 5: New Scene Types (Priority: Low)

### Testimonial Scene
```typescript
{
  type: "testimonial",
  content: {
    quote: string,
    author: string,
    role?: string,
    avatar?: string,
    rating?: number  // 1-5 stars
  }
}
```

### Timeline Scene
```typescript
{
  type: "timeline",
  content: {
    title?: string,
    events: [{
      date: string,
      title: string,
      description?: string
    }]
  }
}
```

### Code Scene
```typescript
{
  type: "code",
  content: {
    code: string,
    language: string,
    title?: string,
    highlightLines?: number[]
  }
}
```

### Comparison Scene
```typescript
{
  type: "comparison",
  content: {
    before: { url: string, label?: string },
    after: { url: string, label?: string },
    mode: "slider" | "side-by-side"
  }
}
```

**Effort:** 2-4h each

---

## Implementation Priority Matrix

| Feature | Feasibility | Impact | Priority | Effort |
|---------|-------------|--------|----------|--------|
| MediaScene (video support) | Easy | High | P1 | 2h |
| Improved QR Codes | Easy | Medium | P1 | 1h |
| Background Audio | Easy | Medium | P2 | 2h |
| Testimonial Scene | Easy | Medium | P2 | 2h |
| Google Fonts | Medium | Medium | P2 | 4h |
| Global Transitions | Medium | High | P2 | 6h |
| Timeline Scene | Medium | Medium | P3 | 4h |
| Code Scene | Medium | Low | P3 | 3h |
| Individual Transitions | Complex | Medium | P3 | 8h |

---

## Technical Notes

### Dependencies to Add
```json
{
  "@remotion/transitions": "^4.0.0",
  "@remotion/google-fonts": "^4.0.0"
}
```

### Required Imports
```tsx
import { OffthreadVideo, Audio } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
```

---

## Resources

- [Remotion Documentation](https://www.remotion.dev/docs)
- [Transitions Guide](https://www.remotion.dev/docs/transitioning)
- [Google Fonts](https://www.remotion.dev/docs/google-fonts)
- [Asset Loading](https://www.remotion.dev/docs/assets)
