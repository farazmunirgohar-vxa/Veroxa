/**
 * preparedActionStore — in-memory, local-only store for prepared actions.
 *
 * Foundation only: seeded from demo fixtures, mutated in memory for the current
 * session. NO Supabase writes, NO network, NO external execution / connector
 * calls. Status changes (approve / skip / queue) update local state and notify
 * subscribers so the Approval Queue re-renders.
 *
 * Safety fields (riskLevel, approvalRequirement) are derived from the rules
 * engine at seed time so there is one source of truth for the approval gate.
 */

import { getDemoPreparedActionSeeds } from "@/data/demo/demoPreparedActions";
import {
  getApprovalRequirement,
  getRiskLevel,
  type PreparedAction,
  type PreparedActionId,
  type PreparedActionStatus,
} from "@/domain/preparedActions";

function seedActions(): PreparedAction[] {
  return getDemoPreparedActionSeeds().map((seed) => {
    const base: PreparedAction = {
      ...seed,
      executionStatus: seed.executionStatus ?? "not_started",
      // Filled below from the rules engine (single source of truth).
      riskLevel: "low",
      approvalRequirement: "team_approval_required",
    };
    return {
      ...base,
      riskLevel: getRiskLevel(base),
      approvalRequirement: getApprovalRequirement(base),
    };
  });
}

let actions: PreparedAction[] = seedActions();

type Listener = () => void;
const listeners = new Set<Listener>();

function emit(): void {
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      // ignore listener errors
    }
  }
}

/** Stable snapshot for useSyncExternalStore. */
export function getSnapshot(): PreparedAction[] {
  return actions;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Statuses that are final — once reached, an action is immutable. This is a
 * safety invariant: a queued/executed/archived action can never silently
 * regress back into the open queue.
 */
const IMMUTABLE_STATUSES: ReadonlySet<PreparedActionStatus> = new Set([
  "queued_for_execution",
  "executed",
  "archived",
]);

export function setStatus(id: PreparedActionId, status: PreparedActionStatus): boolean {
  const idx = actions.findIndex((a) => a.id === id);
  if (idx === -1) return false;
  // Reject transitions out of a final state.
  if (IMMUTABLE_STATUSES.has(actions[idx].status)) return false;
  const next = [...actions];
  next[idx] = { ...next[idx], status };
  actions = next;
  emit();
  return true;
}

export function getById(id: PreparedActionId): PreparedAction | undefined {
  return actions.find((a) => a.id === id);
}

/** Reset to fixtures — used only for demo/testing. */
export function resetPreparedActions(): void {
  actions = seedActions();
  emit();
}
