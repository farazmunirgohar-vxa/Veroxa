import { clientReadinessSeedAreas } from "./clientReadinessSeedData";
import { getClientSafeReadinessMessage } from "./clientReadinessMessages";
import { getClientReadinessScoreLabel } from "./clientReadinessSummary";
import type { ClientReadinessAreaInput, ClientReadinessSnapshot } from "./types";

const readyStatuses = new Set(["Ready for Veroxa review", "Prepared by Veroxa", "Ready for weekly update", "Ready for monthly report"]);

export function buildClientReadinessSnapshot(input?: {
  clientId?: string;
  restaurantName?: string;
  areas?: ClientReadinessAreaInput[];
  updatedAt?: string;
}): ClientReadinessSnapshot {
  const areas = input?.areas ?? clientReadinessSeedAreas;
  const totalWeight = areas.filter((area) => area.required).reduce((sum, area) => sum + area.weight, 0);
  const completedWeight = areas
    .filter((area) => area.required && readyStatuses.has(area.status))
    .reduce((sum, area) => sum + area.weight, 0);
  const readinessPercent = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
  const scoreLabel = getClientReadinessScoreLabel(readinessPercent);
  const nextAction = getClientReadinessNextAction(areas);
  return {
    clientId: input?.clientId ?? "preview-client",
    restaurantName: input?.restaurantName ?? "Your restaurant",
    areas,
    completedWeight,
    totalWeight,
    readinessPercent,
    scoreLabel,
    nextAction,
    clientSafeMessage: getClientSafeReadinessMessage(scoreLabel, nextAction),
    reviewNotice: "Nothing goes live without Veroxa team review. This is a preview/manual readiness view, not a live connection.",
    updatedAt: input?.updatedAt ?? "2026-06-05T00:00:00.000Z",
  };
}

export function getClientReadinessNextAction(areas: ClientReadinessAreaInput[] = clientReadinessSeedAreas): string {
  const priority = areas.find((area) => area.required && (area.status === "Needs your input" || area.status === "Waiting on media" || area.status === "Waiting on access"));
  if (priority?.nextAction) return priority.nextAction;
  const review = areas.find((area) => area.status === "Ready for Veroxa review" || area.status === "In review");
  return review?.nextAction ?? "Wait for Veroxa review";
}
