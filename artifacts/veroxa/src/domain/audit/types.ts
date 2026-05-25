export type AuditAction =
  | "login" | "logout"
  | "create" | "update" | "delete"
  | "approve" | "reject" | "publish" | "schedule"
  | "advance_stage" | "assign_task" | "complete_task"
  | "view_internal" | "export";

export interface AuditEntry {
  id:          string;
  actorId:     string;
  actorRole:   "client" | "team" | "operator" | "owner" | "system";
  action:      AuditAction;
  subjectType: string;     // e.g. "Client", "ContentItem", "Report"
  subjectId:   string;
  reason?:     string;
  occurredAt:  string;
}
