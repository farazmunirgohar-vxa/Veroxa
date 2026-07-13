export type ConfirmationState =
  | "unverified"
  | "team_prefilled"
  | "needs_owner_confirmation"
  | "owner_confirmed"
  | "rejected"
  | "superseded";

export type ReadinessState = "passed" | "pending" | "blocked" | "not_applicable";

export type MomoReadinessDimension =
  | "restaurant_truth"
  | "onboarding"
  | "media"
  | "content"
  | "approvals"
  | "meta"
  | "google_local"
  | "operations"
  | "monitoring_recovery";

export interface RestaurantTruthRecord {
  key: string;
  category:
    | "identity"
    | "location"
    | "contact"
    | "hours"
    | "menu"
    | "service"
    | "dietary_claim"
    | "brand_voice"
    | "goal"
    | "presence";
  value: unknown;
  confirmationState: ConfirmationState;
  source: "team" | "owner" | "public_evidence" | "connected_platform";
  ownerConfirmedAt?: string;
  teamVerifiedAt?: string;
}

export interface MediaIntelligenceRecord {
  assetId: string;
  rightsState: "missing" | "owner_granted" | "restricted" | "expired";
  reviewState: "uploaded" | "under_review" | "approved" | "rejected";
  qualityState: "unreviewed" | "usable" | "needs_better_version" | "not_usable";
  classificationState: "not_requested" | "queued" | "classified" | "failed";
  tags: string[];
  reuseAllowed: boolean;
  useCount: number;
}

export interface ContentOperationsRecord {
  contentId: string;
  strategyState: "draft" | "reviewed" | "approved";
  generationState: "not_requested" | "queued" | "generated" | "failed" | "provider_blocked";
  approvalState: "draft" | "team_review" | "owner_review" | "approved" | "rejected";
  platformVariants: Array<"facebook" | "instagram" | "google_business_profile">;
  scheduledAt?: string;
}

export interface ConnectionReadiness {
  provider: "meta" | "google_business_profile";
  state: "not_connected" | "pending_owner" | "connected" | "needs_attention" | "revoked";
  requiredScopesVerified: boolean;
  lastVerifiedAt?: string;
}

export interface ReadinessCheck {
  key: string;
  label: string;
  dimension: MomoReadinessDimension;
  state: ReadinessState;
  required: boolean;
  weight: number;
  evidenceRefs: string[];
  blocker?: string;
}

export interface MomoReadinessResult {
  score: number;
  gate: "ready" | "blocked";
  checks: ReadinessCheck[];
  blockingChecks: ReadinessCheck[];
  measuredAt: string;
}

export type DeferredCapability =
  | "media_ai_classification"
  | "content_ai_generation"
  | "meta_publish"
  | "google_business_profile_write"
  | "visibility_monitoring";

export type ProviderResult<T> =
  | { status: "completed"; value: T; providerEventId?: string }
  | { status: "queued"; jobId: string }
  | {
      status: "blocked";
      reason:
        | "provider_not_authorized"
        | "connection_required"
        | "owner_confirmation_required"
        | "approval_required"
        | "incremental_spend_not_approved";
    };
