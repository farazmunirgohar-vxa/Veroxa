import type { OnboardingChecklistItem, OnboardingReadiness, OnboardingPackageId, RestaurantOnboardingProfile } from "./types";

const hasText = (value: string) => value.trim().length > 0;
const needsTikTok = (_packageId: OnboardingPackageId) => false;

function platformItem(id: string, label: string, description: string, value: string, requiredFor: OnboardingPackageId[], packageId: OnboardingPackageId): OnboardingChecklistItem {
  const required = requiredFor.includes(packageId);
  const complete = hasText(value);
  const status = complete ? "complete" : required ? "needed" : "optional";
  return { id, label, description, status: status as OnboardingChecklistItem["status"], clientLabel: complete ? "Complete" : required ? "Needs your input" : "Optional", teamLabel: complete ? "Ready for review" : required ? "Missing platform link" : "Not needed for this package", requiredFor, value };
}

export function getPlatformProfileChecklist(profile: RestaurantOnboardingProfile): OnboardingChecklistItem[] {
  const p = profile.packageId;
  return [
    platformItem("googleBusinessProfileUrl", "Google Business Profile", "Core profile link for Google visibility review.", profile.googleBusinessProfileUrl, ["complete_online_presence"], p),
    platformItem("googleMapsUrl", "Google Maps", "Maps listing link for local visibility review.", profile.googleMapsUrl, ["complete_online_presence"], p),
    platformItem("websiteUrl", "Website", "Website link if the restaurant has one.", profile.websiteUrl, ["complete_online_presence"], p),
    platformItem("menuUrl", "Menu link", "Public menu link Veroxa can reference after review.", profile.menuUrl, ["complete_online_presence"], p),
    platformItem("orderingUrl", "Order link", "Ordering path if available.", profile.orderingUrl, ["complete_online_presence"], p),
    platformItem("reservationUrl", "Reservation link", "Reservation path if the restaurant uses one.", profile.reservationUrl, [], p),
    platformItem("cateringUrl", "Catering link", "Catering or large-order path if available.", profile.cateringUrl, [], p),
    platformItem("facebookUrl", "Facebook", "Facebook page for Complete Online Presence.", profile.facebookUrl, ["complete_online_presence"], p),
    platformItem("instagramUrl", "Instagram", "Instagram profile for media and content review.", profile.instagramUrl, ["complete_online_presence"], p),
    platformItem("tiktokUrl", "TikTok", "TikTok is coming soon and not required for the launch offer.", profile.tiktokUrl, [], p),
    ({ id: "adsComingSoon", label: "Ads", description: "Ads management is coming soon and not part of launch onboarding.", status: "not_needed" as const, clientLabel: "Not needed right now", teamLabel: "Not needed for this package", requiredFor: [], value: "Coming soon" } satisfies OnboardingChecklistItem),
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

export function getLaunchAccessChecklist(profile: RestaurantOnboardingProfile) {
  return [
    { id: "google_business_profile", label: "Google Business Profile access/link", status: profile.googleBusinessProfileUrl || profile.googleMapsUrl ? "Ready for Veroxa review" : "Waiting on access", launchService: true },
    { id: "website", label: "Website access/link", status: profile.websiteUrl ? "Ready for Veroxa review" : "Waiting on access", launchService: true },
    { id: "facebook", label: "Facebook access/link", status: profile.facebookUrl ? "Ready for Veroxa review" : "Waiting on access", launchService: true, addOnIfMissing: "Missing Facebook profile creation +$45/profile" },
    { id: "instagram", label: "Instagram access/link", status: profile.instagramUrl ? "Ready for Veroxa review" : "Waiting on access", launchService: true, addOnIfMissing: "Missing Instagram profile creation +$45/profile" },
    { id: "yelp", label: "Yelp", status: "Coming soon", launchService: false },
    { id: "tiktok", label: "TikTok", status: "Coming soon", launchService: false },
    { id: "ads", label: "Ads", status: "Coming soon", launchService: false },
  ] as const;
}
