import { minutesUntil } from "./slaClock";
import { isSlaSatisfied } from "./requestStatusEngine";
import type { PortalRequest, SlaEvaluation, SlaStatus } from "./types";
export function evaluateRequestSla(
  request: PortalRequest,
  nowIso = new Date().toISOString(),
): SlaEvaluation {
  const remaining = minutesUntil(request.dueAt, nowIso);
  let slaStatus: SlaStatus = "on_track";
  if (request.status === "paused") slaStatus = "paused";
  else if (isSlaSatisfied(request.status)) slaStatus = "completed";
  else if (remaining < 0) slaStatus = "overdue";
  else if (remaining <= 180) slaStatus = "due_soon";
  return {
    requestId: request.id,
    slaStatus,
    minutesRemaining: remaining,
    dueLabel: formatDueLabel(slaStatus, remaining),
    clientSafeStatus: buildClientSafeSlaCopy(request, slaStatus),
    teamLabel: buildTeamSlaLabel(slaStatus, remaining),
  };
}
function formatDueLabel(status: SlaStatus, minutes: number): string {
  if (status === "completed") return "Response provided";
  if (status === "paused") return "Paused";
  if (status === "overdue") return "Response overdue";
  if (status === "due_soon") return "Response due soon";
  return "Veroxa will respond within 24 hours";
}
function buildClientSafeSlaCopy(
  request: PortalRequest,
  status: SlaStatus,
): string {
  if (status === "completed")
    return request.responseSummary || "Veroxa has answered this request.";
  if (request.status === "upgrade_required")
    return "This request is included in a higher plan. Veroxa will respond within 24 hours with next steps.";
  if (request.status === "needs_client_input")
    return "We need one detail from you before preparing this. Veroxa will respond within 24 hours.";
  if (status === "overdue")
    return "Your request is still in review. Veroxa owes you an answer, not an automatic completion promise.";
  return "Your request is in review. Veroxa will respond within 24 hours.";
}
function buildTeamSlaLabel(status: SlaStatus, minutes: number): string {
  if (status === "overdue") return "overdue — needs response";
  if (status === "due_soon")
    return `due soon — ${Math.max(0, Math.round(minutes / 60))}h left`;
  if (status === "completed") return "answered / routed";
  return "SLA due within 24h";
}
