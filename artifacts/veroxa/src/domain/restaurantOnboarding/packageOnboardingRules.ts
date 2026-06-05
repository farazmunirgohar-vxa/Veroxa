import type { OnboardingPackageId } from "./types";

export interface PackageOnboardingRuleSet {
  packageId: OnboardingPackageId;
  label: string;
  requiredBusinessInfo: string[];
  requiredPlatforms: string[];
  optionalPlatforms: string[];
  requiredMedia: string[];
  proofInputs: string[];
  acknowledgements: string[];
}

const completeOnlinePresenceRuleSet: PackageOnboardingRuleSet = {
  packageId: "complete_online_presence",
  label: "Complete Online Presence",
  requiredBusinessInfo: ["restaurantName", "contactName", "phone", "email", "address", "cuisineType", "bestSellers", "foodCategories", "customerTypes", "busyDays", "busyTimes", "postingPreferences"],
  requiredPlatforms: ["googleBusinessProfileUrl", "googleMapsUrl", "websiteUrl", "menuUrl", "orderingUrl", "facebookUrl", "instagramUrl"],
  optionalPlatforms: ["reservationUrl", "cateringUrl"],
  requiredMedia: ["food photos", "best seller photos", "storefront photo", "dining-room photo", "menu photo/link"],
  proofInputs: ["main customer type", "most wanted action", "current weak points", "best sellers", "order/menu availability", "Google/social confidence"],
  acknowledgements: ["picture-based content at launch", "weekly update expectations", "monthly report expectations", "24-hour portal response means review/answer/next step", "team review before anything goes live"],
};

export const packageOnboardingRules: Record<OnboardingPackageId, PackageOnboardingRuleSet> = {
  complete_online_presence: completeOnlinePresenceRuleSet,
  // Historical/internal aliases only. They normalize to the current launch offer
  // so retired tiers cannot drive current client-facing onboarding UI.
  starter: { ...completeOnlinePresenceRuleSet, packageId: "starter", label: "Complete Online Presence" },
  growth: { ...completeOnlinePresenceRuleSet, packageId: "growth", label: "Complete Online Presence" },
  premium: { ...completeOnlinePresenceRuleSet, packageId: "premium", label: "Complete Online Presence" },
};

export function normalizeOnboardingPackageId(packageId: OnboardingPackageId): "complete_online_presence" {
  return "complete_online_presence";
}

export function getPackageOnboardingRules(packageId: OnboardingPackageId): PackageOnboardingRuleSet {
  return packageOnboardingRules[normalizeOnboardingPackageId(packageId)];
}

export function packageRequiresGrowthMedia(_packageId: OnboardingPackageId): boolean {
  return false;
}

export function packageRequiresPremiumReadiness(_packageId: OnboardingPackageId): boolean {
  return false;
}
