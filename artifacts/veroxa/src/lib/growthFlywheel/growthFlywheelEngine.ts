/**
 * growthFlywheelEngine.ts — turn execution/retention outcomes into cautious
 * lead-targeting lessons.
 *
 * SAFETY / SCOPE:
 *   - Pure, deterministic aggregation. No network, no writes, no model calls,
 *     no guarantees.
 *   - Every signal carries a confidence label tied to sample size. Patterns are
 *     signals, not rules; a human always decides. Retention proves value —
 *     raw lead volume does not.
 */

import {
  GROWTH_FLYWHEEL_RECOMMENDATION_LABELS,
  type GrowthFlywheelRecommendationKind,
  type GrowthFlywheelSignal,
} from "@/lib/executionIntelligence/executionIntelligenceTypes";
import {
  LEARNING_CONFIDENCE_LABELS,
  confidenceFromSample,
} from "@/lib/leadIntelligence/leadLearningSignals";
import type {
  GrowthFlywheelObservation,
  GrowthFlywheelSnapshot,
} from "./growthFlywheelTypes";

function groupBySegment(
  obs: GrowthFlywheelObservation[],
): Map<string, GrowthFlywheelObservation[]> {
  const map = new Map<string, GrowthFlywheelObservation[]>();
  for (const o of obs) {
    const arr = map.get(o.segment) ?? [];
    arr.push(o);
    map.set(o.segment, arr);
  }
  return map;
}

function pickRecommendation(
  retainRate: number,
  avgExecutionHealth: number,
  highEffortRate: number,
  guaranteeRiskRate: number,
  strongVisualRate: number,
): GrowthFlywheelRecommendationKind {
  if (guaranteeRiskRate >= 0.4) return "requires_clearer_expectations";
  if (retainRate >= 0.6 && avgExecutionHealth >= 65 && highEffortRate < 0.4)
    return "find_more_like_this";
  if (retainRate >= 0.6 && strongVisualRate >= 0.5 && avgExecutionHealth < 65)
    return "good_for_founder_handled";
  if (highEffortRate >= 0.5 && retainRate >= 0.4)
    return "requires_stronger_onboarding";
  if (retainRate < 0.35) return "reduce_priority_for_type";
  return "needs_team_support_before_scaling";
}

function rate(n: number, d: number): number {
  return d > 0 ? n / d : 0;
}

/**
 * Build per-segment flywheel signals from execution/retention observations.
 * One signal per segment that has at least one observation.
 */
export function buildGrowthFlywheel(
  observations: GrowthFlywheelObservation[],
): GrowthFlywheelSnapshot {
  const signals: GrowthFlywheelSignal[] = [];

  for (const [segment, group] of groupBySegment(observations)) {
    const sample = group.length;
    const segmentLabel = group[0]?.segmentLabel ?? segment;
    const retained = group.filter((o) => o.firstMonthRetained).length;
    const retainRate = rate(retained, sample);
    const avgExecutionHealth =
      group.reduce((s, o) => s + o.executionHealth, 0) / sample;
    const avgRetentionRisk =
      group.reduce((s, o) => s + o.retentionRisk, 0) / sample;
    const highEffortRate = rate(
      group.filter((o) => o.highEffortSetup).length,
      sample,
    );
    const strongVisualRate = rate(
      group.filter((o) => o.strongVisualFit).length,
      sample,
    );
    const guaranteeRiskRate = rate(
      group.filter((o) => o.successFitCategory === "poor_fit_for_now").length,
      sample,
    );

    const recommendation = pickRecommendation(
      retainRate,
      avgExecutionHealth,
      highEffortRate,
      guaranteeRiskRate,
      strongVisualRate,
    );
    const confidence = confidenceFromSample(sample);

    const leadQualityFeedback =
      retainRate >= 0.6
        ? `Leads from "${segmentLabel}" are retaining well so far (${Math.round(
            retainRate * 100,
          )}% first-month).`
        : retainRate < 0.35
          ? `Lower-retention so far (${Math.round(retainRate * 100)}% first-month) — review before scaling.`
          : `Mixed retention so far (${Math.round(retainRate * 100)}% first-month) — keep observing.`;

    const targetingAdjustment =
      recommendation === "find_more_like_this"
        ? "Consider sourcing more leads like this."
        : recommendation === "reduce_priority_for_type"
          ? "Lower priority for this lead type unless owner access is strong."
          : recommendation === "good_for_founder_handled"
            ? "Route to founder-handled onboarding where possible."
            : "Keep volume steady; strengthen the supporting playbook first.";

    const executionLesson =
      avgExecutionHealth >= 65
        ? "Execution tends to run smoothly for this segment."
        : highEffortRate >= 0.5
          ? "Expect heavier setup effort during onboarding."
          : "Execution is workable with attentive support.";

    const retentionLesson =
      avgRetentionRisk < 30
        ? "Retention risk stays low once onboarded."
        : guaranteeRiskRate >= 0.4
          ? "Watch for expectation/guarantee risk early in the relationship."
          : "Retention holds with timely check-ins on the usual fixable inputs.";

    signals.push({
      segment,
      segmentLabel,
      leadQualityFeedback,
      targetingAdjustment,
      executionLesson,
      retentionLesson,
      recommendation,
      recommendationLabel:
        GROWTH_FLYWHEEL_RECOMMENDATION_LABELS[recommendation],
      confidenceLabel: LEARNING_CONFIDENCE_LABELS[confidence],
      sample,
    });
  }

  signals.sort((a, b) => b.sample - a.sample);

  const insights: string[] = [];
  if (observations.length === 0) {
    insights.push(
      "No execution outcomes yet — as clients onboard and retain, the flywheel will surface cautious lessons here.",
    );
  } else {
    const best = [...signals].sort((a, b) => b.sample - a.sample)[0];
    if (best) {
      insights.push(
        `${best.segmentLabel}: ${best.leadQualityFeedback} (${best.confidenceLabel}).`,
      );
    }
    const expectationRisk = signals.find(
      (s) => s.recommendation === "requires_clearer_expectations",
    );
    if (expectationRisk) {
      insights.push(
        `Expectation-setting matters for "${expectationRisk.segmentLabel}" — align scope during sales.`,
      );
    }
  }

  const stillLearning = observations.length < 15;
  if (stillLearning && observations.length > 0) {
    insights.push(
      `Still learning — ${observations.length} outcome(s). Treat patterns as early signals, not rules.`,
    );
  }

  return {
    totalObservations: observations.length,
    signals,
    insights,
    stillLearning,
  };
}
