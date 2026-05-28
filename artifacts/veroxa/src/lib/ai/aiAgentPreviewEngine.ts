/**
 * aiAgentPreviewEngine.ts — rule-based, deterministic AI preview layer.
 *
 * SIMULATED ONLY. No live model calls, no network, no Supabase, no writes.
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
