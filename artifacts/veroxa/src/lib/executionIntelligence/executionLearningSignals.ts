/**
 * executionLearningSignals.ts — turn execution/retention outcomes into cautious
 * learning signals.
 *
 * SAFETY / SCOPE:
 *   - Pure, deterministic aggregation over ExecutionOutcomeRecord[]. No network,
 *     no writes, no model calls.
 *   - Every signal carries a confidence label tied to sample size. Patterns are
 *     signals, not rules; a human always decides. Retention proves value — a
 *     client that churned is never "bad", just "lower-retention so far".
 */

import {
  EXECUTION_LEARNING_PATTERN_LABELS,
  type ExecutionLearningPatternKind,
  type ExecutionLearningSignal,
} from "./executionIntelligenceTypes";
import {
  LEARNING_CONFIDENCE_LABELS,
  LEARNING_THRESHOLDS,
  confidenceFromSample,
} from "@/lib/leadIntelligence/leadLearningSignals";

/**
 * A logged execution/retention outcome for an onboarded client. Production-shaped
 * so a backend can mirror it 1:1. Internal-only; never client-visible.
 */
export interface ExecutionOutcomeRecord {
  id: string;
  clientId: string;
  createdAt: string;
  /** Lead segment the client originated from (string to stay decoupled). */
  segment?: string;
  /** Execution health at the time of the outcome (0..100). */
  executionHealth: number;
  /** Retention risk at the time of the outcome (0..100, higher = more risk). */
  retentionRisk: number;
  /** Client success fit category (string to stay decoupled). */
  successFitCategory: string;
  /** Whether the client was retained through the first month. */
  firstMonthRetained: boolean;
  /** Whether onboarding required heavy setup effort. */
  highEffortSetup: boolean;
  /** Whether the client has strong food/visual potential. */
  strongVisualFit: boolean;
  /** Whether the client cooperated well (responses, access, media). */
  cooperatedWell: boolean;
}

function mkSignal(
  kind: ExecutionLearningPatternKind,
  detail: string,
  sample: number,
): ExecutionLearningSignal {
  return {
    kind,
    kindLabel: EXECUTION_LEARNING_PATTERN_LABELS[kind],
    detail,
    confidenceLabel: LEARNING_CONFIDENCE_LABELS[confidenceFromSample(sample)],
    sample,
  };
}

function rate(n: number, d: number): number {
  return d > 0 ? n / d : 0;
}

/**
 * Compute cautious execution-learning signals from logged outcomes. Each signal
 * is confidence-labelled by how many outcomes back it.
 */
export function computeExecutionLearningSignals(
  outcomes: ExecutionOutcomeRecord[],
): ExecutionLearningSignal[] {
  const signals: ExecutionLearningSignal[] = [];
  const total = outcomes.length;
  if (total === 0) return signals;

  const retained = outcomes.filter((o) => o.firstMonthRetained);
  const churned = outcomes.filter((o) => !o.firstMonthRetained);

  if (retained.length > 0) {
    const cooperative = rate(
      retained.filter((o) => o.cooperatedWell).length,
      retained.length,
    );
    signals.push(
      mkSignal(
        "retainedClientPattern",
        `Retained clients cooperate well ${Math.round(
          cooperative * 100,
        )}% of the time — cooperation is the strongest retention input so far.`,
        retained.length,
      ),
    );
  }

  if (churned.length > 0) {
    const lowCoop = rate(
      churned.filter((o) => !o.cooperatedWell).length,
      churned.length,
    );
    signals.push(
      mkSignal(
        "churnRiskPattern",
        `Among lower-retention clients, ${Math.round(
          lowCoop * 100,
        )}% showed low cooperation — a fixable, early-warning input.`,
        churned.length,
      ),
    );
  }

  const highEffort = outcomes.filter((o) => o.highEffortSetup);
  if (highEffort.length >= LEARNING_THRESHOLDS.emerging) {
    const retainedHighEffort = rate(
      highEffort.filter((o) => o.firstMonthRetained).length,
      highEffort.length,
    );
    signals.push(
      mkSignal(
        "highEffortSetupPattern",
        `High-effort setups still retain ${Math.round(
          retainedHighEffort * 100,
        )}% so far — worth it with strong onboarding support.`,
        highEffort.length,
      ),
    );
  }

  const strongVisual = outcomes.filter((o) => o.strongVisualFit);
  if (strongVisual.length > 0) {
    const retainedVisual = rate(
      strongVisual.filter((o) => o.firstMonthRetained).length,
      strongVisual.length,
    );
    signals.push(
      mkSignal(
        "strongVisualFitPattern",
        `Strong-visual clients retain ${Math.round(
          retainedVisual * 100,
        )}% so far — visual potential is a promising lead signal.`,
        strongVisual.length,
      ),
    );
  }

  const lowCoopAll = outcomes.filter((o) => !o.cooperatedWell);
  if (lowCoopAll.length > 0) {
    signals.push(
      mkSignal(
        "lowCooperationPattern",
        `${lowCoopAll.length} client(s) showed low cooperation — flag for extra onboarding guidance early.`,
        lowCoopAll.length,
      ),
    );
  }

  return signals;
}

/** Retention rate by lead segment, for feeding cautious lead targeting. */
export interface SegmentRetentionRate {
  segment: string;
  sample: number;
  retainRate: number;
  confidenceLabel: string;
}

export function retentionRateBySegment(
  outcomes: ExecutionOutcomeRecord[],
): SegmentRetentionRate[] {
  const map = new Map<string, ExecutionOutcomeRecord[]>();
  for (const o of outcomes) {
    if (!o.segment) continue;
    const arr = map.get(o.segment) ?? [];
    arr.push(o);
    map.set(o.segment, arr);
  }
  const out: SegmentRetentionRate[] = [];
  for (const [segment, recs] of map) {
    out.push({
      segment,
      sample: recs.length,
      retainRate: rate(recs.filter((r) => r.firstMonthRetained).length, recs.length),
      confidenceLabel: LEARNING_CONFIDENCE_LABELS[confidenceFromSample(recs.length)],
    });
  }
  return out.sort((a, b) => b.retainRate - a.retainRate);
}
