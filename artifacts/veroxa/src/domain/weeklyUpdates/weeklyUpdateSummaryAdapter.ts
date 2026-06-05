import type { ClientUpdateSummary } from "@/domain/saas/repositoryContracts";
import type { WeeklyUpdateRecord } from "./types";

function fallbackList(items: string[] | undefined, fallback: string): string[] {
  return items && items.length > 0 ? items : [fallback];
}

export function buildWeeklyUpdateFromClientSummary(
  summary: ClientUpdateSummary,
  restaurantName = "Your restaurant",
): WeeklyUpdateRecord {
  const isDemo = summary.sourceLabel === "demo";
  return {
    id: summary.id,
    clientId: summary.id.split("-weekly")[0] || "loaded-client",
    weekLabel: summary.title,
    restaurantName,
    completedThisWeek: fallbackList(
      summary.completed,
      "Veroxa reviewed the current online presence setup.",
    ),
    preparedThisWeek: [
      isDemo
        ? "Sample prepared visibility work for review only."
        : "Prepared progress notes for Veroxa team review.",
    ],
    pendingItems: fallbackList(
      summary.waitingOnClient,
      "Veroxa will ask for input when a confirmed detail or usable media is needed.",
    ),
    mediaNeeded: [
      "Best-seller photos",
      "Clear food photos",
      "Storefront or dining-room photos",
    ],
    clientConfirmationsNeeded: fallbackList(
      summary.waitingOnClient,
      "Confirm hours, menu, prices, offers, and links before Veroxa uses them publicly.",
    ),
    requestsAnswered: [
      "Portal requests receive a review, answer, or next step within 24 hours.",
    ],
    nextWeekFocus: [summary.nextDirection],
    status: summary.waitingOnClient.length > 0 ? "needs_confirmation" : "ready_for_review",
    clientSafeSummary: isDemo
      ? "This sample weekly update shows how Veroxa summarizes work, pending items, media needs, confirmations, and next focus."
      : "This weekly update is prepared from loaded portal data and waits for Veroxa team review before anything public happens.",
    createdAt: new Date().toISOString(),
  };
}
