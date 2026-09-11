/**
 * Cyber TUI — CyberShell.
 *
 * The responsive shell: header strip, three-column command center (or focus
 * layout), and the command composer. Composes the real Hermes transcript with
 * the cyber panels. No fabricated telemetry — panels render adapter state only.
 *
 * Interactions:
 *   /layout command-center | /layout focus — switch layout profile
 *   Tab                                    — cycle focused panel (visual state)
 *   Esc                                    — quit
 */

import React, { useEffect, useState } from 'react'
import { Box, Text, useApp, useInput, useStdout } from 'ink'

import type { CyberPalette } from '../theme/theme.js'
import type { CyberState } from '../state/model.js'
import { decideLayout, panelsForLayout, breakpointLabel, visiblePanelsFor, nextFocusedPanel, type LayoutProfile, type PanelKey } from '../layout/engine.js'
import {
  ActivityPanel,
  AgentsPanel,
  ApprovalsPanel,
  DriftMonitor,
  EntropyMonitor,
  MissionPanel,
  ReceiptsPanel,
  SystemPanel,
  TasksPanel,
  TranscriptPanel
} from './panels.js'
import { ActivityPulse, CommandComposer, StatusChip, type ChipTone } from './primitives.js'
import { AsciiSignal, AsciiWordmark } from './ascii-visual.js'
import { ALL_RENDER_MODES, COMMUNITY_RECIPES, DEFAULT_ASCII_CONFIG, findCommunityRecipe, normalizeRenderMode } from '../ascii/registry.js'
import type { AsciiRecipeConfig } from '../ascii/types.js'
import type { GatewayClient } from '../gateway/client.js'

export interface CyberShellProps {
  state: CyberState
  palette: CyberPalette
  gw: GatewayClient | null
  onLayout: (profile: LayoutProfile) => void
  onCommand: (text: string) => void
  ascii?: boolean
  /** When false, the shell renders statically (no stdin raw mode). Used by the preview harness. */
  interactive?: boolean
}

function HeaderStrip({ state, palette, cols }: { state: CyberState; palette: CyberPalette; cols: number }): React.JSX.Element {
  const s = state.system
  const model = s.model || 'NO PROVIDER'
  const session = s.sessionId ? s.sessionId.slice(0, 8) : '—'
  const bp = breakpointLabel(cols)
  const runtimeTone: ChipTone = state.sessionReady ? 'green' : 'amber'
  const queueTone: ChipTone = state.activity.streaming ? 'cyan' : 'muted'

  return (
    <Box width={cols} justifyContent="space-between" borderStyle="round" borderColor={palette.border} paddingX={1}>
      <Box flexShrink={0}>
        <Text bold color={palette.cyan}>
          HERMES <Text color={palette.red}>//</Text>{' '}
          <Text color={palette.textPrimary}>AGENTROPOLIS</Text>
        </Text>
      </Box>
      <Box flexShrink={1} width="auto">
        <Text color={palette.muted} wrap="truncate">
          <StatusChip label={state.sessionReady ? 'RUNTIME LIVE' : 'BOOT'} tone={runtimeTone} palette={palette} />{' '}
          <StatusChip label={`SESSION ${session}`} tone="muted" palette={palette} />{' '}
          <StatusChip label={`MODEL ${model}`} tone="cyan" palette={palette} />{' '}
          <StatusChip label={`AGENTS ${state.agents.agents.length}`} tone="magenta" palette={palette} />{' '}
          <StatusChip label={state.activity.streaming ? 'QUEUE ◉' : 'QUEUE —'} tone={queueTone} palette={palette} />{' '}
          <StatusChip label={`STATE ${bp}`} tone="muted" palette={palette} />
        </Text>
      </Box>
      <Box flexShrink={0}>
        <ActivityPulse active={state.system.running || state.activity.streaming} palette={palette} />
      </Box>
    </Box>
  )
}

function RailPanels({
  keys,
  state,
  palette,
  focused
}: {
  keys: readonly string[]
  state: CyberState
  palette: CyberPalette
  focused: PanelKey | null
}): React.JSX.Element {
  const render = (key: string): React.JSX.Element | null => {
    const isFocused = focused === key
    switch (key) {
      case 'mission':
        return <MissionPanel state={state} palette={palette} focused={isFocused} />
      case 'tasks':
        return <TasksPanel state={state} palette={palette} focused={isFocused} />
      case 'agents':
        return <AgentsPanel state={state} palette={palette} focused={isFocused} />
      case 'system':
        return <SystemPanel state={state} palette={palette} focused={isFocused} />
      case 'approvals':
        return <ApprovalsPanel state={state} palette={palette} focused={isFocused} />
      case 'activity':
        return <ActivityPanel state={state} palette={palette} focused={isFocused} />
      case 'receipts':
        return <ReceiptsPanel state={state} palette={palette} focused={isFocused} />
      default:
        return null
    }
  }
  return (
    <Box flexDirection="column" width="100%" gap={0}>
      {keys.map((k) => (
        <Box key={k} marginBottom={1}>
          {render(k)}
        </Box>
      ))}
    </Box>
  )
}

export function CyberShell({
  state,
  palette,
  gw,
  onLayout,
  onCommand,
  ascii,
  interactive = true
}: CyberShellProps): React.JSX.Element {
  const { stdout } = useStdout()
  const { exit } = useApp()
  const cols = stdout.columns ?? 120
  const [profile, setProfile] = useState<LayoutProfile>('command-center')
  const [input, setInput] = useState('')
  const [focusedPanel, setFocusedPanel] = useState<PanelKey | null>(null)
  const [asciiVisual, setAsciiVisual] = useState(process.env.HERMES_ASCII_VISUAL !== '0')
  const initialRecipe = findCommunityRecipe(process.env.HERMES_ASCII_RECIPE || '')
  const [asciiRecipeIndex, setAsciiRecipeIndex] = useState(() => Math.max(0, initialRecipe ? COMMUNITY_RECIPES.indexOf(initialRecipe) : 0))
  const [asciiOverride, setAsciiOverride] = useState<Partial<AsciiRecipeConfig>>(() => process.env.HERMES_ASCII_MODE
    ? { renderMode: normalizeRenderMode(process.env.HERMES_ASCII_MODE) }
    : {})
  const asciiRecipe = COMMUNITY_RECIPES[asciiRecipeIndex]
  const asciiConfig = { ...(asciiRecipe?.config ?? DEFAULT_ASCII_CONFIG), ...asciiOverride }

  const decision = decideLayout(cols, profile)
  const { left, right } = panelsForLayout(decision)
  const visiblePanels = visiblePanelsFor(decision)

  useEffect(() => {
    if (gw && !state.sessionReady) {
      // Handled by the app-level boot flow; kept here for visual state only.
    }
  }, [gw, state.sessionReady])

  useInput(
    (_input, key) => {
      if (key.escape) {
        exit()
        return
      }
      if (key.tab) {
        setFocusedPanel((cur) => nextFocusedPanel(visiblePanels, cur))
        return
      }
      if (key.return) {
        const text = input.trim()
        setInput('')
        if (text === '/ascii off') {
          setAsciiVisual(false)
          return
        }
        if (text === '/ascii on') {
          setAsciiVisual(true)
          return
        }
        if (text === '/ascii next' || text === '/ascii prev') {
          const direction = text.endsWith('next') ? 1 : -1
          setAsciiRecipeIndex((index) => (index + direction + COMMUNITY_RECIPES.length) % COMMUNITY_RECIPES.length)
          setAsciiOverride({})
          setAsciiVisual(true)
          return
        }
        if (text.startsWith('/ascii recipe ')) {
          const recipe = findCommunityRecipe(text.slice('/ascii recipe '.length))
          if (recipe) {
            setAsciiRecipeIndex(COMMUNITY_RECIPES.indexOf(recipe))
            setAsciiOverride({})
            setAsciiVisual(true)
          }
          return
        }
        if (text.startsWith('/ascii mode ')) {
          const requested = text.slice('/ascii mode '.length).trim()
          if (ALL_RENDER_MODES.includes(requested as typeof ALL_RENDER_MODES[number])) {
            setAsciiOverride((current) => ({ ...current, renderMode: normalizeRenderMode(requested) }))
            setAsciiVisual(true)
          }
          return
        }
        if (text.startsWith('/layout ')) {
          const target = text.slice('/layout '.length).trim() as LayoutProfile
          if (target === 'command-center' || target === 'focus') {
            setProfile(target)
            onLayout(target)
          }
          return
        }
        if (text) {
          onCommand(text)
        }
        return
      }
      if (key.backspace || key.delete) {
        setInput((v) => v.slice(0, -1))
        return
      }
      if (_input && !key.ctrl) {
        setInput((v) => v + _input)
      }
    },
    { isActive: interactive }
  )

  const leftCol = decision.focusOnly ? null : (
    <Box width="24%" flexDirection="column" paddingRight={1}>
      <RailPanels keys={left} state={state} palette={palette} focused={focusedPanel} />
      {decision.threeColumn ? (
        <>
          <EntropyMonitor state={state} palette={palette} />
          <Box marginBottom={1} />
          <DriftMonitor state={state} palette={palette} />
        </>
      ) : null}
    </Box>
  )

  const rightCol = decision.focusOnly ? null : (
    <Box width={decision.threeColumn ? '24%' : '28%'} flexDirection="column" paddingLeft={1}>
      <RailPanels keys={right} state={state} palette={palette} focused={focusedPanel} />
    </Box>
  )

  const composerHint = `${profile.toUpperCase()} · ${breakpointLabel(cols)}${state.activity.streaming ? ' · STREAMING' : ''}`

  return (
    <Box flexDirection="column" width={cols} paddingX={0}>
      <AsciiWordmark palette={palette} ascii={ascii} visible={cols >= 120 && asciiVisual} />
      <HeaderStrip state={state} palette={palette} cols={cols} />
      <Box width={cols} flexDirection="row" marginTop={1} marginBottom={1}>
        {leftCol}
        <Box width={decision.focusOnly ? '100%' : decision.threeColumn ? '52%' : '72%'} flexDirection="column" paddingX={1}>
          <Text color={palette.muted} dimColor>
            {profile.toUpperCase()} · {breakpointLabel(cols)}
            {decision.focusOnly ? ' · FOCUS' : decision.oneRail ? ' · COMPACT' : ' · COMMAND CENTER'}
            {focusedPanel ? ` · FOCUS:${focusedPanel.toUpperCase()}` : ''}
          </Text>
          <Box flexDirection="column" marginTop={0}>
            <TranscriptPanel state={state} palette={palette} />
            {asciiVisual && cols >= 80 ? (
              <AsciiSignal
                palette={palette}
                width={Math.max(24, Math.min(72, Math.floor(cols * (decision.focusOnly ? 0.72 : decision.threeColumn ? 0.42 : 0.58))))}
                active={state.system.running || state.activity.streaming}
                config={asciiConfig}
                recipeName={asciiRecipe?.name ?? 'Hermes Native'}
                animated={interactive}
              />
            ) : null}
          </Box>
        </Box>
        {rightCol}
      </Box>
      <CommandComposer value={input} palette={palette} ascii={ascii} hint={composerHint} />
      <Box width={cols} justifyContent="space-between">
        <Text color={palette.muted}>/ascii recipe NAME | next | prev | mode STYLE | on | off · /layout focus · Tab · Esc</Text>
        <Text color={palette.muted}>
          {decision.focusOnly ? 'CONVERSATION-FIRST' : decision.threeColumn ? 'FULL COMMAND CENTER' : decision.oneRail ? 'ONE RAIL' : 'FOCUS'}
        </Text>
      </Box>
    </Box>
  )
}
