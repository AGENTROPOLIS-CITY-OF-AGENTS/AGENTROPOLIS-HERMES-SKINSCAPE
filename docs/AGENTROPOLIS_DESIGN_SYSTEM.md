# Agentropolis Design System: HERMES Skinscape

HERMES Skinscape is an application-layer interface inside the Agentropolis Intelligence Grid. Its map identity is **HERMES City, Node H-50**.

## Visual contract

- Obsidian and carbon surfaces establish the terrain.
- Cyan marks structure, navigation, and active interface boundaries.
- Red marks identity, primary action, and operational emphasis.
- Lime marks healthy state and successful system feedback.
- Hot pink and purple are supporting accents, not dominant page backgrounds.
- Dense information uses a monospace face. Display copy uses a condensed, heavy sans-serif face.
- Motion reinforces location or system state and must stop when reduced motion is requested.

## Interface contract

- Every page answers where the user is, what is online, and what action is next.
- The globe locator identifies the product's place in the Grid.
- Spectacle stays behind the interface. Labels, forms, and status remain readable.
- All controls retain keyboard focus indicators and semantic status output.
- Runtime or connection state must come from real system data. The interface must not fabricate telemetry.

## Tokens

The live token layer is `web/agentropolis-design-system.css`. It loads after legacy and feature CSS so the Agentropolis contract governs the final rendered surface without changing the Skinscape forge, exports, world rotation, or 3D city runtime.
