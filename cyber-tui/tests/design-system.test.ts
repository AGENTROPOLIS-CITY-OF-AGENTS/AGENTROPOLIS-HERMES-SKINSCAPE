import { describe, expect, it } from 'vitest'

import {
  AGENTROPOLIS_TERMINAL_PROFILE,
  TERMINAL_QUANTIZATION,
  asciiWidthForLayout,
  designSystemStamp,
  quantizeAsciiWidth,
  quantizeMotionFps
} from '../src/theme/design-system.js'

describe('AGENTROPOLIS terminal design system', () => {
  it('exposes the canonical terminal consumer profile and protocol stamp', () => {
    expect(AGENTROPOLIS_TERMINAL_PROFILE.designSystem).toBe('AGENTROPOLIS')
    expect(designSystemStamp()).toBe('AGDS/TUI-1 · QP-1')
  })

  it('quantizes motion to the approved frame-rate scale', () => {
    expect(quantizeMotionFps(3)).toBe(2)
    expect(quantizeMotionFps(5)).toBe(4)
    expect(quantizeMotionFps(11)).toBe(12)
    expect(quantizeMotionFps(Number.NaN)).toBe(4)
  })

  it('quantizes ASCII widths to four-column cells within bounds', () => {
    expect(quantizeAsciiWidth(13)).toBe(TERMINAL_QUANTIZATION.asciiWidths.min)
    expect(quantizeAsciiWidth(53)).toBe(52)
    expect(quantizeAsciiWidth(999)).toBe(TERMINAL_QUANTIZATION.asciiWidths.max)
    expect(asciiWidthForLayout(120, false, true) % 4).toBe(0)
  })
})
