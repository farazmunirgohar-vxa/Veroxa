import type { RestaurantOnboardingProfile } from "./types";
import { getBusinessInfoNextAction } from "./businessInfoChecklist";
import { getPlatformNextAction } from "./platformProfileChecklist";
import { getMediaRequestDraft } from "./mediaIntakeGuidance";
import { buildClientBusinessTruthRequest } from "./businessTruthConfirmation";

export function buildWelcomeMessageDraft(profile: RestaurantOnboardingProfile): string {
  return `Welcome to Veroxa. We will organize the online presence setup for ${profile.restaurantName}: Google and Maps review, platform links, media direction, first content preparation, and simple progress updates. Please provide the setup details we ask for, and Veroxa will review everything calmly before anything goes live.`;
}

export function buildMediaRequestDraft(profile: RestaurantOnboardingProfile): string {
  return getMediaRequestDraft(profile);
}

export function buildMissingInfoRequestDraft(profile: RestaurantOnboardingProfile): string {
  return `${getBusinessInfoNextAction(profile)} ${getPlatformNextAction(profile)} Veroxa uses this to organize your online presence correctly.`;
}

export function buildBusinessTruthConfirmationDraft(profile: RestaurantOnboardingProfile): string {
  return buildClientBusinessTruthRequest(profile);
}

export function buildFirstWeekExpectationDraft(profile: RestaurantOnboardingProfile): string {
  return `In the first week, Veroxa will review your setup details, organize the media you provide, review Google/Maps and profile links, prepare the first manual work plan, and share simple updates. Media quality matters, and business details may need your confirmation before Veroxa prepares anything public. Nothing goes live without Veroxa team review.`;
}
