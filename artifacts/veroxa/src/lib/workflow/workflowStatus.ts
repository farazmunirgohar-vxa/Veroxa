/**
 * workflowStatus.ts — derivation between the internal lifecycle and the two
 * presentation surfaces (client-safe and internal team).
 *
 * The lifecycle status is the single source of truth. Client and team labels
 * are always derived here so the surfaces can never drift apart.
 */

import type {
  ClientVisibleStatus,
  InternalTeamStatus,
  WorkflowLifecycleStatus,
} from "./workflowTypes";

/** Derive the calm, client-safe status from the internal lifecycle. */
export function deriveClientVisibleStatus(
  lifecycle: WorkflowLifecycleStatus,
): ClientVisibleStatus {
  switch (lifecycle) {
    case "submitted":
      return "Submitted";
    case "ai_prepared":
    case "team_reviewing":
      return "Being reviewed";
    case "needs_client_input":
      return "Needs your input";
    case "ready_for_content_prep":
    case "content_draft_ready":
    case "scheduling_prep_ready":
      return "Prepared by Veroxa";
    case "blocked":
      return "In progress";
    case "completed":
    case "report_ready":
      return "Completed";
    case "included_in_report":
      return "Included in report";
  }
}

/** Derive the richer internal team status from the internal lifecycle. */
export function deriveInternalTeamStatus(
  lifecycle: WorkflowLifecycleStatus,
): InternalTeamStatus {
  switch (lifecycle) {
    case "submitted":
      return "New submission";
    case "ai_prepared":
      return "AI prepared";
    case "team_reviewing":
      return "Needs team review";
    case "needs_client_input":
      return "Needs client input";
    case "ready_for_content_prep":
      return "Ready for content prep";
    case "content_draft_ready":
      return "Draft ready";
    case "scheduling_prep_ready":
      return "Schedule prep ready";
    case "report_ready":
      return "Report ready";
    case "blocked":
      return "Blocked";
    case "completed":
    case "included_in_report":
      return "Completed";
  }
}

/** Lifecycle stages that mean the client owes Veroxa something. */
export function lifecycleNeedsClientAction(
  lifecycle: WorkflowLifecycleStatus,
): boolean {
  return lifecycle === "needs_client_input";
}

/** Lifecycle stages that count as finished work (eligible for reporting). */
export function lifecycleIsComplete(
  lifecycle: WorkflowLifecycleStatus,
): boolean {
  return (
    lifecycle === "completed" ||
    lifecycle === "report_ready" ||
    lifecycle === "included_in_report"
  );
}

/** Lifecycle stages Veroxa is actively preparing. */
export function lifecycleIsInPreparation(
  lifecycle: WorkflowLifecycleStatus,
): boolean {
  return (
    lifecycle === "ai_prepared" ||
    lifecycle === "team_reviewing" ||
    lifecycle === "ready_for_content_prep" ||
    lifecycle === "content_draft_ready" ||
    lifecycle === "scheduling_prep_ready"
  );
}
