# HERMESCAPE 54 — universal production track

Status: **NOT RELEASED**. This branch adds a portable adapter contract and a release plan; it does not assert desktop, browser, mobile or agent integration is already working.

## Existing implementation

The repository already includes a Hermes Cyber TUI with a real Hermes gateway JSON-RPC integration, skins, installer and canary evidence. Preserve those. The audited gateway behavior is version-specific and must be revalidated against current Hermes before release. Do not fork the Hermes runtime or expose the gateway directly on a public interface.

## Product

One session-aware Hermes Canvas with chat, terminal, agent screen, browser, artifacts, jobs and settings; multiple adapter implementations: Hermes, DEVINai, MUSEai, Grokbot, custom agents. Omarchy is an optional Arch/Hyprland desktop integration, **not** the universal terminal. UI is spatial 3D when hardware allows; terminal and accessible navigation remain fully functional without GPU acceleration.

## Portability

- Desktop: Windows (native and optional WSL bridge), macOS, Linux including Omarchy/Arch, Debian/Ubuntu, Fedora/RHEL, openSUSE, Alpine subject to libc/runtime packaging.
- Web: browser UI connects only to an authenticated, explicitly installed or remote agent service. Browser extensions never silently acquire local process privileges.
- Mobile: iOS/Android companion and PWA; OS background-execution limits apply.
- Headless: CLI/TUI and remote agent host. All platforms use the same typed event/capability contract.

## Security release gates (all mandatory)

1. Identity and session isolation; cross-session events rejected; monotonic sequence handling and reconnect replay.
2. Authenticated, encrypted remote transport; localhost bridge bound to loopback with origin/CSRF protections and short-lived tokens. No public unauthenticated RPC.
3. Default-deny capabilities; explicit consent for terminal write, screen control, browser actions and job management; no blanket 'yolo' permission propagation.
4. Secrets stay in runtime-owned storage; redact UI events, logs and receipts; never transmit raw environment variables.
5. Audit receipts for approvals, denials, execution and verification, with tamper-evident storage integration when available.
6. Dependency lockfile audit, signed artifacts, pinned CI actions, SBOM and platform-specific installer verification.
7. Real gateway canary for chat, session resume, tool completion, approval rejection and reconnect; fake events forbidden in production status.
8. Cross-platform smoke tests on Windows, macOS, Ubuntu, Arch/Omarchy; browser and mobile capability-limited tests.
9. Accessibility, keyboard navigation, reduced-motion mode, performance budgets and WebGL fallback.
10. Independent security review and explicit human approval before release or deployment.

## Implementation sequence

1. Inspect installed WSL HERMESCAPE/Cyber TUI and compare to repository HEAD; verify runtime API compatibility.
2. Build Hermes adapter against the real gateway; add session-aware Canvas routing and reconnect tests.
3. Define DEVINai TUI identity/API (not yet verified); add a terminal-only fallback if no structured API exists.
4. Add Omarchy integration as optional plugin; do not modify user dotfiles or window-manager config without approval.
5. Build desktop host, browser companion and mobile shell using capability-aware bridges.
6. Connect MUSEai/Grokbot through authenticated adapters after confirming their actual interfaces.
7. Package, test, sign and release only after all gates pass.

## Rollback

Existing TUI installation remains untouched. The supported fallback is to unset HERMES_TUI_DIR and run stock `hermes --tui`. No migration of secrets or existing sessions is authorized by this branch.
