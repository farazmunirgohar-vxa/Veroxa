/**
 * Daily Opportunity Engine — rule-based V1.
 *
 * Deterministic, dependency-light rules over demo/fixture data. No AI/model
 * calls, no network, no posting. Designed so the rules can later be upgraded
 * with an AI layer WITHOUT changing how the Team portal consumes the result.
 */

import {
  demoRestaurants,
  getRestaurantName,
  getMediaRequirements,
  getClientNotes,
  demoClientLifecycle,
} from "@/data/demoData";
import type {
  DailyOpportunity,
  DailyOpportunityContext,
  MealWindow,
  OpportunityPriority,
} from "./types";
import { OPPORTUNITY_PRIORITY_ORDER } from "./types";

/** Map a clock time to a coarse service window. */
export function getMealWindow(date: Date): MealWindow {
  const h = date.getHours();
  if (h < 11) return "morning";
  if (h < 14) return "lunch";
  if (h < 17) return "afternoon";
  if (h < 22) return "dinner";
  return "late_night";
}

function isWeekend(date: Date): boolean {
  const d = date.getDay();
  return d === 0 || d === 6; // Sun / Sat
}

function isCateringWindowDay(date: Date): boolean {
  const d = date.getDay();
  return d === 4 || d === 5; // Thu / Fri — lead time for weekend trays
}

function priorityRank(p: OpportunityPriority): number {
  return OPPORTUNITY_PRIORITY_ORDER[p];
}

/**
 * Produce 1–3 recommended opportunities for a single client.
 * Rules are ordered by importance; the strongest signals win the slots.
 */
export function getDailyOpportunitiesForClient(
  clientId: string,
  ctx: DailyOpportunityContext = {},
): DailyOpportunity[] {
  const now = ctx.now ?? new Date();
  const restaurantName = getRestaurantName(clientId);
  const media = getMediaRequirements(clientId);
  const notes = getClientNotes(clientId);
  const lifecycle = demoClientLifecycle.find((l) => l.clientId === clientId);
  const mealWindow = getMealWindow(now);
  const topSeller = notes?.bestSellers?.[0];

  const out: DailyOpportunity[] = [];
  const photoRatio = media ? media.photos.current / media.photos.target : 1;

  // 1) Content supply is the gating signal — low supply blocks everything else.
  if (lifecycle?.mediaStatus === "Critical" || photoRatio < 0.35) {
    out.push({
      id: `${clientId}-content-shortage`,
      clientId,
      restaurantName,
      type: "content_shortage_reminder",
      title: "Refresh the content shelf",
      whyItMatters:
        "Posting slows down without fresh photos. One quick batch keeps the week's content moving.",
      priority: "high",
      recommendedAction: {
        label: "Ask for a small batch of fresh photos",
        detail: topSeller
          ? `Request 3–5 quick shots, starting with ${topSeller}.`
          : "Request 3–5 quick shots of current best sellers.",
      },
      requiredClientInput: {
        needed: true,
        ask: topSeller
          ? `Could you send a few quick photos of your ${topSeller}?`
          : "Could you send a few quick photos of your most popular dishes?",
      },
    });
  } else if (lifecycle?.mediaStatus === "Low" || photoRatio < 0.6) {
    out.push({
      id: `${clientId}-best-seller-spotlight`,
      clientId,
      restaurantName,
      type: "best_seller_spotlight",
      title: topSeller ? `Spotlight the ${topSeller}` : "Spotlight a best seller",
      whyItMatters:
        "A proven favourite is the safest way to drive orders while content supply rebuilds.",
      priority: "medium",
      recommendedAction: {
        label: "Prepare a best-seller feature",
        detail: topSeller
          ? `Use existing media to feature ${topSeller}.`
          : "Use existing media to feature a top dish.",
      },
      requiredClientInput: { needed: false },
    });
  }

  // 2) Reviews / reputation — low health means reputation needs a nudge.
  if (lifecycle && lifecycle.healthScore < 70) {
    out.push({
      id: `${clientId}-review-growth`,
      clientId,
      restaurantName,
      type: "review_growth_push",
      title: "Nudge happy guests for a review",
      whyItMatters:
        "More recent reviews lift local discovery and trust — a direct path to new customers.",
      priority: lifecycle.healthScore < 50 ? "high" : "medium",
      recommendedAction: {
        label: "Send a friendly review prompt",
        detail: "Prepare a short, warm ask for recent happy guests.",
      },
      requiredClientInput: { needed: false },
    });
  }

  // 3) Time-of-day / day-of-week push.
  if (isWeekend(now)) {
    out.push({
      id: `${clientId}-weekend-family`,
      clientId,
      restaurantName,
      type: "weekend_family_meal",
      title: "Weekend family meal push",
      whyItMatters: "Weekends are peak family-dining intent — meet it with a clear feature.",
      priority: "medium",
      mealWindow,
      recommendedAction: {
        label: "Feature a shareable / family option",
        detail: topSeller ? `Lead with ${topSeller}.` : "Lead with a shareable plate.",
      },
      requiredClientInput: { needed: false },
    });
  } else if (mealWindow === "morning" || mealWindow === "lunch") {
    out.push({
      id: `${clientId}-lunch-push`,
      clientId,
      restaurantName,
      type: "lunch_push",
      title: "Lunch push",
      whyItMatters: "Catch the midday decision window before guests pick where to eat.",
      priority: "medium",
      mealWindow,
      recommendedAction: {
        label: "Post a lunch-ready feature now",
        detail: topSeller ? `Quick, appetising shot of ${topSeller}.` : "Quick, appetising lunch shot.",
      },
      requiredClientInput: { needed: false },
    });
  } else if (mealWindow === "afternoon" || mealWindow === "dinner") {
    out.push({
      id: `${clientId}-dinner-push`,
      clientId,
      restaurantName,
      type: "dinner_push",
      title: "Dinner push",
      whyItMatters: "Afternoon is when guests plan dinner — be the easy choice.",
      priority: "medium",
      mealWindow,
      recommendedAction: {
        label: "Post a dinner feature this afternoon",
        detail: topSeller ? `Warm, inviting shot of ${topSeller}.` : "Warm, inviting dinner shot.",
      },
      requiredClientInput: { needed: false },
    });
  }

  // 4) Catering lead time on Thu/Fri.
  if (isCateringWindowDay(now)) {
    out.push({
      id: `${clientId}-catering`,
      clientId,
      restaurantName,
      type: "catering_reminder",
      title: "Catering / weekend trays reminder",
      whyItMatters: "Thursday–Friday is the booking window for weekend group orders.",
      priority: "low",
      recommendedAction: {
        label: "Remind guests catering is available",
        detail: "Post a simple catering / party-tray reminder.",
      },
      requiredClientInput: { needed: false },
    });
  }

  // 5) Google freshness fill-in when supply is healthy and slots remain.
  if (out.length < 3 && lifecycle?.mediaStatus === "Healthy") {
    out.push({
      id: `${clientId}-google-update`,
      clientId,
      restaurantName,
      type: "google_photo_update",
      title: "Add a fresh Google photo",
      whyItMatters: "Recent Google photos keep the profile active and improve local visibility.",
      priority: "low",
      recommendedAction: {
        label: "Add one recent photo to Google",
        detail: "Use an approved recent shot to keep the profile fresh.",
      },
      requiredClientInput: { needed: false },
    });
  }

  return out
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority))
    .slice(0, 3);
}

/**
 * Aggregate the strongest "suggested pushes" across all demo clients, for the
 * Team Dashboard. Returns the highest-priority opportunities first.
 */
export function getTodaysSuggestedPushes(
  ctx: DailyOpportunityContext = {},
  limit = 3,
): DailyOpportunity[] {
  const all = demoRestaurants.flatMap((r) =>
    getDailyOpportunitiesForClient(r.id, ctx),
  );
  return all
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority))
    .slice(0, limit);
}
