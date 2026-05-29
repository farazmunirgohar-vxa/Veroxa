/**
 * retentionRiskEngine.ts — detect fixable retention risks, never blame.
 *
 * SAFETY / SCOPE:
 *   - Deterministic detection from execution signals. No network, no writes,
 *     no auto-send/call/message, no guarantees.
 *   - Every risk carries SPLIT wording: a full team-only note and a calm,
 *     respectful, blame-free client-safe message. Risk is framed as "a few
 *     inputs needed", never the client's fault.
 *   - Sensitive items flag humanApprovalRequired — AI never decides a client
 *     relationship; a human always does.
 */

import {
  RETENTION_RISK_LEVEL_LABELS,
  RETENTION_RISK_REASON_LABELS,
  type RetentionRiskItem,
  type RetentionRiskLevel,
  type RetentionRiskReason,
  type RetentionRiskScore,
} from "./executionIntelligenceTypes";

const clamp = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));

/** Signals the retention engine reasons over (already 0..100 where noted). */
export interface RetentionInputs {
  mediaSupplyScore: number;
  accessProvidedPct: number;
  cooperationScore: number;
  workCompletionScore: number;
  reportingScore: number;
  blockedItems: number;
  needsClientClarification: number;
  unansweredClientRequests: number;
  responseSpeed: number;
  onboardingCompletePct: number;
  possibleGuaranteeExpectation: boolean;
  lastActivityLabel: string;
}

function mkItem(
  reason: RetentionRiskReason,
  level: RetentionRiskLevel,
  teamNote: string,
  clientSafeMessage: string,
  recommendedAction: string,
  humanApprovalRequired: boolean,
): RetentionRiskItem {
  return {
    reason,
    reasonLabel: RETENTION_RISK_REASON_LABELS[reason],
    level,
    levelLabel: RETENTION_RISK_LEVEL_LABELS[level],
    teamNote,
    clientSafeMessage,
    recommendedAction,
    humanApprovalRequired,
  };
}

/** Detect the individual, fixable risk items present in the signals. */
export function detectRetentionRisks(input: RetentionInputs): RetentionRiskItem[] {
  const items: RetentionRiskItem[] = [];

  if (input.mediaSupplyScore < 50) {
    const level: RetentionRiskLevel =
      input.mediaSupplyScore < 30 ? "elevated" : "watch";
    items.push(
      mkItem(
        "client_not_uploading_media",
        level,
        `Media supply score ${input.mediaSupplyScore}/100 — runway is thinning, content cadence at risk.`,
        "Veroxa needs a few more inputs to keep your online presence moving — please upload 3–5 photos/videos this week.",
        "Send a friendly media request and offer a quick reshoot if helpful.",
        false,
      ),
    );
  }

  if (input.accessProvidedPct < 60) {
    const level: RetentionRiskLevel =
      input.accessProvidedPct < 35 ? "high" : "elevated";
    items.push(
      mkItem(
        "access_not_provided",
        level,
        `Only ${input.accessProvidedPct}% of required access provided — setup/execution is partially blocked.`,
        "Please provide access so Veroxa can complete setup and keep things moving.",
        "Confirm exactly which access is outstanding and resend a simple how-to.",
        true,
      ),
    );
  }

  if (input.possibleGuaranteeExpectation) {
    items.push(
      mkItem(
        "wants_guarantees",
        "elevated",
        "Possible expectation of guaranteed results — expectation alignment needed before it becomes a churn driver.",
        "Veroxa focuses on consistent improvement to your online presence over time.",
        "Have a calm expectation-setting conversation; document agreed scope.",
        true,
      ),
    );
  }

  if (input.onboardingCompletePct < 70) {
    items.push(
      mkItem(
        "unclear_expectations",
        input.onboardingCompletePct < 50 ? "elevated" : "watch",
        `Onboarding only ${input.onboardingCompletePct}% complete — expectations/scope may be unclear.`,
        "A couple of onboarding steps remain — finishing them helps Veroxa tailor your content.",
        "Walk the client through the remaining onboarding steps.",
        false,
      ),
    );
  }

  if (/days? ago|no activity/i.test(input.lastActivityLabel) || input.responseSpeed < 45) {
    items.push(
      mkItem(
        "no_response",
        input.responseSpeed < 30 ? "elevated" : "watch",
        `Quiet client — response speed ${input.responseSpeed}/100, last activity "${input.lastActivityLabel}".`,
        "Checking in — let us know if there's anything you need from Veroxa this week.",
        "Send a warm check-in; vary the channel if there's no reply.",
        true,
      ),
    );
  }

  if (input.unansweredClientRequests > 0) {
    items.push(
      mkItem(
        "slow_approval",
        "watch",
        `${input.unansweredClientRequests} client request(s) still awaiting resolution.`,
        "We're on your open requests — we'll follow up shortly.",
        "Resolve or acknowledge the open client requests.",
        false,
      ),
    );
  }

  if (input.reportingScore < 55) {
    items.push(
      mkItem(
        "reporting_gap",
        input.reportingScore < 35 ? "elevated" : "watch",
        `Reporting score ${input.reportingScore}/100 — a reporting gap could erode trust.`,
        "Your next progress update is being prepared.",
        "Prepare/refresh the report so progress is visible.",
        false,
      ),
    );
  }

  if (input.blockedItems > 0) {
    items.push(
      mkItem(
        "execution_blocked",
        input.blockedItems > 2 ? "elevated" : "watch",
        `${input.blockedItems} work item(s) blocked — execution is stalled until unblocked.`,
        "A few items are paused while we line up what's needed — we'll keep you posted.",
        "Identify each blocker and the single input needed to clear it.",
        false,
      ),
    );
  }

  return items;
}

/** Worst level present across items, defaulting to low. */
function aggregateLevel(items: RetentionRiskItem[]): RetentionRiskLevel {
  const order: RetentionRiskLevel[] = ["low", "watch", "elevated", "high"];
  let worst: RetentionRiskLevel = "low";
  for (const it of items) {
    if (order.indexOf(it.level) > order.indexOf(worst)) worst = it.level;
  }
  return worst;
}

/**
 * Build the aggregate RetentionRiskScore (0..100, higher = MORE risk) plus the
 * detected items. When no measurable signals exist yet, the score is cautious
 * and the note says so.
 */
export function buildRetentionRisk(input: RetentionInputs): RetentionRiskScore {
  const items = detectRetentionRisks(input);

  const levelWeight: Record<RetentionRiskLevel, number> = {
    low: 0,
    watch: 14,
    elevated: 26,
    high: 40,
  };
  const raw = items.reduce((sum, it) => sum + levelWeight[it.level], 0);
  const score = clamp(Math.min(100, raw));
  const level = items.length === 0 ? "low" : aggregateLevel(items);

  const note =
    items.length === 0
      ? "No measurable retention risks yet — keep logging execution signals."
      : `${items.length} fixable signal(s) detected. Risk is framed as inputs needed, not the client's fault.`;

  return {
    score,
    level,
    levelLabel: RETENTION_RISK_LEVEL_LABELS[level],
    label: RETENTION_RISK_LEVEL_LABELS[level],
    note,
    items,
  };
}
