/**
 * leadSummary.ts — rule-based lead summary for the Audit Lead handoff.
 *
 * Deterministic by default. An optional server-backed enhancement is available
 * via generateAiDraftClient (draftType "lead_summary"); when the server is not
 * configured or unreachable, callers keep this rule-based summary. No keys are
 * ever read here.
 */

import type { AuditLeadRecord } from "./leadTypes";

export interface RuleBasedLeadSummary {
  headline: string;
  bullets: string[];
  recommendedFocus: string;
}

/**
 * Build a calm, plain-language internal summary of a lead from data already
 * on the record. Safe to render on the team surface.
 */
export function buildRuleBasedLeadSummary(
  lead: AuditLeadRecord,
): RuleBasedLeadSummary {
  const { restaurantName, city, state, cuisineType, publicAudit } = lead;

  const headline = `${restaurantName} — ${cuisineType} in ${city}, ${state}. Audit grade ${publicAudit.gradeLabel} (${publicAudit.totalScore}/100), recommended ${publicAudit.recommendedPackageLabel}.`;

  const bullets: string[] = [];
  bullets.push(
    `Lead score ${lead.internalLeadScore}/100 · projected ${formatUsd(lead.projectedMonthlyMrr)}/mo current plan.`,
  );
  if (publicAudit.weakSpotTitles.length > 0) {
    bullets.push(
      `Biggest gaps to address: ${publicAudit.weakSpotTitles.slice(0, 3).join(", ")}.`,
    );
  }
  bullets.push(`Suggested next action: ${lead.nextAction}`);

  const recommendedFocus =
    publicAudit.weakSpotTitles[0] ??
    "Establish a steady weekly content rhythm to build momentum.";

  return { headline, bullets, recommendedFocus };
}

function formatUsd(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}
