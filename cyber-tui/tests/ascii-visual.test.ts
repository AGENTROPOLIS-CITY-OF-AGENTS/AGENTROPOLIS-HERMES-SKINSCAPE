import { describe, expect, it } from 'vitest'

import { buildAsciiFrame, renderWordmark } from '../src/components/ascii-visual.js'
import { proceduralPlane, renderAscii } from '../src/ascii/engine.js'
import { ALL_RENDER_MODES, COMMUNITY_RECIPES, findCommunityRecipe, normalizeRecipeConfig } from '../src/ascii/registry.js'

describe('Hermes ASCII Forge', () => {
  it('loads the complete attributed community vault', () => {
    expect(COMMUNITY_RECIPES).toHaveLength(48)
    expect(new Set(COMMUNITY_RECIPES.map((recipe) => recipe.id)).size).toBe(48)
    expect(COMMUNITY_RECIPES.every((recipe) => recipe.sourceUrl.startsWith('https://21st.dev/community/ascii/'))).toBe(true)
    expect(findCommunityRecipe('Dither Effect')?.author).toBe('Andre Heng')
  })

  it('normalizes and renders every public recipe', () => {
    const plane = proceduralPlane(32, 7, 3)
    for (const recipe of COMMUNITY_RECIPES) {
      const config = normalizeRecipeConfig(recipe.config)
      const frame = renderAscii(plane, config, 0.75)
      expect(frame, recipe.name).toHaveLength(7)
      expect(frame.every((line) => line.length <= 32), recipe.name).toBe(true)
    }
  })

  it('supports every native render mode', () => {
    const plane = proceduralPlane(24, 5, 0)
    for (const renderMode of ALL_RENDER_MODES) {
      const frame = renderAscii(plane, { renderMode, coverage: 100 })
      expect(frame, renderMode).toHaveLength(5)
      expect(frame.every((line) => line.length <= 24), renderMode).toBe(true)
    }
  })

  it('builds deterministic bounded frames', () => {
    const config = findCommunityRecipe('Dither Effect')!.config
    const first = buildAsciiFrame(40, 7, 12, config)
    const second = buildAsciiFrame(40, 7, 12, config)
    expect(first).toEqual(second)
    expect(first).toHaveLength(7)
    expect(first.every((line) => line.length <= 40)).toBe(true)
  })

  it('renders effects, masks, and animation deterministically', () => {
    const plane = proceduralPlane(30, 6, 1)
    const config = {
      animated: true,
      animStyle: 'wave' as const,
      animIntensity: { enabled: true, intensity: 100 },
      pfx: {
        bloom: { enabled: true, intensity: 60 }, glitch: { enabled: true, intensity: 50 },
        filmGrain: { enabled: true, intensity: 40 }, filmDust: { enabled: true, intensity: 30 },
        halftone: { enabled: true, intensity: 35 }, pixelate: { enabled: true, intensity: 30 },
        chromatic: { enabled: true, intensity: 25 }, scanLines: { enabled: true, intensity: 30 },
        vignette: { enabled: true, intensity: 30 }
      },
      mask: { enabled: true, invert: false, shapes: [{ type: 'circle', x: 0.5, y: 0.5, radius: 0.45 }] }
    }
    expect(renderAscii(plane, config, 1)).toEqual(renderAscii(plane, config, 1))
    expect(renderAscii(plane, config, 1)).not.toEqual(renderAscii(plane, config, 2))
  })

  it('renders the canonical wordmark in Unicode and ASCII-safe modes', () => {
    const unicode = renderWordmark('NEURO BUILDS')
    const safe = renderWordmark('NEURO BUILDS', true)
    expect(unicode).toHaveLength(5)
    expect(unicode.join('\n')).toContain('█')
    expect(safe.join('\n')).not.toContain('█')
    expect(safe.join('\n')).toContain('#')
  })
})
