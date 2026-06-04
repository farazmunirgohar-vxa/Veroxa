import type { OnboardingStatus, RestaurantOnboardingProfile, TeamOnboardingQueueGroup, TeamOnboardingQueueSummary } from "./types";
import { getOnboardingStatus } from "./onboardingStatusEngine";

const queueLabels: Record<string, string> = {
  client_info_needed: "Needs business info",
  media_needed: "Needs media",
  platform_links_needed: "Needs platform links",
  business_truth_needed: "Needs business-truth confirmation",
  first_week_setup_needed: "Needs first-week setup",
  team_review_needed: "Needs first-week setup",
  ready_for_manual_service: "Ready for manual service",
  blocked: "Blocked / paused",
  paused: "Blocked / paused",
  not_started: "Needs business info",
};

export function getTeamOnboardingPriority(profile: RestaurantOnboardingProfile): number {
  const status = getOnboardingStatus(profile);
  const base: Record<OnboardingStatus, number> = { blocked: 95, media_needed: 85, business_truth_needed: 80, platform_links_needed: 75, client_info_needed: 70, first_week_setup_needed: 60, team_review_needed: 55, not_started: 50, paused: 25, ready_for_manual_service: 10 };
  return base[status] + profile.blockers.length * 5 + profile.warnings.length * 2;
}

export function getTeamNextOnboardingAction(profile: RestaurantOnboardingProfile): string {
  return profile.nextTeamAction;
}

export function getOnboardingRiskTone(profile: RestaurantOnboardingProfile): "calm" | "watch" | "blocked" {
  if (profile.blockers.length > 0 || getOnboardingStatus(profile) === "blocked") return "blocked";
  if (profile.warnings.length > 0 || getTeamOnboardingPriority(profile) >= 75) return "watch";
  return "calm";
}

export function groupOnboardingProfilesByStatus(profiles: RestaurantOnboardingProfile[]): TeamOnboardingQueueGroup[] {
  const order = ["client_info_needed", "media_needed", "platform_links_needed", "business_truth_needed", "first_week_setup_needed", "ready_for_manual_service", "blocked"];
  const groups = new Map<string, RestaurantOnboardingProfile[]>();
  profiles.forEach((profile) => {
    const status = getOnboardingStatus(profile);
    const key = status === "paused" ? "blocked" : status === "team_review_needed" ? "first_week_setup_needed" : status;
    groups.set(key, [...(groups.get(key) ?? []), profile]);
  });
  return order.map((id) => ({ id, label: queueLabels[id], profiles: (groups.get(id) ?? []).sort((a, b) => getTeamOnboardingPriority(b) - getTeamOnboardingPriority(a)) })).filter((group) => group.profiles.length > 0);
}

export function buildTeamOnboardingQueue(profiles: RestaurantOnboardingProfile[]): TeamOnboardingQueueGroup[] {
  return groupOnboardingProfilesByStatus(profiles);
}

export function getOnboardingQueueSummary(profiles: RestaurantOnboardingProfile[]): TeamOnboardingQueueSummary {
  return profiles.reduce<TeamOnboardingQueueSummary>((summary, profile) => {
    const status = getOnboardingStatus(profile);
    summary.total += 1;
    if (status === "client_info_needed") summary.needsBusinessInfo += 1;
    if (status === "media_needed") summary.needsMedia += 1;
    if (status === "platform_links_needed") summary.needsPlatformLinks += 1;
    if (status === "business_truth_needed") summary.needsConfirmation += 1;
    if (status === "first_week_setup_needed" || status === "team_review_needed") summary.needsFirstWeekSetup += 1;
    if (status === "ready_for_manual_service") summary.readyForManualService += 1;
    if (status === "blocked" || status === "paused") summary.blockedOrPaused += 1;
    return summary;
  }, { total: 0, needsBusinessInfo: 0, needsMedia: 0, needsPlatformLinks: 0, needsConfirmation: 0, needsFirstWeekSetup: 0, readyForManualService: 0, blockedOrPaused: 0 });
}
