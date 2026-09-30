import { DEFAULT_ASCII_CONFIG, normalizeRecipeConfig } from './registry.js'
import type { AsciiRecipeConfig, PixelPlane, RenderMode } from './types.js'

const RAMPS: Record<RenderMode, string> = {
  characters: ' .:-=+*#%@', braille: ' ⠂⠒⠖⠶⣿', mixed: ' .·:+xX#█',
  hexdump: ' 00112233445566778899aabbccddeeff', matrix: ' 01ATG#@',
  dots: '  .·•●', cross: '  +xX#', diamond: '  ◇◆', rings: '  ○◉',
  hearts: '  ♡♥', stars: '  ·✦★', hexagons: '  ⬡⬢', triangles: '  △▲',
  bubbles: '  ◌○●', lines: '  ─═', diagonal: '  /╱', hatching: '  /╱▓',
  contour: '  .-~=≋#', dither: ' .:░▒▓█', pixel: '  ░▒▓█',
  mosaic: '  ▖▚▟█', bricks: '  ▄▆█', voxel: '  ░▣▰█',
  halfblocks: '  ▄█', disco: '  ·*✦●', lego: '  ▢▣■'
}

function clamp(value: number, low = 0, high = 1): number { return Math.max(low, Math.min(high, value)) }

function effect(config: AsciiRecipeConfig, name: string): number {
  const setting = config.pfx[name]
  return setting?.enabled ? clamp(setting.intensity / 100) : 0
}

function noise(x: number, y: number, tick: number): number {
  const value = Math.sin(x * 12.9898 + y * 78.233 + tick * 37.719) * 43758.5453
  return value - Math.floor(value)
}

function preparedPlane(input: PixelPlane, config: AsciiRecipeConfig, time: number): PixelPlane {
  const height = input.length
  const width = input[0]?.length ?? 0
  const pixel = effect(config, 'pixelate')
  const glitch = effect(config, 'glitch')
  const blur = config.blurType === 'off' ? 0 : clamp(config.blurAmount / 100)
  const block = pixel ? Math.max(1, Math.round(1 + pixel * 7)) : 1
  const radius = blur ? Math.max(1, Math.round(blur * 3)) : 0
  const tick = Math.floor(time * 8)
  const at = (x: number, y: number): number => input[Math.max(0, Math.min(height - 1, y))]?.[Math.max(0, Math.min(width - 1, x))] ?? 0
  return Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) => {
    let sx = Math.floor(x / block) * block
    let sy = Math.floor(y / block) * block
    if (glitch && noise(0, y, tick) > 0.78) sx += Math.round((noise(y, tick, 4) - 0.5) * glitch * 18)
    if (!radius) return at(sx, sy)
    let sum = 0
    let count = 0
    for (let oy = -radius; oy <= radius; oy += 1) for (let ox = -radius; ox <= radius; ox += 1) {
      sum += at(sx + ox, sy + oy); count += 1
    }
    return sum / count
  }))
}

function tone(value: number, points: { x: number; y: number }[]): number {
  const sorted = [...points].sort((a, b) => a.x - b.x)
  if (value <= (sorted[0]?.x ?? 0)) return sorted[0]?.y ?? value
  for (let index = 1; index < sorted.length; index += 1) {
    const right = sorted[index]!
    const left = sorted[index - 1]!
    if (value <= right.x) {
      const span = Math.max(0.0001, right.x - left.x)
      return left.y + ((value - left.x) / span) * (right.y - left.y)
    }
  }
  return sorted.at(-1)?.y ?? value
}

function edgeAt(plane: PixelPlane, x: number, y: number): number {
  const at = (px: number, py: number) => plane[Math.max(0, Math.min(plane.length - 1, py))]?.[Math.max(0, Math.min((plane[0]?.length ?? 1) - 1, px))] ?? 0
  const gx = -at(x - 1, y - 1) + at(x + 1, y - 1) - 2 * at(x - 1, y) + 2 * at(x + 1, y) - at(x - 1, y + 1) + at(x + 1, y + 1)
  const gy = -at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1) + at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1)
  return clamp(Math.sqrt(gx * gx + gy * gy))
}

function animationOffset(style: AsciiRecipeConfig['animStyle'], x: number, y: number, time: number): number {
  if (style === 'wave') return Math.sin(x * 0.24 + time) * 0.14
  if (style === 'ripple') return Math.sin(Math.sqrt(x * x + y * y) * 0.45 - time * 1.5) * 0.14
  if (style === 'pulse') return Math.sin(time) * 0.12
  if (style === 'shimmer') return Math.sin(x * 1.7 + y * 0.61 + time * 3) * 0.08
  if (style === 'flicker') return Math.sin(x * 91.7 + y * 47.3 + Math.floor(time * 8) * 13.1) * 0.07
  return 0
}

function insideMask(config: AsciiRecipeConfig, x: number, y: number, width: number, height: number): boolean {
  if (!config.mask.enabled || config.mask.shapes.length === 0) return true
  const nx = x / Math.max(1, width - 1)
  const ny = y / Math.max(1, height - 1)
  const hit = config.mask.shapes.some((shape) => {
    if (shape.type === 'circle') {
      const radius = shape.radius ?? Math.min(shape.w ?? 0.2, shape.h ?? 0.2) / 2
      return Math.hypot(nx - shape.x, ny - shape.y) <= radius
    }
    return nx >= shape.x && nx <= shape.x + (shape.w ?? 0) && ny >= shape.y && ny <= shape.y + (shape.h ?? 0)
  })
  return config.mask.invert ? !hit : hit
}

function lightGain(config: AsciiRecipeConfig, x: number, y: number, width: number, height: number): number {
  if (!config.lights.enabled) return 0
  const nx = x / Math.max(1, width - 1)
  const ny = y / Math.max(1, height - 1)
  return config.lights.points.reduce((sum, point) => {
    const radius = point.radius ?? 0.25
    return sum + Math.max(0, 1 - Math.hypot(nx - point.x, ny - point.y) / radius) * ((point.intensity ?? 50) / 100)
  }, 0)
}

export function proceduralPlane(width: number, height: number, frame = 0, source: 'gradient' | 'shader' = 'shader'): PixelPlane {
  const safeWidth = Math.max(8, Math.min(160, Math.floor(width)))
  const safeHeight = Math.max(3, Math.min(60, Math.floor(height)))
  return Array.from({ length: safeHeight }, (_, y) => Array.from({ length: safeWidth }, (_, x) => {
    const nx = (x - safeWidth / 2) / Math.max(1, safeWidth / 2)
    const ny = (y - safeHeight / 2) / Math.max(1, safeHeight / 2)
    if (source === 'gradient') return clamp((nx + ny + 2) / 4)
    const radius = Math.sqrt(nx * nx + ny * ny)
    const ring = (Math.sin(radius * 18 - frame * 0.72) + 1) / 2
    const scan = (Math.sin(x * 0.31 + frame * 0.37) + Math.cos(y * 1.13 - frame * 0.22) + 2) / 4
    const spine = Math.max(0, 1 - Math.abs(nx) * 7) * (0.35 + ring * 0.65)
    const arc = Math.max(0, 1 - Math.abs(radius - 0.62) * 8)
    return clamp(ring * 0.32 + scan * 0.24 + spine * 0.28 + arc * 0.28)
  }))
}

export function renderAscii(plane: PixelPlane, partial: Partial<AsciiRecipeConfig> = DEFAULT_ASCII_CONFIG, time = 0): string[] {
  const config = normalizeRecipeConfig(partial as Partial<AsciiRecipeConfig> & Record<string, unknown>)
  const source = preparedPlane(plane, config, time)
  const height = source.length
  const width = source[0]?.length ?? 0
  const ramp = config.customChars || RAMPS[config.renderMode] || RAMPS.characters
  const coverageCutoff = 1 - clamp(config.coverage / 100)
  const animationStrength = config.animated && config.animIntensity.enabled ? config.animIntensity.intensity / 100 : 0
  const bloom = effect(config, 'bloom')
  const grain = effect(config, 'filmGrain')
  const dust = effect(config, 'filmDust')
  const halftone = effect(config, 'halftone')
  const chromatic = effect(config, 'chromatic')
  const tick = Math.floor(time * 8)
  return source.map((row, y) => row.map((raw, x) => {
    if (!insideMask(config, x, y, width, height)) return ' '
    // Community recipes use zero-centered brightness and 100-centered contrast.
    let value = raw + (config.brightness / 100)
    value = (value - 0.5) * (config.contrast / 100) + 0.5
    value += edgeAt(source, x, y) * (config.edgeEmphasis / 100)
    value += config.density / 200
    value += lightGain(config, x, y, width, height)
    if (bloom && value > 0.58) value += (value - 0.58) * bloom
    if (grain) value += (noise(x, y, tick) - 0.5) * grain * 0.28
    if (dust && noise(x, y, tick + 91) > 1 - dust * 0.035) value = noise(y, x, tick) > 0.5 ? 1 : 0
    if (halftone) {
      const pattern = ((x + y) % 2 ? -1 : 1) * halftone * 0.12
      value = Math.round((value + pattern) * (3 + halftone * 5)) / (3 + halftone * 5)
    }
    if (chromatic) value += ((source[y]?.[Math.min(width - 1, x + 1)] ?? value) - (source[y]?.[Math.max(0, x - 1)] ?? value)) * chromatic * 0.45
    value = tone(clamp(value), config.toneCurve)
    value += animationOffset(config.animStyle, x, y, time * (config.animSpeed.intensity / 100)) * animationStrength
    if (config.pfx.scanLines?.enabled && y % 2) value *= 1 - config.pfx.scanLines.intensity / 140
    if (config.pfx.vignette?.enabled) {
      const nx = (x / Math.max(1, width - 1)) * 2 - 1
      const ny = (y / Math.max(1, height - 1)) * 2 - 1
      value *= 1 - clamp(Math.hypot(nx, ny) * config.pfx.vignette.intensity / 140)
    }
    value = clamp(config.invert ? 1 - value : value)
    if (value < coverageCutoff) return ' '
    return ramp[Math.min(ramp.length - 1, Math.floor(value * ramp.length))] ?? ' '
  }).join('').trimEnd())
}
