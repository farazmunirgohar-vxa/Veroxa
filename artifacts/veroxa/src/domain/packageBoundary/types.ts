export type PlanId = "complete_online_presence" | "starter" | "growth" | "premium";
export type ClientRequestType =
  | "google_profile_update"
  | "maps_visibility_update"
  | "seo_search_visibility_basics"
  | "website_alignment"
  | "facebook_picture_post"
  | "instagram_picture_post"
  | "picture_caption"
  | "media_guidance"
  | "weekly_update"
  | "monthly_report"
  | "monthly_report_request"
  | "portal_request_review"
  | "up_to_3_posts_per_week_media_dependent"
  | "business_info_correction"
  | "link_menu_contact_update"
  | "new_basic_website_request"
  | "missing_social_profile_creation"
  | "yelp_profile_alignment"
  | "tiktok_request"
  | "reels_request"
  | "video_content_request"
  | "ad_management_request"
  | "ad_planning_request"
  | "daily_posting_request"
  | "premium_daily_posting_request"
  | "advanced_campaign_request"
  | "customer_service_request"
  | "dm_or_comment_reply_request"
  | "refund_or_complaint_request"
  | "order_question_request"
  | "offer_or_discount_request"
  | "full_website_redesign"
  | "custom_website_build"
  | "technical_hosting_or_domain_support"
  | "unknown_request";
export type RequestEligibilityStatus =
  | "included"
  | "add_on_available"
  | "coming_soon_not_included"
  | "needs_confirmation"
  | "not_supported_at_launch"
  | "needs_team_review"
  | "unclear";
export interface PackageBoundaryDecision {
  requestId: string;
  clientId: string;
  currentPlan: PlanId;
  requestType: ClientRequestType;
  eligibilityStatus: RequestEligibilityStatus;
  includedInPlan: boolean;
  requiredPlan?: PlanId;
  clientSafeMessage: string;
  teamReason: string;
  nextAction: string;
  addOnPrice?: number;
  addOnDisplayPrice?: string;
  upgradePath?: string;
  blockedReason?: string;
  createdAt: string;
}
export interface PackageBoundaryRequestInput {
  requestId: string;
  clientId: string;
  currentPlan: PlanId;
  title: string;
  message: string;
  createdAt?: string;
}
