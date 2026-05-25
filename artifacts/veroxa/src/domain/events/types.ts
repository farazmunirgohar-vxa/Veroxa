export type AppEventKind =
  | "MediaUploaded"
  | "MediaApproved"
  | "TaskCreated"
  | "TaskCompleted"
  | "TaskOverdue"
  | "ReportDrafted"
  | "ReportPublished"
  | "ClientStatusChanged"
  | "ClientOnboarded"
  | "InventoryLow"
  | "InventoryCritical"
  | "WorkflowAdvanced"
  | "WorkflowBlocked"
  | "AgentRecommendation"
  | "NotificationDispatched";

export interface AppEvent<P = Record<string, unknown>> {
  id:        string;
  kind:      AppEventKind;
  occurredAt: string;
  actor?:    string;       // user id or "system"
  subjectId?: string;      // entity the event is about
  payload:   P;
}
