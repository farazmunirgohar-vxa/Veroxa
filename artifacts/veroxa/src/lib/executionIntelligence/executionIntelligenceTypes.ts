/**
 * executionIntelligenceTypes.ts — Execution Intelligence Engine (foundation).
 *
 * SAFETY / SCOPE:
 *   - Everything here is rule-based and deterministic. No network, no auto-send,
 *     no auto-call/message, no publishing, no payments, no notifications, no
 *     guarantees.
 *   - Execution Intelligence RETAINS clients (vs Lead Intelligence, which BRINGS
 *     clients). It scores onboarding quality, cooperation, work completion,
 *     online-presence progress, retention risk, and renewal likelihood.
 *   - It NEVER punishes or blames a client. Risk is framed as "needs guidance",
 *     "a few inputs needed", or "worth a check-in" — never the client's fault.
 *   - Risk detail and internal notes are TEAM-ONLY. Client-facing wording must
 *     stay calm, respectful, and free of blame. AI can classify/score/recommend
 *     but never makes a final client-relationship decision — a human always does.
 */

// ---------------------------------------------------------------------------
// Client success fit — how strong a Veroxa fit a client looks, based on
// cooperation + execution signals (not a judgement of the person/business).
// ---------------------------------------------------------------------------

export type ClientSuccessFitCategory =
  | "excellent_fit"
  | "good_fit"
  | "needs_guidance"
  | "retention_risk"
  | "poor_fit_for_now";

export const CLIENT_SUCCESS_FIT_LABELS: Record<
  ClientSuccessFitCategory,
  string
> = {
  excellent_fit: "Excellent fit",
  good_fit: "Good fit",
  needs_guidance: "Needs guidance",
  retention_risk: "Retention risk",
  poor_fit_for_now: "Poor fit for now",
};

export const CLIENT_SUCCESS_FIT_DESCRIPTIONS: Record<
  ClientSuccessFitCategory,
  string
> = {
  excellent_fit:
    "Provides media, gives access, responds, and approves work — Veroxa can execute smoothly.",
  good_fit:
    "Cooperating well across most basics with a little room to tighten the rhythm.",
  needs_guidance:
    "Willing but missing a few inputs — clearer guidance keeps execution moving.",
  retention_risk:
    "Execution is slowing for fixable reasons — a human check-in is worth scheduling.",
  poor_fit_for_now:
    "Current expectations or inputs make execution hard right now — revisit scope together.",
};

// ---------------------------------------------------------------------------
// Retention risk — fixable reasons execution can stall. NEVER blame language.
// ---------------------------------------------------------------------------

export type RetentionRiskReason =
  | "client_not_uploading_media"
  | "access_not_provided"
  | "unclear_expectations"
  | "wants_guarantees"
  | "no_response"
  | "slow_approval"
  | "poor_fit_service_scope"
  | "reporting_gap"
  | "execution_blocked"
  | "price_sensitivity";

export const RETENTION_RISK_REASON_LABELS: Record<RetentionRiskReason, string> =
  {
    client_not_uploading_media: "Media supply running low",
    access_not_provided: "Account access not yet provided",
    unclear_expectations: "Expectations may need aligning",
    wants_guarantees: "Possible expectation of guarantees",
    no_response: "Quiet — no recent response",
    slow_approval: "Approvals taking longer than usual",
    poor_fit_service_scope: "Scope may not match current needs",
    reporting_gap: "A reporting gap to close",
    execution_blocked: "Work is blocked and waiting",
    price_sensitivity: "Possible price sensitivity",
  };

export type RetentionRiskLevel = "low" | "watch" | "elevated" | "high";

export const RETENTION_RISK_LEVEL_LABELS: Record<RetentionRiskLevel, string> = {
  low: "Low risk",
  watch: "Worth watching",
  elevated: "Needs attention",
  high: "Needs a check-in",
};

/** A single detected retention risk, with split client-safe / team-only wording. */
export interface RetentionRiskItem {
  reason: RetentionRiskReason;
  reasonLabel: string;
  level: RetentionRiskLevel;
  levelLabel: string;
  /** Internal, full-detail note for the team only. */
  teamNote: string;
  /** Calm, respectful, blame-free wording safe to show the client. */
  clientSafeMessage: string;
  /** The next human action recommended (never auto-executed). */
  recommendedAction: string;
  /** True when this involves sensitive client comms / a relationship decision. */
  humanApprovalRequired: boolean;
}

// ---------------------------------------------------------------------------
// Score dimensions — 0..100 each, deterministic. Higher = healthier, EXCEPT
// retentionRisk where higher = more risk (documented inline).
// ---------------------------------------------------------------------------

export interface ExecutionScoreDimensions {
  /** How complete onboarding is (higher = more complete). */
  onboardingCompletion: number;
  /** How much required account access has been provided. */
  accessCompletion: number;
  /** How consistently fresh media is being supplied. */
  mediaUploadConsistency: number;
  /** How quickly the client responds when input is needed. */
  clientResponseSpeed: number;
  /** Share of work moving through to completion. */
  workQueueCompletion: number;
  /** How well AI-prepared drafts are being used (preview-grade). */
  aiDraftUsage: number;
  /** How quickly humans approve prepared work. */
  humanApprovalSpeed: number;
  /** Consistency of reporting delivery. */
  reportingConsistency: number;
  /** Progress improving the Google business profile. */
  googleProfileProgress: number;
  /** Progress on website/social setup. */
  websiteSocialSetupProgress: number;
  /** Retention risk (0..100, higher = MORE risk). */
  retentionRisk: number;
  /** Likelihood of renewal (higher = more likely). */
  renewalLikelihood: number;
}

/** Generic 0..100 sub-score with a cautious label + plain-language note. */
export interface ExecutionSubScore {
  score: number;
  label: string;
  note: string;
}

export interface ClientSuccessFitScore extends ExecutionSubScore {
  category: ClientSuccessFitCategory;
  categoryLabel: string;
}

export type ExecutionSubScoreKind =
  | "execution_health"
  | "client_cooperation"
  | "media_supply"
  | "access_completion"
  | "work_completion"
  | "reporting_health"
  | "online_presence_improvement";

export interface ExecutionHealthScore extends ExecutionSubScore {}
export interface ClientCooperationScore extends ExecutionSubScore {}
export interface MediaSupplyScore extends ExecutionSubScore {}
export interface AccessCompletionScore extends ExecutionSubScore {}
export interface WorkCompletionScore extends ExecutionSubScore {}
export interface ReportingHealthScore extends ExecutionSubScore {}
export interface OnlinePresenceImprovementScore extends ExecutionSubScore {}

export interface RetentionRiskScore extends ExecutionSubScore {
  level: RetentionRiskLevel;
  levelLabel: string;
  /** Detected, fixable risk items (team-only detail inside). */
  items: RetentionRiskItem[];
}

// ---------------------------------------------------------------------------
// Next execution action — what to do next for this client (human action).
// ---------------------------------------------------------------------------

export type ExecutionNextActionKind =
  | "request_media"
  | "request_access"
  | "approve_draft"
  | "complete_google_task"
  | "prepare_report"
  | "schedule_check_in"
  | "review_expectation_risk"
  | "keep_executing";

export const EXECUTION_NEXT_ACTION_LABELS: Record<
  ExecutionNextActionKind,
  string
> = {
  request_media: "Request media",
  request_access: "Request access",
  approve_draft: "Approve a prepared draft",
  complete_google_task: "Complete a Google profile task",
  prepare_report: "Prepare the report",
  schedule_check_in: "Schedule a client check-in",
  review_expectation_risk: "Review expectation alignment",
  keep_executing: "Keep executing — on track",
};

export interface ExecutionNextAction {
  kind: ExecutionNextActionKind;
  label: string;
  detail: string;
  /** True when a human must act/approve (sensitive client comms etc.). */
  requiresHumanReview: boolean;
}

// ---------------------------------------------------------------------------
// Compliance — guardrail flags attached to every execution profile.
// ---------------------------------------------------------------------------

export type ExecutionComplianceFlagType =
  | "no_auto_send"
  | "human_review_required"
  | "no_client_blame"
  | "no_performance_guarantee"
  | "risk_language_team_only"
  | "respectful_client_requests";

export interface ExecutionComplianceFlag {
  type: ExecutionComplianceFlagType;
  note: string;
}

// ---------------------------------------------------------------------------
// Profile — the full execution-intelligence record for a single client.
// ---------------------------------------------------------------------------

export interface ExecutionIntelligenceProfile {
  clientId: string;
  restaurantName: string;
  dimensions: ExecutionScoreDimensions;
  executionHealth: ExecutionHealthScore;
  clientSuccessFit: ClientSuccessFitScore;
  retention: RetentionRiskScore;
  cooperation: ClientCooperationScore;
  mediaSupply: MediaSupplyScore;
  access: AccessCompletionScore;
  workCompletion: WorkCompletionScore;
  reporting: ReportingHealthScore;
  onlinePresence: OnlinePresenceImprovementScore;
  /** Renewal likelihood (0..100, higher = more likely). */
  renewalLikelihood: number;
  renewalLikelihoodLabel: string;
  /** Team-facing summary of what's blocking execution right now. */
  blockedWorkSummary: string;
  /** Single highest-leverage next action for this client. */
  nextBestAction: ExecutionNextAction;
  /** What Veroxa should fix this week (team-facing). */
  fixThisWeek: string[];
  /** What the client needs to provide (client-safe wording). */
  clientNeedsToProvide: string[];
  /** What the team needs to approve (team-facing). */
  teamNeedsToApprove: string[];
  complianceFlags: ExecutionComplianceFlag[];
}

// ---------------------------------------------------------------------------
// Learning signals — execution/retention outcomes that can improve targeting.
// These feed the Growth Flywheel and (cautiously) lead prioritisation.
// ---------------------------------------------------------------------------

export type ExecutionLearningPatternKind =
  | "retainedClientPattern"
  | "churnRiskPattern"
  | "highEffortSetupPattern"
  | "strongVisualFitPattern"
  | "lowCooperationPattern"
  | "highRetentionSegment"
  | "lowRetentionSegment";

export const EXECUTION_LEARNING_PATTERN_LABELS: Record<
  ExecutionLearningPatternKind,
  string
> = {
  retainedClientPattern: "Retained-client pattern",
  churnRiskPattern: "Churn-risk pattern",
  highEffortSetupPattern: "High-effort setup pattern",
  strongVisualFitPattern: "Strong-visual fit pattern",
  lowCooperationPattern: "Low-cooperation pattern",
  highRetentionSegment: "Higher-retention segment",
  lowRetentionSegment: "Lower-retention segment",
};

/**
 * A cautious, confidence-labelled lesson learned from execution/retention
 * outcomes. Signals, not rules — a human always decides.
 */
export interface ExecutionLearningSignal {
  kind: ExecutionLearningPatternKind;
  kindLabel: string;
  /** Plain-language description of the observed pattern. */
  detail: string;
  /** How much data backs it (mirrors the lead-learning confidence labels). */
  confidenceLabel: string;
  /** Number of clients/outcomes behind the signal. */
  sample: number;
}

// ---------------------------------------------------------------------------
// Growth flywheel signal — connects lead quality to execution/retention.
// ---------------------------------------------------------------------------

export type GrowthFlywheelRecommendationKind =
  | "find_more_like_this"
  | "reduce_priority_for_type"
  | "requires_stronger_onboarding"
  | "requires_clearer_expectations"
  | "good_for_founder_handled"
  | "needs_team_support_before_scaling";

export const GROWTH_FLYWHEEL_RECOMMENDATION_LABELS: Record<
  GrowthFlywheelRecommendationKind,
  string
> = {
  find_more_like_this: "Find more leads like this",
  reduce_priority_for_type: "Reduce priority for this lead type",
  requires_stronger_onboarding: "Requires stronger onboarding",
  requires_clearer_expectations: "Requires clearer expectation setting",
  good_for_founder_handled: "Good fit for founder-handled clients",
  needs_team_support_before_scaling: "Needs team support before scaling",
};

export interface GrowthFlywheelSignal {
  /** The lead segment this lesson is about (string to stay decoupled). */
  segment: string;
  segmentLabel: string;
  /** Feedback about the quality of leads from this segment. */
  leadQualityFeedback: string;
  /** Suggested targeting adjustment. */
  targetingAdjustment: string;
  /** Lesson learned about execution for this segment. */
  executionLesson: string;
  /** Lesson learned about retention for this segment. */
  retentionLesson: string;
  recommendation: GrowthFlywheelRecommendationKind;
  recommendationLabel: string;
  confidenceLabel: string;
  sample: number;
}
