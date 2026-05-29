/**
 * customerMomentTypes.ts — the customer-moment and content-angle vocabulary
 * used by the Restaurant Content Intelligence Pipeline.
 *
 * RULE-BASED ONLY. These are classification categories the pipeline chooses
 * from when it reasons about *why a customer would act* on a piece of content.
 * Nothing here publishes, sends, or guarantees anything. Every downstream use
 * is a DRAFT that requires Veroxa team approval.
 */

// ---------------------------------------------------------------------------
// Customer moments — the real-life decision moment a post is meant to catch.
// ---------------------------------------------------------------------------

export type CustomerMoment =
  | "lunch_decision"
  | "dinner_craving"
  | "weekend_family_meal"
  | "late_night_snack"
  | "office_lunch"
  | "halal_food_search"
  | "comfort_food"
  | "new_customer_trust"
  | "repeat_customer_reminder"
  | "special_menu_discovery"
  | "behind_the_scenes_trust";

export const CUSTOMER_MOMENT_LABELS: Record<CustomerMoment, string> = {
  lunch_decision: "Lunch decision",
  dinner_craving: "Dinner craving",
  weekend_family_meal: "Weekend family meal",
  late_night_snack: "Late-night snack",
  office_lunch: "Office lunch",
  halal_food_search: "Halal food search",
  comfort_food: "Comfort food",
  new_customer_trust: "New-customer trust",
  repeat_customer_reminder: "Repeat-customer reminder",
  special_menu_discovery: "Special / menu discovery",
  behind_the_scenes_trust: "Behind-the-scenes trust",
};

// ---------------------------------------------------------------------------
// Recommended meal window per moment. Plain-language, never an exact promise.
// ---------------------------------------------------------------------------

export interface MealWindow {
  /** Plain-language posting window. */
  window: string;
  /** Why this window suits the moment. */
  reason: string;
}

export const CUSTOMER_MOMENT_WINDOWS: Record<CustomerMoment, MealWindow> = {
  lunch_decision: {
    window: "Weekday 10:30 AM–12:00 PM",
    reason: "Catches people deciding where to eat just before lunch.",
  },
  office_lunch: {
    window: "Weekday 10:30 AM–12:00 PM",
    reason: "Reaches office workers planning a quick lunch.",
  },
  dinner_craving: {
    window: "Weekday 4:00 PM–7:00 PM",
    reason: "Lands while people plan dinner after work.",
  },
  weekend_family_meal: {
    window: "Friday evening or Saturday late morning",
    reason: "Reaches families planning a weekend meal out.",
  },
  late_night_snack: {
    window: "Evening, after 8:00 PM",
    reason: "Suits snack and dessert cravings later in the day.",
  },
  halal_food_search: {
    window: "Around meal windows (late morning / late afternoon)",
    reason: "Aligns with active mealtime searches for halal options.",
  },
  comfort_food: {
    window: "Afternoon to evening",
    reason: "Comfort-food appeal builds through the afternoon and evening.",
  },
  new_customer_trust: {
    window: "Midweek midday",
    reason: "A calmer slot suits trust-building, discovery content.",
  },
  repeat_customer_reminder: {
    window: "Late afternoon, mid-to-late week",
    reason: "Gentle reminder while regulars plan their next visit.",
  },
  special_menu_discovery: {
    window: "Thursday early evening",
    reason: "Builds anticipation heading into the weekend.",
  },
  behind_the_scenes_trust: {
    window: "Midweek midday",
    reason: "Lighter, trust-building content performs well midweek.",
  },
};

// ---------------------------------------------------------------------------
// Content angles — the editorial approach the post takes.
// ---------------------------------------------------------------------------

export type ContentAngle =
  | "craving"
  | "trust_story"
  | "menu_education"
  | "visit_action"
  | "family_group"
  | "behind_the_scenes"
  | "google_profile_freshness"
  | "review_trust"
  | "offer_special_if_provided";

export const CONTENT_ANGLE_LABELS: Record<ContentAngle, string> = {
  craving: "Craving / reach",
  trust_story: "Trust / story",
  menu_education: "Menu education",
  visit_action: "Visit / action",
  family_group: "Family / group",
  behind_the_scenes: "Behind-the-scenes",
  google_profile_freshness: "Google profile freshness",
  review_trust: "Review / trust",
  offer_special_if_provided: "Offer / special (only if provided)",
};
