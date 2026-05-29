/**
 * selfImprovingLeadEngine.ts — cautious, outcome-driven score adjustments.
 *
 * SAFETY / SCOPE:
 *   - Deterministic. Takes the base intelligence score plus logged outcomes
 *     and produces a SMALL, bounded adjustment with an explicit confidence
 *     label. No network, no writes, no model calls.
 *   - Anti-overfit by design: adjustments are capped, only apply once a minimum
 *     sample exists, and are labelled "early / low confidence" until the sample
 *     grows. The system suggests; a human always decides.
 *   - Language stays cautious: segments/angles that convert less are "weaker so
 *     far", never "bad". Nothing here is a guarantee.
 */

import type {
  ConversionOpportunityScore,
  LeadIntelligenceProfile,
  LeadSegment,
} from "./leadIntelligenceTypes";
import { OUTREACH_ANGLE_LABELS } from "./leadIntelligenceTypes";
import {
  computeLearningSignals,
  segmentLearning,
  LEARNING_THRESHOLDS,
  type LearningConfidence,
  type LearningSignals,
} from "./leadLearningSignals";
import type { LeadOutcomeRecord } from "./leadOutcomeTypes";
import {
  retentionRateBySegment,
  type ExecutionOutcomeRecord,
} from "@/lib/executionIntelligence/executionLearningSignals";

/** Maximum the learning layer is ever allowed to move a score, in points. */
export const MAX_SCORE_ADJUSTMENT = 10;

/** Baseline conversion rate we compare a segment against (0..1). */
const BASELINE_CONVERSION = 0.25;

export interface ScoreAdjustment {
  segment: LeadSegment;
  /** Signed adjustment applied to overallConversionOpportunity (bounded). */
  adjustment: number;
  /** The base score before adjustment. */
  baseScore: number;
  /** The adjusted score (clamped 0..100). */
  adjustedScore: number;
  confidence: LearningConfidence;
  confidenceLabel: string;
  /** Whether the adjustment was actually applied (false when sample too small). */
  applied: boolean;
  /** Cautious, plain-language reason. */
  reason: string;
}

const clamp = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));

/**
 * Compute a bounded score adjustment for a segment from learning signals.
 * Below the "emerging" threshold, the adjustment is reported but NOT applied.
 */
export function computeScoreAdjustment(
  segment: LeadSegment,
  baseScore: number,
  learning: LearningSignals,
): ScoreAdjustment {
  const seg = segmentLearning(learning, segment);
  const sample = seg?.sample ?? 0;

  if (!seg || sample < LEARNING_THRESHOLDS.emerging) {
    return {
      segment,
      adjustment: 0,
      baseScore,
      adjustedScore: clamp(baseScore),
      confidence: "early",
      confidenceLabel: "Early / low confidence",
      applied: false,
      reason:
        sample === 0
          ? "No outcomes logged for this segment yet — no adjustment made."
          : `Only ${sample} outcome(s) for this segment — too early to adjust the score.`,
    };
  }

  // Established segments get the full (still bounded) nudge; emerging ones get
  // a damped version so early data can't swing the score too hard.
  const damp = seg.confidence === "established" ? 1 : 0.5;
  const rawDelta =
    (seg.conversionRate - BASELINE_CONVERSION) * (MAX_SCORE_ADJUSTMENT * 2) * damp;
  const adjustment = Math.max(
    -MAX_SCORE_ADJUSTMENT,
    Math.min(MAX_SCORE_ADJUSTMENT, Math.round(rawDelta)),
  );

  const direction =
    adjustment > 0 ? "stronger" : adjustment < 0 ? "weaker so far" : "in line with baseline";
  const reason = `This segment is converting ${Math.round(
    seg.conversionRate * 100,
  )}% across ${sample} outcomes (${direction}). ${seg.confidenceLabel}.`;

  return {
    segment,
    adjustment,
    baseScore,
    adjustedScore: clamp(baseScore + adjustment),
    confidence: seg.confidence,
    confidenceLabel: seg.confidenceLabel,
    applied: true,
    reason,
  };
}

/** A self-improved view of a single lead's score (base + bounded adjustment). */
export interface SelfImprovedScore {
  base: ConversionOpportunityScore;
  adjustment: ScoreAdjustment;
  /** overallConversionOpportunity after the bounded adjustment. */
  improvedOverall: number;
}

export function selfImproveScore(
  profile: LeadIntelligenceProfile,
  learning: LearningSignals,
): SelfImprovedScore {
  const adjustment = computeScoreAdjustment(
    profile.segment,
    profile.score.overallConversionOpportunity,
    learning,
  );
  return {
    base: profile.score,
    adjustment,
    improvedOverall: adjustment.adjustedScore,
  };
}

/** A recommendation about who/what to target more or less, with confidence. */
export interface TargetingRecommendation {
  kind: "do_more" | "do_less" | "watch";
  subject: string;
  detail: string;
  confidenceLabel: string;
}

export interface OutreachRecommendation {
  kind: "favor_angle" | "favor_channel" | "watch";
  subject: string;
  detail: string;
  confidenceLabel: string;
}

/** The full self-improving snapshot for the dashboard. */
export interface SelfImprovementSnapshot {
  learning: LearningSignals;
  /** Bounded adjustment per segment that has any history. */
  segmentAdjustments: ScoreAdjustment[];
  targetingRecommendations: TargetingRecommendation[];
  outreachRecommendations: OutreachRecommendation[];
  /** Cautious, plain-language insights (mirrors learning.insights + more). */
  insights: string[];
  /** True until enough data exists to trust the signals. */
  stillLearning: boolean;
  /**
   * Retention-informed targeting — cautious lessons from execution/retention
   * outcomes (the Growth Flywheel feeding back into lead targeting). Empty when
   * no execution outcomes are supplied. Retention proves value; volume does not.
   */
  retentionInformedTargeting: TargetingRecommendation[];
}

function buildRetentionInformedTargeting(
  executionOutcomes: ExecutionOutcomeRecord[],
): TargetingRecommendation[] {
  const recs: TargetingRecommendation[] = [];
  for (const seg of retentionRateBySegment(executionOutcomes)) {
    if (seg.sample < LEARNING_THRESHOLDS.emerging) continue;
    if (seg.retainRate >= 0.6) {
      recs.push({
        kind: "do_more",
        subject: seg.segment,
        detail: `Retaining ${Math.round(seg.retainRate * 100)}% first-month so far — retention proves value, consider sourcing more like this.`,
        confidenceLabel: seg.confidenceLabel,
      });
    } else if (seg.retainRate <= 0.3) {
      recs.push({
        kind: "watch",
        subject: seg.segment,
        detail: `Lower-retention so far (${Math.round(seg.retainRate * 100)}%) — strengthen onboarding/expectations before scaling this type.`,
        confidenceLabel: seg.confidenceLabel,
      });
    }
  }
  return recs;
}

function buildTargetingRecommendations(
  learning: LearningSignals,
): TargetingRecommendation[] {
  const recs: TargetingRecommendation[] = [];
  for (const seg of learning.bySegment) {
    if (seg.sample < LEARNING_THRESHOLDS.emerging) continue;
    if (seg.conversionRate >= 0.4) {
      recs.push({
        kind: "do_more",
        subject: seg.segment,
        detail: `Converting ${Math.round(seg.conversionRate * 100)}% so far — consider sourcing more leads like this.`,
        confidenceLabel: seg.confidenceLabel,
      });
    } else if (seg.conversionRate <= 0.1 && seg.confidence === "established") {
      recs.push({
        kind: "do_less",
        subject: seg.segment,
        detail: `Weaker so far (${Math.round(seg.conversionRate * 100)}%) — review the angle before investing more time here.`,
        confidenceLabel: seg.confidenceLabel,
      });
    } else {
      recs.push({
        kind: "watch",
        subject: seg.segment,
        detail: `Mixed so far (${Math.round(seg.conversionRate * 100)}%) — keep logging outcomes before changing approach.`,
        confidenceLabel: seg.confidenceLabel,
      });
    }
  }
  return recs;
}

function buildOutreachRecommendations(
  learning: LearningSignals,
): OutreachRecommendation[] {
  const recs: OutreachRecommendation[] = [];
  for (const angle of learning.byAngle) {
    if (angle.sample < LEARNING_THRESHOLDS.emerging) continue;
    if (angle.conversionRate >= 0.35) {
      recs.push({
        kind: "favor_angle",
        subject: OUTREACH_ANGLE_LABELS[angle.outreachAngleId] ?? angle.outreachAngleId,
        detail: `Performing best so far (${Math.round(angle.conversionRate * 100)}% of ${angle.sample}). Favor it where it fits — still review each draft.`,
        confidenceLabel: angle.confidenceLabel,
      });
    }
  }
  for (const channel of learning.byChannel) {
    if (channel.sample < LEARNING_THRESHOLDS.emerging) continue;
    if (channel.conversionRate >= 0.35) {
      recs.push({
        kind: "favor_channel",
        subject: channel.channel,
        detail: `This channel is converting ${Math.round(channel.conversionRate * 100)}% so far. Worth leaning on, with human review.`,
        confidenceLabel: channel.confidenceLabel,
      });
    }
  }
  if (recs.length === 0) {
    recs.push({
      kind: "watch",
      subject: "Outreach angles",
      detail: "Not enough outcomes yet to favor an angle — keep logging results.",
      confidenceLabel: "Early / low confidence",
    });
  }
  return recs;
}

/**
 * Build the full self-improvement snapshot from logged outcomes. This is the
 * single entry point the dashboard uses.
 */
export function buildSelfImprovementSnapshot(
  outcomes: LeadOutcomeRecord[],
  executionOutcomes: ExecutionOutcomeRecord[] = [],
): SelfImprovementSnapshot {
  const learning = computeLearningSignals(outcomes);
  const segmentAdjustments = learning.bySegment.map((s) =>
    computeScoreAdjustment(s.segment, 50, learning),
  );
  const stillLearning = learning.totalOutcomes < LEARNING_THRESHOLDS.established;

  const retentionInformedTargeting =
    buildRetentionInformedTargeting(executionOutcomes);

  const insights = [...learning.insights];
  if (stillLearning) {
    insights.push(
      `Still learning — ${learning.totalOutcomes} outcome(s) logged. Treat patterns as early signals, not rules.`,
    );
  }
  if (retentionInformedTargeting.length > 0) {
    insights.push(
      "Retention outcomes are now informing lead targeting — retention proves value, not raw volume.",
    );
  }

  return {
    learning,
    segmentAdjustments,
    targetingRecommendations: buildTargetingRecommendations(learning),
    outreachRecommendations: buildOutreachRecommendations(learning),
    insights,
    stillLearning,
    retentionInformedTargeting,
  };
}
