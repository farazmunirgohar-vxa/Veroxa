/**
 * leadSourceTypes.ts — M034
 *
 * Types for the Veroxa Lead Source Quality Score model.
 * Internal-only. Never shown to restaurants or on public pages.
 */

import type { LeadSource, LeadSourceCategory } from "./leadTypes";

export type LeadSourceQualityGrade =
  | "scale"
  | "improve"
  | "selective"
  | "low_quality"
  | "pause";

export type LeadSourceExperimentStatus =
  | "planned"
  | "active"
  | "paused"
  | "completed";

export const LEAD_SOURCE_QUALITY_GRADE_LABELS: Record<LeadSourceQualityGrade, string> = {
  scale: "Scale",
  improve: "Improve",
  selective: "Selective",
  low_quality: "Low Quality",
  pause: "Pause",
};

export const LEAD_SOURCE_QUALITY_GRADE_COLORS: Record<LeadSourceQualityGrade, string> = {
  scale: "bg-emerald-100 text-emerald-800",
  improve: "bg-blue-100 text-blue-800",
  selective: "bg-yellow-100 text-yellow-800",
  low_quality: "bg-orange-100 text-orange-800",
  pause: "bg-red-100 text-red-800",
};

export const LEAD_SOURCE_EXPERIMENT_STATUS_LABELS: Record<LeadSourceExperimentStatus, string> = {
  planned: "Planned",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
};

/**
 * Lead Source Quality Score breakdown (100 pts total).
 *
 * NOTE: Execution Fit, Yield Potential, and Retention / Referral Potential
 * are internal preliminary estimates until real close and yield data is
 * connected. They are derived from lead quality, priority tier, and source
 * category.
 */
export interface LeadSourceQualityScore {
  leadVolume: number;               // 15 — count relative to active sources
  leadQuality: number;              // 20 — average internal lead score
  walkthroughConversion: number;    // 15 — walkthrough requests / total leads
  closeConversion: number;          // 15 — won / (won + lost) ratio
  packageValue: number;             // 10 — average projected founding MRR per lead
  executionFit: number;             // 10 — estimated from lead quality + source category
  yieldPotential: number;           // 10 — estimated from internal lead score + package
  retentionReferralPotential: number; // 5 — conservative estimate from source category
  total: number;                    // 0–100 clamped
}

export interface LeadSourcePerformanceSnapshot {
  source: LeadSource;
  sourceLabel: string;
  category: LeadSourceCategory;
  categoryLabel: string;
  totalLeads: number;
  priorityALeads: number;
  walkthroughRequested: number;
  contacted: number;
  proposalSent: number;
  won: number;
  lost: number;
  nurture: number;
  projectedFoundingMrr: number;
  projectedStandardMrr: number;
  averageInternalLeadScore: number;
  estimatedYieldPotential: number;
  qualityScore: LeadSourceQualityScore;
  qualityGrade: LeadSourceQualityGrade;
  recommendation: string;
}

export interface LeadSourceRecommendation {
  source: LeadSource;
  sourceLabel: string;
  action: "scale" | "improve" | "selective" | "reduce" | "pause" | "experiment";
  reason: string;
  nextStep: string;
}

export interface LeadSourceExperiment {
  id: string;
  source: LeadSource;
  title: string;
  hypothesis: string;
  startDate: string;
  endDate?: string;
  status: LeadSourceExperimentStatus;
  targetLeadCount: number;
  targetWalkthroughs: number;
  notes: string;
  resultSummary?: string;
  createdAt: string;
  updatedAt: string;
}
