/**
 * Pure client package/readiness helpers.
 *
 * No React, no network, no storage. These helpers translate Veroxa's locked
 * package rules into client-safe labels for the real Client Portal review path.
 */

import { VEROXA_PLANS } from "@/data/pricing/veroxaPricing";

export type ClientPlanSlug = "starter" | "growth" | "premium";

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

export function getCurrentPlanLabel(plan: ClientPlanSlug): string {
  return VEROXA_PLANS[plan].label;
}

export function getPackagePostingLimitSummary(plan: ClientPlanSlug): string {
  return VEROXA_PLANS[plan].postingVolumeSummary;
}

export function getVeroxaResponsibilitySummary(plan: ClientPlanSlug): string[] {
  return VEROXA_PLANS[plan].veroxaResponsibilities;
}

export function getRestaurantResponsibilitySummary(): string[] {
  return VEROXA_PLANS.starter.clientResponsibilities;
}

export function getMediaDependencyReminder(
  usableMediaAvailable: boolean,
): string {
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
  if (!input.clientApprovedPremium || !input.agreedAdBudget)
    return "assessment_needed";
  return "ready_for_premium";
}

export function getPremiumEligibilityLabel(
  status: PremiumEligibilityStatus,
): string {
  switch (status) {
    case "not_eligible_yet":
      return "Premium can be reviewed after at least 1 month on Starter or Growth.";
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

export function getFirstClientDiscountState(
  _input: ClientPackageReadinessInput,
): string {
  return "";
}

export function buildClientPackageReadiness(
  input: ClientPackageReadinessInput,
) {
  const premiumStatus = getPremiumEligibilityState(input);
  return {
    planLabel: getCurrentPlanLabel(input.plan),
    postingLimitSummary: getPackagePostingLimitSummary(input.plan),
    veroxaResponsibilities: getVeroxaResponsibilitySummary(input.plan),
    restaurantResponsibilities: getRestaurantResponsibilitySummary(),
    mediaDependencyReminder: getMediaDependencyReminder(
      input.usableMediaAvailable,
    ),
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
