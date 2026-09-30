/**
 * AGENTROPOLIS Design System — terminal consumer profile.
 *
 * This is the executable adapter for terminal surfaces. It does not redefine
 * the canonical design system; it constrains Ink output to discrete values so
 * layouts, motion, and ASCII media remain stable across terminal sizes.
 */

export const AGENTROPOLIS_TERMINAL_PROFILE = {
  id: 'agentropolis-terminal',
  version: 1,
  designSystem: 'AGENTROPOLIS',
  principles: ['obsidian-first', 'semantic-color', 'signal-over-spectacle', 'honest-state'] as const,
  accents: {
    structure: 'cyan',
    identity: 'red',
    active: 'lime',
    intelligence: 'purple',
    critical: 'hot-pink'
  }
} as const

/** Quantization Protocol: terminal values may only land on these discrete scales. */
export const TERMINAL_QUANTIZATION = {
  version: 1,
  spacingCells: [0, 1, 2, 4] as const,
  motionFps: [1, 2, 4, 6, 8, 12] as const,
  asciiWidths: { min: 24, max: 72, quantum: 4 },
  asciiHeights: { ambient: 7, media: 12 },
  recipeWindow: 9,
  breakpoints: {
    narrow: 0,
    compact: 80,
    operational: 120,
    wide: 180
  }
} as const

function nearest(value: number, scale: readonly number[]): number {
  return scale.reduce((best, candidate) =>
    Math.abs(candidate - value) < Math.abs(best - value) ? candidate : best, scale[0] ?? value)
}

export function quantizeMotionFps(value: number): number {
  const safe = Number.isFinite(value) ? value : 4
  return nearest(Math.max(1, Math.min(12, safe)), TERMINAL_QUANTIZATION.motionFps)
}

export function quantizeAsciiWidth(value: number): number {
  const { min, max, quantum } = TERMINAL_QUANTIZATION.asciiWidths
  const clamped = Math.max(min, Math.min(max, value))
  return Math.round(clamped / quantum) * quantum
}

export function asciiWidthForLayout(cols: number, focusOnly: boolean, threeColumn: boolean): number {
  const ratio = focusOnly ? 0.72 : threeColumn ? 0.42 : 0.58
  return quantizeAsciiWidth(Math.floor(cols * ratio))
}

export function designSystemStamp(): string {
  return `AGDS/TUI-${AGENTROPOLIS_TERMINAL_PROFILE.version} · QP-${TERMINAL_QUANTIZATION.version}`
}
