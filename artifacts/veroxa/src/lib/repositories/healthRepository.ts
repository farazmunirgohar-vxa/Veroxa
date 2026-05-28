/**
 * healthRepository.ts — read-only adapter that produces
 * `ClientHealthSnapshot` records from demo fixtures.
 *
 * Read-only. No writes. No network.
 */

import { demoClientHealth, type DemoClientHealth } from "@/data/demo/demoClientHealth";
import { demoMediaRunway } from "@/data/demo/demoMediaAssets";
import { demoWeeklyReports } from "@/data/demo/demoWeeklyReports";
import { getRestaurantName } from "@/data/demo/demoClients";
import type {
  ClientHealthSnapshot,
  ContentHealthStatus,
  ReportStatus,
} from "@/lib/data/veroxaDataContracts";

/**
 * Pure formula. Returns ceil(weeks of remaining content).
 */
export function calculateWeeksOfContentLeft(
  unusedUsableMediaCount: number,
  postingFrequencyWeekly: number,
): number {
  if (postingFrequencyWeekly <= 0) return 0;
  return Math.max(0, Math.round((unusedUsableMediaCount / postingFrequencyWeekly) * 10) / 10);
}

export function getContentHealthStatus(weeksOfContentLeft: number): ContentHealthStatus {
  if (weeksOfContentLeft <= 0) return "broken";
  if (weeksOfContentLeft < 1) return "urgent";
  if (weeksOfContentLeft < 3) return "caution";
  return "healthy";
}

function mapReportStatus(s: DemoClientHealth["signals"]["reportStatus"]): ReportStatus {
  switch (s) {
    case "Approved":
      return "approved";
    case "Pending":
      return "operator_review";
    case "Draft":
      return "drafted";
    case "Overdue":
      return "blocked";
    default:
      return "drafted";
  }
}

function toSnapshot(h: DemoClientHealth): ClientHealthSnapshot {
  const runway = demoMediaRunway.find((r) => r.clientId === h.clientId);
  const unusedUsable = (runway?.unusedPhotos ?? 0) + (runway?.unusedVideos ?? 0);
  const frequency = runway?.postsPerWeek ?? 0;
  const weeksLeft = calculateWeeksOfContentLeft(unusedUsable, frequency);
  const contentStatus = getContentHealthStatus(weeksLeft);
  const week = demoWeeklyReports.find((w) => w.clientId === h.clientId);
  const planned = Number(
    week?.metrics.find((m) => m.label.toLowerCase().includes("posts published"))?.value ?? "0",
  );
  const target = frequency;
  const completion = target > 0 ? Math.min(1, planned / target) : 0;
  const operatorActionRequired =
    h.level === "attention" || h.level === "critical" || h.signals.reportStatus === "Pending";
  const ownerEscalationRequired =
    h.level === "critical" || h.signals.reportStatus === "Overdue";
  const clientActionRequired = h.signals.onboardingComplete < 100;

  return {
    clientId: h.clientId,
    businessName: getRestaurantName(h.clientId),
    unusedUsableMediaCount: unusedUsable,
    postingFrequencyWeekly: frequency,
    weeksOfContentLeft: weeksLeft,
    contentHealthStatus: contentStatus,
    postingCompletionRate: completion,
    reportStatus: mapReportStatus(h.signals.reportStatus),
    operatorActionRequired,
    ownerEscalationRequired,
    clientActionRequired,
    riskReason: h.mainIssue,
  };
}

export function getClientHealthSnapshot(clientId: string): ClientHealthSnapshot | undefined {
  const h = demoClientHealth.find((x) => x.clientId === clientId);
  return h ? toSnapshot(h) : undefined;
}

export function getAllClientHealthSnapshots(): ClientHealthSnapshot[] {
  return demoClientHealth.map(toSnapshot);
}

export function getClientsNeedingTeamAction(): ClientHealthSnapshot[] {
  return getAllClientHealthSnapshots().filter(
    (s) => s.contentHealthStatus === "caution" || s.contentHealthStatus === "urgent",
  );
}

export function getClientsNeedingOperatorAction(): ClientHealthSnapshot[] {
  return getAllClientHealthSnapshots().filter((s) => s.operatorActionRequired);
}

export function getOwnerEscalationClients(): ClientHealthSnapshot[] {
  return getAllClientHealthSnapshots().filter((s) => s.ownerEscalationRequired);
}

export interface HealthSummary {
  total: number;
  healthy: number;
  caution: number;
  urgent: number;
  broken: number;
  operatorActions: number;
  ownerEscalations: number;
  clientActions: number;
}

export function getHealthSummary(): HealthSummary {
  const all = getAllClientHealthSnapshots();
  return {
    total: all.length,
    healthy: all.filter((s) => s.contentHealthStatus === "healthy").length,
    caution: all.filter((s) => s.contentHealthStatus === "caution").length,
    urgent: all.filter((s) => s.contentHealthStatus === "urgent").length,
    broken: all.filter((s) => s.contentHealthStatus === "broken").length,
    operatorActions: all.filter((s) => s.operatorActionRequired).length,
    ownerEscalations: all.filter((s) => s.ownerEscalationRequired).length,
    clientActions: all.filter((s) => s.clientActionRequired).length,
  };
}
