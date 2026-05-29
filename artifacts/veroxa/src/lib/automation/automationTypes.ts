/**
 * automationTypes.ts — types for Veroxa's automation PREVIEW layer.
 *
 * SIMULATED / RULE-BASED ONLY.
 *   - No real external actions.
 *   - No writes, no notifications, no publishing, no client auto-messaging.
 *
 * The automation preview shows the team what Veroxa WOULD prepare when a
 * trigger fires, what a human must approve, what is blocked, and what future
 * real integration would be required. Nothing here executes anything.
 */

/** The event that would start an automation. */
export type AutomationTrigger =
  | "media_uploaded"
  | "media_needs_context"
  | "content_angle_ready"
  | "caption_approved"
  | "weekly_cycle_due"
  | "month_end_due"
  | "lead_audit_completed"
  | "missing_metrics";

export const AUTOMATION_TRIGGER_LABELS: Record<AutomationTrigger, string> = {
  media_uploaded: "Media uploaded",
  media_needs_context: "Media needs context",
  content_angle_ready: "Content angle ready",
  caption_approved: "Caption approved",
  weekly_cycle_due: "Weekly cycle due",
  month_end_due: "Month end due",
  lead_audit_completed: "Lead audit completed",
  missing_metrics: "Missing metrics",
};

/** Where a prepared action would eventually go (future integration only). */
export type AutomationDestination =
  | "team_queue"
  | "client_portal"
  | "report_queue"
  | "scheduling_prep"
  | "onboarding_checklist"
  | "future_publishing_connector"
  | "future_notification_channel";

export const AUTOMATION_DESTINATION_LABELS: Record<
  AutomationDestination,
  string
> = {
  team_queue: "Team work queue",
  client_portal: "Client portal (after team review)",
  report_queue: "Report queue",
  scheduling_prep: "Scheduling prep",
  onboarding_checklist: "Onboarding checklist",
  future_publishing_connector: "Future publishing connector",
  future_notification_channel: "Future notification channel",
};

/** Current state of the automation preview. */
export type AutomationStatus =
  | "prepared"
  | "awaiting_approval"
  | "blocked"
  | "future_integration_required";

export const AUTOMATION_STATUS_LABELS: Record<AutomationStatus, string> = {
  prepared: "Prepared",
  awaiting_approval: "Awaiting approval",
  blocked: "Blocked",
  future_integration_required: "Future integration required",
};

/** A single automation preview row. */
export interface AutomationPreview {
  automationName: string;
  trigger: AutomationTrigger;
  condition: string;
  preparedAction: string;
  destination: AutomationDestination;
  approvalRequired: boolean;
  status: AutomationStatus;
  blockedReason?: string;
  futureIntegration?: string;
  auditTrailNote: string;
}

/** Aggregated snapshot for the team command center. */
export interface AutomationSnapshot {
  preparedCount: number;
  awaitingApprovalCount: number;
  blockedCount: number;
  futureIntegrationCount: number;
  previews: AutomationPreview[];
}
