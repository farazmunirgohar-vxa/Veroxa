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
  "Veroxa uses assisted tools behind the scenes to help the team review uploads, prepare content ideas, and keep work moving. Final review always stays with the Veroxa team.";

export const TEAM_AI_DISCLOSURE =
  "AI drafts the structure; Veroxa team verifies before sharing.";

export const CLIENT_AUTOMATION_DISCLOSURE =
  "Veroxa uses assisted tools behind the scenes to help the team prepare work faster. Final review stays with the Veroxa team before anything is shared or posted.";

// ===========================================================================
// STRUCTURED AGENT OUTPUT CONTRACT (BUILD 1)
// ---------------------------------------------------------------------------
// Every AI agent output should be a STRUCTURE, not just text. This gives the
// team a consistent surface: what was produced, how confident the draft is,
// what inputs it used, the recommended next human action, the risks, and
// whether it's ready to flow into an automation. Human approval is always
// required for anything client-facing.
// ===========================================================================

/** Standard agent output categories. */
export type AiAgentOutputCategory =
  | "media_review"
  | "content_angle"
  | "caption_draft"
  | "schedule_recommendation"
  | "client_update_draft"
  | "report_draft"
  | "clarification_question"
  | "lead_summary"
  | "blocker_review"
  | "next_best_action";

export const AI_AGENT_OUTPUT_CATEGORY_LABELS: Record<
  AiAgentOutputCategory,
  string
> = {
  media_review: "Media review",
  content_angle: "Content angle",
  caption_draft: "Caption draft",
  schedule_recommendation: "Schedule recommendation",
  client_update_draft: "Client update draft",
  report_draft: "Report draft",
  clarification_question: "Clarification question",
  lead_summary: "Lead summary",
  blocker_review: "Blocker review",
  next_best_action: "Next best action",
};

/** Confidence in the draft (never a guarantee of outcome). */
export type AiConfidenceLevel = "high" | "medium" | "low";

export const AI_CONFIDENCE_LABELS: Record<AiConfidenceLevel, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

/** Standard risk categories an agent can flag. */
export type AiRiskCategory =
  | "missing_client_context"
  | "unclear_media_quality"
  | "missing_menu_or_offer"
  | "report_metrics_missing"
  | "claim_risk"
  | "client_response_needed"
  | "approval_required"
  | "blocked_workflow"
  | "low_confidence_ai_output"
  | "manual_review_required";

export const AI_RISK_CATEGORY_LABELS: Record<AiRiskCategory, string> = {
  missing_client_context: "Missing client context",
  unclear_media_quality: "Unclear media quality",
  missing_menu_or_offer: "Missing menu or offer",
  report_metrics_missing: "Report metrics missing",
  claim_risk: "Claim risk",
  client_response_needed: "Client response needed",
  approval_required: "Approval required",
  blocked_workflow: "Blocked workflow",
  low_confidence_ai_output: "Low-confidence AI output",
  manual_review_required: "Manual review required",
};

/** Standard human approval gates — what a human must approve before flow. */
export type AiApprovalGate =
  | "content_before_scheduling"
  | "report_before_client_visible"
  | "message_before_client_send"
  | "media_before_use"
  | "lead_summary_before_outreach"
  | "claim_before_public_use";

export const AI_APPROVAL_GATE_LABELS: Record<AiApprovalGate, string> = {
  content_before_scheduling: "Content approved before scheduling",
  report_before_client_visible: "Report verified before client sees it",
  message_before_client_send: "Message approved before sending to client",
  media_before_use: "Media approved before use",
  lead_summary_before_outreach: "Lead summary reviewed before outreach",
  claim_before_public_use: "Claims confirmed before public use",
};

/** Whether the prepared output is ready to flow into an automation step. */
export type AiAutomationReadiness =
  | "ready"
  | "needs_review"
  | "blocked"
  | "not_applicable";

export const AI_AUTOMATION_READINESS_LABELS: Record<
  AiAutomationReadiness,
  string
> = {
  ready: "Automation-ready",
  needs_review: "Needs team review",
  blocked: "Blocked",
  not_applicable: "Not applicable",
};

/** A typed risk flag tied to a standard category. */
export interface AiCategorizedRiskFlag {
  category: AiRiskCategory;
  level: AiRiskLevel;
  message: string;
  nextHumanAction: string;
  clientInputRequired?: boolean;
}

/**
 * The strengthened, structured output every AI agent should return.
 * Additive to the existing per-agent shapes — agents may carry their
 * domain payload AND this standard envelope.
 */
export interface AiAgentOutput {
  agentName: AiAgentName;
  category: AiAgentOutputCategory;
  status: AiAgentStatus;
  confidenceLevel: AiConfidenceLevel;
  sourceInputs: string[];
  outputSummary: string;
  recommendedNextAction: string;
  humanApprovalRequired: true;
  approvalGate?: AiApprovalGate;
  riskFlags: AiCategorizedRiskFlag[];
  automationReadiness: AiAutomationReadiness;
}
