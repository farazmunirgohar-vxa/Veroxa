import { getFirstClientReadinessChecks } from "./checklist";
import { getReadinessStatusFromChecks } from "./summary";
import type { FirstClientLaunchGate, ReadinessCheck } from "./types";

const requiredLaunchGateCheckKeys = [
  "pricing-guardrails-pass",
  "no-owner-operator-active-role",
  "portal-separation-guardrails-pass",
  "client-dashboard-safe-states",
  "team-upload-inbox-exists",
  "client-media-dependency",
  "client-updates-no-fake-metrics",
  "client-reports-no-fake-metrics",
  "team-approval-queue-exists",
  "business-truth-confirmation",
  "no-auto-publishing-claim",
] as const;

export function getLaunchGateBlockers(checks: readonly ReadinessCheck[] = getFirstClientReadinessChecks()): readonly ReadinessCheck[] {
  return checks.filter(
    (check) =>
      requiredLaunchGateCheckKeys.includes(check.key as (typeof requiredLaunchGateCheckKeys)[number]) &&
      check.status !== "passing",
  );
}

export function isFirstClientLaunchReady(checks: readonly ReadinessCheck[] = getFirstClientReadinessChecks()): boolean {
  return getLaunchGateBlockers(checks).length === 0;
}

export function getFirstClientLaunchGate(checks: readonly ReadinessCheck[] = getFirstClientReadinessChecks()): FirstClientLaunchGate {
  const requiredChecks = checks.filter((check) =>
    requiredLaunchGateCheckKeys.includes(check.key as (typeof requiredLaunchGateCheckKeys)[number]),
  );
  const blockers = getLaunchGateBlockers(checks);
  const isReady = blockers.length === 0;

  return {
    status: isReady ? getReadinessStatusFromChecks(requiredChecks) : "blocked",
    isReady,
    requiredCheckKeys: requiredLaunchGateCheckKeys,
    blockers,
    message: isReady
      ? "First-client benchmark gate is ready for Faraz review. Production auth, storage, live data, and manual execution review still apply."
      : "First-client benchmark gate needs setup before client launch.",
  };
}
