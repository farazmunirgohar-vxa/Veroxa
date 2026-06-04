import type { PackageBoundaryDecision } from "./types";
export function getPackageBoundaryQueue(decisions: PackageBoundaryDecision[]) {
  return decisions
    .filter((d) => !d.includedInPlan || d.eligibilityStatus !== "included")
    .map((d) => ({
      id: `package-${d.requestId}`,
      clientId: d.clientId,
      status: d.eligibilityStatus,
      label: d.blockedReason ?? "Manual review",
      teamAction: d.nextAction,
      clientMessage: d.clientSafeMessage,
    }));
}
export function summarizePackageBoundary(decisions: PackageBoundaryDecision[]) {
  return {
    total: decisions.length,
    included: decisions.filter((d) => d.eligibilityStatus === "included").length,
    comingSoon: decisions.filter((d) => d.eligibilityStatus === "coming_soon_not_included").length,
    addOnAvailable: decisions.filter((d) => d.eligibilityStatus === "add_on_available").length,
    routedBoundaryWork: decisions.filter((d) => d.eligibilityStatus !== "included").length,
    comingSoonRouted: decisions.filter((d) => d.eligibilityStatus === "coming_soon_not_included").length,
    upgradeRouted: decisions.filter((d) => d.eligibilityStatus === "coming_soon_not_included" || d.eligibilityStatus === "not_supported_at_launch" || d.eligibilityStatus === "add_on_available").length,
    confirmationNeeded: decisions.filter((d) => d.eligibilityStatus === "needs_confirmation").length,
    notSupported: decisions.filter((d) => d.eligibilityStatus === "not_supported_at_launch").length,
  };
}
