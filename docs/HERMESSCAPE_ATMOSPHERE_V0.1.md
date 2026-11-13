# HERMESSCAPE Atmospheric Engine v0.1

Status: design/prototype specification; not production implementation.

## Existing system
This repository currently provides 50+ YAML skins and a React/Ink Cyber TUI with gateway-backed mission, task, agent, system, approvals, activity and receipts panels. Preserve all existing functionality.

## Proposed functionality
- Optional ambient environment presets: aurora-boreal, agentropolis-obsidian, deep-ocean, void-sunset.
- Read-only, verified agent presence visualization: idle, working, waiting, failed, unknown.
- Scene profiles for chat, terminal, code and orchestration, controlled by explicit user selection.
- Configurable intensity, frame-rate ceiling, adaptive performance and reduced-motion mode.
- Hot switching and complete renderer teardown on exit.
- Platform-aware rendering: terminal-safe ANSI/Unicode/static ambience in React/Ink; WebGL/canvas only in a separately verified browser-capable host. Never assume the TUI supports WebGL.
- No external assets, remote shader downloads, credential access, agent tools, MCP calls or network egress from rendering.

## Adapter contract
```ts
type AgentStatus = 'idle' | 'working' | 'waiting' | 'failed' | 'unknown';
type ScenePreset = 'aurora-boreal' | 'agentropolis-obsidian' | 'deep-ocean' | 'void-sunset';
interface AtmosphereOptions {
  enabled: boolean; // default false
  preset: ScenePreset;
  intensity: number; // 0..1
  maxFps: number; // cap, not guaranteed
  reducedMotion: boolean;
}
interface AtmosphereSnapshot {
  agents: ReadonlyArray<{ id: string; status: AgentStatus }>;
  timestamp: number;
}
interface AtmosphereRenderer {
  start(options: AtmosphereOptions): void;
  update(snapshot: AtmosphereSnapshot): void;
  resize(width: number, height: number): void;
  pause(): void;
  dispose(): void;
}
```

## Acceptance gates
1. Disabled-by-default mode preserves original TUI behavior, input, scrollback, panels and all existing skins.
2. Unknown or absent gateway data must never be represented as fabricated telemetry.
3. Reduced-motion renders a static scene; no WebGL falls back safely.
4. Hot switching and exit release listeners, animation loops and renderer resources.
5. Scene events are sanitized and read-only, never grant execution authority.
6. Benchmarks and test logs must substantiate any cross-platform or performance claims.
7. CI and human review before merge.

## Delivery sequence
1. Inspect `cyber-tui/`, event adapter, package scripts, and test setup.
2. Implement terminal-safe optional ambience behind a feature flag.
3. Test accessibility, lifecycle, resource usage and compatibility.
4. Add browser shader adapter only after identifying a real supported host.

Upstream inspiration: https://github.com/Adolanium/hermes-borealis
