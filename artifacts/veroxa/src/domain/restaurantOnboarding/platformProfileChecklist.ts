import type { OnboardingChecklistItem, OnboardingReadiness, OnboardingPackageId, RestaurantOnboardingProfile } from "./types";

const hasText = (value: string) => value.trim().length > 0;
const needsTikTok = (packageId: OnboardingPackageId) => packageId === "growth" || packageId === "premium";

function platformItem(id: string, label: string, description: string, value: string, requiredFor: OnboardingPackageId[], packageId: OnboardingPackageId): OnboardingChecklistItem {
  const required = requiredFor.includes(packageId);
  const complete = hasText(value);
  const status = complete ? "complete" : required ? "needed" : "optional";
  return { id, label, description, status: status as OnboardingChecklistItem["status"], clientLabel: complete ? "Complete" : required ? "Needs your input" : "Optional", teamLabel: complete ? "Ready for review" : required ? "Missing platform link" : "Not needed for this package", requiredFor, value };
}

export function getPlatformProfileChecklist(profile: RestaurantOnboardingProfile): OnboardingChecklistItem[] {
  const p = profile.packageId;
  return [
    platformItem("googleBusinessProfileUrl", "Google Business Profile", "Core profile link for Google visibility review.", profile.googleBusinessProfileUrl, ["starter", "growth", "premium"], p),
    platformItem("googleMapsUrl", "Google Maps", "Maps listing link for local visibility review.", profile.googleMapsUrl, ["starter", "growth", "premium"], p),
    platformItem("websiteUrl", "Website", "Website link if the restaurant has one.", profile.websiteUrl, ["starter", "growth", "premium"], p),
    platformItem("menuUrl", "Menu link", "Public menu link Veroxa can reference after review.", profile.menuUrl, ["starter", "growth", "premium"], p),
    platformItem("orderingUrl", "Order link", "Ordering path if available.", profile.orderingUrl, ["starter", "growth", "premium"], p),
    platformItem("reservationUrl", "Reservation link", "Reservation path if the restaurant uses one.", profile.reservationUrl, [], p),
    platformItem("cateringUrl", "Catering link", "Catering or large-order path if available.", profile.cateringUrl, [], p),
    platformItem("facebookUrl", "Facebook", "Facebook page for Complete Online Presence.", profile.facebookUrl, ["starter", "growth", "premium"], p),
    platformItem("instagramUrl", "Instagram", "Instagram profile for media and content review.", profile.instagramUrl, ["starter", "growth", "premium"], p),
    platformItem("tiktokUrl", "TikTok", "TikTok is coming soon and not required for the launch offer.", profile.tiktokUrl, ["growth", "premium"], p),
    ({ id: "premiumAdsReadiness", label: "Premium ads readiness", description: "Ads are coming soon; no ad systems are connected.", status: p === "premium" ? "review" as const : "not_needed" as const, clientLabel: p === "premium" ? "Veroxa team review" : "Not needed right now", teamLabel: p === "premium" ? "Needs verification" : "Not needed for this package", requiredFor: ["premium" as const], value: p === "premium" ? "Readiness assessment required" : "" } satisfies OnboardingChecklistItem),
  ].filter((check) => check.id !== "tiktokUrl" || needsTikTok(p) || hasText(profile.tiktokUrl));
}

export function getMissingPlatformLinks(profile: RestaurantOnboardingProfile): string[] {
  return getPlatformProfileChecklist(profile).filter((check) => check.status === "needed").map((check) => check.label);
}

export function getPlatformReadiness(profile: RestaurantOnboardingProfile): OnboardingReadiness {
  const checklist = getPlatformProfileChecklist(profile);
  const required = checklist.filter((check) => check.status !== "optional" && check.status !== "not_needed");
  const missing = getMissingPlatformLinks(profile);
  const completed = required.filter((check) => check.status === "complete" || check.status === "review").length;
  return { level: missing.length === 0 ? "ready" : completed > 0 ? "partial" : "not_ready", completed, totalRequired: required.length, missing, nextAction: getPlatformNextAction(profile) };
}

export function getPlatformNextAction(profile: RestaurantOnboardingProfile): string {
  const missing = getMissingPlatformLinks(profile);
  if (missing.length === 0) return "Platform links are ready for Veroxa team review.";
  return `Confirm available platform links: ${missing.slice(0, 4).join(", ")}${missing.length > 4 ? ", and remaining links" : ""}.`;
}
