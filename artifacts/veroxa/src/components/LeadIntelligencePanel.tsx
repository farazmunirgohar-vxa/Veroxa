/**
 * LeadIntelligencePanel.tsx — team-facing surfaces for the Lead Intelligence +
 * Outreach Engine.
 *
 * SAFETY: read-only previews built from local audit leads + the rule-based
 * lead intelligence engine. No network, no auto-send, no provisioning. Every
 * lead-gen task is a human action; outreach always requires human review.
 */

import { useMemo } from "react";
import { Link } from "wouter";
import { Sparkles, Target, ArrowRight, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAuditLeads } from "@/lib/leads/localAuditLeadStore";
import {
  analyzeLeadIntelligence,
  inputFromAuditLead,
} from "@/lib/leadIntelligence/leadScoringEngine";
import {
  LEAD_SEGMENT_LABELS,
  type LeadIntelligenceProfile,
} from "@/lib/leadIntelligence/leadIntelligenceTypes";
import type { AuditLeadRecord } from "@/lib/leads/leadTypes";

interface ScoredLead {
  lead: AuditLeadRecord;
  profile: LeadIntelligenceProfile;
}

function useScoredLeads(): ScoredLead[] {
  return useMemo(() => {
    const leads = getAuditLeads();
    return leads
      .map((lead) => ({
        lead,
        profile: analyzeLeadIntelligence(inputFromAuditLead(lead)),
      }))
      .sort(
        (a, b) =>
          b.profile.score.overallConversionOpportunity -
          a.profile.score.overallConversionOpportunity,
      );
  }, []);
}

/** Compact summary strip for the team dashboard. */
export function LeadIntelligenceSummaryStrip() {
  const scored = useScoredLeads();
  if (scored.length === 0) return null;

  const highOpportunity = scored.filter(
    (s) => s.profile.score.overallConversionOpportunity >= 60,
  ).length;
  const needsContactResearch = scored.filter((s) =>
    s.profile.contactPaths.every((p) => p.confidence === "needs_research"),
  ).length;
  const possibleSpend = scored.filter(
    (s) => s.profile.marketingInvestment.possiblePaidServiceSignal,
  ).length;
  const readyToPrepare = scored.filter((s) =>
    s.profile.contactPaths.some((p) => p.confidence !== "needs_research"),
  ).length;

  return (
    <Card className="bg-card border-border" data-testid="lead-intel-strip">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Lead Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <StripCell label="High opportunity" value={highOpportunity} />
          <StripCell label="Ready to prepare" value={readyToPrepare} />
          <StripCell label="Needs contact research" value={needsContactResearch} />
          <StripCell label="Possible mktg spend" value={possibleSpend} />
        </div>
        <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          Rule-based scoring. Outreach drafts always require human review — nothing
          auto-sends.
        </p>
        <Link href="/demo/team/audit-leads">
          <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-primary cursor-pointer">
            Open lead queue <ArrowRight className="w-3 h-3" />
          </span>
        </Link>
      </CardContent>
    </Card>
  );
}

function StripCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

/** Lead-gen task list for the team work queue — separate from client work. */
export function LeadGenTasksList({ limit = 6 }: { limit?: number }) {
  const scored = useScoredLeads();
  if (scored.length === 0) return null;

  return (
    <Card
      className="bg-card border-border"
      data-testid="lead-gen-tasks"
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Lead-gen tasks (separate from client work)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-[11px] text-muted-foreground">
          Prospecting and outreach prep for audit leads. Every step is a human
          action — verify a public contact path, prepare a draft, then review
          before sending. Nothing auto-sends.
        </p>
        {scored.slice(0, limit).map(({ lead, profile }) => {
          const next = profile.nextActions[0];
          return (
            <div
              key={lead.id}
              className="rounded-md border border-border bg-muted/10 p-2.5"
              data-testid={`lead-gen-task-${lead.id}`}
            >
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <p className="text-sm font-medium">{lead.restaurantName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {profile.location || `${lead.city}, ${lead.state}`}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] border-primary/40 text-primary bg-primary/5"
                >
                  {LEAD_SEGMENT_LABELS[profile.segment]} ·{" "}
                  {profile.score.overallConversionOpportunity}/100
                </Badge>
              </div>
              {next && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Next: <span className="text-foreground/90">{next.label}</span>
                  {next.requiresHumanReview && (
                    <span className="text-amber-400"> (human review)</span>
                  )}{" "}
                  — {next.detail}
                </p>
              )}
            </div>
          );
        })}
        <Link href="/demo/team/audit-leads">
          <span className="inline-flex items-center gap-1 text-[11px] text-primary cursor-pointer">
            Open full lead queue <ArrowRight className="w-3 h-3" />
          </span>
        </Link>
      </CardContent>
    </Card>
  );
}
