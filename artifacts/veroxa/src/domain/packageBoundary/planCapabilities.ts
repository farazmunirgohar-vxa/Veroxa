import type { ClientRequestType, PlanId } from "./types";

export const launchPlanId: PlanId = "complete_online_presence";
export const planOrder: PlanId[] = ["complete_online_presence"];
export const historicalPlanAliases: PlanId[] = ["starter", "growth", "premium"];

export const completeOnlinePresenceIncluded: ClientRequestType[] = [
  "google_profile_update",
  "maps_visibility_update",
  "yelp_profile_alignment",
  "website_alignment",
  "seo_search_visibility_basics",
  "facebook_picture_post",
  "instagram_picture_post",
  "picture_caption",
  "media_guidance",
  "monthly_report",
  "monthly_report_request",
  "portal_request_review",
  "up_to_3_posts_per_week_media_dependent",
  "business_info_correction",
  "link_menu_contact_update",
];

export const comingSoonNotIncludedTypes: ClientRequestType[] = [
  "tiktok_request",
  "reels_request",
  "video_content_request",
  "ad_management_request",
  "ad_planning_request",
  "daily_posting_request",
  "premium_daily_posting_request",
  "advanced_campaign_request",
];

export const customerServiceBlockedTypes: ClientRequestType[] = [
  "customer_service_request",
  "dm_or_comment_reply_request",
  "refund_or_complaint_request",
  "order_question_request",
];
export const websiteBlockedTypes: ClientRequestType[] = [
  "full_website_redesign",
  "custom_website_build",
  "technical_hosting_or_domain_support",
];
export const offerConfirmationTypes: ClientRequestType[] = ["offer_or_discount_request"];

export function normalizePlan(plan: PlanId): PlanId {
  return plan === "starter" || plan === "growth" || plan === "premium" ? launchPlanId : plan;
}

export function getIncludedRequestTypes(plan: PlanId): ClientRequestType[] {
  return normalizePlan(plan) === launchPlanId ? completeOnlinePresenceIncluded : completeOnlinePresenceIncluded;
}
export function getRequiredPlan(type: ClientRequestType): PlanId | undefined {
  if (completeOnlinePresenceIncluded.includes(type)) return launchPlanId;
  return undefined;
}
export function isRequestIncludedInPlan(plan: PlanId, type: ClientRequestType): boolean {
  return getIncludedRequestTypes(plan).includes(type);
}
