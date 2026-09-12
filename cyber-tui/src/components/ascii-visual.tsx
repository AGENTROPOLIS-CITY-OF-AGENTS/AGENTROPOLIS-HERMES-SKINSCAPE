/** Hermes ASCII Forge terminal surface. The renderer is local and dependency-free. */

import React, { useEffect, useMemo, useState } from 'react'
import { Box, Text } from 'ink'

import { proceduralPlane, renderAscii } from '../ascii/engine.js'
import { decodeMediaFrame } from '../ascii/media.js'
import { normalizeRecipeConfig } from '../ascii/registry.js'
import type { AsciiRecipeConfig, CommunityRecipe, PixelPlane } from '../ascii/types.js'
import type { CyberPalette } from '../theme/theme.js'

const GLYPHS: Record<string, readonly string[]> = {
  A: [' ### ', '#   #', '#####', '#   #', '#   #'], B: ['#### ', '#   #', '#### ', '#   #', '#### '],
  D: ['#### ', '#   #', '#   #', '#   #', '#### '], E: ['#####', '#    ', '#### ', '#    ', '#####'],
  I: ['#####', '  #  ', '  #  ', '  #  ', '#####'], L: ['#    ', '#    ', '#    ', '#    ', '#####'],
  N: ['#   #', '##  #', '# # #', '#  ##', '#   #'], O: [' ### ', '#   #', '#   #', '#   #', ' ### '],
  R: ['#### ', '#   #', '#### ', '#  # ', '#   #'], S: [' ####', '#    ', ' ### ', '    #', '#### '],
  U: ['#   #', '#   #', '#   #', '#   #', ' ### '], ' ': ['  ', '  ', '  ', '  ', '  ']
}

export function renderWordmark(label: string, ascii = false): string[] {
  const rows = ['', '', '', '', '']
  for (const letter of label.toUpperCase()) {
    const glyph = GLYPHS[letter] ?? GLYPHS[' ']!
    for (let row = 0; row < rows.length; row += 1) rows[row] += `${glyph[row]} `
  }
  return rows.map((row) => row.replaceAll('#', ascii ? '#' : '█').trimEnd())
}

export function buildAsciiFrame(width: number, height: number, frame: number, config: Partial<AsciiRecipeConfig>): string[] {
  return renderAscii(proceduralPlane(width, height, frame, 'shader'), config, frame / 4)
}

export function AsciiWordmark({ palette, ascii, visible }: { palette: CyberPalette; ascii?: boolean; visible: boolean }): React.JSX.Element | null {
  if (!visible) return null
  const rows = renderWordmark(process.env.HERMES_ASCII_WORDMARK?.trim() || 'NEURO BUILDS', ascii)
  const colors = [palette.textPrimary, palette.magenta, palette.red, palette.magenta, palette.cyan]
  return <Box flexDirection="column" paddingX={1}>
    {rows.map((row, index) => <Text key={`${index}-${row}`} color={colors[index]} bold>{row}</Text>)}
    <Text color={palette.cyan}>AGENTROPOLIS-CITY-OF-AGENTS</Text>
    <Text color={palette.muted}>powered by Hermes · ASCII Forge</Text>
  </Box>
}

export function AsciiSignal({ palette, width, active, config, recipeName, animated = true, sourcePath }: {
  palette: CyberPalette; width: number; active: boolean; config: Partial<AsciiRecipeConfig>; recipeName: string; animated?: boolean; sourcePath?: string
}): React.JSX.Element {
  const [frame, setFrame] = useState(0)
  const [mediaPlane, setMediaPlane] = useState<PixelPlane | null>(null)
  const [mediaState, setMediaState] = useState<'procedural' | 'loading' | 'ready' | 'error'>('procedural')
  const [mediaError, setMediaError] = useState('')
  const normalized = useMemo(() => normalizeRecipeConfig(config as Partial<AsciiRecipeConfig> & Record<string, unknown>), [config])

  useEffect(() => {
    let cancelled = false
    if (!sourcePath) {
      setMediaPlane(null)
      setMediaState('procedural')
      setMediaError('')
      return () => { cancelled = true }
    }
    setMediaState('loading')
    setMediaError('')
    void decodeMediaFrame(sourcePath, width, 12)
      .then((plane) => {
        if (!cancelled) {
          setMediaPlane(plane)
          setMediaState('ready')
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setMediaPlane(null)
          setMediaState('error')
          setMediaError(error instanceof Error ? error.message : String(error))
        }
      })
    return () => { cancelled = true }
  }, [sourcePath, width])

  useEffect(() => {
    if (!animated || !normalized.animated) return
    const requested = Number(process.env.HERMES_ASCII_FPS || 4)
    const fps = Number.isFinite(requested) ? Math.max(1, Math.min(12, requested)) : 4
    const timer = setInterval(() => setFrame((value) => (value + 1) % 10_000), Math.round(1000 / fps))
    return () => clearInterval(timer)
  }, [animated, normalized.animated])

  const lines = useMemo(
    () => mediaPlane ? renderAscii(mediaPlane, normalized, frame / 4) : buildAsciiFrame(width, 7, frame, normalized),
    [frame, mediaPlane, normalized, width]
  )
  const colors = [palette.muted, palette.cyan, palette.electricBlue, palette.magenta, palette.red, palette.cyan, palette.muted]
  const sourceLabel = sourcePath ? sourcePath.replace(/^.*[\\/]/, '') : 'PROCEDURAL'
  return <Box flexDirection="column" width="100%" marginTop={1}>
    <Box justifyContent="space-between">
      <Text color={palette.cyan} bold>HERMES ASCII FORGE</Text>
      <Text color={active ? palette.success : palette.muted}>{active ? 'LIVE' : 'AMBIENT'} · {recipeName.toUpperCase()} · {normalized.renderMode.toUpperCase()}</Text>
    </Box>
    <Text color={mediaState === 'error' ? palette.red : palette.muted} wrap="truncate">
      SOURCE {sourceLabel.toUpperCase()} · {mediaState.toUpperCase()}{mediaError ? ` · ${mediaError}` : ''}
    </Text>
    {lines.map((line, index) => <Text key={`${index}-${line}`} color={colors[index % colors.length]} dimColor={!active}>{line || ' '}</Text>)}
  </Box>
}

export function AsciiRecipePicker({ palette, recipes, selectedIndex }: {
  palette: CyberPalette; recipes: readonly CommunityRecipe[]; selectedIndex: number
}): React.JSX.Element {
  const radius = 4
  const start = Math.max(0, Math.min(recipes.length - (radius * 2 + 1), selectedIndex - radius))
  const visible = recipes.slice(start, start + radius * 2 + 1)
  return <Box flexDirection="column" width="100%" marginTop={1} borderStyle="round" borderColor={palette.cyan} paddingX={1}>
    <Text color={palette.cyan} bold>ASCII VAULT · {recipes.length} RECIPES</Text>
    {visible.map((recipe, offset) => {
      const index = start + offset
      const selected = index === selectedIndex
      return <Text key={recipe.id} color={selected ? palette.textPrimary : palette.muted} bold={selected}>
        {selected ? '❯' : ' '} {String(index + 1).padStart(2, '0')} · {recipe.name} · {recipe.author} · {String(recipe.config.renderMode ?? 'characters')}
      </Text>
    })}
    <Text color={palette.muted}>↑/↓ choose · Enter apply · Esc cancel</Text>
  </Box>
}
