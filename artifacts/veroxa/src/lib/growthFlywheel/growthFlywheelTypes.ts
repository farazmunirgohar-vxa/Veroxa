/**
 * growthFlywheelTypes.ts — connect Lead Intelligence to Execution Intelligence.
 *
 * SAFETY / SCOPE:
 *   - Deterministic. No network, no writes, no model calls, no guarantees.
 *   - The flywheel turns execution/retention OUTCOMES into cautious lessons that
 *     can improve future lead targeting. Patterns are signals, not rules; a
 *     human always decides. Language stays respectful — a segment that retains
 *     less is "lower-retention so far", never "bad".
 */

import type {
  GrowthFlywheelRecommendationKind,
  GrowthFlywheelSignal,
} from "@/lib/executionIntelligence/executionIntelligenceTypes";

export type {
  GrowthFlywheelRecommendationKind,
  GrowthFlywheelSignal,
} from "@/lib/executionIntelligence/executionIntelligenceTypes";

/**
 * One observation tying a converted lead to its execution/retention outcome.
 * Production-shaped so a backend can mirror it 1:1 (one row per client/cohort).
 */
export interface GrowthFlywheelObservation {
  clientId: string;
  /** Lead segment the client came from (string to stay decoupled). */
  segment: string;
  segmentLabel: string;
  /** Lead score at outreach time (0..100), if known. */
  leadScoreAtOutreach?: number;
  /** Whether outreach reached a positive milestone. */
  outreachPositive: boolean;
  /** Execution health once onboarded (0..100). */
  executionHealth: number;
  /** Retention risk (0..100, higher = more risk). */
  retentionRisk: number;
  /** Whether the client was retained through the first month. */
  firstMonthRetained: boolean;
  /** Client success fit category (string to stay decoupled). */
  successFitCategory: string;
  /** Whether onboarding needed heavy setup effort. */
  highEffortSetup: boolean;
  /** Whether the client has strong food/visual potential. */
  strongVisualFit: boolean;
}

/** Aggregated flywheel view for the dashboard. */
export interface GrowthFlywheelSnapshot {
  totalObservations: number;
  signals: GrowthFlywheelSignal[];
  /** Cautious, plain-language insights across all segments. */
  insights: string[];
  /** True until enough observations exist to trust the signals. */
  stillLearning: boolean;
}
