// SaaS Phase 1 domain contracts only.
// These types describe future persistence records; they do not create tables,
// connect auth, write storage, or enable production integrations.

export type RestaurantId = string;
export type UserId = string;
export type MembershipId = string;
export type MediaAssetId = string;
export type ClientRequestId = string;
export type PreparedActionId = string;
export type ApprovalDecisionId = string;
export type ManualExecutionEventId = string;
export type ReportId = string;
export type ActivityLogId = string;
export type OpportunityScoreId = string;
export type VisibilityFindingId = string;

export type SaasDataMode =
  | "placeholder_review"
  | "demo"
  | "authenticated_client"
  | "authenticated_team"
  | "future_live_integration";

export type RestaurantStatus =
  | "demo"
  | "prospect"
  | "onboarding"
  | "active"
  | "paused"
  | "canceled"
  | "inactive"
  | "archived";

export interface RestaurantAccount {
  id: RestaurantId;
  name: string;
  slug: string;
  legalName?: string;
  primaryLocationName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  timezone: string;
  phone?: string;
  websiteUrl?: string;
  googleBusinessProfileUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  menuUrl?: string;
  orderingUrl?: string;
  cuisineType?: string;
  status: RestaurantStatus;
  dataMode: SaasDataMode;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantProfile {
  restaurantId: RestaurantId;
  bestSellers: string[];
  customerTypes: string[];
  busyDays: string[];
  busyTimes: string[];
  preferredPostingDays: string[];
  preferredPostingTimes: string[];
  brandVoiceNotes?: string;
  mediaGuidanceNotes?: string;
  offersNotes?: string;
  cateringNotes?: string;
  businessTruthNotes?: string;
  clientConfirmedAt?: string;
  updatedAt: string;
}

export type SaasUserRole = "client_admin" | "client_member" | "team_member";
export type MembershipStatus = "invited" | "active" | "disabled" | "removed";

export interface SaasUser {
  id: UserId;
  email: string;
  fullName: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantMembership {
  id: MembershipId;
  userId: UserId;
  restaurantId: RestaurantId;
  role: SaasUserRole;
  status: MembershipStatus;
  invitedAt?: string;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type AccountPlanStatus =
  | "demo"
  | "prospect"
  | "trial"
  | "onboarding"
  | "active"
  | "past_due"
  | "paused"
  | "canceled"
  | "inactive";

export interface AccountPlanState {
  restaurantId: RestaurantId;
  currentPlanId: "complete_online_presence" | "starter" | "growth" | "premium";
  planStatus: AccountPlanStatus;
  billingMode: "manual" | "future_stripe" | "future_external";
  monthlyPriceCents: number;
  foundingDiscountEligible: boolean;
  foundingDiscountActive: boolean;
  foundingDiscountStartedAt?: string;
  foundingDiscountLostAt?: string;
  premiumReadinessStatus:
    | "not_eligible"
    | "eligible_for_review"
    | "assessment_needed"
    | "approved"
    | "not_approved"
    | "active";
  adBudgetConfirmed: boolean;
  adBudgetAmountCents?: number;
  createdAt: string;
  updatedAt: string;
}

export type MediaAssetStatus =
  | "client_submitted"
  | "team_review_needed"
  | "usable"
  | "needs_better_media"
  | "prepared_for_post"
  | "scheduled_for_manual_use"
  | "manually_used"
  | "archived";

export type MediaAssetSource =
  | "client_upload_placeholder"
  | "team_added_placeholder"
  | "demo_fixture"
  | "future_storage";

export interface MediaAsset {
  id: MediaAssetId;
  restaurantId: RestaurantId;
  dataMode: SaasDataMode;
  source: MediaAssetSource;
  originalFileName?: string;
  displayName: string;
  mediaType: "image" | "video" | "mixed" | "unknown";
  storagePath?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  clientNote?: string;
  clientDirection?: string;
  teamReviewNote?: string;
  bestUse?: string;
  status: MediaAssetStatus;
  submittedByUserId?: UserId;
  reviewedByUserId?: UserId;
  submittedAt?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ClientRequestType =
  | "media_direction"
  | "content_request"
  | "hours_update"
  | "menu_update"
  | "offer_update"
  | "report_question"
  | "general_question";

export type ClientRequestStatus =
  | "new"
  | "needs_team_review"
  | "needs_client_confirmation"
  | "in_review"
  | "resolved"
  | "held";

export interface ClientRequest {
  id: ClientRequestId;
  restaurantId: RestaurantId;
  dataMode: SaasDataMode;
  createdByUserId?: UserId;
  requestType: ClientRequestType;
  relatedMediaAssetId?: MediaAssetId;
  message: string;
  preferredTiming?: string;
  status: ClientRequestStatus;
  clientVisibleStatus: string;
  teamNextAction?: string;
  requiresClientConfirmation: boolean;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export type PreparedActionSourceType =
  | "visibility_finding"
  | "client_request"
  | "media_review"
  | "report_follow_up"
  | "team_manual";
export type PreparedActionChannel =
  | "google_maps"
  | "google_update"
  | "instagram"
  | "facebook"
  | "website"
  | "report"
  | "client_message"
  | "internal";
export type PreparedActionRiskLevel = "low" | "medium" | "sensitive";
export type PreparedActionStatus =
  | "prepared"
  | "needs_approval"
  | "approved_for_manual_execution"
  | "needs_client_confirmation"
  | "queued_for_later"
  | "held"
  | "skipped";

export interface PreparedActionRecord {
  id: PreparedActionId;
  restaurantId: RestaurantId;
  dataMode: SaasDataMode;
  sourceType: PreparedActionSourceType;
  sourceId?: string;
  actionType: string;
  channel: PreparedActionChannel;
  title: string;
  preparedCopy?: string;
  mediaAssetId?: MediaAssetId;
  riskLevel: PreparedActionRiskLevel;
  requiresClientConfirmation: boolean;
  status: PreparedActionStatus;
  createdAt: string;
  updatedAt: string;
}

export type ApprovalDecision =
  | "approved_for_manual_execution"
  | "edit_needed"
  | "ask_client"
  | "hold"
  | "skip";

export interface ApprovalDecisionRecord {
  id: ApprovalDecisionId;
  preparedActionId: PreparedActionId;
  restaurantId: RestaurantId;
  dataMode: SaasDataMode;
  reviewedByUserId?: UserId;
  decision: ApprovalDecision;
  decisionNote?: string;
  createdAt: string;
}

export type ManualExecutionStatus =
  | "prepared"
  | "needs_approval"
  | "approved_for_manual_execution"
  | "manually_completed"
  | "included_in_report"
  | "held"
  | "skipped"
  | "failed"
  | "needs_client_confirmation";

export interface ManualExecutionEventRecord {
  id: ManualExecutionEventId;
  preparedActionId: PreparedActionId;
  restaurantId: RestaurantId;
  dataMode: SaasDataMode;
  executedByUserId?: UserId;
  executionChannel: PreparedActionChannel;
  status: ManualExecutionStatus;
  manualNote?: string;
  executedAt?: string;
  includedInReportAt?: string;
  createdAt: string;
}

export type ReportType = "weekly" | "monthly" | "custom";
export type ReportStatus =
  | "draft_needed"
  | "ready_for_review"
  | "missing_data"
  | "reviewed"
  | "published_to_client"
  | "held";

export interface ReportRecord {
  id: ReportId;
  restaurantId: RestaurantId;
  dataMode: SaasDataMode;
  reportType: ReportType;
  periodStart: string;
  periodEnd: string;
  status: ReportStatus;
  summary?: string;
  workCompleted: string[];
  mediaUsed: MediaAssetId[];
  visibilityNotes: string[];
  clientNeeds: string[];
  honestLimitations: string[];
  publishedToClientAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisibilityFindingRecord {
  id: VisibilityFindingId;
  restaurantId: RestaurantId;
  dataMode: SaasDataMode;
  findingType: string;
  title: string;
  whyItMatters: string;
  customerOpportunityImpact: string;
  preparedActionId?: PreparedActionId;
  riskLevel: PreparedActionRiskLevel;
  requiresClientConfirmation: boolean;
  status: "open" | "prepared" | "in_review" | "resolved" | "held";
  createdAt: string;
  updatedAt: string;
}

export interface OpportunityScoreRecord {
  id: OpportunityScoreId;
  restaurantId: RestaurantId;
  dataMode: SaasDataMode;
  score: number;
  status: "draft" | "reviewed" | "stale";
  findability: number;
  trust: number;
  choice: number;
  mediaFreshness: number;
  bestSellerVisibility: number;
  googleLocalReadiness: number;
  reviewReputationSupport: number;
  contentConsistency: number;
  clientCooperation: number;
  blockers: string[];
  mainOpportunity: string;
  mainBlocker?: string;
  suggestedNextAction: string;
  confidenceLevel: "low" | "medium" | "high";
  createdAt: string;
}

export type ActivityLogEntityType =
  | "restaurant"
  | "restaurant_profile"
  | "media_asset"
  | "client_request"
  | "prepared_action"
  | "approval_decision"
  | "manual_execution_event"
  | "report"
  | "visibility_finding"
  | "opportunity_score"
  | "profit_validation_snapshot";

export type ActivityLogAction =
  | "created"
  | "updated"
  | "reviewed"
  | "approved"
  | "held"
  | "skipped"
  | "queued_for_later"
  | "manual_execution_recorded"
  | "snapshot_previewed";

export type ActivityLogVisibility = "team_internal" | "client_safe";

export interface ActivityLogRecord {
  id: ActivityLogId;
  restaurantId: RestaurantId;
  dataMode: SaasDataMode;
  entityType: ActivityLogEntityType;
  entityId: string;
  action: ActivityLogAction;
  actorUserId?: UserId;
  actorLabel: string;
  summary: string;
  visibility: ActivityLogVisibility;
  metadata?: Record<string, string | number | boolean | null>;
  isPersisted: boolean;
  createdAt: string;
}

export interface CreateActivityLogInput {
  restaurantId: RestaurantId;
  dataMode?: SaasDataMode;
  entityType: ActivityLogEntityType;
  entityId: string;
  action: ActivityLogAction;
  actorUserId?: UserId;
  actorLabel?: string;
  summary: string;
  visibility?: ActivityLogVisibility;
  metadata?: Record<string, string | number | boolean | null>;
}

// Phase 2 aliases keep repository contracts readable while preserving the
// Phase 1 record shapes. They do not create persistence or new runtime writes.
export type MediaAssetRecord = MediaAsset;
export type ClientRequestRecord = ClientRequest;
