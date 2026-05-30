/**
 * veroxaDataContracts.ts — pure TypeScript data contracts for the
 * Veroxa operating system.
 *
 * These interfaces describe the shape of data the app expects to
 * read once a real backend is connected. They are deliberately
 * decoupled from the current demo fixture shapes — the repository
 * layer in `src/lib/repositories/` maps fixtures into these contracts.
 *
 * Rules:
 *  - Pure TypeScript. No runtime logic.
 *  - No React. No I/O. No fetch / Supabase / writes.
 *  - This file MUST NOT import from `@/data/demo/*` or any UI module.
 *  - Future Supabase rows should be adapter-mapped into these shapes,
 *    not have these shapes bent to fit raw column names.
 */

// ── Roles ────────────────────────────────────────────────────────
export type VeroxaRole = "client" | "team" | "system";

// ── Lifecycle / health / risk vocabularies ───────────────────────
export type LifecycleStatus =
  | "lead"
  | "signed"
  | "onboarding"
  | "active"
  | "needs_attention"
  | "at_risk"
  | "paused"
  | "closed";

export type ContentHealthStatus = "healthy" | "caution" | "urgent" | "broken";

export type RiskStatus = "good" | "risk" | "at_risk";

// ── Workflow stages (operating-system layer) ─────────────────────
export type WorkflowStage =
  | "media_intake"
  | "ai_quality_review"
  | "team_review"
  | "concept_queue"
  | "draft_queue"
  | "internal_approval"
  | "post_ready"
  | "scheduled"
  | "published"
  | "report_feed"
  | "reusable_archive";

export type WorkflowItemType =
  | "media"
  | "draft"
  | "schedule"
  | "request"
  | "report";

export type WorkflowPriority = "low" | "normal" | "high" | "urgent";

// ── Report status ────────────────────────────────────────────────
export type ReportStatus =
  | "drafted"
  | "validated"
  | "team_review"
  | "approved"
  | "published"
  | "blocked";

// ── Service plan (string union — extend as plans evolve) ─────────
export type ClientServicePlan = "Essential" | "Growth" | "Premium" | "Unknown";

// ── Client account ───────────────────────────────────────────────
export interface ClientAccount {
  clientId: string;
  businessName: string;
  cuisineType: string;
  servicePlan: ClientServicePlan;
  lifecycleStatus: LifecycleStatus;
  contentHealthStatus: ContentHealthStatus;
  riskStatus: RiskStatus;
  assignedTeam: string;
  assignedInternalReviewer: string;
  postingFrequencyWeekly: number;
  timezone: string;
}

// ── Media asset ──────────────────────────────────────────────────
export type MediaFileType = "photo" | "video";

export type MediaReviewStatus =
  | "pending_review"
  | "approved"
  | "needs_revision"
  | "scheduled"
  | "used"
  | "reserved"
  | "archived";

export type MediaQualityFlag = "ok" | "blurry" | "duplicate" | "low_quality";

export interface MediaAsset {
  mediaId: string;
  clientId: string;
  title: string;
  fileType: MediaFileType;
  reviewStatus: MediaReviewStatus;
  qualityFlag: MediaQualityFlag;
  uploadedAt: string;
  suggestedUse: string;
  linkedPostId?: string;
}

// ── Workflow item ────────────────────────────────────────────────
export interface WorkflowItem {
  itemId: string;
  clientId: string;
  businessName: string;
  workflowStage: WorkflowStage;
  itemType: WorkflowItemType;
  priority: WorkflowPriority;
  title: string;
  description: string;
  nextAction: string;
  assignedRole: VeroxaRole;
  dueLabel: string;
  blockedReason?: string;
}

// ── Client health snapshot ───────────────────────────────────────
export interface ClientHealthSnapshot {
  clientId: string;
  businessName: string;
  unusedUsableMediaCount: number;
  postingFrequencyWeekly: number;
  weeksOfContentLeft: number;
  contentHealthStatus: ContentHealthStatus;
  postingCompletionRate: number;
  reportStatus: ReportStatus;
  teamActionRequired: boolean;
  internalEscalationRequired: boolean;
  clientActionRequired: boolean;
  riskReason: string;
}

// ── Weekly report summary ────────────────────────────────────────
export interface WeeklyReportSummary {
  reportId: string;
  clientId: string;
  weekStart: string;
  weekEnd: string;
  postsPlanned: number;
  postsPublished: number;
  reach: number;
  engagement: number;
  googleViews: number;
  googleCalls: number;
  googleDirections: number;
  uploadsReceived: number;
  status: ReportStatus;
}

// ── Monthly report summary ───────────────────────────────────────
export interface MonthlyReportSummary {
  reportId: string;
  clientId: string;
  monthKey: string;
  status: ReportStatus;
  totalPosts: number;
  totalReach: number;
  totalEngagement: number;
  googleViews: number;
  googleCalls: number;
  googleDirections: number;
  keyInsights: string[];
  nextMonthPlan: string[];
  teamReviewRequired: boolean;
}

// ── Activity event ───────────────────────────────────────────────
export type ActivityVisibility = "client_visible" | "internal_only";

export interface ActivityEvent {
  eventId: string;
  clientId: string;
  role: VeroxaRole;
  action: string;
  description: string;
  createdAt: string;
  visibility: ActivityVisibility;
}
