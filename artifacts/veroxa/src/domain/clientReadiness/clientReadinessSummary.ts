import { buildClientReadinessSnapshot } from "./clientReadinessEngine";
import type { ClientReadinessScoreLabel, ClientReadinessSnapshot, ClientReadinessSummaryCard, ClientSafeReadinessStatus } from "./types";

export function getClientReadinessScoreLabel(percent: number): ClientReadinessScoreLabel {
  if (percent >= 85) return "Ready for Veroxa review";
  if (percent >= 65) return "Almost ready";
  if (percent >= 35) return "Some items ready";
  return "Setup starting";
}

function toneForStatus(status: ClientSafeReadinessStatus): ClientReadinessSummaryCard["tone"] {
  if (status === "Needs your input") return "needs_input";
  if (status === "Waiting on media" || status === "Waiting on access") return "waiting";
  if (status === "Coming soon") return "coming_soon";
  if (status === "Ready for Veroxa review" || status === "Prepared by Veroxa" || status === "Ready for weekly update" || status === "Ready for monthly report") return "ready";
  return "neutral";
}

export function getClientReadinessSummaryCards(snapshot: ClientReadinessSnapshot = buildClientReadinessSnapshot()): ClientReadinessSummaryCard[] {
  return snapshot.areas.map((area) => ({
    id: area.id,
    title: area.label,
    status: area.status,
    body: area.detail,
    nextAction: area.nextAction ?? "Wait for Veroxa review",
    tone: toneForStatus(area.status),
  }));
}
