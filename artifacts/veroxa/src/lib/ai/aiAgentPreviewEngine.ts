/**
 * aiAgentPreviewEngine.ts — rule-based, deterministic AI preview layer.
 *
 * RULE-BASED ONLY. Deterministic preparation, no live model calls, no
 * network, no cloud writes. Outputs are prepared drafts/recommendations that
 * always require human/team approval before anything becomes client-facing.
 * Every function in this module is a pure transformation over existing
 * fixture/work-item shapes. The output is treated as a DRAFT that the
 * Veroxa team must review before anything is shared with a client.
 *
 * Why deterministic:
 *   - Demo surfaces stay stable across reloads (no nondeterministic copy).
 *   - The same item always produces the same recommendation, so screenshots
 *     and walkthroughs don't drift.
 *   - Easy to swap in a real model call later behind the same interface.
 */

import type {
  ClientTeamSubmission,
  ClientTeamSubmissionPriority,
  ClientTeamSubmissionStatus,
  ClientTeamSubmissionWorkType,
} from "@/data/demo/demoClientTeamWork";
import type { TeamWorkItem } from "@/lib/repositories/clientTeamWorkRepository";
import type {
  AiAgentName,
  AiAgentStatus,
  AiClientUpdateDraft,
  AiMediaQualityLabel,
  AiMediaReviewOutput,
  AiMediaUsageRecommendation,
  AiOperatorAssistantSnapshot,
  AiReportSummaryDraft,
  AiRiskFlag,
  AiRiskLevel,
  AiWorkItemPreview,
} from "./aiAgentTypes";

// ---------------------------------------------------------------------------
// Tiny deterministic hash — used to keep "scores" stable per id without
// pretending to be a real model. NOT cryptographic.
// ---------------------------------------------------------------------------

function stableHash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// ---------------------------------------------------------------------------
// Status mapping — submission status → AI workflow status.
// ---------------------------------------------------------------------------

function statusFromSubmission(s: ClientTeamSubmissionStatus): AiAgentStatus {
  switch (s) {
    case "blocked":
      return "blocked";
    case "needs_client_clarification":
      return "manual_review_needed";
    case "completed":
    case "archived":
      return "approved";
    case "in_progress":
    case "accepted":
      return "needs_human_review";
    case "new":
    case "needs_review":
    default:
      return "ready";
  }
}

function pickAgentForWorkType(
  wt: ClientTeamSubmissionWorkType,
): AiAgentName {
  switch (wt) {
    case "media_review":
      return "media_review";
    case "content":
      return "content_strategist";
    case "reporting":
      return "reporting_draft";
    case "client_support":
      return "client_update";
    case "menu_update":
    case "google_update":
    default:
      return "team_operator_assistant";
  }
}

// ---------------------------------------------------------------------------
// Media Review Agent
// ---------------------------------------------------------------------------

function qualityLabelForScore(score: number): AiMediaQualityLabel {
  if (score >= 80) return "Strong";
  if (score >= 65) return "Good";
  if (score >= 50) return "Mixed";
  return "Needs context";
}

function usageForScore(
  score: number,
  hasContext: boolean,
): AiMediaUsageRecommendation {
  if (!hasContext) return "needs_context";
  if (score >= 80) return "use_now";
  if (score >= 65) return "save_for_later";
  if (score >= 50) return "needs_context";
  return "not_recommended";
}

/**
 * Deterministic media review preview for a submission. Uses the submission's
 * description length as a proxy for "context provided" and a stable hash of
 * its id as a proxy for "quality score." Replace with a real signal-aware
 * scorer when wired to actual media metadata.
 */
export function previewMediaReview(
  submission: ClientTeamSubmission,
): AiMediaReviewOutput {
  const hasContext = submission.description.trim().length >= 30;
  // Base score 55–88 derived from the submission id, biased up if the client
  // included context and down if blocked / needs_clarification.
  const base = 55 + (stableHash(submission.id) % 34);
  const contextBonus = hasContext ? 6 : -4;
  const statusPenalty =
    submission.status === "blocked"
      ? -15
      : submission.status === "needs_client_clarification"
      ? -8
      : 0;
  const score = Math.max(20, Math.min(95, base + contextBonus + statusPenalty));
  const qualityLabel = qualityLabelForScore(score);
  const recommendedUsage = usageForScore(score, hasContext);
  const status = statusFromSubmission(submission.status);

  const angleSeed = stableHash(submission.id) % 4;
  const contentAngle = [
    "Lead with the hero shot — overhead, single dish, signature item.",
    "Behind-the-scenes kitchen story — short, vertical, sound-on.",
    "Customer favourite carousel — 3 dishes, weekend feature.",
    "Local moment — interior + service, calm caption.",
  ][angleSeed];

  let note: string;
  if (recommendedUsage === "needs_context") {
    note =
      "Ask the client for a one-line description (dish name, occasion) before drafting captions.";
  } else if (recommendedUsage === "not_recommended") {
    note = "Reshoot suggested — lighting and framing won't carry a post.";
  } else if (recommendedUsage === "save_for_later") {
    note = "Usable, but keep for filler weeks; better hero shots are ahead.";
  } else {
    note = "Strong enough to lead a post — draft caption and schedule.";
  }

  return {
    agent: "media_review",
    status,
    mediaQualityScore: score,
    qualityLabel,
    recommendedUsage,
    contentAngle,
    note,
  };
}

// ---------------------------------------------------------------------------
// Per-work-item preview — drives the team work queue's AI fields.
// ---------------------------------------------------------------------------

function riskForItem(item: TeamWorkItem): AiRiskFlag | undefined {
  if (item.teamWorkStatus === "waiting_on_client") {
    return {
      level: "warning",
      message: "Waiting on client input — workflow paused.",
      nextHumanAction: "Send a short, specific follow-up to unblock.",
    };
  }
  if (item.priority === "urgent") {
    return {
      level: "critical",
      message: "Urgent priority — risks slipping this week.",
      nextHumanAction: "Pull into today's queue and confirm owner.",
    };
  }
  if (item.priority === "high" && item.teamWorkStatus === "ready_for_team") {
    return {
      level: "warning",
      message: "High-priority item still unstarted.",
      nextHumanAction: "Assign an owner and start within 24 hours.",
    };
  }
  return undefined;
}

function recommendedAngleForItem(item: TeamWorkItem): string | undefined {
  if (item.workType === "content" || item.workType === "media_review") {
    const seed = stableHash(item.submissionId) % 4;
    return [
      "Hero dish, single-frame, weekend feature.",
      "Behind-the-scenes kitchen clip, short and vertical.",
      "Carousel: 3 customer favourites, one caption.",
      "Local-moment shot with calm, owner-voice caption.",
    ][seed];
  }
  if (item.workType === "google_update") {
    return "Refresh Google profile photo + add one short Google post this week.";
  }
  if (item.workType === "reporting") {
    return "Pull last 7 days of activity + 1 highlight into the weekly update.";
  }
  return undefined;
}

function nextActionForItem(item: TeamWorkItem): string {
  if (item.teamWorkStatus === "ready_for_team") {
    return `Pick up: ${item.nextTeamAction || "start the next planned step."}`;
  }
  if (item.teamWorkStatus === "in_progress") {
    return item.nextTeamAction || "Continue current step and prepare for review.";
  }
  if (item.teamWorkStatus === "waiting_on_client") {
    return item.nextClientAction
      ? `Nudge client: ${item.nextClientAction}`
      : "Send a short follow-up to the client.";
  }
  if (item.teamWorkStatus === "ready_for_review") {
    return "Team review: approve, revise, or send back to client.";
  }
  if (item.teamWorkStatus === "completed") {
    return "Closed — include in this week's client update.";
  }
  return item.nextTeamAction || "Confirm next step.";
}

export function previewWorkItem(item: TeamWorkItem): AiWorkItemPreview {
  const agent = pickAgentForWorkType(item.workType);
  const risk = riskForItem(item);
  const status: AiAgentStatus =
    item.teamWorkStatus === "ready_for_review"
      ? "needs_human_review"
      : item.teamWorkStatus === "waiting_on_client"
      ? "manual_review_needed"
      : item.teamWorkStatus === "completed"
      ? "approved"
      : item.teamWorkStatus === "in_progress"
      ? "ready"
      : risk?.level === "critical"
      ? "blocked"
      : "ready";
  return {
    submissionId: item.submissionId,
    agent,
    status,
    suggestedAngle: recommendedAngleForItem(item),
    recommendedNextAction: nextActionForItem(item),
    risk,
    approvalRequired:
      item.teamWorkStatus === "ready_for_review" ||
      item.teamWorkStatus === "in_progress",
  };
}

export function previewWorkItems(items: TeamWorkItem[]): AiWorkItemPreview[] {
  return items.map(previewWorkItem);
}

// ---------------------------------------------------------------------------
// Client Update Agent — compact weekly summary for the client portal.
// ---------------------------------------------------------------------------

export function previewClientUpdate(input: {
  inProgressCount: number;
  blockedCount: number;
  waitingOnClientCount: number;
  completedThisWeekCount: number;
  topInProgressTitle?: string;
  topActionNeededTitle?: string;
}): AiClientUpdateDraft {
  const {
    inProgressCount,
    blockedCount,
    waitingOnClientCount,
    completedThisWeekCount,
    topInProgressTitle,
    topActionNeededTitle,
  } = input;

  const whatVeroxaReviewed =
    completedThisWeekCount > 0
      ? `Reviewed and completed ${completedThisWeekCount} item${completedThisWeekCount === 1 ? "" : "s"} this week.`
      : "Reviewed this week's uploads, messages, and open work — nothing closed yet.";

  const whatIsBeingPrepared =
    inProgressCount > 0
      ? `Preparing ${inProgressCount} active item${inProgressCount === 1 ? "" : "s"}${topInProgressTitle ? ` — including "${topInProgressTitle}"` : ""}.`
      : "No active work in preparation right now — Veroxa is queued and ready for your next upload.";

  const whatClientNeedsToProvide =
    waitingOnClientCount > 0
      ? topActionNeededTitle
        ? `Veroxa is waiting on your input for "${topActionNeededTitle}"${waitingOnClientCount > 1 ? ` (+${waitingOnClientCount - 1} more).` : "."}`
        : `${waitingOnClientCount} item${waitingOnClientCount === 1 ? "" : "s"} need a short reply from you to continue.`
      : "Nothing required from you right now.";

  const nextPlannedAction =
    blockedCount > 0
      ? "Veroxa team will work through blockers and follow up with anything needed from you."
      : inProgressCount > 0
      ? "Continue preparing this week's content and send for team review."
      : "Wait for your next upload and prepare the weekly summary.";

  const status: AiAgentStatus =
    blockedCount > 0
      ? "needs_human_review"
      : waitingOnClientCount > 0
      ? "manual_review_needed"
      : "ready";

  return {
    agent: "client_update",
    status,
    whatVeroxaReviewed,
    whatIsBeingPrepared,
    whatClientNeedsToProvide,
    nextPlannedAction,
  };
}

// ---------------------------------------------------------------------------
// Reporting Draft Agent
// ---------------------------------------------------------------------------

export function previewReportDraft(input: {
  reportTitle: string;
  cadence: "weekly" | "monthly";
  hasPublishedPosts: boolean;
  hasMetrics: boolean;
}): AiReportSummaryDraft {
  const { reportTitle, cadence, hasPublishedPosts, hasMetrics } = input;
  const missingDataFlags: string[] = [];
  if (!hasMetrics) {
    missingDataFlags.push(
      "Performance metrics not connected — placeholder copy used.",
    );
  }
  if (!hasPublishedPosts) {
    missingDataFlags.push(
      "No publishing activity recorded this period — draft uses planned posts only.",
    );
  }

  const draftSummary =
    cadence === "weekly"
      ? "This week Veroxa reviewed uploads, prepared the next batch of posts, and updated the Google profile. Final review by the Veroxa team."
      : "This month Veroxa kept posting cadence on track, refreshed the Google profile, and aligned content with the restaurant's strongest dishes. Final review by the Veroxa team.";

  const status: AiAgentStatus =
    missingDataFlags.length > 0 ? "needs_human_review" : "ready";

  return {
    agent: "reporting_draft",
    status,
    title: reportTitle,
    draftSummary,
    missingDataFlags,
    humanVerificationRequired: true,
  };
}

// ---------------------------------------------------------------------------
// Team Operator Assistant — daily command-center snapshot.
// ---------------------------------------------------------------------------

export function previewOperatorAssistant(input: {
  readyForApprovalCount: number;
  blockedCount: number;
  clientInputNeededCount: number;
  aiPreparedDraftsCount: number;
  topRiskFlags: AiRiskFlag[];
}): AiOperatorAssistantSnapshot {
  const {
    readyForApprovalCount,
    blockedCount,
    clientInputNeededCount,
    aiPreparedDraftsCount,
    topRiskFlags,
  } = input;

  let topRecommendation: string;
  if (blockedCount > 0) {
    topRecommendation = `Clear ${blockedCount} blocker${blockedCount === 1 ? "" : "s"} first — they're holding the rest of the queue.`;
  } else if (readyForApprovalCount > 0) {
    topRecommendation = `Approve or revise ${readyForApprovalCount} AI-prepared item${readyForApprovalCount === 1 ? "" : "s"} so they can move to the client.`;
  } else if (clientInputNeededCount > 0) {
    topRecommendation = `Send ${clientInputNeededCount} short client follow-up${clientInputNeededCount === 1 ? "" : "s"} to unblock work.`;
  } else if (aiPreparedDraftsCount > 0) {
    topRecommendation = `Review ${aiPreparedDraftsCount} fresh AI draft${aiPreparedDraftsCount === 1 ? "" : "s"} and finalize for the week.`;
  } else {
    topRecommendation = "Queue is clear — focus on weekly reporting and capture planning.";
  }

  return {
    agent: "team_operator_assistant",
    readyForApprovalCount,
    blockedCount,
    clientInputNeededCount,
    aiPreparedDraftsCount,
    riskFlags: topRiskFlags.slice(0, 4),
    topRecommendation,
  };
}

// ---------------------------------------------------------------------------
// Clarification prompt — AI-prepared suggestion for a submission that is
// waiting on the client. The Veroxa team reviews and sends the follow-up;
// nothing is auto-messaged.
// ---------------------------------------------------------------------------

function clarificationQuestionForSubmission(
  submission: ClientTeamSubmission,
): string {
  const requested = submission.requestedClientAction?.trim();
  if (requested && requested.length > 0) return requested;
  switch (submission.submissionType) {
    case "media":
      return "Ask for the dish name and the occasion so the caption can be specific.";
    case "menu_update":
      return "Confirm the exact item name, price, and whether it replaces an existing item.";
    case "promotion":
      return "Confirm the offer wording, the start and end dates, and any fine print.";
    case "correction":
      return "Confirm exactly what is wrong and the correct detail to use.";
    case "question":
      return "Ask for a one-line answer so the team can proceed.";
    case "access_info":
      return "Confirm the account or access detail needed to continue.";
    case "general_request":
    default:
      return "Ask one short clarifying question to confirm scope before drafting.";
  }
}

export function previewClarificationPrompt(submission: ClientTeamSubmission): {
  agent: AiAgentName;
  status: AiAgentStatus;
  suggestedQuestion: string;
  nextTeamAction: string;
} {
  return {
    agent: "client_update",
    status: "manual_review_needed",
    suggestedQuestion: clarificationQuestionForSubmission(submission),
    nextTeamAction:
      "Send this as a short, friendly client follow-up, then resume once they reply.",
  };
}

// ---------------------------------------------------------------------------
// Risk / Blocker Agent — flat list across all items.
// ---------------------------------------------------------------------------

export function previewRiskFlags(items: TeamWorkItem[]): AiRiskFlag[] {
  const flags: AiRiskFlag[] = [];
  for (const item of items) {
    const f = riskForItem(item);
    if (f) flags.push(f);
  }
  return flags;
}

// ===========================================================================
// STRUCTURED AGENT OUTPUTS (BUILD 2)
// ---------------------------------------------------------------------------
// These helpers wrap the existing rule-based logic in the strengthened
// `AiAgentOutput` envelope: confidence, source inputs, recommended next
// action, risk flags (categorized), approval gate, and automation readiness.
// All deterministic; no model calls; humans approve everything client-facing.
// ===========================================================================

import type {
  AiAgentOutput,
  AiAutomationReadiness,
  AiCategorizedRiskFlag,
  AiConfidenceLevel,
} from "./aiAgentTypes";

function confidenceFromScore(score: number, hasContext: boolean): AiConfidenceLevel {
  if (!hasContext) return "low";
  if (score >= 78) return "high";
  if (score >= 60) return "medium";
  return "low";
}

function readinessFromStatus(status: AiAgentStatus): AiAutomationReadiness {
  switch (status) {
    case "approved":
    case "ready":
      return "ready";
    case "needs_human_review":
      return "needs_review";
    case "blocked":
      return "blocked";
    case "manual_review_needed":
      return "needs_review";
    default:
      return "needs_review";
  }
}

/** Media Review Agent — structured envelope around previewMediaReview. */
export function mediaReviewOutput(
  submission: ClientTeamSubmission,
): AiAgentOutput {
  const review = previewMediaReview(submission);
  const hasContext = submission.description.trim().length >= 30;
  const riskFlags: AiCategorizedRiskFlag[] = [];
  if (review.recommendedUsage === "needs_context") {
    riskFlags.push({
      category: "missing_client_context",
      level: "warning",
      message: "Media needs a short description before captioning.",
      nextHumanAction: "Ask the client for dish name and occasion.",
      clientInputRequired: true,
    });
  }
  if (review.recommendedUsage === "not_recommended") {
    riskFlags.push({
      category: "unclear_media_quality",
      level: "warning",
      message: "Quality is unlikely to carry a post.",
      nextHumanAction: "Suggest a reshoot or save as filler.",
    });
  }
  const canCaption =
    review.recommendedUsage === "use_now" ||
    review.recommendedUsage === "save_for_later";
  return {
    agentName: "media_review",
    category: "media_review",
    status: review.status,
    confidenceLevel: confidenceFromScore(review.mediaQualityScore, hasContext),
    sourceInputs: ["Uploaded media", "Submission description", "Submission status"],
    outputSummary: `${review.qualityLabel} · ${review.note}`,
    recommendedNextAction: canCaption
      ? "Move to caption drafting after a quick team check."
      : "Ask the client for context before drafting.",
    humanApprovalRequired: true,
    approvalGate: "media_before_use",
    riskFlags,
    automationReadiness: canCaption
      ? readinessFromStatus(review.status)
      : "blocked",
  };
}

export type AiContentDecisionMoment =
  | "lunch"
  | "dinner"
  | "weekend"
  | "family meal"
  | "special/menu feature"
  | "behind-the-scenes"
  | "trust/story";

/** Content Strategist Agent — angle + decision moment + supporting caption. */
export function contentAngleOutput(
  submission: ClientTeamSubmission,
): AiAgentOutput & {
  decisionMoment: AiContentDecisionMoment;
  supportingCaptionIdea: string;
} {
  const seed = stableHash(submission.id);
  const moments: AiContentDecisionMoment[] = [
    "lunch",
    "dinner",
    "weekend",
    "family meal",
    "special/menu feature",
    "behind-the-scenes",
    "trust/story",
  ];
  const decisionMoment = moments[seed % moments.length];
  const angle = recommendedAngleForItemSeed(seed) ;
  const hasContext = submission.description.trim().length >= 30;
  const status = statusFromSubmission(submission.status);
  return {
    agentName: "content_strategist",
    category: "content_angle",
    status,
    confidenceLevel: hasContext ? "medium" : "low",
    sourceInputs: ["Media review", "Submission description", "Restaurant focus"],
    outputSummary: `Angle: ${angle} (decision moment: ${decisionMoment}).`,
    recommendedNextAction: "Confirm the angle, then draft captions for review.",
    humanApprovalRequired: true,
    approvalGate: "content_before_scheduling",
    riskFlags: hasContext
      ? []
      : [
          {
            category: "missing_client_context",
            level: "info",
            message: "Limited context — angle is a best guess.",
            nextHumanAction: "Confirm the dish/occasion with the client.",
            clientInputRequired: true,
          },
        ],
    automationReadiness: hasContext ? "needs_review" : "blocked",
    decisionMoment,
    supportingCaptionIdea:
      "Keep it short and owner-voiced; one clear invitation to visit or order.",
  };
}

function recommendedAngleForItemSeed(seed: number): string {
  return [
    "Hero dish, single-frame, weekend feature.",
    "Behind-the-scenes kitchen clip, short and vertical.",
    "Carousel: 3 customer favourites, one caption.",
    "Local-moment shot with calm, owner-voice caption.",
  ][seed % 4];
}

// Claim-risk language the caption agent must never invent unless provided.
const CLAIM_RISK_TERMS = [
  "halal",
  "authentic",
  "family-owned",
  "best",
  "guaranteed",
  "discount",
  "% off",
  "free",
];

/** Caption Draft Agent — 2–3 short drafts + claim-risk + missing-info checks. */
export function captionDraftOutput(
  submission: ClientTeamSubmission,
): AiAgentOutput & { captionDrafts: string[] } {
  const hasContext = submission.description.trim().length >= 30;
  const provided = submission.description.toLowerCase();
  const captionDrafts = [
    "Fresh from our kitchen today — come taste what everyone's talking about.",
    "Made to order, served with care. Stop in this week.",
    "A little something we're proud of. See you soon.",
  ];
  const claimRisks = CLAIM_RISK_TERMS.filter((t) => provided.includes(t));
  const riskFlags: AiCategorizedRiskFlag[] = [];
  if (claimRisks.length > 0) {
    riskFlags.push({
      category: "claim_risk",
      level: "warning",
      message: `Possible claim to verify: ${claimRisks.join(", ")}.`,
      nextHumanAction: "Confirm the claim with the client before publishing.",
    });
  }
  if (!hasContext) {
    riskFlags.push({
      category: "missing_client_context",
      level: "info",
      message: "Drafts are generic without specifics.",
      nextHumanAction: "Add the dish name/occasion to personalize.",
      clientInputRequired: true,
    });
  }
  return {
    agentName: "caption_draft",
    category: "caption_draft",
    status: statusFromSubmission(submission.status),
    confidenceLevel: hasContext ? "medium" : "low",
    sourceInputs: ["Content angle", "Submission description"],
    outputSummary: `${captionDrafts.length} caption drafts prepared. No specials, discounts, or menu items invented.`,
    recommendedNextAction:
      "Pick or edit one draft, confirm any claims, then approve for scheduling.",
    humanApprovalRequired: true,
    approvalGate: "claim_before_public_use",
    riskFlags,
    automationReadiness: riskFlags.some((r) => r.level === "warning")
      ? "needs_review"
      : "ready",
    captionDrafts,
  };
}

/** Scheduling Recommendation Agent — window + reason + readiness + gate. */
export function scheduleRecommendationOutput(
  item: TeamWorkItem,
): AiAgentOutput & { recommendedPostWindow: string; contentType: string } {
  const seed = stableHash(item.submissionId);
  const windows = [
    "Thu 11:30am (pre-lunch)",
    "Fri 5:00pm (weekend warm-up)",
    "Sat 10:00am (brunch crowd)",
    "Sun 4:00pm (family dinner planning)",
  ];
  const recommendedPostWindow = windows[seed % windows.length];
  const blocked = item.teamWorkStatus === "waiting_on_client";
  const riskFlags: AiCategorizedRiskFlag[] = [];
  if (blocked) {
    riskFlags.push({
      category: "blocked_workflow",
      level: "warning",
      message: "Missing media or context — cannot schedule yet.",
      nextHumanAction: "Resolve the client follow-up first.",
      clientInputRequired: true,
    });
  }
  return {
    agentName: "scheduling_recommendation",
    category: "schedule_recommendation",
    status: blocked ? "blocked" : "needs_human_review",
    confidenceLevel: "medium",
    sourceInputs: ["Approved content", "Posting cadence", "Work item status"],
    outputSummary: `Suggested window: ${recommendedPostWindow}.`,
    recommendedNextAction: blocked
      ? "Unblock the item, then re-check the schedule."
      : "Approve the content, then confirm this posting window.",
    humanApprovalRequired: true,
    approvalGate: "content_before_scheduling",
    riskFlags,
    automationReadiness: blocked ? "blocked" : "needs_review",
    recommendedPostWindow,
    contentType: item.workType === "media_review" ? "Photo/video post" : "Content post",
  };
}

/** Reporting Draft Agent — structured envelope around previewReportDraft. */
export function reportDraftOutput(input: {
  reportTitle: string;
  cadence: "weekly" | "monthly";
  hasPublishedPosts: boolean;
  hasMetrics: boolean;
  sourceWorkItemTitles?: string[];
}): AiAgentOutput & {
  clientSafeSummary: string;
  teamOnlyMissingDataFlags: string[];
  sourceWorkItems: string[];
} {
  const draft = previewReportDraft(input);
  const riskFlags: AiCategorizedRiskFlag[] = [];
  if (!input.hasMetrics) {
    riskFlags.push({
      category: "report_metrics_missing",
      level: "info",
      message: "Performance metrics are not connected yet.",
      nextHumanAction: "Verify workflow activity; note metrics pending.",
    });
  }
  return {
    agentName: "reporting_draft",
    category: "report_draft",
    status: draft.status,
    confidenceLevel: input.hasMetrics ? "medium" : "low",
    sourceInputs: ["Completed work items", "Posting activity", "Cadence"],
    outputSummary: draft.draftSummary,
    recommendedNextAction:
      "Verify the draft against the work log, then mark ready for client.",
    humanApprovalRequired: true,
    approvalGate: "report_before_client_visible",
    riskFlags,
    automationReadiness: readinessFromStatus(draft.status),
    clientSafeSummary:
      input.cadence === "weekly"
        ? "Veroxa is preparing your weekly update. The team is reviewing it before it's shared."
        : "Veroxa is preparing your monthly summary. The team is reviewing it before it's shared.",
    teamOnlyMissingDataFlags: draft.missingDataFlags,
    sourceWorkItems: input.sourceWorkItemTitles ?? [],
  };
}

/** Risk / Blocker Agent — categorized flags across all items. */
export function categorizedRiskFlags(
  items: TeamWorkItem[],
): AiCategorizedRiskFlag[] {
  const flags: AiCategorizedRiskFlag[] = [];
  for (const item of items) {
    if (item.teamWorkStatus === "waiting_on_client") {
      flags.push({
        category: "client_response_needed",
        level: "warning",
        message: `"${item.title}" is waiting on the client.`,
        nextHumanAction: "Send a short, specific follow-up.",
        clientInputRequired: true,
      });
    } else if (item.priority === "urgent") {
      flags.push({
        category: "approval_required",
        level: "critical",
        message: `"${item.title}" is urgent and may slip.`,
        nextHumanAction: "Pull into today's queue and confirm owner.",
      });
    } else if (
      item.priority === "high" &&
      item.teamWorkStatus === "ready_for_team"
    ) {
      flags.push({
        category: "blocked_workflow",
        level: "warning",
        message: `"${item.title}" is high-priority but unstarted.`,
        nextHumanAction: "Assign an owner and start within 24 hours.",
      });
    } else if (item.teamWorkStatus === "ready_for_review") {
      flags.push({
        category: "approval_required",
        level: "info",
        message: `"${item.title}" is ready for team review.`,
        nextHumanAction: "Approve, revise, or send back to the client.",
      });
    }
  }
  return flags;
}

/** Next Best Action — single highest-leverage recommendation for the team. */
export function nextBestAction(items: TeamWorkItem[]): AiAgentOutput {
  const flags = categorizedRiskFlags(items);
  const critical = flags.find((f) => f.level === "critical");
  const warning = flags.find((f) => f.level === "warning");
  const chosen = critical ?? warning ?? flags[0];
  return {
    agentName: "team_operator_assistant",
    category: "next_best_action",
    status: chosen ? "needs_human_review" : "ready",
    confidenceLevel: "high",
    sourceInputs: ["All open work items", "Risk flags", "Priorities"],
    outputSummary: chosen
      ? chosen.message
      : "Queue is clear — focus on weekly reporting and capture planning.",
    recommendedNextAction: chosen
      ? chosen.nextHumanAction
      : "Plan next week's content capture.",
    humanApprovalRequired: true,
    riskFlags: chosen ? [chosen] : [],
    automationReadiness: "not_applicable",
  };
}

// ---------------------------------------------------------------------------
// Re-exports for ergonomic imports at call sites.
// ---------------------------------------------------------------------------

export type {
  AiAgentName,
  AiAgentStatus,
  AiClientUpdateDraft,
  AiMediaReviewOutput,
  AiMediaUsageRecommendation,
  AiOperatorAssistantSnapshot,
  AiReportSummaryDraft,
  AiRiskFlag,
  AiRiskLevel,
  AiWorkItemPreview,
  ClientTeamSubmissionPriority,
};
