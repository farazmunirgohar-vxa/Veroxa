export type PlanId = "starter" | "growth" | "premium";
export type ClientRequestType =
  | "google_profile_update"
  | "maps_visibility_update"
  | "facebook_picture_post"
  | "instagram_picture_post"
  | "picture_caption"
  | "media_guidance"
  | "simple_monthly_summary"
  | "reels_request"
  | "tiktok_request"
  | "better_support_request"
  | "weekly_update_request"
  | "monthly_report_request"
  | "ad_management_request"
  | "ad_planning_request"
  | "premium_daily_posting_request"
  | "advanced_campaign_request"
  | "customer_service_request"
  | "dm_or_comment_reply_request"
  | "offer_or_discount_request"
  | "unknown_request";
export type RequestEligibilityStatus =
  | "included"
  | "needs_upgrade"
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
