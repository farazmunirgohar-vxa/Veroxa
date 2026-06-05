import type { OnboardingChecklistItem, RestaurantOnboardingProfile } from "./types";
import { getMissingBusinessInfo } from "./businessInfoChecklist";
import { getMissingPlatformLinks } from "./platformProfileChecklist";
import { getNextMediaNeeded } from "./mediaIntakeGuidance";
import { getBusinessTruthItemsToConfirm } from "./businessTruthConfirmation";

export function getFirstWeekSetupChecklist(profile: RestaurantOnboardingProfile): OnboardingChecklistItem[] {
  const missingBusiness = getMissingBusinessInfo(profile).length;
  const missingPlatforms = getMissingPlatformLinks(profile).length;
  const missingMedia = getNextMediaNeeded(profile).length;
  const missingTruth = getBusinessTruthItemsToConfirm(profile).length;
  const checks = [
    ["verifyBusinessInfo", "Verify business info", "Review restaurant basics before first setup work.", missingBusiness === 0],
    ["reviewGoogleMaps", "Review Google/Maps presence", "Review local visibility readiness from provided links.", !getMissingPlatformLinks(profile).includes("Google Business Profile") && !getMissingPlatformLinks(profile).includes("Google Maps")],
    ["collectMedia", "Collect first usable media batch", "Request current photos before first picture-based content.", missingMedia === 0],
    ["identifyBestSellers", "Identify best sellers", "Use confirmed best sellers to guide first setup.", profile.bestSellers.length > 0],
    ["pictureContent", "Prepare first picture-based content", "Draft only; no publishing or scheduling.", missingMedia === 0 && missingTruth === 0],
    ["clientUpdate", "Prepare client-safe first update", "Explain setup status without internal language.", missingBusiness === 0],
    ["manualPlan", "Prepare Team manual execution plan", "Queue first-week actions for manual work only.", missingBusiness === 0 && missingPlatforms <= 2],
    ["confirmTruth", "Confirm business details before public claims", "Hold public-facing claims until details are confirmed.", missingTruth === 0],
  ] as const;
  return checks.map(([id, label, description, complete]) => ({ id, label, description, status: complete ? "complete" : "review", clientLabel: complete ? "Complete" : "Veroxa team review", teamLabel: complete ? "Use in first-week setup" : "Needs verification", requiredFor: ["complete_online_presence"] }));
}

export function getFirstWeekSetupStatus(profile: RestaurantOnboardingProfile): string {
  const blockers = getFirstWeekBlockers(profile);
  if (blockers.length === 0) return "Ready for first-week manual service setup.";
  return `First-week setup needs attention: ${blockers.slice(0, 3).join(", ")}.`;
}

export function getFirstWeekTeamTasks(profile: RestaurantOnboardingProfile): string[] {
  const tasks = ["Verify business info", "Review Google/Maps presence", "Identify best sellers to highlight", "Prepare client-safe first update", "Prepare Team manual execution plan", "Confirm business details before public claims"];
  return tasks;
}

export function getFirstWeekClientTasks(profile: RestaurantOnboardingProfile): string[] {
  return [profile.nextClientAction, ...getNextMediaNeeded(profile).slice(0, 3).map((item) => `Send or confirm: ${item}`), ...getBusinessTruthItemsToConfirm(profile).slice(0, 3).map((item) => `Confirm: ${item}`)];
}

export function getFirstWeekReadySignals(profile: RestaurantOnboardingProfile): string[] {
  return profile.readySignals;
}

export function getFirstWeekBlockers(profile: RestaurantOnboardingProfile): string[] {
  return [...profile.blockers, ...getMissingBusinessInfo(profile).map((item) => `Missing ${item}`), ...getNextMediaNeeded(profile).slice(0, 2).map((item) => `Needs ${item}`)];
}
