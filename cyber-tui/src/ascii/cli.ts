#!/usr/bin/env node
import { decodeMediaFrame } from './media.js'
import { renderAscii } from './engine.js'
import { ALL_RENDER_MODES, COMMUNITY_RECIPES, DEFAULT_ASCII_CONFIG, findCommunityRecipe, normalizeRenderMode } from './registry.js'
import type { AsciiRecipeConfig, ToggleIntensity } from './types.js'

function option(name: string, fallback?: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : fallback
}

const input = process.argv[2]
if (process.argv.includes('--list')) {
  process.stdout.write(COMMUNITY_RECIPES.map((item) => `${item.name}\t${item.author}\t${item.config.renderMode}\t${item.slug}`).join('\n') + '\n')
  process.exit(0)
}
if (!input || input.startsWith('--')) {
  console.error('usage: ascii-forge <photo-or-video> [--recipe NAME] [--mode STYLE] [--width 80] [--height 24] [--time 0]')
  console.error('       ascii-forge --list')
  process.exit(2)
}
const width = Number(option('--width', '80'))
const height = Number(option('--height', '24'))
const seconds = Number(option('--time', '0'))
const requestedRecipe = option('--recipe')
const recipe = requestedRecipe ? findCommunityRecipe(requestedRecipe) : undefined
if (requestedRecipe && !recipe) {
  console.error(`ascii-forge: recipe not found: ${requestedRecipe}`)
  process.exit(2)
}

const mode = option('--mode')
if (mode && !ALL_RENDER_MODES.includes(mode as typeof ALL_RENDER_MODES[number])) {
  console.error(`ascii-forge: render mode not found: ${mode}`)
  process.exit(2)
}

const config: Partial<AsciiRecipeConfig> = { ...(recipe?.config ?? DEFAULT_ASCII_CONFIG) }
if (mode) config.renderMode = normalizeRenderMode(mode)
for (const key of ['brightness', 'contrast', 'density', 'coverage', 'edgeEmphasis'] as const) {
  const value = option(`--${key}`)
  if (value !== undefined && Number.isFinite(Number(value))) config[key] = Number(value)
}
if (process.argv.includes('--invert')) config.invert = true
const requestedEffect = option('--effect')
if (requestedEffect) {
  const [name, amount = '100'] = requestedEffect.split(':')
  if (name) config.pfx = { ...(config.pfx ?? {}), [name]: { enabled: amount !== 'off', intensity: amount === 'off' ? 0 : Number(amount) || 100 } as ToggleIntensity }
}

try {
  const plane = await decodeMediaFrame(input, width, height, seconds)
  const lines = renderAscii(plane, config, seconds)
  process.stdout.write(`${lines.join('\n')}\n`)
} catch (error) {
  console.error(`ascii-forge: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}
