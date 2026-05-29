/**
 * leadPrioritizationEngine.ts — decide which leads to focus on, and why.
 *
 * SAFETY / SCOPE:
 *   - Deterministic, rule-based ranking over a lead's intelligence profile,
 *     contact-path quality, and (optional) historical learning signals.
 *   - The engine RECOMMENDS a focus order and a cautious first angle. It never
 *     contacts anyone, never auto-sends, and never makes the final call — a
 *     human reviews every recommendation.
 *   - Language stays cautious: low-priority is "park / revisit", not "bad lead";
 *     a paid-service signal is "possible"; nothing is guaranteed.
 *   - When the learning sample is small, confidence is labelled low and the
 *     historical adjustment is deliberately tiny so the system can't overfit.
 */

import { computeContactPathQuality } from "./contactPathEngine";
import {
  OUTREACH_ANGLE_LABELS,
  SEGMENT_OUTREACH_ANGLE_ID,
  type ContactPathQuality,
  type LeadIntelligenceProfile,
} from "./leadIntelligenceTypes";
import type { LeadIntelligenceInput } from "./leadScoringEngine";
import {
  segmentLearning,
  angleLearning,
  type LearningSignals,
} from "./leadLearningSignals";
import { OBJECTION_PLAYBOOK, type ObjectionType } from "./leadObjectionPatterns";

/** Where a lead lands on the focus ladder. */
export type ConversionProbabilityBand =
  | "very_high"
  | "high"
  | "medium"
  | "low"
  | "park";

export const CONVERSION_BAND_LABELS: Record<ConversionProbabilityBand, string> = {
  very_high: "Very high — focus first",
  high: "High — strong candidate",
  medium: "Medium — worth a careful look",
  low: "Low — only if capacity allows",
  park: "Park — revisit later",
};

/** Cautious confidence label for the whole recommendation. */
export type PrioritizationConfidence = "high" | "medium" | "low";

export const PRIORITIZATION_CONFIDENCE_LABELS: Record<
  PrioritizationConfidence,
  string
> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence — early signal",
};

/** A recommended next action for the lead (all human-executed). */
export type RecommendedLeadAction =
  | "verify_contact_then_reach_out"
  | "prepare_outreach_for_review"
  | "share_audit"
  | "book_walkthrough"
  | "nurture_revisit_later"
  | "research_contact_path";

export const RECOMMENDED_LEAD_ACTION_LABELS: Record<
  RecommendedLeadAction,
  string
> = {
  verify_contact_then_reach_out: "Verify contact path, then reach out (after review)",
  prepare_outreach_for_review: "Prepare outreach for human review",
  share_audit: "Share the free audit",
  book_walkthrough: "Offer an audit walkthrough",
  nurture_revisit_later: "Nurture — revisit later",
  research_contact_path: "Research a public contact path first",
};

export interface LeadPrioritization {
  /** 0..100 blended priority score (higher = focus sooner). */
  priorityScore: number;
  band: ConversionProbabilityBand;
  bandLabel: string;
  /** Filled in by rankLeads once a batch is sorted (1 = top). */
  priorityRank?: number;
  recommendedLeadAction: RecommendedLeadAction;
  recommendedLeadActionLabel: string;
  /** Why this lead is worth attention. */
  whyThisLead: string[];
  /** Why now (timing / reachability / opportunity). */
  whyNow: string;
  /** Cautious best outreach angle (segment-driven, learning-aware). */
  bestOutreachAngleId: string;
  bestOutreachAngleLabel: string;
  /** The objection most likely to come up, with a calm preparation note. */
  likelyObjection?: ObjectionType;
  likelyObjectionLabel?: string;
  likelyObjectionPrep?: string;
  confidence: PrioritizationConfidence;
  confidenceLabel: string;
  /** Things a human must verify before acting. */
  manualVerificationNeeded: string[];
  /** Contact path quality used in the decision (carried for the UI). */
  contactPathQuality: ContactPathQuality;
  /** How much the learning history nudged the score (small by design). */
  historicalAdjustment: number;
}

const clamp = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));

function bandFromScore(score: number): ConversionProbabilityBand {
  if (score >= 78) return "very_high";
  if (score >= 60) return "high";
  if (score >= 42) return "medium";
  if (score >= 25) return "low";
  return "park";
}

/**
 * Pick the likely objection from the segment. Cautious, charitable defaults —
 * these are PREPARATION, not assumptions about the person.
 */
function likelyObjectionForSegment(
  profile: LeadIntelligenceProfile,
): ObjectionType | undefined {
  switch (profile.segment) {
    case "agency_spend_opportunity_lead":
      return "already_has_agency";
    case "ads_waste_risk_lead":
      return "wants_ads_only";
    case "inconsistent_owner_managed_lead":
      return "no_time";
    case "no_online_presence_lead":
      return "price";
    case "strong_fit_pilot_lead":
      return "wants_guarantees";
    case "already_strong_low_priority":
      return "not_interested";
  }
}

/**
 * Compute the prioritization for a single lead. Pass learning signals to make
 * it history-aware; without them it falls back to the profile only.
 */
export function prioritizeLead(
  profile: LeadIntelligenceProfile,
  input: LeadIntelligenceInput,
  learning?: LearningSignals,
): LeadPrioritization {
  const score = profile.score;
  const contactPathQuality = computeContactPathQuality(input, profile.contactPaths);

  // Base priority: opportunity, weighted toward leads we can actually reach.
  let base =
    score.overallConversionOpportunity * 0.55 +
    contactPathQuality.score * 0.25 +
    score.decisionMakerAccessScore * 0.12 +
    score.fitScore * 0.08;

  // Already-strong leads are intentionally de-prioritised (nurture, not chase).
  if (profile.segment === "already_strong_low_priority") base -= 18;

  // History-aware nudge — small by design so the system can't overfit early.
  let historicalAdjustment = 0;
  let confidence: PrioritizationConfidence = "medium";
  if (learning) {
    const seg = segmentLearning(learning, profile.segment);
    if (seg && seg.sample >= 5) {
      // Center on 0.25 baseline conversion; cap the nudge at +/-8 points.
      const delta = (seg.conversionRate - 0.25) * 32;
      historicalAdjustment = Math.max(-8, Math.min(8, delta));
      confidence = seg.confidence === "established" ? "high" : "medium";
    } else {
      // Not enough history yet — say so, and don't lean on it.
      confidence = "low";
    }
  } else {
    confidence = "medium";
  }

  const priorityScore = clamp(base + historicalAdjustment);
  const band = bandFromScore(priorityScore);

  // Best outreach angle: segment default, swapped for a clearly stronger angle
  // only when the learning signal is established.
  let bestOutreachAngleId = SEGMENT_OUTREACH_ANGLE_ID[profile.segment];
  if (learning) {
    const segAngle = angleLearning(learning, bestOutreachAngleId);
    const topAngle = learning.byAngle.find(
      (a) => a.confidence === "established" && a.conversionRate > 0.35,
    );
    if (
      topAngle &&
      (!segAngle ||
        (segAngle.confidence !== "established" &&
          topAngle.conversionRate > segAngle.conversionRate + 0.1))
    ) {
      bestOutreachAngleId = topAngle.outreachAngleId;
    }
  }

  // Recommended action.
  let recommendedLeadAction: RecommendedLeadAction;
  if (profile.segment === "already_strong_low_priority" || band === "park") {
    recommendedLeadAction = "nurture_revisit_later";
  } else if (contactPathQuality.usablePathCount === 0) {
    recommendedLeadAction = "research_contact_path";
  } else if (contactPathQuality.tier === "thin") {
    recommendedLeadAction = "verify_contact_then_reach_out";
  } else if (band === "very_high" || band === "high") {
    recommendedLeadAction = "prepare_outreach_for_review";
  } else {
    recommendedLeadAction = "share_audit";
  }

  // Why this lead.
  const whyThisLead: string[] = [];
  if (score.improvementRoomScore >= 60)
    whyThisLead.push("Clear room to improve the public presence.");
  if (score.inconsistencyScore >= 50)
    whyThisLead.push("Execution appears inconsistent across surfaces.");
  if (score.foodVisualPotentialScore >= 60)
    whyThisLead.push("Possible upside from stronger food visuals.");
  if (contactPathQuality.tier === "strong")
    whyThisLead.push("A clear public contact path makes a first touch realistic.");
  if (score.marketingInvestmentSignalScore >= 50)
    whyThisLead.push(
      "Possible existing paid-service signal — worth a careful, complementary conversation.",
    );
  if (whyThisLead.length === 0)
    whyThisLead.push("Mixed signals — review manually before prioritising.");

  // Why now.
  let whyNow: string;
  if (contactPathQuality.usablePathCount === 0) {
    whyNow = "Not yet — there is no usable public contact path to act on.";
  } else if (band === "very_high" || band === "high") {
    whyNow =
      "Reachable now with clear opportunity — a good moment for a cautious first touch.";
  } else if (band === "park") {
    whyNow = "No urgency — park and revisit when a clearer gap appears.";
  } else {
    whyNow = "Worth a look when there is capacity — not the most urgent.";
  }

  // Likely objection prep.
  const likelyObjection = likelyObjectionForSegment(profile);
  const objectionEntry = likelyObjection
    ? OBJECTION_PLAYBOOK[likelyObjection]
    : undefined;

  // Manual verification.
  const manualVerificationNeeded = [...contactPathQuality.manualVerificationChecklist];
  if (score.marketingInvestmentSignalScore >= 50) {
    manualVerificationNeeded.push(
      "Treat any paid-service signal as possible only — verify before mentioning it.",
    );
  }
  if (confidence === "low") {
    manualVerificationNeeded.push(
      "Learning history is early — rely on judgement, not the score, for now.",
    );
  }

  return {
    priorityScore,
    band,
    bandLabel: CONVERSION_BAND_LABELS[band],
    recommendedLeadAction,
    recommendedLeadActionLabel:
      RECOMMENDED_LEAD_ACTION_LABELS[recommendedLeadAction],
    whyThisLead: whyThisLead.slice(0, 4),
    whyNow,
    bestOutreachAngleId,
    bestOutreachAngleLabel:
      OUTREACH_ANGLE_LABELS[bestOutreachAngleId] ?? bestOutreachAngleId,
    likelyObjection,
    likelyObjectionLabel: objectionEntry?.label,
    likelyObjectionPrep: objectionEntry?.cautiousResponseAngle,
    confidence,
    confidenceLabel: PRIORITIZATION_CONFIDENCE_LABELS[confidence],
    manualVerificationNeeded,
    contactPathQuality,
    historicalAdjustment: Math.round(historicalAdjustment),
  };
}

export interface RankedLead<T> {
  lead: T;
  prioritization: LeadPrioritization;
}

/**
 * Rank a batch of leads by priority score and assign 1-based ranks. Pass a
 * mapper that yields (profile, input) for each lead so this stays decoupled
 * from any particular storage shape.
 */
export function rankLeads<T>(
  leads: T[],
  toAnalysis: (lead: T) => {
    profile: LeadIntelligenceProfile;
    input: LeadIntelligenceInput;
  },
  learning?: LearningSignals,
): RankedLead<T>[] {
  const scored = leads.map((lead) => {
    const { profile, input } = toAnalysis(lead);
    return { lead, prioritization: prioritizeLead(profile, input, learning) };
  });
  scored.sort(
    (a, b) => b.prioritization.priorityScore - a.prioritization.priorityScore,
  );
  scored.forEach((s, i) => {
    s.prioritization.priorityRank = i + 1;
  });
  return scored;
}
