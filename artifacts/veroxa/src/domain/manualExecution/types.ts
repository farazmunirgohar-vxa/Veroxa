export type ManualExecutionType =
  | "social_post"
  | "google_update"
  | "profile_cleanup"
  | "review_reply_draft"
  | "menu_link_cleanup"
  | "best_seller_visibility"
  | "weekly_update"
  | "monthly_report_draft"
  | "premium_readiness_review";

export type ManualExecutionPlatform =
  | "google_business_profile"
  | "google_maps"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "website_or_menu_link"
  | "internal_report"
  | "client_portal";

export type ManualExecutionApprovalStatus =
  | "needs_team_review"
  | "ready_to_copy"
  | "needs_client_confirmation"
  | "held_for_later"
  | "manually_completed"
  | "not_recommended";

export type ClientConfirmationStatus =
  | "not_required"
  | "required"
  | "requested"
  | "confirmed"
  | "rejected"
  | "unclear";

export type ManualPublishStatus =
  | "not_ready"
  | "ready_for_manual_execution"
  | "copied_by_team"
  | "manually_posted"
  | "manually_logged"
  | "skipped"
  | "blocked";

export type ManualExecutionRiskFlag =
  | "needs_business_truth_confirmation"
  | "missing_media"
  | "low_media_quality"
  | "possible_unverified_claim"
  | "sensitive_offer_or_discount"
  | "platform_access_needed"
  | "premium_ads_requires_approval"
  | "insufficient_context"
  | "no_usable_action";

export type ManualExecutionPlanFit = "starter" | "growth" | "premium_candidate" | "review_only";

export interface ManualExecutionPack {
  id: string;
  sourceWorkItemId: string;
  clientId: string;
  restaurantName: string;
  planFit: ManualExecutionPlanFit;
  platform: ManualExecutionPlatform;
  executionType: ManualExecutionType;
  title: string;
  clientSafeSummary: string;
  teamInstructions: string;
  copyPasteCaption?: string;
  copyPasteGoogleUpdate?: string;
  copyPasteHashtags: readonly string[];
  suggestedMediaUse: string;
  suggestedPublishWindow: string;
  businessTruthItemsToConfirm: readonly string[];
  riskFlags: readonly ManualExecutionRiskFlag[];
  approvalStatus: ManualExecutionApprovalStatus;
  confirmationStatus: ClientConfirmationStatus;
  manualPublishStatus: ManualPublishStatus;
  createdAt: string;
  updatedAt: string;
  blockedReason?: string;
  nextAction: string;
}

export interface ManualExecutionInputWorkItem {
  id: string;
  clientId: string;
  title: string;
  type: "media" | "draft" | "schedule" | "request" | "report" | "visibility" | "audit" | "premium";
  stage: string;
  priority?: "low" | "normal" | "high" | "urgent";
  dueLabel?: string;
}

export interface BuildManualExecutionPacksInput {
  workItems?: readonly ManualExecutionInputWorkItem[];
  restaurantNameByClientId?: Record<string, string>;
}

export interface GroupedManualExecutionPacks {
  readyToCopy: ManualExecutionPack[];
  needsClientConfirmation: ManualExecutionPack[];
  needsMediaOrContext: ManualExecutionPack[];
  heldForLater: ManualExecutionPack[];
  completedPreview: ManualExecutionPack[];
}

export type ManualExecutionRiskTone = "success" | "info" | "warning" | "danger" | "neutral";

export interface ManualExecutionLaunchGateSignal {
  readyToCopyCount: number;
  needsClientConfirmationCount: number;
  blockedByMediaOrContextCount: number;
  heldForLaterCount: number;
  completedPreviewCount: number;
  demoWalkthroughReady: boolean;
  feedbackConversationReady: boolean;
  firstPaidClientReadyLater: boolean;
  summary: string;
  recommendedNextAction: string;
}
