import type { RestaurantOnboardingProfile } from "./types";
import { getBusinessInfoReadiness } from "./businessInfoChecklist";
import { getPlatformReadiness } from "./platformProfileChecklist";
import { getNextMediaNeeded } from "./mediaIntakeGuidance";
import { getBusinessTruthItemsToConfirm } from "./businessTruthConfirmation";
import { getFirstWeekBlockers } from "./firstWeekSetupEngine";
import { getOnboardingProgress, getOnboardingStatus, getOnboardingStatusLabel } from "./onboardingStatusEngine";

export function buildOnboardingReadinessSnapshot(profile: RestaurantOnboardingProfile) {
  const mediaMissing = getNextMediaNeeded(profile);
  const truthMissing = getBusinessTruthItemsToConfirm(profile);
  const firstWeekBlockers = getFirstWeekBlockers(profile);
  return {
    status: getOnboardingStatus(profile),
    statusLabel: getOnboardingStatusLabel(getOnboardingStatus(profile)),
    progress: getOnboardingProgress(profile),
    businessInfo: getBusinessInfoReadiness(profile),
    platforms: getPlatformReadiness(profile),
    media: { level: mediaMissing.length === 0 ? "ready" : "partial", missing: mediaMissing },
    businessTruth: { level: truthMissing.length === 0 ? "ready" : "partial", missing: truthMissing },
    firstWeek: { level: firstWeekBlockers.length === 0 ? "ready" : "partial", blockers: firstWeekBlockers },
  };
}

export function getLaunchOnboardingReadinessDetails(profile: RestaurantOnboardingProfile) {
  const truthMissing = getBusinessTruthItemsToConfirm(profile);
  const mediaMissing = getNextMediaNeeded(profile);
  const platform = getPlatformReadiness(profile);
  return {
    businessInfoComplete: getBusinessInfoReadiness(profile).level === "ready",
    googleMapsLinkAccessReady: Boolean(profile.googleBusinessProfileUrl || profile.googleMapsUrl),
    websiteLinkAccessReady: Boolean(profile.websiteUrl),
    facebookLinkAccessReady: Boolean(profile.facebookUrl),
    instagramLinkAccessReady: Boolean(profile.instagramUrl),
    mediaSupplyReady: mediaMissing.length === 0,
    bestSellersProvided: profile.bestSellers.length > 0,
    businessTruthConfirmationsReady: truthMissing.length === 0,
    onboardingAcknowledgementReviewed: profile.readySignals.some((signal) => /acknowledg/i.test(signal)),
    addOnsNeeded: [!profile.websiteUrl ? "Review whether new basic website add-on is needed" : "", !profile.facebookUrl ? "Review whether missing Facebook profile add-on is needed" : "", !profile.instagramUrl ? "Review whether missing Instagram profile add-on is needed" : ""].filter(Boolean),
    firstWeeklyUpdateReady: mediaMissing.length === 0 && truthMissing.length === 0,
    firstMonthlyReportBaselineReady: platform.level !== "not_ready" && truthMissing.length === 0,
    nextAction: getLaunchOnboardingNextAction(profile),
  };
}

export function getLaunchOnboardingNextAction(profile: RestaurantOnboardingProfile): string {
  const truthMissing = getBusinessTruthItemsToConfirm(profile);
  if (getNextMediaNeeded(profile).length > 0) return "Provide media";
  if (truthMissing.length > 0) return "Confirm hours/menu/prices";
  if (!profile.websiteUrl) return "Provide website access";
  if (!profile.googleBusinessProfileUrl && !profile.googleMapsUrl) return "Provide Google profile link/access";
  if (!profile.facebookUrl || !profile.instagramUrl) return "Provide Facebook/Instagram access";
  if (!profile.readySignals.some((signal) => /acknowledg/i.test(signal))) return "Review expectations";
  if (!profile.websiteUrl || !profile.facebookUrl || !profile.instagramUrl) return "Review add-on need";
  return "Wait for Veroxa review";
}
