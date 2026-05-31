/**
 * Pure client package/readiness helpers.
 *
 * No React, no network, no storage. These helpers translate Veroxa's locked
 * package rules into client-safe labels for the real Client Portal review path.
 */

export type ClientPlanSlug = "essential" | "growth" | "premium";

export type PremiumEligibilityStatus =
  | "not_eligible_yet"
  | "eligible_for_assessment"
  | "assessment_needed"
  | "ready_for_premium"
  | "not_ready_continue_foundation";

export interface ClientPackageReadinessInput {
  plan: ClientPlanSlug;
  monthsActiveOnFoundationPlan: number;
  foundationStable: boolean;
  readinessAssessmentCompleted: boolean;
  clientApprovedPremium: boolean;
  agreedAdBudget: boolean;
  usableMediaAvailable: boolean;
  firstClientDiscountEligible: boolean;
  monthsSinceServiceStart: number;
  continuouslyActive: boolean;
}

const PLAN_LABELS: Record<ClientPlanSlug, string> = {
  essential: "Essential",
  growth: "Growth",
  premium: "Premium",
};

const POSTING_LIMIT_SUMMARY: Record<ClientPlanSlug, string> = {
  essential: "Up to 1 picture post per day when usable media is available.",
  growth:
    "Picture posting plus TikTok/Reels support using the photos and videos you provide.",
  premium:
    "Up to 2 content posts per day total: 1 picture post and 1 reel or short video post, when usable media is available.",
};

export function getCurrentPlanLabel(plan: ClientPlanSlug): string {
  return PLAN_LABELS[plan];
}

export function getPackagePostingLimitSummary(plan: ClientPlanSlug): string {
  return POSTING_LIMIT_SUMMARY[plan];
}

export function getVeroxaResponsibilitySummary(plan: ClientPlanSlug): string[] {
  const responsibilities = [
    "Google Business Profile and Google Maps visibility support",
    "Google Search SEO basics and page consistency",
    "Facebook + Instagram presence management",
    "Captions, content preparation, weekly updates, and monthly snapshots",
    "Media guidance so your restaurant knows what to send next",
  ];

  if (plan === "growth" || plan === "premium") {
    responsibilities.push(
      "TikTok and Reels posting support using restaurant-provided photos and videos",
    );
  }

  if (plan === "premium") {
    responsibilities.push(
      "Ads management after readiness, approval, and agreed ad budget",
    );
  }

  return responsibilities;
}

export function getRestaurantResponsibilitySummary(): string[] {
  return [
    "Provide usable photos and videos when content is needed",
    "Confirm business-truth changes such as hours, menu items, prices, offers, and important details",
    "Handle customer replies, comments, DMs, order questions, refunds, complaints, and service conversations",
    "Pay any ad spend directly to the ad platform if Premium ads are approved later",
  ];
}

export function getMediaDependencyReminder(usableMediaAvailable: boolean): string {
  return usableMediaAvailable
    ? "Posting depends on usable media. Your current supply looks workable, and Veroxa will ask when more content would help."
    : "More content needed: posting depends on usable media and may slow until new photos or videos are provided.";
}

export function getPremiumEligibilityState(
  input: ClientPackageReadinessInput,
): PremiumEligibilityStatus {
  if (input.plan === "premium") {
    return input.clientApprovedPremium && input.agreedAdBudget
      ? "ready_for_premium"
      : "assessment_needed";
  }

  if (input.monthsActiveOnFoundationPlan < 1) return "not_eligible_yet";
  if (!input.foundationStable) return "not_ready_continue_foundation";
  if (!input.readinessAssessmentCompleted) return "eligible_for_assessment";
  if (!input.clientApprovedPremium || !input.agreedAdBudget) return "assessment_needed";
  return "ready_for_premium";
}

export function getPremiumEligibilityLabel(status: PremiumEligibilityStatus): string {
  switch (status) {
    case "not_eligible_yet":
      return "Premium can be reviewed after at least 1 month on Essential or Growth.";
    case "eligible_for_assessment":
      return "Eligible for a Premium readiness assessment by phone, Zoom, or in person.";
    case "assessment_needed":
      return "Premium needs Veroxa review, your approval, and an agreed ad budget before ads begin.";
    case "ready_for_premium":
      return "Ready for Premium once Veroxa confirms the approved ad plan and budget.";
    case "not_ready_continue_foundation":
      return "Continue strengthening the foundation before Premium ads are considered.";
  }
}

export function getFirstClientDiscountState(input: ClientPackageReadinessInput): string {
  if (!input.firstClientDiscountEligible) {
    return "First-client discount is not active for this account.";
  }
  if (!input.continuouslyActive) {
    return "First-client discount ends if service stops and does not return later.";
  }
  if (input.monthsSinceServiceStart < 12) {
    return "First-client 20% discount is active for the first 12 months.";
  }
  return "20% loyalty discount continues while the account stays continuously active.";
}

export function buildClientPackageReadiness(input: ClientPackageReadinessInput) {
  const premiumStatus = getPremiumEligibilityState(input);
  return {
    planLabel: getCurrentPlanLabel(input.plan),
    postingLimitSummary: getPackagePostingLimitSummary(input.plan),
    veroxaResponsibilities: getVeroxaResponsibilitySummary(input.plan),
    restaurantResponsibilities: getRestaurantResponsibilitySummary(),
    mediaDependencyReminder: getMediaDependencyReminder(input.usableMediaAvailable),
    premiumStatus,
    premiumStatusLabel: getPremiumEligibilityLabel(premiumStatus),
    discountStatusLabel: getFirstClientDiscountState(input),
  };
}

export const DEFAULT_CLIENT_PACKAGE_READINESS: ClientPackageReadinessInput = {
  plan: "growth",
  monthsActiveOnFoundationPlan: 1,
  foundationStable: false,
  readinessAssessmentCompleted: false,
  clientApprovedPremium: false,
  agreedAdBudget: false,
  usableMediaAvailable: true,
  firstClientDiscountEligible: true,
  monthsSinceServiceStart: 1,
  continuouslyActive: true,
};
