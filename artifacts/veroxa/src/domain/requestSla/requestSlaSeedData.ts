import { packageBoundarySeedDecisions } from "../packageBoundary";
import { addHours } from "./slaClock";
import { statusFromEligibility } from "./requestStatusEngine";
import type { PortalRequest } from "./types";
const base = "2026-06-04T12:00:00.000Z";
export const requestSlaSeedData: PortalRequest[] =
  packageBoundarySeedDecisions.map((decision, index) => ({
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
    submittedAt: new Date(
      new Date(base).getTime() - index * 7 * 60 * 60 * 1000,
    ).toISOString(),
    status: statusFromEligibility(decision.eligibilityStatus),
    dueAt: addHours(
      new Date(
        new Date(base).getTime() - index * 7 * 60 * 60 * 1000,
      ).toISOString(),
    ),
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
  }));
