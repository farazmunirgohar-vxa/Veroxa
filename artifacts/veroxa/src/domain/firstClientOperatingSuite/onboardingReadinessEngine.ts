import type { OnboardingReadinessInput, OnboardingReadinessStatus } from "./types";

const requiredFields: readonly [keyof OnboardingReadinessInput, string][] = [
  ["businessName", "Business name"],
  ["address", "Address"],
  ["phone", "Phone"],
  ["website", "Website"],
  ["googleBusinessProfileLink", "Google Business Profile link"],
  ["menuLinkOrImages", "Menu link or menu images"],
  ["orderingLink", "Ordering link"],
  ["brandToneNotes", "Brand tone notes"],
  ["postingPreferences", "Posting preferences"],
];

function hasText(value: unknown): boolean {
  return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
}

function hasList(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

export function evaluateOnboardingReadiness(
  input: OnboardingReadinessInput,
): OnboardingReadinessStatus {
  const completedItems: string[] = [];
  const missingItems: string[] = [];

  for (const [field, label] of requiredFields) {
    if (hasText(input[field])) completedItems.push(label);
    else missingItems.push(label);
  }

  if (hasText(input.instagramLink)) completedItems.push("Instagram link");
  if (hasText(input.facebookLink)) completedItems.push("Facebook link");
  if (hasText(input.tiktokLink)) completedItems.push("TikTok link if available");

  if (hasList(input.topMenuItems)) completedItems.push("Top menu items");
  else missingItems.push("Top menu items");

  if (hasList(input.bestSellers)) completedItems.push("Best sellers");
  else missingItems.push("Best sellers");

  if (input.mediaGuidanceGiven) completedItems.push("Media guidance given");
  else missingItems.push("Media guidance given");

  if (input.requiresPremiumReadiness) {
    if (hasText(input.premiumReadinessNotes)) {
      completedItems.push("Premium readiness notes");
    } else {
      missingItems.push("Premium readiness assessment notes");
    }
  }

  const itemsRequiringConfirmation = [
    ...(input.itemsRequiringConfirmation ?? []),
  ];

  const status =
    missingItems.length === 0 && itemsRequiringConfirmation.length === 0
      ? "complete"
      : completedItems.length >= 8
        ? "partial"
        : "needed";

  const nextSetupAction =
    itemsRequiringConfirmation.length > 0
      ? `Confirm ${itemsRequiringConfirmation[0]} before preparing public-facing work.`
      : missingItems.length > 0
        ? `Collect ${missingItems[0]} before service start review.`
        : "Onboarding inputs are ready for manual service review.";

  return {
    status,
    completedItems,
    missingItems,
    itemsRequiringConfirmation,
    nextSetupAction,
    premiumReadinessLabel: input.requiresPremiumReadiness
      ? input.premiumReadinessNotes
        ? "Premium readiness review notes present"
        : "Premium readiness review still needed"
      : undefined,
  };
}
