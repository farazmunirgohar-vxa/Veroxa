import type { ClientRequestType, PlanId } from "./types";
export const planOrder: PlanId[] = ["starter", "growth", "premium"];
export const starterIncluded: ClientRequestType[] = [
  "google_profile_update",
  "maps_visibility_update",
  "facebook_picture_post",
  "instagram_picture_post",
  "picture_caption",
  "media_guidance",
  "simple_monthly_summary",
];
export const growthIncluded: ClientRequestType[] = [
  ...starterIncluded,
  "reels_request",
  "tiktok_request",
  "better_support_request",
  "weekly_update_request",
  "monthly_report_request",
];
export const premiumIncluded: ClientRequestType[] = [
  ...growthIncluded,
  "ad_management_request",
  "ad_planning_request",
  "premium_daily_posting_request",
  "advanced_campaign_request",
];
export const customerServiceBlockedTypes: ClientRequestType[] = [
  "customer_service_request",
  "dm_or_comment_reply_request",
];
export const offerConfirmationTypes: ClientRequestType[] = [
  "offer_or_discount_request",
];
export function getIncludedRequestTypes(plan: PlanId): ClientRequestType[] {
  if (plan === "premium") return premiumIncluded;
  if (plan === "growth") return growthIncluded;
  return starterIncluded;
}
export function getRequiredPlan(type: ClientRequestType): PlanId | undefined {
  if (starterIncluded.includes(type)) return "starter";
  if (growthIncluded.includes(type)) return "growth";
  if (premiumIncluded.includes(type)) return "premium";
  return undefined;
}
export function isRequestIncludedInPlan(
  plan: PlanId,
  type: ClientRequestType,
): boolean {
  return getIncludedRequestTypes(plan).includes(type);
}
