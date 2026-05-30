import {
  getClientNeedsFromYou,
  getClientPortalJourney,
  getClientRecentProgress,
  getClientVisibilityProgress,
} from "./repository";
import type { ClientMonthlyReport } from "./types";

function summaries(items: { title: string; summary: string }[], fallback: string[]): string[] {
  return items.length > 0
    ? items.slice(0, 6).map((item) => `${item.title}: ${item.summary}`)
    : fallback;
}

/**
 * Generate a deterministic, client-safe monthly report foundation from local
 * journey data. It avoids fake revenue, ranking guarantees, and invented live
 * metrics; Replit can later polish the display around these fields.
 */
export function generateClientMonthlyReport(clientId: string): ClientMonthlyReport {
  const journey = getClientPortalJourney(clientId);
  const visibility = getClientVisibilityProgress(clientId);
  const completed = getClientRecentProgress(clientId);
  const pending = getClientNeedsFromYou(clientId);
  const mediaAndContent = journey.filter(
    (item) => item.type === "media_submission" || item.type === "content_preparation",
  );
  const reputation = journey.filter((item) => item.type === "review_response");

  return {
    clientId,
    monthLabel: "Current month",
    executiveSummary:
      "Veroxa worked on your online presence, local visibility, content preparation, and review support this month.",
    visibilityProgress: visibility,
    mediaAndContentSummary: summaries(mediaAndContent, [
      "Content prepared: Veroxa reviewed available media and identified the next content needs.",
    ]),
    reviewReputationSummary: summaries(reputation, [
      "Review response support: Veroxa is monitoring opportunities for calm, accurate replies.",
    ]),
    completedWork: summaries(completed, [
      "Visibility work completed: completed items will appear here as Veroxa finishes them.",
    ]),
    pendingClientInput:
      pending.length > 0
        ? pending.map((need) => `${need.title}: ${need.description}`)
        : ["No client input is pending right now."],
    nextMonthFocus: [
      "Local visibility improvement opportunities.",
      "Fresh photo and content consistency.",
      "Review response support.",
      "Business details confirmation when needed.",
    ],
    clientSafeRecommendations: [
      "Upload fresh food and atmosphere photos when available.",
      "Share changes to hours, menu, ordering links, catering, or offers before they are promoted.",
      "Let Veroxa know which dishes or services should be emphasized next month.",
    ],
  };
}
