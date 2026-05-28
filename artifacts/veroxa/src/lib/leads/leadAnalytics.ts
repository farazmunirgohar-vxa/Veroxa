/**
 * leadAnalytics.ts — M034
 *
 * In-memory analytics helpers for the Veroxa lead pipeline.
 * All operations are local / pure — no network, no Supabase, no fetch.
 */

import type { AuditLeadRecord, LeadSource } from "./leadTypes";
import { LEAD_SOURCE_LABELS, getLeadSourceCategory } from "./leadTypes";
import { rankLeadSources } from "./leadSourceScoring";
import type { LeadSourcePerformanceSnapshot } from "./leadSourceTypes";

/** Group leads by source and return a count map. */
export function summarizeLeadsBySource(
  leads: AuditLeadRecord[],
): Map<LeadSource, number> {
  const map = new Map<LeadSource, number>();
  for (const l of leads) {
    map.set(l.source, (map.get(l.source) ?? 0) + 1);
  }
  return map;
}

/** Return sources sorted by quality score descending (top performers first). */
export function getTopLeadSources(
  leads: AuditLeadRecord[],
  limit = 3,
): LeadSourcePerformanceSnapshot[] {
  return rankLeadSources(leads).slice(0, limit);
}

/**
 * Return sources that are graded "low_quality" or "pause" and have at least
 * one lead — i.e. sources consuming effort without proportional return.
 */
export function getWeakLeadSources(
  leads: AuditLeadRecord[],
): LeadSourcePerformanceSnapshot[] {
  return rankLeadSources(leads).filter(
    (s) => (s.qualityGrade === "low_quality" || s.qualityGrade === "pause") &&
            s.totalLeads > 0,
  );
}

/** Return a breakdown of leads by source category for mix analysis. */
export function getLeadSourceMix(leads: AuditLeadRecord[]): {
  category: ReturnType<typeof getLeadSourceCategory>;
  categoryLabel: string;
  count: number;
  pct: number;
}[] {
  type Cat = ReturnType<typeof getLeadSourceCategory>;
  const categoryMap = new Map<Cat, number>();
  for (const l of leads) {
    const cat = getLeadSourceCategory(l.source);
    categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + 1);
  }
  const total = leads.length || 1;
  return Array.from(categoryMap.entries())
    .map(([category, count]) => ({
      category,
      categoryLabel: getCategoryLabel(category),
      count,
      pct: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

function getCategoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    direct_outreach: "Direct Outreach",
    website_self_selling: "Website / Self-Selling",
    relationship: "Relationship",
    proof_based: "Proof / Case Study",
    campaign_event: "Campaign / Event",
    other: "Other",
  };
  return labels[cat] ?? cat;
}

/** Get a human-readable label for a source, with fallback. */
export function getSourceLabel(source: string): string {
  return (LEAD_SOURCE_LABELS as Record<string, string>)[source] ?? "Unknown / Other";
}
