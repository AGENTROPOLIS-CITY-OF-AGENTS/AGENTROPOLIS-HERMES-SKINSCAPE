# HERMES // AGENTROPOLIS — Cyber TUI

A cyberpunk mission-control TUI for [Hermes Agent](https://github.com/NousResearch/hermes-agent).

This is the **visual/runtime customization layer**. The Hermes runtime, agents,
tools, models, sessions, gateway, skills, and memory remain 100% upstream —
the Cyber TUI only replaces the terminal presentation, using the documented
`HERMES_TUI_DIR` custom-TUI mechanism and the real gateway JSON-RPC protocol.

## What it is

- Real Hermes conversation/transcript/input in the center
- Cyber panels around it: MISSION, TASKS, AGENTS, SYSTEM, APPROVALS, ACTIVITY, RECEIPTS
- Entropy/Drift monitor interfaces (show PROVIDER NOT CONNECTED until a provider exists)
- Layout profiles: `/layout command-center` (multi-panel) and `/layout focus` (conversation-first)
- Responsive: >=180 full command center · 120-179 compressed 3-column ·
  80-119 center + one rail · <80 focus mode
- Hermes ASCII Forge: a clean-room terminal renderer with 26 modes, all 48
  attributed public community recipes, local photo/video decoding, procedural
  sources, animation, adjustments, masks, lights, and terminal effects.
- NO fabricated telemetry — panels render real gateway events or explicit
  UNAVAILABLE / NOT CONNECTED / NO PROVIDER / AWAITING DATA markers

## Build

```bash
npm install
npm run build        # dist/entry.js (HERMES_TUI_DIR prebuilt bundle)
npm test             # vitest unit tests
npm run typecheck
```

## Activate

```bash
export HERMES_TUI_DIR="$PWD"    # or the built dir
hermes --tui
```

### ASCII controls

Inside the TUI:

```text
/ascii on
/ascii off
/ascii pick
/ascii next
/ascii prev
/ascii recipe Dither Effect
/ascii mode matrix
/ascii pfp
/ascii image "C:\\Users\\marqu\\Pictures\\profile.png"
/ascii image off
```

`/ascii pick` opens the complete 48-recipe vault in the terminal. Use the arrow
keys and Enter to apply a recipe. On Windows, `/ascii pfp` opens the native file
chooser; the selected photo or video frame becomes the live Forge source. Use
`/ascii image PATH` on any platform or to paste a path directly. The recipe and
render mode remain independently selectable after the PFP is loaded.

Environment controls:

```bash
HERMES_ASCII_VISUAL=0              # disable the layer
HERMES_ASCII_RECIPE="Dither Effect" # any registry name, slug, or id
HERMES_ASCII_MODE=matrix            # optional mode override
HERMES_ASCII_FPS=4                  # 1-12; clamped for terminal performance
HERMES_ASCII_WORDMARK="NEURO BUILDS"
HERMES_ASCII_IMAGE="C:\\Users\\marqu\\Pictures\\profile.png"
```

The wordmark appears at 120+ columns, the animated signal at 80+ columns, and
both collapse automatically on smaller terminals. Animation is quantized to a
low frame rate so the effect does not flood the terminal renderer.

Render a local photo or a frame from a local video (requires `ffmpeg`):

```bash
npm run build
npm run ascii:render -- ./clip.mp4 --time 3.5 --recipe "Areeb Asci" --width 96 --height 30
npm run ascii:render -- --list
```

Refresh the public recipe registry and attribution audit with `npm run ascii:sync`.
This imports public configuration data only; it does not copy the 21st.dev editor
code or download hosted media.

`HERMES_TUI_DIR` is the supported mechanism (`hermes_cli/main.py:1967`): the
launcher runs `node --expose-gc dist/entry.js` and the TUI spawns the real
gateway (`python -m tui_gateway.entry`) exactly like the upstream Ink TUI.

## Smoke test (real gateway)

```bash
node dist/smoke-gateway.js   # requires a working local Hermes install
```

Verifies `gateway.ready`, `setup.status`, and `session.most_recent` against the
actual local gateway. Read-only; no session mutation.

## Architecture

See `docs/CYBER_TUI_ARCHITECTURE.md` and `docs/CYBER_TUI_COMPATIBILITY.md` in
the repository root.
