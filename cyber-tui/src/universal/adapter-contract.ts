/** HERMESCAPE 54 cross-platform adapter contract. No runtime privileges are granted by this interface. */
export type Platform = "windows" | "macos" | "linux" | "android" | "ios" | "web" | "unknown";
export type Surface = "chat" | "terminal" | "screen" | "browser" | "artifacts" | "jobs" | "settings";
export type AgentKind = "hermes" | "devin" | "museai" | "grokbot" | "custom";
export type Capability = "session.read" | "message.send" | "terminal.read" | "terminal.write" | "screen.view" | "screen.control" | "browser.read" | "browser.act" | "artifact.read" | "job.manage";
export type Availability = "connected" | "disconnected" | "unsupported" | "approval-required";
export interface AdapterDescriptor {
  id: string;
  kind: AgentKind;
  displayName: string;
  platform: Platform;
  surfaces: Partial<Record<Surface, Availability>>;
  capabilities: readonly Capability[];
}
export interface AgentEvent {
  adapterId: string;
  sessionId: string;
  sequence: number;
  timestamp: string;
  type: "message" | "tool.start" | "tool.complete" | "approval.request" | "status" | "error";
  payload: Record<string, unknown>;
}
export interface CapabilityRequest {
  adapterId: string;
  sessionId: string;
  capability: Capability;
  reason: string;
  approvalId?: string;
}
export interface CapabilityDecision {
  allowed: boolean;
  receiptId?: string;
  reason: string;
}
export interface AgentAdapter {
  readonly descriptor: AdapterDescriptor;
  listSessions(): Promise<readonly { id: string; title: string }[]>;
  subscribe(sessionId: string, onEvent: (event: AgentEvent) => void): Promise<() => void>;
  requestCapability(request: CapabilityRequest): Promise<CapabilityDecision>;
  dispose(): Promise<void>;
}
/** Fail closed: a capability is usable only when advertised AND independently authorized. */
export function capabilityAvailable(adapter: AdapterDescriptor, capability: Capability): boolean {
  return adapter.capabilities.includes(capability);
}
export function assertEvent(event: AgentEvent): void {
  if (!event.adapterId || !event.sessionId || !Number.isSafeInteger(event.sequence) || event.sequence < 0 || !Number.isFinite(Date.parse(event.timestamp))) {
    throw new Error("Invalid agent event envelope");
  }
}
