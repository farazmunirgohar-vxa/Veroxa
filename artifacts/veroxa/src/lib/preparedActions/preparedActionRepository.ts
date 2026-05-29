/**
 * preparedActionRepository — read + status-transition API over the local
 * prepared-action store.
 *
 * Foundation only: fixture/local state. No Supabase writes, no network, no
 * external execution. This establishes the Approval-to-Execution workflow API
 * the Team portal consumes; a real backend can later implement the same surface.
 */

import {
  PREPARED_ACTION_PRIORITY_ORDER,
  type PreparedAction,
  requiresClientConfirmation,
  type PreparedActionChannel,
  type PreparedActionId,
  type PreparedActionStatus,
} from "@/domain/preparedActions";
import { getById, getSnapshot, setStatus } from "./preparedActionStore";

/** Statuses that still need a human decision in the queue. */
const PENDING_STATUSES: ReadonlySet<PreparedActionStatus> = new Set([
  "prepared",
  "needs_review",
  "needs_client_confirmation",
]);

function byPriority(a: PreparedAction, b: PreparedAction): number {
  return (
    PREPARED_ACTION_PRIORITY_ORDER[a.priority] - PREPARED_ACTION_PRIORITY_ORDER[b.priority]
  );
}

export function getPreparedActions(): PreparedAction[] {
  return [...getSnapshot()].sort(byPriority);
}

export function getPreparedActionsForClient(clientId: string): PreparedAction[] {
  return getPreparedActions().filter((a) => a.clientId === clientId);
}

export function getPendingApprovalActions(): PreparedAction[] {
  return getPreparedActions().filter((a) => PENDING_STATUSES.has(a.status));
}

export function getPreparedActionsByChannel(
  channel: PreparedActionChannel,
): PreparedAction[] {
  return getPreparedActions().filter((a) => a.channel === channel);
}

export function getPreparedActionsByStatus(
  status: PreparedActionStatus,
): PreparedAction[] {
  return getPreparedActions().filter((a) => a.status === status);
}

export function getHighPriorityPreparedActions(): PreparedAction[] {
  return getPreparedActions().filter((a) => a.priority === "high");
}

export function updatePreparedActionStatus(
  id: PreparedActionId,
  status: PreparedActionStatus,
): boolean {
  return setStatus(id, status);
}

/**
 * Approve an action. Safety invariant: an action that requires the restaurant's
 * confirmation can only be approved once it has been put through the
 * "needs client confirmation" step — Faraz confirms with the client, then
 * approves. This prevents a sensitive business-truth change being approved
 * straight from the prepared state without the client in the loop.
 */
export function markApproved(id: PreparedActionId): boolean {
  const action = getById(id);
  if (!action) return false;
  if (requiresClientConfirmation(action) && action.status !== "needs_client_confirmation") {
    return false;
  }
  return setStatus(id, "approved");
}

export function markSkipped(id: PreparedActionId): boolean {
  return setStatus(id, "skipped");
}

export function markNeedsClientConfirmation(id: PreparedActionId): boolean {
  return setStatus(id, "needs_client_confirmation");
}

/**
 * Queue an approved action for (future) execution. Safety invariant: only an
 * already-approved action can be queued — nothing reaches the execution path
 * without passing through human approval first.
 */
export function markQueuedForExecution(id: PreparedActionId): boolean {
  const action = getById(id);
  if (!action || action.status !== "approved") return false;
  return setStatus(id, "queued_for_execution");
}
