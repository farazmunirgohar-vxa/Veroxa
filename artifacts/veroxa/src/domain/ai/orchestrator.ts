import type { AppEventKind } from "@/domain/events/types";

export type AgentRole =
  | "Media Review Agent"
  | "Strategist Agent"
  | "Caption Agent"
  | "Brand Agent"
  | "Scheduling Agent"
  | "Reporting Agent"
  | "Risk Agent"
  | "Team Assistant";

export interface AgentNode {
  role:        AgentRole;
  purpose:     string;
  consumes:    AppEventKind[];   // events that trigger this agent
  emits:       AppEventKind[];   // events this agent publishes when finished
  handoffsTo:  AgentRole[];      // downstream agents in pipeline order
  status:      "Stubbed" | "Planned";
}

/**
 * Demo orchestration graph. Today the agents don't actually run — this is the
 * architectural description that the UI and future runtime both consume.
 */
export const agentPipeline: AgentNode[] = [
  { role: "Media Review Agent",  purpose: "Triage incoming media for quality, brand fit, and metadata.",
    consumes: ["MediaUploaded"], emits: ["MediaApproved"], handoffsTo: ["Strategist Agent"], status: "Stubbed" },
  { role: "Strategist Agent",    purpose: "Decide post angle and pillar based on calendar + goals.",
    consumes: ["MediaApproved"], emits: ["WorkflowAdvanced"], handoffsTo: ["Caption Agent"], status: "Stubbed" },
  { role: "Caption Agent",       purpose: "Draft caption copy in client brand voice.",
    consumes: ["WorkflowAdvanced"], emits: ["WorkflowAdvanced"], handoffsTo: ["Brand Agent"], status: "Stubbed" },
  { role: "Brand Agent",         purpose: "Validate tone, terminology, compliance.",
    consumes: ["WorkflowAdvanced"], emits: ["WorkflowAdvanced"], handoffsTo: ["Scheduling Agent"], status: "Stubbed" },
  { role: "Scheduling Agent",    purpose: "Choose optimal post slot.",
    consumes: ["WorkflowAdvanced"], emits: ["WorkflowAdvanced"], handoffsTo: ["Reporting Agent"], status: "Stubbed" },
  { role: "Reporting Agent",     purpose: "Aggregate KPIs and draft weekly / monthly reports.",
    consumes: ["ReportDrafted", "WorkflowAdvanced"], emits: ["ReportPublished"], handoffsTo: ["Team Assistant"], status: "Stubbed" },
  { role: "Risk Agent",          purpose: "Monitor health and surface at-risk clients.",
    consumes: ["ClientStatusChanged", "InventoryLow"], emits: ["NotificationDispatched"], handoffsTo: ["Team Assistant"], status: "Stubbed" },
  { role: "Team Assistant",      purpose: "Daily Team/Internal Admin briefing + action prompts.",
    consumes: ["NotificationDispatched", "WorkflowBlocked", "ReportPublished"], emits: [], handoffsTo: [], status: "Stubbed" },
];

export const AgentOrchestrator = {
  pipeline(): AgentNode[]                       { return agentPipeline; },
  byRole(role: AgentRole): AgentNode | undefined { return agentPipeline.find((a) => a.role === role); },
  downstreamOf(role: AgentRole): AgentNode[] {
    const node = agentPipeline.find((a) => a.role === role);
    if (!node) return [];
    return node.handoffsTo
      .map((r) => agentPipeline.find((a) => a.role === r))
      .filter((a): a is AgentNode => Boolean(a));
  },
  trigger(_kind: AppEventKind): AgentNode[] {
    return agentPipeline.filter((a) => a.consumes.includes(_kind));
  },
};
