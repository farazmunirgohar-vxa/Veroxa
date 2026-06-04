import type { ValueProofSummary } from "./types";
export function buildTeamValueProofQueue(summaries: ValueProofSummary[]) {
  return summaries.map((s) => ({
    id: `value-${s.clientId}`,
    restaurantName: s.restaurantName,
    status: s.status,
    reachCount: s.reachSignals.length,
    actionCount: s.customerActionSignals.length,
    nextAction: s.nextAction,
    teamSummary: s.teamSummary,
  }));
}
