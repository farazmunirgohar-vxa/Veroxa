/**
 * ExecutionIntelligencePanel.tsx — team-facing surfaces for the Execution
 * Intelligence Engine + Growth Flywheel.
 *
 * SAFETY: read-only previews built from local fixtures + the rule-based
 * execution intelligence engine. No network, no auto-send/call/message, no
 * publishing, no payments, no guarantees. Retention risk detail is team-only;
 * client-facing wording stays calm and blame-free. A human always decides on
 * retention and sensitive client comms.
 */

import { useMemo } from "react";
import { Link } from "wouter";
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  HeartPulse,
  Workflow,
  Swords,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common";
import type { StatusBadgeTone } from "@/components/common";
import {
  allClientExecutionProfiles,
} from "@/lib/executionIntelligence/executionScoringEngine";
import type {
  ExecutionIntelligenceProfile,
  RetentionRiskLevel,
} from "@/lib/executionIntelligence/executionIntelligenceTypes";
import { getAuditLeads } from "@/lib/leads/localAuditLeadStore";
import {
  analyzeLeadIntelligence,
  inputFromAuditLead,
} from "@/lib/leadIntelligence/leadScoringEngine";

const riskTone: Record<RetentionRiskLevel, StatusBadgeTone> = {
  low: "success",
  watch: "info",
  elevated: "warning",
  high: "danger",
};

function useExecutionProfiles(): ExecutionIntelligenceProfile[] {
  return useMemo(() => allClientExecutionProfiles(), []);
}

/** Compact summary strip for the team dashboard. */
export function ExecutionIntelligenceSummaryStrip() {
  const profiles = useExecutionProfiles();
  if (profiles.length === 0) return null;

  const atRisk = profiles.filter(
    (p) => p.retention.level === "elevated" || p.retention.level === "high",
  ).length;
  const needsInput = profiles.filter((p) =>
    p.clientNeedsToProvide.some(
      (n) => !n.startsWith("Nothing needed"),
    ),
  ).length;
  const healthyExecution = profiles.filter(
    (p) => p.executionHealth.score >= 70,
  ).length;
  const renewLikely = profiles.filter((p) => p.renewalLikelihood >= 70).length;

  return (
    <Card className="bg-card border-border" data-testid="execution-intel-strip">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Execution Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <StripCell label="Healthy execution" value={healthyExecution} />
          <StripCell label="Likely to renew" value={renewLikely} />
          <StripCell label="Needs client input" value={needsInput} />
          <StripCell label="Retention attention" value={atRisk} />
        </div>
        <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          Rule-based scoring. Risk is framed as fixable inputs, never the client's
          fault — and a human always decides on retention.
        </p>
        <Link href="/team/work-queue">
          <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-primary cursor-pointer">
            Open work queue <ArrowRight className="w-3 h-3" />
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

/** Per-client execution health list with retention badges (team-facing). */
export function ExecutionHealthList({ limit = 6 }: { limit?: number }) {
  const profiles = useExecutionProfiles();
  if (profiles.length === 0) return null;

  return (
    <Card className="bg-card border-border" data-testid="execution-health-list">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-primary" />
          Client execution health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-[11px] text-muted-foreground">
          Execution retains clients. Risk detail here is team-only; client-facing
          wording stays calm and respectful. Nothing auto-sends.
        </p>
        {profiles.slice(0, limit).map((p) => (
          <div
            key={p.clientId}
            className="rounded-md border border-border bg-muted/10 p-2.5"
            data-testid={`execution-health-${p.clientId}`}
          >
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p className="text-sm font-medium">{p.restaurantName}</p>
                <p className="text-[11px] text-muted-foreground">
                  {p.clientSuccessFit.categoryLabel} · execution{" "}
                  {p.executionHealth.score}/100
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusBadge tone={riskTone[p.retention.level]}>
                  {p.retention.levelLabel}
                </StatusBadge>
                <span className="text-[10px] text-muted-foreground">
                  Renewal {p.renewalLikelihood}/100
                </span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              <span className="text-foreground/90">
                {p.nextBestAction.label}
              </span>{" "}
              — {p.nextBestAction.detail}
            </p>
            {p.retention.items.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {p.retention.items.slice(0, 3).map((item, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-[10px] border-amber-500/40 text-amber-400 bg-amber-500/5"
                  >
                    {item.reasonLabel}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Engine Competition — Lead Intelligence (brings clients) vs Execution
 * Intelligence (retains them). Both feed each other; neither wins alone.
 */
export function EngineCompetitionPanel() {
  const profiles = useExecutionProfiles();

  const stats = useMemo(() => {
    const leads = getAuditLeads();
    const leadProfiles = leads.map((l) =>
      analyzeLeadIntelligence(inputFromAuditLead(l)),
    );
    const highOpportunity = leadProfiles.filter(
      (p) => p.score.overallConversionOpportunity >= 60,
    ).length;
    const avgRenewal =
      profiles.length > 0
        ? Math.round(
            profiles.reduce((s, p) => s + p.renewalLikelihood, 0) /
              profiles.length,
          )
        : 0;
    const retained = profiles.filter((p) => p.retention.level === "low").length;
    return {
      leadCount: leads.length,
      highOpportunity,
      clientCount: profiles.length,
      avgRenewal,
      retained,
    };
  }, [profiles]);

  return (
    <Card className="bg-card border-primary/20" data-testid="engine-competition">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Swords className="w-4 h-4 text-primary" />
          Engine Competition
          <span className="text-[10px] text-muted-foreground font-normal">
            · two engines, one flywheel
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-md border border-sky-500/30 bg-sky-500/5 p-3">
            <p className="text-[10px] uppercase tracking-wider text-sky-400 font-semibold mb-1 inline-flex items-center gap-1">
              <Target className="w-3 h-3" /> Lead Intelligence — brings clients
            </p>
            <div className="grid grid-cols-2 gap-2">
              <MiniStat label="Saved leads" value={stats.leadCount} />
              <MiniStat label="High opportunity" value={stats.highOpportunity} />
            </div>
          </div>
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
            <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold mb-1 inline-flex items-center gap-1">
              <Workflow className="w-3 h-3" /> Execution Intelligence — retains them
            </p>
            <div className="grid grid-cols-2 gap-2">
              <MiniStat label="Active clients" value={stats.clientCount} />
              <MiniStat label="Avg renewal" value={`${stats.avgRenewal}`} />
            </div>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Lead Intelligence brings clients in; Execution Intelligence keeps them.
          Retention outcomes feed back into who to target next — retention proves
          value, not raw lead volume.
        </p>
        <p className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          Rule-based preview. No guarantees, no auto-send — a human always decides.
        </p>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded border border-border/50 bg-background/40 p-2">
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">
        {label}
      </p>
    </div>
  );
}
