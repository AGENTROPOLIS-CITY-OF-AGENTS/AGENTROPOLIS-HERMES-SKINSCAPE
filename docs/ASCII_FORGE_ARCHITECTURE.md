# Hermes ASCII Forge

Hermes ASCII Forge is the native visual engine for the AGENTROPOLIS terminal.
It reproduces the useful behavior of an ASCII-art studio as local TypeScript,
then adapts it for Ink/ANSI, Windows Terminal, Linux terminals, and SSH.

## Ownership boundary

- Renderer, effects, command handling, media adapter, and tests are original
  code in this repository.
- `cyber-tui/data/community-recipes.json` stores public configuration values,
  authorship, source links, and fingerprints for the 48 recipes visible at the
  audit date.
- Hosted thumbnails and videos are referenced for provenance only. They are not
  copied, bundled, or required at runtime.
- No 21st.dev editor source, browser component, API client, or runtime dependency
  is included.

## Capability map

| Surface | Hermes implementation |
|---|---|
| Photo and video | Safe local FFmpeg frame decoder; no shell interpolation |
| Shader and gradient | Bounded procedural pixel-plane generators |
| Style | 26 native character ramps, including community modes and additional forge modes |
| Adjust | Brightness, contrast, density, coverage, invert, edge emphasis, tone curve, blur |
| Effects | Bloom, glitch, film grain/dust, halftone, pixelate, chromatic edge, scan lines, vignette |
| Motion | Flicker, pulse, ripple, shimmer, wave, progressive-compatible configuration |
| Composition | Shape masks, point lights, tint/background/blend configuration preservation |
| Vault | 48 searchable attributed recipes; repeatable synchronization script |
| Surfaces | Live Ink panel and standalone `ascii-forge` CLI |

Terminal output cannot reproduce RGB subpixel shaders exactly, so chromatic,
bloom, blending, and blur are deliberate luminance/character approximations.
Recipe fields remain normalized and available for future true-color ANSI or
GPU-backed adapters.

## Runtime flow

1. A procedural source or decoded local media frame becomes a normalized
   luminance plane.
2. The selected recipe is normalized against safe Hermes defaults.
3. Spatial effects, adjustments, masks, lights, and animation transform it.
4. A mode-specific ramp maps values to terminal glyphs.
5. Ink renders bounded frames at 1–12 FPS; the CLI emits a single frame.

## Operator interface

```text
/ascii on
/ascii off
/ascii next
/ascii prev
/ascii recipe <name-or-slug>
/ascii mode <render-mode>
```

```bash
npm run ascii:sync
npm run build
npm run ascii:render -- ./photo.png --recipe "Dither Effect" --width 80 --height 24
npm run ascii:render -- --list
```
