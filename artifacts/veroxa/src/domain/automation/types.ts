export type AutomationCategory =
  | "Media Review"
  | "Caption Generation"
  | "Scheduling"
  | "Reporting"
  | "Risk Monitoring"
  | "Client Follow-up"
  | "Notifications";

export type AutomationStatus = "Planned" | "Enabled" | "Disabled" | "Future";
export type AutomationTrigger =
  | { kind: "event"; eventKind: import("@/domain/events/types").AppEventKind }
  | { kind: "schedule"; cron: string }
  | { kind: "manual" };

export interface AutomationRule {
  id:          string;
  category:    AutomationCategory;
  name:        string;
  description: string;
  trigger:     AutomationTrigger;
  status:      AutomationStatus;
}
