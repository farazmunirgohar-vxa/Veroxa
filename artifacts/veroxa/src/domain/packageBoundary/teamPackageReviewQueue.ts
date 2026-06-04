import type { PackageBoundaryDecision } from "./types";
export function getPackageBoundaryQueue(decisions: PackageBoundaryDecision[]) {
  return decisions
    .filter((d) => !d.includedInPlan || d.eligibilityStatus !== "included")
    .map((d) => ({
      id: `package-${d.requestId}`,
      clientId: d.clientId,
      status: d.eligibilityStatus,
      label: d.upgradePath ?? d.blockedReason ?? "Review needed",
      teamAction: d.nextAction,
      clientMessage: d.clientSafeMessage,
    }));
}
export function summarizePackageBoundary(decisions: PackageBoundaryDecision[]) {
  return {
    total: decisions.length,
    included: decisions.filter((d) => d.eligibilityStatus === "included")
      .length,
    upgradeRouted: decisions.filter(
      (d) => d.eligibilityStatus === "needs_upgrade",
    ).length,
    confirmationNeeded: decisions.filter(
      (d) => d.eligibilityStatus === "needs_confirmation",
    ).length,
    notSupported: decisions.filter(
      (d) => d.eligibilityStatus === "not_supported_at_launch",
    ).length,
  };
}
