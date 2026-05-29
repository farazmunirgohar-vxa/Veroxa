/**
 * Prepared Actions — Approval-to-Execution domain model (foundation only).
 *
 * This is the bridge that turns Veroxa from a recommendation dashboard into an
 * execution-capable operating system: AI/automation audits → Veroxa prepares an
 * exact action → it appears in the Team approval queue → Faraz approves / edits /
 * skips / asks the client → Veroxa executes LATER when a connector exists.
 *
 * IMPORTANT: this is a planning/domain model only. Nothing here performs an
 * external API call, posts, publishes, or creates any real side effect. There
 * are NO OpenAI/model calls, NO storage, NO external execution. See
 * docs/APPROVAL_TO_EXECUTION_OS.md.
 */

export type PreparedActionId = string;

/** Where the action would eventually land. */
export type PreparedActionChannel =
  | "google_business_profile"
  | "social_media"
  | "website"
  | "seo"
  | "reviews"
  | "client_communication"
  | "reports"
  | "internal_task";

export const PREPARED_ACTION_CHANNEL_LABELS: Record<
  PreparedActionChannel,
  string
> = {
  google_business_profile: "Google Business Profile",
  social_media: "Social media",
  website: "Website",
  seo: "Search visibility",
  reviews: "Reviews",
  client_communication: "Client communication",
  reports: "Reports",
  internal_task: "Internal task",
};

/** The concrete kind of action prepared. */
export type PreparedActionType =
  | "google_post"
  | "google_photo_upload"
  | "review_reply"
  | "social_post"
  | "website_copy_update"
  | "website_link_fix"
  | "seo_keyword_update"
  | "menu_visibility_update"
  | "client_reminder"
  | "weekly_update"
  | "monthly_report"
  | "content_request"
  | "daily_customer_push"
  | "catering_push"
  | "review_growth_push"
  | "profile_audit_fix"
  | "internal_follow_up";

export const PREPARED_ACTION_TYPE_LABELS: Record<PreparedActionType, string> = {
  google_post: "Google update",
  google_photo_upload: "Google photo",
  review_reply: "Review reply",
  social_post: "Social post",
  website_copy_update: "Website copy update",
  website_link_fix: "Website link fix",
  seo_keyword_update: "Search keyword update",
  menu_visibility_update: "Menu visibility update",
  client_reminder: "Client reminder",
  weekly_update: "Weekly update",
  monthly_report: "Monthly report",
  content_request: "Content request",
  daily_customer_push: "Daily customer push",
  catering_push: "Catering push",
  review_growth_push: "Review growth push",
  profile_audit_fix: "Profile audit fix",
  internal_follow_up: "Internal follow-up",
};

/** What produced the prepared action. */
export type PreparedActionSource =
  | "automation_audit"
  | "daily_opportunity_engine"
  | "team_manual"
  | "client_request"
  | "review_monitor"
  | "content_pipeline";

export const PREPARED_ACTION_SOURCE_LABELS: Record<
  PreparedActionSource,
  string
> = {
  automation_audit: "Automated audit",
  daily_opportunity_engine: "Daily opportunity engine",
  team_manual: "Team",
  client_request: "Client request",
  review_monitor: "Review monitor",
  content_pipeline: "Content pipeline",
};

/** Lifecycle status of a prepared action. */
export type PreparedActionStatus =
  | "prepared"
  | "needs_review"
  | "needs_client_confirmation"
  | "approved"
  | "skipped"
  | "edited"
  | "queued_for_execution"
  | "executed"
  | "failed"
  | "archived";

export const PREPARED_ACTION_STATUS_LABELS: Record<
  PreparedActionStatus,
  string
> = {
  prepared: "Prepared",
  needs_review: "Ready for review",
  needs_client_confirmation: "Client confirmation needed",
  approved: "Approved",
  skipped: "Skipped",
  edited: "Edited",
  queued_for_execution: "Queued for later",
  executed: "Done",
  failed: "Needs attention",
  archived: "Archived",
};

/** How risky the action is to take. */
export type ApprovalRiskLevel = "low" | "medium" | "high" | "sensitive";

export const APPROVAL_RISK_LABELS: Record<ApprovalRiskLevel, string> = {
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
  sensitive: "Sensitive",
};

/** What sign-off the action requires before it can be executed. */
export type ApprovalRequirement =
  | "none_internal_only"
  | "team_approval_required"
  | "client_confirmation_required"
  | "never_automatic";

export const APPROVAL_REQUIREMENT_LABELS: Record<ApprovalRequirement, string> =
  {
    none_internal_only: "Internal only",
    team_approval_required: "Approval needed",
    client_confirmation_required: "Client confirmation needed",
    never_automatic: "Always manual",
  };

/** When/how the action would run once approved. */
export type ExecutionMode =
  | "manual_now"
  | "connector_later"
  | "ready_for_connector"
  | "internal_only";

export const EXECUTION_MODE_LABELS: Record<ExecutionMode, string> = {
  manual_now: "Do manually now",
  connector_later: "Hold for later",
  ready_for_connector: "Ready for later",
  internal_only: "Internal only",
};

/** Execution outcome (foundation: nothing actually executes yet). */
export type ExecutionStatus =
  | "not_started"
  | "queued"
  | "in_progress"
  | "completed"
  | "failed";

export type PreparedActionPriority = "high" | "medium" | "low";

export const PREPARED_ACTION_PRIORITY_ORDER: Record<
  PreparedActionPriority,
  number
> = {
  high: 0,
  medium: 1,
  low: 2,
};

export const PREPARED_ACTION_PRIORITY_LABELS: Record<
  PreparedActionPriority,
  string
> = {
  high: "High priority",
  medium: "Medium",
  low: "Low",
};

/**
 * The prepared content / details for the action. Kept deliberately simple and
 * text-only — no binary payloads, no file bytes, no media data.
 */
export interface PreparedActionPayload {
  /** The exact text Veroxa prepared (Google post, reply, message, copy…). */
  preparedText?: string;
  /** Suggested keyword angle for SEO actions. */
  keywordAngle?: string;
  /** A short label describing media that would be used (never bytes). */
  mediaReference?: string;
  /** True when the action depends on business facts the restaurant must confirm. */
  requiresClientConfirmation?: boolean;
  /** Free-form structured notes for the team, plain text only. */
  notes?: string;
}

export interface PreparedAction {
  id: PreparedActionId;
  clientId: string;
  restaurantName: string;
  channel: PreparedActionChannel;
  type: PreparedActionType;
  source: PreparedActionSource;
  /** Short, human title for the card. */
  title: string;
  /** Why Veroxa prepared this — the supporting reason, plain language. */
  reason: string;
  payload: PreparedActionPayload;
  priority: PreparedActionPriority;
  status: PreparedActionStatus;
  riskLevel: ApprovalRiskLevel;
  approvalRequirement: ApprovalRequirement;
  executionMode: ExecutionMode;
  executionStatus: ExecutionStatus;
  /** Calm, imperative next step for the team. */
  suggestedNext: string;
  /** When the action was prepared (display string; demo-safe). */
  preparedAtLabel: string;
  /** Fixtures are always flagged demo-only. */
  demoOnly: true;
}

/**
 * A prepared-action "seed" carries the realistic intent + content only. The
 * safety fields (`riskLevel`, `approvalRequirement`) and `restaurantName` /
 * `demoOnly` are filled in later so the rules engine stays the single source of
 * truth for the approval gate. Any source of prepared actions (hand-written
 * fixtures or the visibility-audit engine) produces seeds in this shape.
 */
export type PreparedActionSeed = Omit<
  PreparedAction,
  | "restaurantName"
  | "riskLevel"
  | "approvalRequirement"
  | "demoOnly"
  | "executionStatus"
> & {
  executionStatus?: ExecutionStatus;
};

/** A seed with the restaurant name resolved, ready for the store to derive safety fields. */
export type ResolvedPreparedActionSeed = PreparedActionSeed & {
  restaurantName: string;
  demoOnly: true;
};
