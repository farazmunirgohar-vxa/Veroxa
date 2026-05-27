/**
 * firstClientContracts.ts — M021
 *
 * TypeScript type contracts for the first real Veroxa client. These
 * describe the shape of data Veroxa will need when real persistence
 * is enabled later (M023+).
 *
 * THIS FILE DEFINES TYPES ONLY.
 *   - No runtime writes.
 *   - No Supabase calls.
 *   - No fetch / FormData / network.
 *   - No raw file blobs / base64.
 *
 * Each section includes the proposed future Supabase table that will
 * back it. Tables themselves are NOT created in this pass — see
 * docs/M023_SUPABASE_WRITES_PLAN_UPLOADS_DIRECTION_REVIEW.md.
 */

// ---- Restaurant (future table: restaurants / clients) ----------------

export interface FirstClientRestaurant {
  /** Stable internal id (uuid). */
  id: string;
  /** Public-facing restaurant name. */
  name: string;
  /** Owner-facing display label (city, region). */
  locationLabel: string;
  /** Subscription tier the restaurant is on. */
  tier: "google_optimization" | "complete_online_presence" | "ads_management_only";
  /** Whether the Ads Add-on is active. */
  adsAddon: boolean;
  /** Onboarding state. */
  onboardingStatus: "lead" | "onboarding" | "active" | "paused" | "churned";
  createdAt: string;
  updatedAt: string;
}

// ---- Restaurant Upload Key (future table: restaurant_upload_keys) ----

export interface FirstClientUploadKey {
  id: string;
  restaurantId: string;
  /** Opaque key shown to the restaurant (rotate-on-compromise). */
  keyDisplay: string;
  active: boolean;
  /** Set when revoked — never reuse the same key. */
  revokedAt: string | null;
  /** Optional human label so the team knows which device/employee. */
  label: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

// ---- Upload Submission (future table: upload_submissions) ------------

export type FirstClientUploadCategory =
  | "food_photo"
  | "kitchen_prep"
  | "restaurant_atmosphere"
  | "menu_special"
  | "short_video"
  | "other";

export type FirstClientUploadPriority =
  | "use_anytime"
  | "use_next"
  | "save_for_weekend"
  | "google_post"
  | "reel_idea";

export type FirstClientUploadStatus =
  | "received"
  | "in_review"
  | "accepted"
  | "needs_better_photo"
  | "saved_for_later";

export interface FirstClientUploadSubmission {
  id: string;
  restaurantId: string;
  /** Which upload-key submitted this. */
  uploadKeyId: string;
  category: FirstClientUploadCategory;
  priority: FirstClientUploadPriority;
  /** Sanitized note. Never store raw filenames here. */
  note: string;
  status: FirstClientUploadStatus;
  /** Internal-only — set by team review. */
  internalNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

// ---- Media Asset (future table: media_assets) ------------------------

export interface FirstClientMediaAsset {
  id: string;
  submissionId: string;
  restaurantId: string;
  kind: "image" | "video";
  /** Storage path (private bucket, served via signed URLs). */
  storagePath: string;
  /** Display dimensions if known. */
  width: number | null;
  height: number | null;
  bytes: number;
  /** True once review passes a usability bar. */
  usable: boolean;
  createdAt: string;
}

// ---- Direction Request (future table: direction_requests) ------------

export type FirstClientDirectionFocus =
  | "lunch_traffic"
  | "dinner_traffic"
  | "catering"
  | "family_platters"
  | "new_item"
  | "dessert"
  | "slow_day"
  | "weekend_push"
  | "google_visibility"
  | "event_or_holiday"
  | "ads_goal"
  | "avoid_item"
  | "use_media_next"
  | "other";

export type FirstClientDirectionChannel =
  | "organic_social"
  | "google"
  | "ads"
  | "all";

export type FirstClientDirectionUrgency = "low" | "normal" | "high" | "urgent";

export type FirstClientDirectionStatus =
  | "received"
  | "interpreted"
  | "in_team_review"
  | "planned"
  | "completed";

export interface FirstClientDirectionRequest {
  id: string;
  restaurantId: string;
  focus: FirstClientDirectionFocus;
  channel: FirstClientDirectionChannel;
  urgency: FirstClientDirectionUrgency;
  title: string;
  /** Sanitized client note. */
  clientNote: string;
  preferredTimingLabel: string;
  relatedMediaId: string | null;
  avoidItem: string | null;
  status: FirstClientDirectionStatus;
  submittedAt: string;
}

// ---- Team Review Decision (future table: team_review_decisions) ------

export interface FirstClientTeamReviewDecision {
  id: string;
  /** Either an upload submission or a direction request. */
  targetType: "upload_submission" | "direction_request";
  targetId: string;
  reviewerId: string;
  decision:
    | "accepted"
    | "needs_better_photo"
    | "saved_for_later"
    | "interpreted"
    | "planned"
    | "completed"
    | "rejected";
  /** Internal-only note. Never surface raw to clients. */
  internalNote: string | null;
  createdAt: string;
}

// ---- Workflow Status (future table: content_workflow_items) ----------

export type FirstClientWorkflowStage =
  | "intake"
  | "media_review"
  | "draft"
  | "approval"
  | "scheduled"
  | "published"
  | "reporting";

export interface FirstClientWorkflowStatus {
  id: string;
  restaurantId: string;
  stage: FirstClientWorkflowStage;
  blockingClientAction: boolean;
  title: string;
  detail: string;
  updatedAt: string;
}

// ---- Weekly Update (future table: weekly_updates) --------------------

export interface FirstClientWeeklyUpdate {
  id: string;
  restaurantId: string;
  weekStart: string;
  highlights: string[];
  metrics: {
    postsPublished: number;
    googlePosts: number;
    storiesOrReels: number;
  };
  /** Client-safe narrative. Internal notes go elsewhere. */
  summary: string;
  createdAt: string;
}
