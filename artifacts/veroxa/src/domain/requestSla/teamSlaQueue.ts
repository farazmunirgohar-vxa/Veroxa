import type { PortalRequest } from "./types";
import { evaluateRequestSla } from "./responseDueEngine";
import { getEscalationAction } from "./escalationEngine";
export function buildTeamSlaQueue(requests: PortalRequest[]) {
  return requests
    .map((request) => ({
      request,
      sla: evaluateRequestSla(request),
      action: getEscalationAction(request),
    }))
    .sort((a, b) => a.sla.minutesRemaining - b.sla.minutesRemaining);
}
export function summarizeRequestSla(requests: PortalRequest[]) {
  const rows = requests.map((r) => evaluateRequestSla(r));
  return {
    total: rows.length,
    dueSoon: rows.filter((r) => r.slaStatus === "due_soon").length,
    overdue: rows.filter((r) => r.slaStatus === "overdue").length,
    answered: rows.filter((r) => r.slaStatus === "completed").length,
    needsResponse: rows.filter((r) =>
      ["on_track", "due_soon", "overdue"].includes(r.slaStatus),
    ).length,
  };
}
