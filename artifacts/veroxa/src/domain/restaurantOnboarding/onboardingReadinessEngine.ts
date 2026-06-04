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
