import {
  getClientNeedsFromYou,
  getClientPortalJourney,
  getClientRecentProgress,
  getClientVisibilityProgress,
} from "./repository";
import type { ClientWeeklyUpdate } from "./types";
import { assertClientSafeLanguage } from "./languageSafety";

function takeOrFallback(items: string[], fallback: string[]): string[] {
  return items.length > 0 ? items.slice(0, 4) : fallback;
}

/**
 * Generate a deterministic, client-safe weekly update from local/demo journey
 * data. No external calls, no hidden execution, no invented performance claims.
 */
export function generateClientWeeklyUpdate(clientId: string): ClientWeeklyUpdate {
  const journey = getClientPortalJourney(clientId);
  const completed = getClientRecentProgress(clientId);
  const needs = getClientNeedsFromYou(clientId);
  const visibility = getClientVisibilityProgress(clientId);

  const inProgress = journey.filter(
    (item) =>
      item.status === "In review" ||
      item.status === "Prepared by Veroxa" ||
      item.status === "In progress",
  );
  const contentProgress = journey.filter(
    (item) => item.type === "media_submission" || item.type === "content_preparation",
  );
  const reviewProgress = journey.filter((item) => item.type === "review_response");

  const update: ClientWeeklyUpdate = {
    clientId,
    restaurantName: journey.find((item) => item.restaurantName)?.restaurantName,
    weekLabel: "Current week",
    headline: "Veroxa is handling this week's online presence work.",
    completedWork: takeOrFallback(
      completed.map((item) => `${item.title}: ${item.summary}`),
      ["Veroxa reviewed recent account activity and prepared the next progress update."],
    ),
    inProgressWork: takeOrFallback(
      inProgress.map((item) => `${item.title}: ${item.summary}`),
      ["A local visibility update is being prepared."],
    ),
    needsClientInput: takeOrFallback(
      needs.map((need) => `${need.title}: ${need.description}`),
      ["Nothing is needed from you right now."],
    ),
    visibilityProgress: [
      visibility.googleProfileFreshness,
      visibility.reviewResponseProgress,
      visibility.nextVisibilityAction,
    ],
    contentProgress: takeOrFallback(
      contentProgress.map((item) => item.summary),
      ["More food photos would help next week's content."],
    ),
    reviewProgress: takeOrFallback(
      reviewProgress.map((item) => item.summary),
      ["Review response support is in progress."],
    ),
    nextWeekFocus: [
      "Prepare the next local visibility update.",
      "Use fresh media for upcoming content where available.",
      "Keep review response support moving in a calm, accurate way.",
    ],
    clientSafeSummary:
      needs.length > 0
        ? "Veroxa is moving the work forward and needs one quick detail from you."
        : "Veroxa is moving the work forward; nothing is needed from you right now.",
  };
  assertClientSafeLanguage(update);
  return update;
}
