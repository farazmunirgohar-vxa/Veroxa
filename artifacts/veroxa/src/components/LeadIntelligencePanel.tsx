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
import {
  Sparkles,
  Target,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Lightbulb,
} from "lucide-react";
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
import {
  prioritizeLead,
  CONVERSION_BAND_LABELS,
  type LeadPrioritization,
} from "@/lib/leadIntelligence/leadPrioritizationEngine";
import { computeLearningSignals } from "@/lib/leadIntelligence/leadLearningSignals";
import { getLeadOutcomes } from "@/lib/leadIntelligence/localLeadOutcomeStore";
import { buildSelfImprovementSnapshot } from "@/lib/leadIntelligence/selfImprovingLeadEngine";
import type { AuditLeadRecord } from "@/lib/leads/leadTypes";

interface ScoredLead {
  lead: AuditLeadRecord;
  profile: LeadIntelligenceProfile;
  prioritization: LeadPrioritization;
}

function useScoredLeads(): ScoredLead[] {
  return useMemo(() => {
    const leads = getAuditLeads();
    const learning = computeLearningSignals(getLeadOutcomes());
    const scored = leads.map((lead) => {
      const input = inputFromAuditLead(lead);
      const profile = analyzeLeadIntelligence(input);
      return {
        lead,
        profile,
        prioritization: prioritizeLead(profile, input, learning),
      };
    });
    scored.sort(
      (a, b) =>
        b.prioritization.priorityScore - a.prioritization.priorityScore,
    );
    scored.forEach((s, i) => {
      s.prioritization.priorityRank = i + 1;
    });
    return scored;
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
        {scored.slice(0, limit).map(({ lead, profile, prioritization }) => {
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
                <div className="flex flex-col items-end gap-1">
                  <Badge
                    variant="outline"
                    className="text-[10px] border-primary/40 text-primary bg-primary/5"
                  >
                    {CONVERSION_BAND_LABELS[prioritization.band]} ·{" "}
                    {prioritization.priorityScore}/100
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {LEAD_SEGMENT_LABELS[profile.segment]}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                <span className="text-foreground/90">
                  {prioritization.recommendedLeadActionLabel}
                </span>{" "}
                — {prioritization.whyNow}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Confidence: {prioritization.confidenceLabel}
              </p>
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

/**
 * Self-improving learning panel — surfaces what the engine has learned from
 * logged outcomes. Everything here is cautious and labelled by confidence;
 * patterns are signals, not rules, and a human always decides.
 */
export function LeadLearningPanel() {
  const snapshot = useMemo(
    () => buildSelfImprovementSnapshot(getLeadOutcomes()),
    [],
  );

  const { learning } = snapshot;

  return (
    <Card className="bg-card border-border" data-testid="lead-learning-panel">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Self-improving learning
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {learning.totalOutcomes === 0 ? (
          <p className="text-[12px] text-muted-foreground">
            No outcomes logged yet. As your team logs what happens after reaching
            out, the engine will surface cautious patterns here — never rules,
            always for a human to weigh.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-[11px] text-muted-foreground">
                {learning.totalOutcomes} outcome(s) logged
              </p>
              {snapshot.stillLearning && (
                <Badge
                  variant="outline"
                  className="text-[10px] border-amber-500/40 text-amber-400 bg-amber-500/5"
                  data-testid="learning-still-learning"
                >
                  Still learning — early signals
                </Badge>
              )}
            </div>

            {snapshot.insights.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" /> Insights
                </p>
                <ul className="text-[12px] list-disc pl-5 space-y-0.5">
                  {snapshot.insights.map((ins, i) => (
                    <li key={i}>{ins}</li>
                  ))}
                </ul>
              </div>
            )}

            {snapshot.targetingRecommendations.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Targeting (who to focus on)
                </p>
                <ul className="space-y-1">
                  {snapshot.targetingRecommendations.map((r, i) => (
                    <li
                      key={i}
                      className="text-[11px] text-muted-foreground rounded border border-border bg-muted/10 p-1.5"
                    >
                      <span className="text-foreground/90">
                        {LEAD_SEGMENT_LABELS[
                          r.subject as keyof typeof LEAD_SEGMENT_LABELS
                        ] ?? r.subject}
                      </span>{" "}
                      — {r.detail}{" "}
                      <span className="italic">({r.confidenceLabel})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {snapshot.outreachRecommendations.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Outreach (what is landing)
                </p>
                <ul className="space-y-1">
                  {snapshot.outreachRecommendations.map((r, i) => (
                    <li
                      key={i}
                      className="text-[11px] text-muted-foreground rounded border border-border bg-muted/10 p-1.5"
                    >
                      <span className="text-foreground/90">{r.subject}</span> —{" "}
                      {r.detail}{" "}
                      <span className="italic">({r.confidenceLabel})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
        <p className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          Cautious signals only — never guarantees. A human always decides.
        </p>
      </CardContent>
    </Card>
  );
}
