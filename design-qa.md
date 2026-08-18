# Design QA — shot carousel proportions

- Source visual truth: `qa-evidence/source-regular-shot-target.png`
- Implementation screenshot: `qa-evidence/implementation-carousel-after.png`
- Combined comparison: `qa-evidence/carousel-comparison.png`
- Viewport: 482 × 814 CSS px
- State: Shots preview open on the “Thrift shopping mobile app” carousel, with a tall mobile screenshot active
- Density normalization: the source capture is 838 × 1632 px and represents a high-density mobile capture; the implementation capture is 482 × 814 px at the browser capture density. The focused frame comparison was normalized by CSS width: both the regular-shot target and corrected active carousel frame resolve to 240 CSS px wide. The implementation image is 786 × 1704 px and renders at 240 × 520.3 CSS px, preserving its natural 2.168 aspect ratio.

## Full-view comparison evidence

The combined comparison shows that the carousel now uses the same visual scale as the regular shot target. The active image remains centered, neighboring filmstrip frames remain visible, and the controls and description keep their existing positions.

## Focused region comparison evidence

The active carousel image was measured in-browser after the fix:

- natural dimensions: 786 × 1704 px
- rendered dimensions: 240 × 520.3 CSS px
- rendered ratio: 2.167936
- natural ratio: 2.167939
- computed `max-height`: `none`
- active frame center: 241 px, matching the 482 px viewport midpoint

The next carousel item was activated and returned the same natural-to-rendered ratio, confirming that the sizing is stable while switching slides.

## Findings

- No actionable P0/P1/P2 mismatch remains for the requested image-proportion fix.
- Fonts and typography: unchanged from the established preview component.
- Spacing and layout rhythm: active frame remains centered; filmstrip spacing, controls, radii, shadow, and description placement are preserved.
- Colors and visual tokens: unchanged.
- Image quality and asset fidelity: the source assets are rendered without cropping or ratio distortion.
- Copy and content: unchanged.

## Comparison history

1. Earlier P1: carousel images were constrained by a 466px mobile `max-height`, forcing the 786 × 1704 screenshot into a 240 × 466 frame instead of its natural proportions.
2. Fix: removed mobile-shot carousel height caps and aligned active carousel widths with the regular-shot width at base, tablet, compact-height, and mobile breakpoints.
3. Post-fix evidence: active and next slides both render at 240 × 520.3 CSS px with a ratio matching the source image, while remaining centered.

## Primary interactions tested

- Open carousel state remained intact through hot reload.
- Next-slide control advances the active image.
- Active and neighboring frames keep their intended scale relationship.
- Build completed successfully with TypeScript and Vite.

## Implementation checklist

- [x] Preserve each mobile screenshot’s natural aspect ratio.
- [x] Match the active carousel width to regular shot previews.
- [x] Preserve neighboring filmstrip behavior and edge blur.
- [x] Verify slide switching and production build.

final result: passed
