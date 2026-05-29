/**
 * executionScoringEngine.ts — deterministic execution-health scoring.
 *
 * SAFETY / SCOPE:
 *   - Pure, rule-based scoring. No network, no writes, no model calls, no
 *     auto-send/call/message, no payments, no guarantees.
 *   - Produces a production-shaped ExecutionIntelligenceProfile per client from a
 *     normalized ExecutionSignalInput. An adapter builds that input from the
 *     current local fixtures so a real backend can later swap the adapter only.
 *   - Risk detail is team-only; client-safe wording is calm and blame-free.
 *     A human always decides on retention / sensitive client comms.
 */

import {
  demoClientHealth,
  type DemoClientHealth,
} from "@/data/demo/demoClientHealth";
import {
  demoMediaRunway,
  type DemoMediaRunway,
} from "@/data/demo/demoMediaAssets";
import { clientTeamWorkRepository } from "@/lib/repositories";
import { getRestaurantName } from "@/data/demoData";
import {
  buildRetentionRisk,
  type RetentionInputs,
} from "./retentionRiskEngine";
import { classifyClientSuccessFit } from "./clientSuccessFitEngine";
import type {
  ClientSuccessFitScore,
  ExecutionComplianceFlag,
  ExecutionHealthScore,
  ExecutionIntelligenceProfile,
  ExecutionNextAction,
  ExecutionScoreDimensions,
  RetentionRiskScore,
} from "./executionIntelligenceTypes";
import {
  EXECUTION_NEXT_ACTION_LABELS,
  type ExecutionNextActionKind,
} from "./executionIntelligenceTypes";

const clamp = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));

// ---------------------------------------------------------------------------
// Normalized input — what the scoring engine needs, decoupled from fixtures.
// ---------------------------------------------------------------------------

export interface ExecutionSignalInput {
  clientId: string;
  restaurantName: string;
  /** 0..100 onboarding completion. */
  onboardingCompletePct: number;
  /** 0..100 share of required account access provided. */
  accessProvidedPct: number;
  mediaUnusedPhotos: number;
  mediaUnusedVideos: number;
  mediaRunwayDays: number;
  mediaHealth: DemoMediaRunway["health"];
  postingConsistency: "good" | "warn" | "bad";
  googleVisibilityScore: number;
  googleTrend: "up" | "flat" | "down";
  reviewActivityRecent: number;
  reportStatus: DemoClientHealth["signals"]["reportStatus"];
  /** Workflow-derived counts. */
  openSubmissions: number;
  blockedItems: number;
  needsClientClarification: number;
  inProgress: number;
  completedItems: number;
  aiDraftsPrepared: number;
  humanApprovalsRecent: number;
  unansweredClientRequests: number;
  /** Human-readable last-activity hint (used for "quiet" detection). */
  lastActivityLabel: string;
  /** Cautious flag: client may expect guaranteed results (from sales notes). */
  possibleGuaranteeExpectation?: boolean;
}

// ---------------------------------------------------------------------------
// Sub-score helpers — each 0..100, deterministic.
// ---------------------------------------------------------------------------

function reportConsistencyScore(
  status: ExecutionSignalInput["reportStatus"],
): number {
  switch (status) {
    case "Approved":
      return 95;
    case "Pending":
      return 70;
    case "Draft":
      return 55;
    case "Overdue":
      return 25;
  }
}

function mediaSupplyScoreValue(input: ExecutionSignalInput): number {
  const byHealth =
    input.mediaHealth === "Healthy"
      ? 90
      : input.mediaHealth === "Low"
        ? 55
        : 25;
  const runwayBonus = Math.min(10, Math.round(input.mediaRunwayDays / 3));
  return clamp(byHealth + runwayBonus - (input.mediaUnusedVideos === 0 ? 5 : 0));
}

function cooperationScoreValue(input: ExecutionSignalInput): number {
  let s = 70;
  if (input.unansweredClientRequests > 0) s -= input.unansweredClientRequests * 12;
  if (input.needsClientClarification > 0) s -= input.needsClientClarification * 8;
  if (input.postingConsistency === "good") s += 10;
  if (input.postingConsistency === "bad") s -= 10;
  if (/days? ago|no activity/i.test(input.lastActivityLabel)) s -= 15;
  if (/today/i.test(input.lastActivityLabel)) s += 8;
  return clamp(s);
}

function workCompletionScoreValue(input: ExecutionSignalInput): number {
  const totalTracked =
    input.completedItems +
    input.inProgress +
    input.blockedItems +
    input.openSubmissions;
  if (totalTracked === 0) return 60;
  const completedRatio = input.completedItems / totalTracked;
  const blockedPenalty = input.blockedItems * 8;
  return clamp(40 + completedRatio * 60 - blockedPenalty);
}

function approvalSpeedScoreValue(input: ExecutionSignalInput): number {
  // Many drafts prepared but few approvals = bottleneck (lower score).
  if (input.aiDraftsPrepared === 0) return 70;
  const ratio = input.humanApprovalsRecent / input.aiDraftsPrepared;
  return clamp(35 + ratio * 60);
}

function aiDraftUsageScoreValue(input: ExecutionSignalInput): number {
  if (input.aiDraftsPrepared === 0) return 50;
  const used = Math.min(input.humanApprovalsRecent, input.aiDraftsPrepared);
  return clamp(40 + (used / input.aiDraftsPrepared) * 55);
}

function onlinePresenceScoreValue(input: ExecutionSignalInput): number {
  const trendAdj =
    input.googleTrend === "up" ? 8 : input.googleTrend === "down" ? -8 : 0;
  const reviewAdj = Math.min(10, input.reviewActivityRecent * 3);
  return clamp(input.googleVisibilityScore + trendAdj + reviewAdj);
}

function websiteSocialSetupScoreValue(input: ExecutionSignalInput): number {
  // Approximate setup progress from onboarding + access + presence.
  return clamp(
    input.onboardingCompletePct * 0.5 +
      input.accessProvidedPct * 0.3 +
      onlinePresenceScoreValue(input) * 0.2,
  );
}

function responseSpeedScoreValue(input: ExecutionSignalInput): number {
  let s = 75;
  if (/today/i.test(input.lastActivityLabel)) s += 10;
  if (/yesterday/i.test(input.lastActivityLabel)) s -= 0;
  if (/days? ago|no activity/i.test(input.lastActivityLabel)) s -= 25;
  s -= input.unansweredClientRequests * 8;
  return clamp(s);
}

function renewalLikelihoodValue(
  dims: ExecutionScoreDimensions,
  retentionRisk: number,
): number {
  const positives =
    dims.mediaUploadConsistency * 0.18 +
    dims.accessCompletion * 0.14 +
    dims.workQueueCompletion * 0.16 +
    dims.reportingConsistency * 0.14 +
    dims.clientResponseSpeed * 0.12 +
    dims.onboardingCompletion * 0.1 +
    dims.googleProfileProgress * 0.16;
  return clamp(positives - retentionRisk * 0.3);
}

function executionHealthValue(dims: ExecutionScoreDimensions): number {
  return clamp(
    dims.onboardingCompletion * 0.1 +
      dims.accessCompletion * 0.12 +
      dims.mediaUploadConsistency * 0.16 +
      dims.clientResponseSpeed * 0.1 +
      dims.workQueueCompletion * 0.16 +
      dims.humanApprovalSpeed * 0.08 +
      dims.reportingConsistency * 0.12 +
      dims.googleProfileProgress * 0.1 +
      dims.websiteSocialSetupProgress * 0.06,
  );
}

function band(score: number, good = 75, ok = 50): string {
  if (score >= good) return "Strong";
  if (score >= ok) return "Steady";
  return "Needs attention";
}

// ---------------------------------------------------------------------------
// Main analyzer.
// ---------------------------------------------------------------------------

export function analyzeExecutionIntelligence(
  input: ExecutionSignalInput,
): ExecutionIntelligenceProfile {
  const mediaSupply = mediaSupplyScoreValue(input);
  const cooperation = cooperationScoreValue(input);
  const workCompletion = workCompletionScoreValue(input);
  const approvalSpeed = approvalSpeedScoreValue(input);
  const aiDraftUsage = aiDraftUsageScoreValue(input);
  const onlinePresence = onlinePresenceScoreValue(input);
  const reporting = reportConsistencyScore(input.reportStatus);
  const responseSpeed = responseSpeedScoreValue(input);
  const websiteSocial = websiteSocialSetupScoreValue(input);

  // Retention risk engine drives the risk dimension + items.
  const retentionInputs: RetentionInputs = {
    mediaSupplyScore: mediaSupply,
    accessProvidedPct: input.accessProvidedPct,
    cooperationScore: cooperation,
    workCompletionScore: workCompletion,
    reportingScore: reporting,
    blockedItems: input.blockedItems,
    needsClientClarification: input.needsClientClarification,
    unansweredClientRequests: input.unansweredClientRequests,
    responseSpeed: responseSpeed,
    onboardingCompletePct: input.onboardingCompletePct,
    possibleGuaranteeExpectation: input.possibleGuaranteeExpectation ?? false,
    lastActivityLabel: input.lastActivityLabel,
  };
  const retention: RetentionRiskScore = buildRetentionRisk(retentionInputs);

  const dimensions: ExecutionScoreDimensions = {
    onboardingCompletion: clamp(input.onboardingCompletePct),
    accessCompletion: clamp(input.accessProvidedPct),
    mediaUploadConsistency: mediaSupply,
    clientResponseSpeed: responseSpeed,
    workQueueCompletion: workCompletion,
    aiDraftUsage,
    humanApprovalSpeed: approvalSpeed,
    reportingConsistency: reporting,
    googleProfileProgress: onlinePresence,
    websiteSocialSetupProgress: websiteSocial,
    retentionRisk: retention.score,
    renewalLikelihood: 0, // filled below
  };

  const renewalLikelihood = renewalLikelihoodValue(dimensions, retention.score);
  dimensions.renewalLikelihood = renewalLikelihood;

  const execHealthValue = executionHealthValue(dimensions);
  const executionHealth: ExecutionHealthScore = {
    score: execHealthValue,
    label: band(execHealthValue),
    note: `Blended execution health across onboarding, media, work completion, reporting, and presence. ${band(
      execHealthValue,
    )} this week.`,
  };

  const clientSuccessFit: ClientSuccessFitScore = classifyClientSuccessFit({
    executionHealth: execHealthValue,
    cooperationScore: cooperation,
    mediaSupplyScore: mediaSupply,
    accessProvidedPct: input.accessProvidedPct,
    retentionRisk: retention.score,
    onlinePresenceScore: onlinePresence,
    possibleGuaranteeExpectation: input.possibleGuaranteeExpectation ?? false,
  });

  const nextBestAction = pickNextBestAction(input, {
    mediaSupply,
    access: input.accessProvidedPct,
    approvalSpeed,
    reporting,
    onlinePresence,
    retentionLevel: retention.level,
    cooperation,
  });

  const blockedWorkSummary =
    input.blockedItems > 0
      ? `${input.blockedItems} item(s) blocked${
          input.needsClientClarification > 0
            ? `, ${input.needsClientClarification} waiting on client input`
            : ""
        }.`
      : "No blocked work right now.";

  const fixThisWeek = buildFixThisWeek(input, {
    mediaSupply,
    access: input.accessProvidedPct,
    approvalSpeed,
    reporting,
    blocked: input.blockedItems,
  });

  const clientNeedsToProvide = buildClientNeeds(input, { mediaSupply });
  const teamNeedsToApprove = buildTeamApprovals(input, { approvalSpeed });

  const complianceFlags: ExecutionComplianceFlag[] = [
    { type: "no_auto_send", note: "Nothing is sent, called, messaged, or posted automatically." },
    { type: "human_review_required", note: "Retention and sensitive client comms require human review." },
    { type: "no_client_blame", note: "Risk is framed as fixable inputs, never the client's fault." },
    { type: "risk_language_team_only", note: "Full risk detail and internal notes stay team-only." },
    { type: "respectful_client_requests", note: "Client-facing requests stay calm and respectful." },
    { type: "no_performance_guarantee", note: "No ranking, walk-in, revenue, or sales guarantees." },
  ];

  return {
    clientId: input.clientId,
    restaurantName: input.restaurantName,
    dimensions,
    executionHealth,
    clientSuccessFit,
    retention,
    cooperation: {
      score: cooperation,
      label: band(cooperation),
      note: "How smoothly the client is collaborating (responses, clarity, cadence).",
    },
    mediaSupply: {
      score: mediaSupply,
      label: band(mediaSupply),
      note: `Media runway ~${input.mediaRunwayDays} day(s); ${input.mediaUnusedPhotos} photo(s), ${input.mediaUnusedVideos} video(s) ready.`,
    },
    access: {
      score: clamp(input.accessProvidedPct),
      label: band(input.accessProvidedPct),
      note: "Share of required account access provided for setup/execution.",
    },
    workCompletion: {
      score: workCompletion,
      label: band(workCompletion),
      note: "How much of the active work is moving through to completion.",
    },
    reporting: {
      score: reporting,
      label: band(reporting),
      note: `Latest report status: ${input.reportStatus}.`,
    },
    onlinePresence: {
      score: onlinePresence,
      label: band(onlinePresence),
      note: "Cautious view of online-presence improvement (profile + reviews).",
    },
    renewalLikelihood,
    renewalLikelihoodLabel: band(renewalLikelihood, 70, 45),
    blockedWorkSummary,
    nextBestAction,
    fixThisWeek,
    clientNeedsToProvide,
    teamNeedsToApprove,
    complianceFlags,
  };
}

interface NextActionSignals {
  mediaSupply: number;
  access: number;
  approvalSpeed: number;
  reporting: number;
  onlinePresence: number;
  retentionLevel: RetentionRiskScore["level"];
  cooperation: number;
}

function mkAction(
  kind: ExecutionNextActionKind,
  detail: string,
  requiresHumanReview: boolean,
): ExecutionNextAction {
  return {
    kind,
    label: EXECUTION_NEXT_ACTION_LABELS[kind],
    detail,
    requiresHumanReview,
  };
}

function pickNextBestAction(
  input: ExecutionSignalInput,
  s: NextActionSignals,
): ExecutionNextAction {
  if (input.accessProvidedPct < 60) {
    return mkAction(
      "request_access",
      "Ask the client to provide remaining account access so Veroxa can complete setup.",
      true,
    );
  }
  if (s.mediaSupply < 50) {
    return mkAction(
      "request_media",
      "Invite the client to upload 3–5 fresh photos/videos this week to keep content moving.",
      true,
    );
  }
  if (s.retentionLevel === "high" || s.retentionLevel === "elevated") {
    return mkAction(
      "schedule_check_in",
      "Schedule a friendly check-in to align on next steps and expectations.",
      true,
    );
  }
  if (s.approvalSpeed < 55) {
    return mkAction(
      "approve_draft",
      "Clear the approval backlog so prepared content can be scheduled.",
      true,
    );
  }
  if (s.reporting < 55) {
    return mkAction(
      "prepare_report",
      "Prepare/refresh the report so the client sees recent progress.",
      true,
    );
  }
  if (s.onlinePresence < 60) {
    return mkAction(
      "complete_google_task",
      "Complete the next Google profile improvement task.",
      false,
    );
  }
  return mkAction(
    "keep_executing",
    "Execution is healthy — keep the current cadence and log outcomes.",
    false,
  );
}

function buildFixThisWeek(
  input: ExecutionSignalInput,
  s: { mediaSupply: number; access: number; approvalSpeed: number; reporting: number; blocked: number },
): string[] {
  const out: string[] = [];
  if (s.access < 60) out.push("Follow up on missing account access (team-only).");
  if (s.mediaSupply < 50) out.push("Refresh the media supply — request a small batch.");
  if (s.approvalSpeed < 55) out.push("Clear the approval backlog on prepared drafts.");
  if (s.reporting < 55) out.push("Close the reporting gap for this client.");
  if (s.blocked > 0) out.push(`Unblock ${s.blocked} stalled item(s).`);
  if (out.length === 0) out.push("Maintain cadence; no urgent fixes this week.");
  return out;
}

function buildClientNeeds(
  input: ExecutionSignalInput,
  s: { mediaSupply: number },
): string[] {
  const out: string[] = [];
  if (input.accessProvidedPct < 60)
    out.push("Provide access so Veroxa can complete setup.");
  if (s.mediaSupply < 50)
    out.push("Upload 3–5 photos/videos this week.");
  if (input.needsClientClarification > 0)
    out.push("Reply to the open clarification when you can.");
  if (out.length === 0)
    out.push("Nothing needed this week — Veroxa has what it needs.");
  return out;
}

function buildTeamApprovals(
  input: ExecutionSignalInput,
  s: { approvalSpeed: number },
): string[] {
  const out: string[] = [];
  if (input.aiDraftsPrepared > input.humanApprovalsRecent)
    out.push(`Review ${input.aiDraftsPrepared - input.humanApprovalsRecent} prepared draft(s).`);
  if (input.reportStatus === "Pending" || input.reportStatus === "Draft")
    out.push("Validate the pending report before it goes out.");
  if (out.length === 0) out.push("No approvals pending.");
  return out;
}

// ---------------------------------------------------------------------------
// Adapter — build a normalized input from the current local fixtures.
// A real backend would replace ONLY this adapter.
// ---------------------------------------------------------------------------

export function executionInputFromClientId(
  clientId: string,
): ExecutionSignalInput {
  const health = demoClientHealth.find((c) => c.clientId === clientId);
  const runway = demoMediaRunway.find((r) => r.clientId === clientId);
  const subs = clientTeamWorkRepository.getClientSubmissions(clientId);

  const blockedItems = subs.filter((s) => s.status === "blocked").length;
  const needsClientClarification = subs.filter(
    (s) => s.status === "needs_client_clarification",
  ).length;
  const inProgress = subs.filter(
    (s) => s.status === "in_progress" || s.status === "accepted",
  ).length;
  const completedItems = subs.filter((s) => s.status === "completed").length;
  const openSubmissions = subs.filter(
    (s) => s.status === "new" || s.status === "needs_review",
  ).length;
  const aiDraftsPrepared = subs.filter(
    (s) => s.workType === "content" || s.workType === "media_review",
  ).length;
  const humanApprovalsRecent = completedItems;
  const unansweredClientRequests = subs.filter(
    (s) => s.submittedBy === "client" && s.status === "needs_client_clarification",
  ).length;

  return {
    clientId,
    restaurantName: getRestaurantName(clientId),
    onboardingCompletePct: health?.signals.onboardingComplete ?? 70,
    accessProvidedPct: Math.min(100, (health?.signals.onboardingComplete ?? 70) + 5),
    mediaUnusedPhotos: runway?.unusedPhotos ?? 0,
    mediaUnusedVideos: runway?.unusedVideos ?? 0,
    mediaRunwayDays: runway?.daysRemaining ?? 14,
    mediaHealth: runway?.health ?? "Low",
    postingConsistency: health?.signals.postingConsistency.status ?? "warn",
    googleVisibilityScore: health?.signals.googleVisibility.score ?? 60,
    googleTrend: health?.signals.googleVisibility.trend ?? "flat",
    reviewActivityRecent: health?.signals.reviewActivity.recent ?? 0,
    reportStatus: health?.signals.reportStatus ?? "Draft",
    openSubmissions,
    blockedItems,
    needsClientClarification,
    inProgress,
    completedItems,
    aiDraftsPrepared,
    humanApprovalsRecent,
    unansweredClientRequests,
    lastActivityLabel: health?.lastActivity ?? "",
    possibleGuaranteeExpectation: false,
  };
}

/** All known demo clients, scored. A real backend would page over clients. */
export function allClientExecutionProfiles(): ExecutionIntelligenceProfile[] {
  return demoClientHealth
    .map((c) => analyzeExecutionIntelligence(executionInputFromClientId(c.clientId)))
    .sort((a, b) => b.retention.score - a.retention.score);
}
