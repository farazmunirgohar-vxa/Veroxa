import type { PortalRequest } from "./types";
import { evaluateRequestSla } from "./responseDueEngine";
export function getEscalationAction(request: PortalRequest): string {
  const sla = evaluateRequestSla(request);
  if (sla.slaStatus === "overdue")
    return "Escalate to Faraz for same-day portal response.";
  if (request.status === "upgrade_required")
    return "Route upgrade message; do not start out-of-tier work.";
  if (request.needsClientConfirmation)
    return "Ask client for the missing detail in the portal.";
  return "Review and answer in the portal before the 24-hour response window closes.";
}
