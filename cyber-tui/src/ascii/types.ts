export type RenderMode =
  | 'characters' | 'braille' | 'mixed' | 'hexdump' | 'matrix' | 'dots'
  | 'cross' | 'diamond' | 'rings' | 'hearts' | 'stars' | 'hexagons'
  | 'triangles' | 'bubbles' | 'lines' | 'diagonal' | 'hatching'
  | 'contour' | 'dither' | 'pixel' | 'mosaic' | 'bricks' | 'voxel'
  | 'halfblocks' | 'disco' | 'lego'

export type AnimationStyle = 'flicker' | 'pulse' | 'ripple' | 'shimmer' | 'wave' | 'progressive' | 'none'

export interface ToggleIntensity { enabled: boolean; intensity: number }
export interface Point { x: number; y: number }
export interface TonePoint extends Point {}
export interface LightPoint extends Point { intensity?: number; radius?: number }
export interface MaskShape { type: string; x: number; y: number; w?: number; h?: number; radius?: number }

export interface AsciiRecipeConfig {
  renderMode: RenderMode
  charSet: string
  customChars: string
  cellSize: number
  coverage: number
  density: number
  invert: boolean
  brightness: number
  contrast: number
  edgeEmphasis: number
  toneCurve: TonePoint[]
  saturation: number
  grayscale: number
  tint: string
  tintOpacity: number
  styleBlend: string
  overlayBlend: string
  bgMode: string
  bgOpacity: number
  bgBlur: number
  blurType: string
  blurAmount: number
  blurAngle: number
  blurCenterX: number
  blurCenterY: number
  lensFocus: number
  tiltFocus: number
  tiltFeather: number
  tiltPosition: number
  animated: boolean
  animStyle: AnimationStyle
  animSpeed: ToggleIntensity
  animIntensity: ToggleIntensity
  progressivePosition: number
  progressiveReverse: boolean
  directionalBothSides: boolean
  pfx: Record<string, ToggleIntensity>
  mask: { enabled: boolean; invert: boolean; shapes: MaskShape[] }
  lights: { enabled: boolean; points: LightPoint[] }
}

export interface CommunityRecipe {
  id: string
  slug: string
  name: string
  author: string
  sourceUrl: string
  configFingerprint: string
  config: Partial<AsciiRecipeConfig> & Record<string, unknown>
}

export type PixelPlane = number[][]
