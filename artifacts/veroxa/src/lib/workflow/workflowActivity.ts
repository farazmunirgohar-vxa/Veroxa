/**
 * workflowActivity.ts — helpers for the append-only workflow activity timeline.
 *
 * Client surfaces only ever render events that carry a `clientSafeLabel`. The
 * internal `summary` may contain team detail and must not be shown to clients.
 */

import type {
  ClientActivityLabel,
  WorkflowActivityEvent,
  WorkflowActor,
  WorkflowLifecycleStatus,
} from "./workflowTypes";

let activitySeq = 0;

function nextActivityId(): string {
  activitySeq += 1;
  return `wfa-${Date.now().toString(36)}-${activitySeq.toString(36)}`;
}

/** Map an internal lifecycle stage to the calm client-safe activity label. */
export function clientActivityForLifecycle(
  lifecycle: WorkflowLifecycleStatus,
): ClientActivityLabel | undefined {
  switch (lifecycle) {
    case "submitted":
      return "Submitted to Veroxa";
    case "ai_prepared":
    case "team_reviewing":
      return "Veroxa is reviewing";
    case "needs_client_input":
      return "Veroxa needs your input";
    case "ready_for_content_prep":
    case "content_draft_ready":
    case "scheduling_prep_ready":
      return "Veroxa is preparing your content";
    case "report_ready":
      return "Veroxa is preparing your report";
    case "completed":
      return "Completed";
    case "included_in_report":
      return "Included in report";
    case "blocked":
      return undefined;
  }
}

export interface MakeActivityEventInput {
  workflowItemId: string;
  actor: WorkflowActor;
  type: string;
  summary: string;
  clientSafeLabel?: ClientActivityLabel;
  internalOnly?: boolean;
  at?: string;
}

export function makeActivityEvent(
  input: MakeActivityEventInput,
): WorkflowActivityEvent {
  return {
    id: nextActivityId(),
    workflowItemId: input.workflowItemId,
    at: input.at ?? new Date().toISOString(),
    actor: input.actor,
    type: input.type,
    clientSafeLabel: input.clientSafeLabel,
    summary: input.summary,
    internalOnly: input.internalOnly ?? input.clientSafeLabel === undefined,
  };
}

/** Build the client-safe activity event for a lifecycle transition. */
export function makeLifecycleActivityEvent(
  workflowItemId: string,
  lifecycle: WorkflowLifecycleStatus,
  summary: string,
  actor: WorkflowActor = "team",
): WorkflowActivityEvent {
  const clientSafeLabel = clientActivityForLifecycle(lifecycle);
  return makeActivityEvent({
    workflowItemId,
    actor,
    type: `lifecycle:${lifecycle}`,
    summary,
    clientSafeLabel,
    internalOnly: clientSafeLabel === undefined,
  });
}

/** Client-safe view of an activity event (drops internal summary text). */
export interface ClientActivityView {
  id: string;
  workflowItemId: string;
  at: string;
  label: ClientActivityLabel;
}

export function toClientActivityViews(
  events: WorkflowActivityEvent[],
): ClientActivityView[] {
  return events
    .filter((e) => !e.internalOnly && e.clientSafeLabel)
    .map((e) => ({
      id: e.id,
      workflowItemId: e.workflowItemId,
      at: e.at,
      label: e.clientSafeLabel as ClientActivityLabel,
    }));
}
