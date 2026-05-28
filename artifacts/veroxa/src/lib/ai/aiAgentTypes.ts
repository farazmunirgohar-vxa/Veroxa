/**
 * aiAgentTypes.ts — type contracts for Veroxa's AI-first SOP preview layer.
 *
 * SIMULATED / RULE-BASED ONLY.
 * No live model calls, no publishing, no client auto-messaging, no writes.
 * All output produced by this layer is treated as a DRAFT that requires
 * Veroxa team review before it ever reaches the client.
 *
 * The purpose of these types is to give every page in the Client and Team
 * portals a single shared vocabulary for "what an AI agent prepared,"
 * "what status it's in," and "what a human still needs to do."
 */

// ---------------------------------------------------------------------------
// Agent identity
// ---------------------------------------------------------------------------

export type AiAgentName =
  | "media_review"
  | "content_strategist"
  | "caption_draft"
  | "scheduling_recommendation"
  | "client_update"
  | "reporting_draft"
  | "risk_blocker"
  | "team_operator_assistant";

export const AI_AGENT_LABELS: Record<AiAgentName, string> = {
  media_review: "Media Review Agent",
  content_strategist: "Content Strategist Agent",
  caption_draft: "Caption Draft Agent",
  scheduling_recommendation: "Scheduling Recommendation Agent",
  client_update: "Client Update Agent",
  reporting_draft: "Reporting Draft Agent",
  risk_blocker: "Risk / Blocker Agent",
  team_operator_assistant: "Team Operator Assistant",
};

// ---------------------------------------------------------------------------
// Workflow status — every AI-prepared item lives in exactly one of these.
// ---------------------------------------------------------------------------

export type AiAgentStatus =
  | "ready"
  | "needs_human_review"
  | "approved"
  | "blocked"
  | "manual_review_needed";

export const AI_AGENT_STATUS_LABELS: Record<AiAgentStatus, string> = {
  ready: "Ready",
  needs_human_review: "Needs team review",
  approved: "Approved",
  blocked: "Blocked",
  manual_review_needed: "Manual review needed",
};

// ---------------------------------------------------------------------------
// Risk surface — shared between the Risk/Blocker agent and the Operator
// Assistant summary on the team dashboard.
// ---------------------------------------------------------------------------

export type AiRiskLevel = "info" | "warning" | "critical";

export interface AiRiskFlag {
  level: AiRiskLevel;
  message: string;
  nextHumanAction: string;
}

// ---------------------------------------------------------------------------
// Media review output
// ---------------------------------------------------------------------------

export type AiMediaUsageRecommendation =
  | "use_now"
  | "save_for_later"
  | "needs_context"
  | "not_recommended";

export const AI_MEDIA_USAGE_LABELS: Record<AiMediaUsageRecommendation, string> = {
  use_now: "Use now",
  save_for_later: "Save for later",
  needs_context: "Needs context",
  not_recommended: "Not recommended",
};

export type AiMediaQualityLabel =
  | "Strong"
  | "Good"
  | "Mixed"
  | "Needs context";

export interface AiMediaReviewOutput {
  agent: "media_review";
  status: AiAgentStatus;
  mediaQualityScore: number;
  qualityLabel: AiMediaQualityLabel;
  recommendedUsage: AiMediaUsageRecommendation;
  contentAngle: string;
  note: string;
}

// ---------------------------------------------------------------------------
// Content + captions + scheduling
// ---------------------------------------------------------------------------

export interface AiContentAngleOutput {
  agent: "content_strategist";
  status: AiAgentStatus;
  contentAngle: string;
  rationale: string;
}

export interface AiCaptionDraftsOutput {
  agent: "caption_draft";
  status: AiAgentStatus;
  captionDrafts: string[];
}

export interface AiSchedulingOutput {
  agent: "scheduling_recommendation";
  status: AiAgentStatus;
  recommendedPostWindow: string;
  reason: string;
}

// ---------------------------------------------------------------------------
// Client update + reporting draft
// ---------------------------------------------------------------------------

export interface AiClientUpdateDraft {
  agent: "client_update";
  status: AiAgentStatus;
  whatVeroxaReviewed: string;
  whatIsBeingPrepared: string;
  whatClientNeedsToProvide: string;
  nextPlannedAction: string;
}

export interface AiReportSummaryDraft {
  agent: "reporting_draft";
  status: AiAgentStatus;
  title: string;
  draftSummary: string;
  missingDataFlags: string[];
  humanVerificationRequired: true;
}

// ---------------------------------------------------------------------------
// Per-work-item preview — what the Team Work Queue uses.
// ---------------------------------------------------------------------------

export interface AiWorkItemPreview {
  submissionId: string;
  agent: AiAgentName;
  status: AiAgentStatus;
  suggestedAngle?: string;
  recommendedNextAction: string;
  risk?: AiRiskFlag;
  approvalRequired: boolean;
}

// ---------------------------------------------------------------------------
// Team Operator Assistant — daily command-center snapshot.
// ---------------------------------------------------------------------------

export interface AiOperatorAssistantSnapshot {
  agent: "team_operator_assistant";
  readyForApprovalCount: number;
  blockedCount: number;
  clientInputNeededCount: number;
  aiPreparedDraftsCount: number;
  riskFlags: AiRiskFlag[];
  topRecommendation: string;
}

// ---------------------------------------------------------------------------
// Client-facing simple status — never expose internal AI mechanics to the
// client. These are the only labels client pages should render for AI work.
// ---------------------------------------------------------------------------

export type ClientFacingWorkStatus =
  | "Uploaded"
  | "Being reviewed"
  | "Needs your input"
  | "Prepared by Veroxa"
  | "Included in report";

export const CLIENT_AI_DISCLOSURE =
  "Veroxa uses AI-assisted organization to help the team review uploads, prepare content ideas, and keep work moving. Final review stays with the Veroxa team.";

export const TEAM_AI_DISCLOSURE =
  "AI drafts the structure; Veroxa team verifies before sharing.";
