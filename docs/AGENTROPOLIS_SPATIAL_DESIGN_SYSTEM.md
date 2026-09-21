# AGENTROPOLIS Spatial Design System

Canonical hierarchy:

`WORLD / REGION / DISTRICT / BLOCK / BUILDING / FLOOR / OFFICE / SURFACE_TOOL`

## Design law

- District selection enters a city-scale environment. A card or dashboard is never the district itself.
- Architecture carries meaning. Buildings represent real institutions, apps, teams, services, agents, workflows, or capability groups.
- Macro shells prioritize orientation and spatial hierarchy.
- Interior shells progressively increase information density.
- Surface tools prioritize task precision over spectacle.
- Never fabricate telemetry to make a city look active.
- Every layer must have a 2D accessible fallback and reduced-motion path.

## Core tokens

```css
:root {
  --agt-obsidian:#050608;
  --agt-panel:rgba(10,14,18,.78);
  --agt-cyan:#00e5ff;
  --agt-red:#ff2a2a;
  --agt-lime:#b7ff00;
  --agt-pink:#ff2bd6;
  --agt-purple:#8b5cf6;
  --agt-gold:#ffc857;
  --agt-glass-blur:18px;
  --agt-edge:1px solid rgba(0,229,255,.28);
  --agt-glow:0 0 24px rgba(0,229,255,.18);
}
```

## Camera grammar

```text
WORLD        orbital / atlas
REGION       high aerial
DISTRICT     flyover / isometric city
BLOCK        low aerial / boulevard
BUILDING     facade / orbit
FLOOR        cutaway / elevator
OFFICE       human-scale interior
SURFACE_TOOL focused HUD
```

## Navigation

Persistent breadcrumb:
`WORLD / REGION / DISTRICT / BLOCK / BUILDING / FLOOR / OFFICE / TOOL`

Always provide:
- up one layer
- World / Home
- search / go-to
- accessibility mode
- reduced motion
- 2D fallback

## Data-to-architecture mapping

Verified data may drive bounded visual properties:
- height -> relative magnitude
- emissive state -> online/offline
- windows -> verified activity/presence
- signage -> identity/status
- roads/transit -> relationships/routing

## Lazy visual loading

Only the focused shell mounts. Adjacent layers render skeletons. Macro geometry uses instancing. Interiors load on building entry. Media begins at 256px thumbnail resolution and upgrades only when visible.

## Benchmark boundary

Git City supplies a useful interaction benchmark for city navigation and meaningful buildings. neurobuilds.grok.me supplies current AGENTROPOLIS visual-cohesion direction. Neither is a runtime dependency.