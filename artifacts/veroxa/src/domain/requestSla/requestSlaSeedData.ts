import { packageBoundarySeedDecisions } from "../packageBoundary";
import { addHours } from "./slaClock";
import { statusFromEligibility } from "./requestStatusEngine";
import type { PortalRequest } from "./types";

const HOUR_MS = 60 * 60 * 1000;

export function getRequestSlaSeedData(now = new Date()): PortalRequest[] {
  const baseTime = now.getTime();

  return packageBoundarySeedDecisions.map((decision, index) => {
    const submittedAt = new Date(baseTime - index * 3 * HOUR_MS).toISOString();

    return {
      id: decision.requestId,
      clientId: decision.clientId,
      restaurantName:
        [
          "Starter healthy benchmark",
          "Starter low-media benchmark",
          "Growth media-ready benchmark",
          "Growth inconsistent-upload benchmark",
          "Premium readiness benchmark",
          "Growth existing-offer benchmark",
        ][index] ?? "Preview restaurant",
      plan: decision.currentPlan,
      requestType: decision.requestType,
      title: decision.requestType.replaceAll("_", " "),
      clientMessage: decision.clientSafeMessage,
      submittedAt,
      status: statusFromEligibility(decision.eligibilityStatus),
      dueAt: addHours(submittedAt),
      eligibilityStatus: decision.eligibilityStatus,
      packageBoundaryDecisionId: decision.requestId,
      needsClientConfirmation:
        decision.eligibilityStatus === "needs_confirmation",
      teamOwner: "Faraz",
      responseSummary:
        decision.eligibilityStatus === "included"
          ? "Veroxa accepted this for review. Manual work is scheduled after team approval."
          : decision.clientSafeMessage,
      nextAction: decision.nextAction,
    };
  });
}
