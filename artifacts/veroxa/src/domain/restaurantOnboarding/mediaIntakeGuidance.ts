import type { OnboardingChecklistItem, RestaurantOnboardingProfile } from "./types";
import { packageRequiresGrowthMedia } from "./packageOnboardingRules";

const mediaCategories = [
  ["food photos", "Food photos", "Clear photos of current menu items."],
  ["best seller photos", "Best seller photos", "Close-up photos of the items customers already choose most."],
  ["storefront photo", "Storefront photo", "Outside photo to help Veroxa orient local presence work."],
  ["menu photo/link", "Menu photo/link", "Current menu photo or menu link."],
  ["staff/team optional", "Staff/team optional", "Only if the restaurant is comfortable sharing."],
  ["dining room optional", "Dining room optional", "Optional customer-safe room photos."],
  ["catering/large order optional", "Catering/large order optional", "Only if catering is actually available and confirmed."],
  ["seasonal item optional", "Seasonal item optional", "Only if the item is currently available and confirmed."],
  ["customer-safe ambience optional", "Customer-safe ambience optional", "Atmosphere photos without private customer moments."],
] as const;

export function getMediaIntakeChecklist(profile: RestaurantOnboardingProfile): OnboardingChecklistItem[] {
  return mediaCategories.map(([id, label, description]) => {
    const required = ["food photos", "best seller photos", "storefront photo", "menu photo/link"].includes(id);
    const complete = profile.mediaAvailable.includes(id);
    return { id, label, description, status: complete ? "complete" : required ? "needed" : "optional", clientLabel: complete ? "Complete" : required ? "Needs your input" : "Optional", teamLabel: complete ? "Use in first-week setup" : required ? "Media request needed" : "Not needed for this package", requiredFor: required ? ["complete_online_presence"] : [], value: complete ? "Available for review" : "" };
  });
}

export function getMediaSupplyStatus(profile: RestaurantOnboardingProfile): string {
  const labels: Record<string, string> = { not_started: "Media not started", low: "More media needed", usable: "Usable launch media", strong: "Strong media supply", inconsistent: "Media supply inconsistent" };
  return labels[profile.mediaSupplyStatus] ?? "Media needs review";
}

export function getNextMediaNeeded(profile: RestaurantOnboardingProfile): string[] {
  return getMediaIntakeChecklist(profile).filter((check) => check.status === "needed").map((check) => check.label);
}

export function getMediaQualityGuidance(profile: RestaurantOnboardingProfile): string[] {
  const guidance = ["Please send clear, current food photos with natural light when possible.", "Close-up angles of best-selling items usually work best.", "Avoid sending blurry photos, screenshots, or photos with private customer moments."];
  void packageRequiresGrowthMedia;
  return guidance;
}

export function getPackageMediaExpectations(profile: RestaurantOnboardingProfile): string {
  void profile;
  return "Complete Online Presence needs a usable picture-based media batch before Veroxa prepares the first content rhythm. Video/Reels/TikTok are coming soon.";
}

export function getMediaRequestDraft(profile: RestaurantOnboardingProfile): string {
  const next = getNextMediaNeeded(profile);
  const firstAsk = next.length ? next.slice(0, 3).join(", ") : "a few fresh best-seller photos";
  return `Please send 5–10 clear food photos of your best-selling items. For this setup, the next helpful items are: ${firstAsk}. Natural light and close-up angles usually work best. Nothing goes live without Veroxa team review.`;
}
