import type { OnboardingStatus, RestaurantOnboardingProfile } from "./types";
import { getMissingBusinessInfo } from "./businessInfoChecklist";
import { getMissingPlatformLinks } from "./platformProfileChecklist";
import { getNextMediaNeeded } from "./mediaIntakeGuidance";
import { getBusinessTruthItemsToConfirm } from "./businessTruthConfirmation";
import { getFirstWeekBlockers } from "./firstWeekSetupEngine";

export function getOnboardingStatus(profile: RestaurantOnboardingProfile): OnboardingStatus {
  if (profile.overallStatus === "paused" || profile.overallStatus === "blocked") return profile.overallStatus;
  if (getMissingBusinessInfo(profile).length > 0) return "client_info_needed";
  if (getNextMediaNeeded(profile).length > 0) return "media_needed";
  if (getMissingPlatformLinks(profile).length > 0) return "platform_links_needed";
  if (getBusinessTruthItemsToConfirm(profile).length > 0) return "business_truth_needed";
  if (getFirstWeekBlockers(profile).length > 0) return "first_week_setup_needed";
  return "ready_for_manual_service";
}

export function getOnboardingStatusLabel(status: OnboardingStatus): string {
  const labels: Record<OnboardingStatus, string> = {
    not_started: "Not started",
    client_info_needed: "Needs client info",
    media_needed: "Needs media",
    platform_links_needed: "Needs platform links",
    business_truth_needed: "Needs details confirmed",
    team_review_needed: "Ready for Veroxa team review",
    first_week_setup_needed: "First-week setup needed",
    ready_for_manual_service: "Ready for manual service",
    blocked: "Blocked",
    paused: "Paused",
  };
  return labels[status];
}

export function getClientOnboardingStatusLabel(profile: RestaurantOnboardingProfile): string {
  const status = getOnboardingStatus(profile);
  if (["client_info_needed", "media_needed", "platform_links_needed", "business_truth_needed"].includes(status)) return "Needs your input";
  if (status === "ready_for_manual_service") return "Ready for manual service";
  if (status === "blocked" || status === "paused") return "In setup";
  return "Ready for Veroxa team review";
}

export function getOnboardingProgress(profile: RestaurantOnboardingProfile): number {
  const sections = [
    getMissingBusinessInfo(profile).length === 0,
    getMissingPlatformLinks(profile).length === 0,
    getNextMediaNeeded(profile).length === 0,
    getBusinessTruthItemsToConfirm(profile).length === 0,
    getFirstWeekBlockers(profile).length === 0,
  ];
  return Math.round((sections.filter(Boolean).length / sections.length) * 100);
}
