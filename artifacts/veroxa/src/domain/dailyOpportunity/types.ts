/**
 * Daily Opportunity Engine — type contracts (rule-based V1).
 *
 * This is the team-facing foundation that answers, for each restaurant:
 * "What should we push today to bring more customers?"
 *
 * V1 is fully rule-based and deterministic — there are NO AI/model calls and
 * nothing here posts or publishes. It is surfaced only inside the Team portal
 * with calm wording ("Suggested push" / "Today's opportunity"), never to the
 * client as an "AI agent". See docs/DAILY_CUSTOMER_OPPORTUNITY_ENGINE.md.
 */

export type MealWindow =
  | "morning"
  | "lunch"
  | "afternoon"
  | "dinner"
  | "late_night";

export const MEAL_WINDOW_LABELS: Record<MealWindow, string> = {
  morning: "Morning",
  lunch: "Lunch",
  afternoon: "Afternoon",
  dinner: "Dinner",
  late_night: "Late night",
};

export type OpportunityType =
  | "lunch_push"
  | "dinner_push"
  | "weekend_family_meal"
  | "best_seller_spotlight"
  | "catering_reminder"
  | "review_growth_push"
  | "google_photo_update"
  | "local_community_post"
  | "new_item_special"
  | "content_shortage_reminder";

export const OPPORTUNITY_TYPE_LABELS: Record<OpportunityType, string> = {
  lunch_push: "Lunch push",
  dinner_push: "Dinner / family meal push",
  weekend_family_meal: "Weekend family meal",
  best_seller_spotlight: "Best seller spotlight",
  catering_reminder: "Catering reminder",
  review_growth_push: "Review growth push",
  google_photo_update: "Google photo / update",
  local_community_post: "Local community post",
  new_item_special: "New item / special",
  content_shortage_reminder: "Content shortage reminder",
};

export type OpportunityPriority = "high" | "medium" | "low";

export const OPPORTUNITY_PRIORITY_ORDER: Record<OpportunityPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export interface RecommendedAction {
  /** Short imperative the team can act on today. */
  label: string;
  /** One supporting line of detail. */
  detail: string;
}

export interface RequiredClientInput {
  /** Whether the team needs something from the restaurant to proceed. */
  needed: boolean;
  /** Simple, client-safe ask (only set when `needed`). */
  ask?: string;
}

export interface DailyOpportunity {
  id: string;
  clientId: string;
  restaurantName: string;
  type: OpportunityType;
  /** The suggested angle, in plain language. */
  title: string;
  /** Why this helps bring more customers today. */
  whyItMatters: string;
  priority: OpportunityPriority;
  mealWindow?: MealWindow;
  recommendedAction: RecommendedAction;
  requiredClientInput: RequiredClientInput;
}

export interface DailyOpportunityContext {
  /** Injectable clock for deterministic results (defaults to now). */
  now?: Date;
}
