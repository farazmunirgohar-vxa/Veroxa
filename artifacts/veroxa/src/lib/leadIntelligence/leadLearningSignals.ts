/**
 * leadLearningSignals.ts — turn logged outcomes into cautious learning signals.
 *
 * SAFETY / SCOPE:
 *   - Pure, deterministic aggregation over LeadOutcomeRecord[]. No network,
 *     no writes, no model calls.
 *   - Every signal carries a CONFIDENCE label tied to sample size. With a small
 *     sample the engine says "early / low confidence" and must not be treated
 *     as a rule. The system suggests; a human always decides.
 *   - Language stays cautious: segments/angles that convert less are "weaker so
 *     far", never "bad". Nothing here is a guarantee.
 */

import type { LeadSegment } from "./leadIntelligenceTypes";
import type { OutreachChannel } from "./leadIntelligenceTypes";
import type { ObjectionType } from "./leadObjectionPatterns";
import {
  isMeetingOrBetter,
  isPositiveOutcome,
  type LeadOutcomeRecord,
} from "./leadOutcomeTypes";

/** How much weight a signal deserves, based on how much data backs it. */
export type LearningConfidence = "early" | "emerging" | "established";

export const LEARNING_CONFIDENCE_LABELS: Record<LearningConfidence, string> = {
  early: "Early / low confidence",
  emerging: "Emerging signal",
  established: "Established signal",
};

/** Minimum sample sizes for each confidence tier. */
export const LEARNING_THRESHOLDS = {
  emerging: 5,
  established: 15,
} as const;

export function confidenceFromSample(sample: number): LearningConfidence {
  if (sample >= LEARNING_THRESHOLDS.established) return "established";
  if (sample >= LEARNING_THRESHOLDS.emerging) return "emerging";
  return "early";
}

/** A conversion summary for any grouping key (segment, angle, channel...). */
export interface LearningRate {
  sample: number;
  positives: number;
  meetings: number;
  /** positives / sample, 0..1. */
  conversionRate: number;
  /** meetings / sample, 0..1. */
  meetingRate: number;
  confidence: LearningConfidence;
  confidenceLabel: string;
  /** Cautious, human-readable note about how to treat this. */
  cautionNote: string;
}

function rateNote(confidence: LearningConfidence, sample: number): string {
  switch (confidence) {
    case "early":
      return `Only ${sample} outcome(s) logged — treat as an early signal, not a rule.`;
    case "emerging":
      return `Emerging pattern across ${sample} outcomes — worth watching, still verify manually.`;
    case "established":
      return `Consistent across ${sample} outcomes — a reliable signal to lean on, with human judgement.`;
  }
}

function buildRate(records: LeadOutcomeRecord[]): LearningRate {
  const sample = records.length;
  const positives = records.filter((r) => isPositiveOutcome(r.stageReached)).length;
  const meetings = records.filter((r) => isMeetingOrBetter(r.stageReached)).length;
  const confidence = confidenceFromSample(sample);
  return {
    sample,
    positives,
    meetings,
    conversionRate: sample > 0 ? positives / sample : 0,
    meetingRate: sample > 0 ? meetings / sample : 0,
    confidence,
    confidenceLabel: LEARNING_CONFIDENCE_LABELS[confidence],
    cautionNote: rateNote(confidence, sample),
  };
}

export interface SegmentLearning extends LearningRate {
  segment: LeadSegment;
}

export interface AngleLearning extends LearningRate {
  outreachAngleId: string;
}

export interface ChannelLearning extends LearningRate {
  channel: OutreachChannel;
}

export interface ObjectionFrequency {
  objection: ObjectionType;
  count: number;
  /** Share of all logged objections, 0..1. */
  share: number;
}

/** The full learning snapshot derived from all logged outcomes. */
export interface LearningSignals {
  totalOutcomes: number;
  overall: LearningRate;
  bySegment: SegmentLearning[];
  byAngle: AngleLearning[];
  byChannel: ChannelLearning[];
  topObjections: ObjectionFrequency[];
  /** Cautious, plain-language insights for the dashboard. */
  insights: string[];
}

function groupBy<T extends string>(
  records: LeadOutcomeRecord[],
  key: (r: LeadOutcomeRecord) => T | undefined,
): Map<T, LeadOutcomeRecord[]> {
  const map = new Map<T, LeadOutcomeRecord[]>();
  for (const r of records) {
    const k = key(r);
    if (k === undefined) continue;
    const arr = map.get(k) ?? [];
    arr.push(r);
    map.set(k, arr);
  }
  return map;
}

function buildInsights(
  bySegment: SegmentLearning[],
  byAngle: AngleLearning[],
  topObjections: ObjectionFrequency[],
): string[] {
  const insights: string[] = [];

  const rankedSegments = [...bySegment]
    .filter((s) => s.sample >= LEARNING_THRESHOLDS.emerging)
    .sort((a, b) => b.conversionRate - a.conversionRate);
  if (rankedSegments.length > 0) {
    const best = rankedSegments[0];
    insights.push(
      `So far, "${best.segment}" is converting best (${Math.round(
        best.conversionRate * 100,
      )}% of ${best.sample}). ${best.confidenceLabel}.`,
    );
  }

  const rankedAngles = [...byAngle]
    .filter((a) => a.sample >= LEARNING_THRESHOLDS.emerging)
    .sort((a, b) => b.conversionRate - a.conversionRate);
  if (rankedAngles.length > 0) {
    const bestAngle = rankedAngles[0];
    insights.push(
      `The "${bestAngle.outreachAngleId}" angle is performing best so far (${Math.round(
        bestAngle.conversionRate * 100,
      )}% of ${bestAngle.sample}). ${bestAngle.confidenceLabel}.`,
    );
  }

  if (topObjections.length > 0) {
    const top = topObjections[0];
    insights.push(
      `Most common objection logged: "${top.objection}" (${Math.round(
        top.share * 100,
      )}% of objections). Prepare a calm, respectful response.`,
    );
  }

  if (insights.length === 0) {
    insights.push(
      "Not enough outcomes logged yet to learn from — log results as outreach happens.",
    );
  }
  return insights;
}

/**
 * Compute the full learning snapshot from logged outcomes. Only outcomes where
 * outreach actually happened (contacted or beyond) count toward rates.
 */
export function computeLearningSignals(
  outcomes: LeadOutcomeRecord[],
): LearningSignals {
  const contacted = outcomes.filter((o) => o.stageReached !== "not_contacted");

  const bySegment: SegmentLearning[] = [];
  for (const [segment, recs] of groupBy(contacted, (r) => r.segment)) {
    bySegment.push({ segment, ...buildRate(recs) });
  }

  const byAngle: AngleLearning[] = [];
  for (const [outreachAngleId, recs] of groupBy(
    contacted,
    (r) => r.outreachAngleId,
  )) {
    byAngle.push({ outreachAngleId, ...buildRate(recs) });
  }

  const byChannel: ChannelLearning[] = [];
  for (const [channel, recs] of groupBy(contacted, (r) => r.channel)) {
    byChannel.push({ channel, ...buildRate(recs) });
  }

  const objectionRecords = contacted.filter((r) => r.objection);
  const objectionCounts = new Map<ObjectionType, number>();
  for (const r of objectionRecords) {
    if (!r.objection) continue;
    objectionCounts.set(r.objection, (objectionCounts.get(r.objection) ?? 0) + 1);
  }
  const totalObjections = objectionRecords.length;
  const topObjections: ObjectionFrequency[] = [...objectionCounts.entries()]
    .map(([objection, count]) => ({
      objection,
      count,
      share: totalObjections > 0 ? count / totalObjections : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalOutcomes: contacted.length,
    overall: buildRate(contacted),
    bySegment: bySegment.sort((a, b) => b.conversionRate - a.conversionRate),
    byAngle: byAngle.sort((a, b) => b.conversionRate - a.conversionRate),
    byChannel: byChannel.sort((a, b) => b.conversionRate - a.conversionRate),
    topObjections,
    insights: buildInsights(bySegment, byAngle, topObjections),
  };
}

/** Convenience: find the learning rate for a specific segment, if any. */
export function segmentLearning(
  signals: LearningSignals,
  segment: LeadSegment,
): SegmentLearning | undefined {
  return signals.bySegment.find((s) => s.segment === segment);
}

/** Convenience: find the learning rate for a specific angle, if any. */
export function angleLearning(
  signals: LearningSignals,
  outreachAngleId: string,
): AngleLearning | undefined {
  return signals.byAngle.find((a) => a.outreachAngleId === outreachAngleId);
}
