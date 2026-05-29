/**
 * clientSuccessFitEngine.ts — classify how strong a Veroxa fit a client is.
 *
 * SAFETY / SCOPE:
 *   - Deterministic classification from execution/cooperation signals. No
 *     network, no writes, no model calls, no guarantees.
 *   - "poor_fit_for_now" describes the CURRENT situation/scope, never a
 *     judgement of the client. Language stays respectful.
 *   - AI classifies; a human decides any retention/relationship action.
 */

import {
  CLIENT_SUCCESS_FIT_DESCRIPTIONS,
  CLIENT_SUCCESS_FIT_LABELS,
  type ClientSuccessFitCategory,
  type ClientSuccessFitScore,
} from "./executionIntelligenceTypes";

const clamp = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));

export interface ClientSuccessFitInputs {
  executionHealth: number;
  cooperationScore: number;
  mediaSupplyScore: number;
  accessProvidedPct: number;
  /** 0..100, higher = MORE retention risk. */
  retentionRisk: number;
  onlinePresenceScore: number;
  possibleGuaranteeExpectation: boolean;
}

function fitScoreValue(input: ClientSuccessFitInputs): number {
  const positives =
    input.executionHealth * 0.3 +
    input.cooperationScore * 0.25 +
    input.mediaSupplyScore * 0.15 +
    input.accessProvidedPct * 0.15 +
    input.onlinePresenceScore * 0.15;
  return clamp(positives - input.retentionRisk * 0.25);
}

function categorize(
  fitScore: number,
  input: ClientSuccessFitInputs,
): ClientSuccessFitCategory {
  if (input.possibleGuaranteeExpectation && fitScore < 55) {
    return "poor_fit_for_now";
  }
  if (input.accessProvidedPct < 35 && input.cooperationScore < 45) {
    return "poor_fit_for_now";
  }
  if (fitScore >= 78 && input.retentionRisk < 25) return "excellent_fit";
  if (fitScore >= 62) return "good_fit";
  if (input.retentionRisk >= 50 || fitScore < 45) return "retention_risk";
  return "needs_guidance";
}

/**
 * Classify the client's success fit and return a labelled score. Higher score
 * = a smoother Veroxa fit (cooperation + execution), not a value judgement.
 */
export function classifyClientSuccessFit(
  input: ClientSuccessFitInputs,
): ClientSuccessFitScore {
  const score = fitScoreValue(input);
  const category = categorize(score, input);
  return {
    score,
    category,
    categoryLabel: CLIENT_SUCCESS_FIT_LABELS[category],
    label: CLIENT_SUCCESS_FIT_LABELS[category],
    note: CLIENT_SUCCESS_FIT_DESCRIPTIONS[category],
  };
}

export interface ClientSuccessFitReasoning {
  category: ClientSuccessFitCategory;
  categoryLabel: string;
  whyLikelyToRetain: string[];
  whyMayChurn: string[];
  whatVeroxaShouldDoNext: string[];
  /** What lead generation should learn from this client. */
  leadGenLesson: string;
}

/**
 * Produce human-readable reasoning around a client's fit — the "why retain /
 * why churn / what next / what leads should learn" narrative. Team-facing.
 */
export function explainClientSuccessFit(
  input: ClientSuccessFitInputs,
): ClientSuccessFitReasoning {
  const { category, categoryLabel } = classifyClientSuccessFit(input);

  const whyLikelyToRetain: string[] = [];
  const whyMayChurn: string[] = [];
  const whatVeroxaShouldDoNext: string[] = [];

  if (input.cooperationScore >= 65)
    whyLikelyToRetain.push("Responds and collaborates well.");
  if (input.mediaSupplyScore >= 65)
    whyLikelyToRetain.push("Keeps a healthy media supply.");
  if (input.accessProvidedPct >= 70)
    whyLikelyToRetain.push("Has provided the access Veroxa needs.");
  if (input.onlinePresenceScore >= 65)
    whyLikelyToRetain.push("Online presence is trending in the right direction.");
  if (whyLikelyToRetain.length === 0)
    whyLikelyToRetain.push("Engaged enough to keep building momentum with guidance.");

  if (input.mediaSupplyScore < 50)
    whyMayChurn.push("Media supply is thin — content can stall.");
  if (input.accessProvidedPct < 60)
    whyMayChurn.push("Some access is still outstanding.");
  if (input.cooperationScore < 50)
    whyMayChurn.push("Responses have been slow lately.");
  if (input.possibleGuaranteeExpectation)
    whyMayChurn.push("May expect guarantees — needs expectation alignment.");
  if (input.retentionRisk >= 50)
    whyMayChurn.push("Several fixable risk signals are stacking up.");
  if (whyMayChurn.length === 0)
    whyMayChurn.push("No strong churn signals right now.");

  switch (category) {
    case "excellent_fit":
      whatVeroxaShouldDoNext.push("Keep the cadence; capture what's working.");
      break;
    case "good_fit":
      whatVeroxaShouldDoNext.push("Tighten one weak input to move toward excellent.");
      break;
    case "needs_guidance":
      whatVeroxaShouldDoNext.push("Offer clear, simple guidance on the missing inputs.");
      break;
    case "retention_risk":
      whatVeroxaShouldDoNext.push("Schedule a human check-in and clear the top risks.");
      break;
    case "poor_fit_for_now":
      whatVeroxaShouldDoNext.push("Revisit scope/expectations together before scaling effort.");
      break;
  }

  const leadGenLesson =
    category === "excellent_fit" || category === "good_fit"
      ? "Leads resembling this client are worth prioritising — they cooperate and execute well."
      : category === "poor_fit_for_now"
        ? "Flag this profile for expectation-setting during sales; it needs alignment before scaling."
        : "This profile can succeed with stronger onboarding — note the extra setup effort during targeting.";

  return {
    category,
    categoryLabel,
    whyLikelyToRetain,
    whyMayChurn,
    whatVeroxaShouldDoNext,
    leadGenLesson,
  };
}
