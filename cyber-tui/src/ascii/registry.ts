import vaultJson from '../../data/community-recipes.json' with { type: 'json' }

import type { AsciiRecipeConfig, CommunityRecipe, RenderMode } from './types.js'

export const ALL_RENDER_MODES: readonly RenderMode[] = [
  'characters', 'braille', 'mixed', 'hexdump', 'matrix', 'dots', 'cross',
  'diamond', 'rings', 'hearts', 'stars', 'hexagons', 'triangles', 'bubbles',
  'lines', 'diagonal', 'hatching', 'contour', 'dither', 'pixel', 'mosaic',
  'bricks', 'voxel', 'halfblocks', 'disco', 'lego'
]

export const DEFAULT_ASCII_CONFIG: AsciiRecipeConfig = {
  renderMode: 'characters',
  charSet: 'standard',
  customChars: '',
  cellSize: 10,
  coverage: 100,
  density: 0,
  invert: false,
  brightness: 0,
  contrast: 100,
  edgeEmphasis: 0,
  toneCurve: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
  saturation: 100,
  grayscale: 0,
  tint: '#38C7FF',
  tintOpacity: 0,
  styleBlend: 'source-over',
  overlayBlend: 'normal',
  bgMode: 'solid-black',
  bgOpacity: 90,
  bgBlur: 0,
  blurType: 'off',
  blurAmount: 0,
  blurAngle: 0,
  blurCenterX: 50,
  blurCenterY: 50,
  lensFocus: 40,
  tiltFocus: 35,
  tiltFeather: 15,
  tiltPosition: 50,
  animated: true,
  animStyle: 'flicker',
  animSpeed: { enabled: true, intensity: 100 },
  animIntensity: { enabled: true, intensity: 30 },
  progressivePosition: 55,
  progressiveReverse: false,
  directionalBothSides: false,
  pfx: {},
  mask: { enabled: false, invert: false, shapes: [] },
  lights: { enabled: false, points: [] }
}

interface VaultShape { count: number; recipes: CommunityRecipe[] }
const vault = vaultJson as unknown as VaultShape

export const COMMUNITY_RECIPES: readonly CommunityRecipe[] = vault.recipes

export function normalizeRenderMode(value: unknown): RenderMode {
  return ALL_RENDER_MODES.includes(value as RenderMode) ? value as RenderMode : 'characters'
}

export function normalizeRecipeConfig(config: Partial<AsciiRecipeConfig> & Record<string, unknown>): AsciiRecipeConfig {
  return {
    ...DEFAULT_ASCII_CONFIG,
    ...config,
    renderMode: normalizeRenderMode(config.renderMode),
    animSpeed: { ...DEFAULT_ASCII_CONFIG.animSpeed, ...(config.animSpeed ?? {}) },
    animIntensity: { ...DEFAULT_ASCII_CONFIG.animIntensity, ...(config.animIntensity ?? {}) },
    pfx: { ...DEFAULT_ASCII_CONFIG.pfx, ...(config.pfx ?? {}) },
    mask: { ...DEFAULT_ASCII_CONFIG.mask, ...(config.mask ?? {}), shapes: config.mask?.shapes ?? [] },
    lights: { ...DEFAULT_ASCII_CONFIG.lights, ...(config.lights ?? {}), points: config.lights?.points ?? [] },
    toneCurve: config.toneCurve?.length ? config.toneCurve : DEFAULT_ASCII_CONFIG.toneCurve
  }
}

export function findCommunityRecipe(query: string): CommunityRecipe | undefined {
  const needle = query.trim().toLowerCase()
  return COMMUNITY_RECIPES.find((recipe) => recipe.id === query || recipe.slug === needle || recipe.name.toLowerCase() === needle)
}
