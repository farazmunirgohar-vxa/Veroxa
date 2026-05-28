/**
 * leadSourceScoring.ts — M034
 *
 * Internal Veroxa Lead Source Quality Score model.
 * Scores lead sources on 8 dimensions (100 pts total).
 *
 * NOTE: Execution Fit (cat 6), Yield Potential (cat 7), and Retention /
 * Referral Potential (cat 8) are internal preliminary estimates derived from
 * lead quality, priority tier, and source category — NOT from real close or
 * yield data. They will be recalibrated once clients are onboarded and actual
 * performance data exists.
 *
 * INTERNAL ONLY — never surface source quality scores to restaurants.
 */

import type { AuditLeadRecord, LeadSource, LeadSourceCategory } from "./leadTypes";
import {
  LEAD_SOURCE_CATEGORY,
  LEAD_SOURCE_CATEGORY_LABELS,
  LEAD_SOURCE_LABELS,
  getLeadSourceCategory,
} from "./leadTypes";
import type {
  LeadSourcePerformanceSnapshot,
  LeadSourceQualityGrade,
  LeadSourceQualityScore,
  LeadSourceRecommendation,
} from "./leadSourceTypes";

const clamp = (n: number, max: number): number =>
  Math.max(0, Math.min(max, Math.round(n)));

// ── Category execution-fit multipliers ──────────────────────────────────────
// Relationship and proof-based sources tend to produce better execution fit
// because the restaurant already has trust/context with Veroxa.
const CATEGORY_EXECUTION_FIT: Record<LeadSourceCategory, number> = {
  relationship: 1.0,
  proof_based: 0.95,
  website_self_selling: 0.85,
  campaign_event: 0.80,
  direct_outreach: 0.70,
  other: 0.60,
};

const CATEGORY_RETENTION_POTENTIAL: Record<LeadSourceCategory, number> = {
  relationship: 5,
  proof_based: 5,
  website_self_selling: 4,
  campaign_event: 3,
  direct_outreach: 2,
  other: 2,
};

// ── 1. Lead Volume (15) ──────────────────────────────────────────────────────
// Score relative to the top source by volume in the dataset.
function scoreLeadVolume(count: number, maxCount: number): number {
  if (maxCount === 0) return 0;
  return clamp((count / maxCount) * 15, 15);
}

// ── 2. Lead Quality (20) ─────────────────────────────────────────────────────
// Average internal lead score (0–100) → scaled to 20.
function scoreLeadQuality(avgScore: number): number {
  return clamp((avgScore / 100) * 20, 20);
}

// ── 3. Walkthrough Conversion (15) ──────────────────────────────────────────
// Walkthrough requests / total leads.
function scoreWalkthroughConversion(walkthroughs: number, total: number): number {
  if (total === 0) return 0;
  return clamp((walkthroughs / total) * 15, 15);
}

// ── 4. Close Conversion (15) ─────────────────────────────────────────────────
// Won / (Won + Lost). No outcome data = neutral 5.
function scoreCloseConversion(won: number, lost: number): number {
  const decisive = won + lost;
  if (decisive === 0) return 5; // no outcome data yet — neutral
  return clamp((won / decisive) * 15, 15);
}

// ── 5. Package Value (10) ────────────────────────────────────────────────────
// Average projected founding MRR per lead relative to $489/mo (founding
// Complete Online Presence — the natural anchor package).
function scorePackageValue(avgFoundingMrr: number): number {
  const anchor = 489;
  return clamp((avgFoundingMrr / anchor) * 10, 10);
}

// ── 6. Execution Fit (10) ────────────────────────────────────────────────────
// Estimated from average lead quality and source category.
function scoreExecutionFit(avgScore: number, category: LeadSourceCategory): number {
  const base = (avgScore / 100) * 10;
  const multiplier = CATEGORY_EXECUTION_FIT[category] ?? 0.7;
  return clamp(base * multiplier, 10);
}

// ── 7. Yield Potential (10) ──────────────────────────────────────────────────
// Estimated from avg internal lead score + priority distribution.
function scoreYieldPotential(
  avgScore: number,
  priorityALeads: number,
  total: number,
): number {
  if (total === 0) return 0;
  const scoreBase = (avgScore / 100) * 6;
  const priorityBonus = (priorityALeads / total) * 4;
  return clamp(scoreBase + priorityBonus, 10);
}

// ── 8. Retention / Referral Potential (5) ───────────────────────────────────
// Conservative estimate from source category.
function scoreRetentionReferral(category: LeadSourceCategory): number {
  return clamp(CATEGORY_RETENTION_POTENTIAL[category] ?? 2, 5);
}

export function getLeadSourceQualityGrade(score: number): LeadSourceQualityGrade {
  if (score >= 85) return "scale";
  if (score >= 70) return "improve";
  if (score >= 55) return "selective";
  if (score >= 40) return "low_quality";
  return "pause";
}

export function getLeadSourceRecommendation(
  snapshot: LeadSourcePerformanceSnapshot,
): string {
  switch (snapshot.qualityGrade) {
    case "scale":
      return "Scale this source carefully. Maintain quality as volume grows.";
    case "improve":
      return "Keep testing and improve your message and follow-up cadence.";
    case "selective":
      return "Use selectively. Only pursue when strong lead signals are present.";
    case "low_quality":
      return "Reduce effort unless there is a clear strategic reason to continue.";
    case "pause":
      return "Pause or rethink this source. Effort-to-return ratio is too low.";
  }
}

export function calculateSingleSourcePerformance(
  source: LeadSource,
  leads: AuditLeadRecord[],
  maxLeadCount: number,
): LeadSourcePerformanceSnapshot {
  const category = LEAD_SOURCE_CATEGORY[source] ?? "other";
  const sourceLeads = leads.filter((l) => l.source === source);
  const total = sourceLeads.length;

  let walkthroughRequested = 0;
  let contacted = 0;
  let proposalSent = 0;
  let won = 0;
  let lost = 0;
  let nurture = 0;
  let priorityALeads = 0;
  let totalFoundingMrr = 0;
  let totalStandardMrr = 0;
  let totalLeadScore = 0;

  for (const l of sourceLeads) {
    if (l.leadStage === "walkthrough_requested") walkthroughRequested++;
    if (l.leadStage === "contacted") contacted++;
    if (l.leadStage === "proposal_sent") proposalSent++;
    if (l.leadStage === "won") won++;
    if (l.leadStage === "lost") lost++;
    if (l.leadPriority === "nurture") nurture++;
    if (l.leadPriority === "priority_a") priorityALeads++;
    totalFoundingMrr += l.projectedMonthlyMrr;
    totalStandardMrr += l.projectedStandardMonthlyMrr;
    totalLeadScore += l.internalLeadScore;
  }

  const avgScore = total > 0 ? totalLeadScore / total : 0;
  const avgFoundingMrr = total > 0 ? totalFoundingMrr / total : 0;
  const estimatedYieldPotential = Math.round(avgScore * 0.6);

  const qualityScore: LeadSourceQualityScore = {
    leadVolume: scoreLeadVolume(total, maxLeadCount),
    leadQuality: scoreLeadQuality(avgScore),
    walkthroughConversion: scoreWalkthroughConversion(walkthroughRequested, total),
    closeConversion: scoreCloseConversion(won, lost),
    packageValue: scorePackageValue(avgFoundingMrr),
    executionFit: scoreExecutionFit(avgScore, category),
    yieldPotential: scoreYieldPotential(avgScore, priorityALeads, total),
    retentionReferralPotential: scoreRetentionReferral(category),
    total: 0,
  };
  qualityScore.total = clamp(
    qualityScore.leadVolume +
      qualityScore.leadQuality +
      qualityScore.walkthroughConversion +
      qualityScore.closeConversion +
      qualityScore.packageValue +
      qualityScore.executionFit +
      qualityScore.yieldPotential +
      qualityScore.retentionReferralPotential,
    100,
  );

  const qualityGrade = getLeadSourceQualityGrade(qualityScore.total);

  const snapshot: LeadSourcePerformanceSnapshot = {
    source,
    sourceLabel: LEAD_SOURCE_LABELS[source] ?? "Unknown / Other",
    category,
    categoryLabel: LEAD_SOURCE_CATEGORY_LABELS[category],
    totalLeads: total,
    priorityALeads,
    walkthroughRequested,
    contacted,
    proposalSent,
    won,
    lost,
    nurture,
    projectedFoundingMrr: Math.round(totalFoundingMrr),
    projectedStandardMrr: Math.round(totalStandardMrr),
    averageInternalLeadScore: Math.round(avgScore),
    estimatedYieldPotential,
    qualityScore,
    qualityGrade,
    recommendation: "",
  };
  snapshot.recommendation = getLeadSourceRecommendation(snapshot);
  return snapshot;
}

export function calculateLeadSourcePerformance(
  leads: AuditLeadRecord[],
): LeadSourcePerformanceSnapshot[] {
  const sourceSet = new Set<LeadSource>();
  for (const l of leads) {
    sourceSet.add(l.source);
  }
  const sources = Array.from(sourceSet);

  // Pre-compute max lead count across active sources for volume scoring.
  const sourceCounts = new Map<LeadSource, number>();
  for (const l of leads) {
    sourceCounts.set(l.source, (sourceCounts.get(l.source) ?? 0) + 1);
  }
  const maxCount = Math.max(0, ...Array.from(sourceCounts.values()));

  return sources.map((s) => calculateSingleSourcePerformance(s, leads, maxCount));
}

export function rankLeadSources(leads: AuditLeadRecord[]): LeadSourcePerformanceSnapshot[] {
  const snapshots = calculateLeadSourcePerformance(leads);
  return snapshots.sort((a, b) => b.qualityScore.total - a.qualityScore.total);
}

export function getLeadSourceRecs(
  leads: AuditLeadRecord[],
): LeadSourceRecommendation[] {
  const snapshots = rankLeadSources(leads);
  return snapshots.map((s) => ({
    source: s.source,
    sourceLabel: s.sourceLabel,
    action:
      s.qualityGrade === "scale"
        ? "scale"
        : s.qualityGrade === "improve"
          ? "improve"
          : s.qualityGrade === "selective"
            ? "selective"
            : s.qualityGrade === "low_quality"
              ? "reduce"
              : "pause",
    reason: s.recommendation,
    nextStep:
      s.qualityGrade === "scale"
        ? `Plan a deliberate volume increase for "${s.sourceLabel}" this week.`
        : s.qualityGrade === "improve"
          ? `Refine your outreach message and follow-up timing for "${s.sourceLabel}".`
          : s.qualityGrade === "selective"
            ? `Only pursue "${s.sourceLabel}" leads that hit Priority A or B.`
            : s.qualityGrade === "low_quality"
              ? `Halve time spent on "${s.sourceLabel}" until quality improves.`
              : `Pause "${s.sourceLabel}" and run an experiment on a higher-potential source instead.`,
  }));
}
