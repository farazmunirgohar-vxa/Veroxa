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

export const packageOnboardingRules: Record<OnboardingPackageId, PackageOnboardingRuleSet> = {
  starter: {
    packageId: "starter",
    label: "Starter",
    requiredBusinessInfo: ["restaurantName", "contactName", "phone", "email", "address", "cuisineType", "bestSellers", "foodCategories", "customerTypes", "busyDays", "busyTimes"],
    requiredPlatforms: ["googleBusinessProfileUrl", "googleMapsUrl", "websiteUrl", "menuUrl", "orderingUrl", "facebookUrl", "instagramUrl"],
    optionalPlatforms: ["reservationUrl", "cateringUrl"],
    requiredMedia: ["food photos", "best seller photos", "storefront photo", "menu photo/link"],
    proofInputs: ["main customer type", "most wanted action", "current weak points", "best sellers", "order/menu availability"],
    acknowledgements: ["basic photo guidance", "simple posting preferences", "team review before anything goes live"],
  },
  growth: {
    packageId: "growth",
    label: "Growth",
    requiredBusinessInfo: ["restaurantName", "contactName", "phone", "email", "address", "cuisineType", "bestSellers", "foodCategories", "customerTypes", "busyDays", "busyTimes", "postingPreferences"],
    requiredPlatforms: ["googleBusinessProfileUrl", "googleMapsUrl", "websiteUrl", "menuUrl", "orderingUrl", "facebookUrl", "instagramUrl", "tiktokUrl"],
    optionalPlatforms: ["reservationUrl", "cateringUrl"],
    requiredMedia: ["food photos", "best seller photos", "short food prep videos", "storefront photo", "menu photo/link"],
    proofInputs: ["main customer type", "most wanted action", "current weak points", "best sellers", "order/menu availability", "Google/social confidence"],
    acknowledgements: ["video/reels readiness", "TikTok profile if available", "weekly update expectations", "monthly report expectations", "communication preferences"],
  },
  premium: {
    packageId: "premium",
    label: "Premium",
    requiredBusinessInfo: ["restaurantName", "contactName", "phone", "email", "address", "cuisineType", "bestSellers", "foodCategories", "customerTypes", "busyDays", "busyTimes", "postingPreferences"],
    requiredPlatforms: ["googleBusinessProfileUrl", "googleMapsUrl", "websiteUrl", "menuUrl", "orderingUrl", "facebookUrl", "instagramUrl", "tiktokUrl"],
    optionalPlatforms: ["reservationUrl", "cateringUrl"],
    requiredMedia: ["food photos", "best seller photos", "short food prep videos", "storefront photo", "menu photo/link", "customer-safe ambience optional"],
    proofInputs: ["main customer type", "most wanted action", "current weak points", "best sellers", "order/menu availability", "Google/social confidence", "owner-reported baseline notes", "tracking signals later"],
    acknowledgements: ["ad management readiness", "ad budget confirmation placeholder", "ad approval requirement", "premium readiness assessment", "ad spend separate acknowledgement"],
  },
};

export function getPackageOnboardingRules(packageId: OnboardingPackageId): PackageOnboardingRuleSet {
  return packageOnboardingRules[packageId];
}

export function packageRequiresGrowthMedia(packageId: OnboardingPackageId): boolean {
  return packageId === "growth" || packageId === "premium";
}

export function packageRequiresPremiumReadiness(packageId: OnboardingPackageId): boolean {
  return packageId === "premium";
}
