import {
  DollarSign, Users, TrendingUp, ShieldAlert, AlertTriangle, Bot, Activity, Brain,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { PortalLayout } from "@/components/PortalLayout";
import { ownerPortalNavItems } from "@/lib/ownerPortalNav";
import {
  PageHeader, MetricTile, StatusBadge, EmptyState,
  SectionCard, StatRow,
} from "@/components/common";
import { ClientRepository } from "@/domain/clients/repository";
import { HealthService, RiskService } from "@/domain/clients/service";
import { AIRepository } from "@/domain/ai/repository";
import {
  demoOwnerMetrics, demoOwnerKpis, demoRevenueTrend, demoServicePlans,
  demoClientHealthDistribution, demoOwnerCommandItems, demoAiAgentSummary,
} from "@/data/demoData";
import { recommendNextPost, recommendOperatorAction } from "@/lib/evidence/evidenceSelectionEngine";
import { demoEvidenceClientContexts } from "@/data/demo/demoEvidenceMemory";
import { Link } from "wouter";

const fmtMoney = (n: number) => `$${n.toLocaleString()}`;

export default function OwnerOS() {
  const portfolioHealth = HealthService.portfolioAverage();
  const atRisk          = RiskService.atRisk();
  const agents          = AIRepository.agents();
  const critical        = demoOwnerCommandItems.filter((i) => i.severity === "Critical");

  const last  = demoRevenueTrend[demoRevenueTrend.length - 1];
  const prev  = demoRevenueTrend[demoRevenueTrend.length - 2];
  const delta = last && prev ? Math.round(((last.revenue - prev.revenue) / prev.revenue) * 1000) / 10 : 0;

  const avgAgentConfidence = Math.round(
    agents.reduce((s, a) => s + a.confidence, 0) / Math.max(1, agents.length),
  );
  const healthyAgents = agents.filter((a) => a.confidence >= 85).length;

  return (
    <PortalLayout items={ownerPortalNavItems} portalName="Owner Portal">
    <div>
      <PageHeader
        title="Owner OS"
        description="Executive layer — revenue, growth, retention, risk, AI system health. Designed for above-the-line oversight."
        testId="header-owner-os"
      />
      <DemoOnlyBanner
        message="Executive snapshot. All figures are demo data and reflect Veroxa's flat pricing model ($477 Starter · $977 Complete Online Presence · $977 Ads Management · $1,497 Bundle — ad spend separate)."
        testId="banner-owner-os"
      />

      {/* Top KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <MetricTile icon={DollarSign}  label="MRR"              value={fmtMoney(demoOwnerMetrics.monthlyRecurringRevenue)} accent="text-emerald-300" hint={`Projected ${fmtMoney(demoOwnerMetrics.projectedRevenue)}`} testId="tile-mrr" />
        <MetricTile icon={Users}       label="Active clients"   value={demoOwnerMetrics.totalActiveClients}                accent="text-sky-300"    hint={`${demoOwnerKpis.clientsNeedingAttention} need attention`} testId="tile-active-clients" />
        <MetricTile icon={TrendingUp}  label="Month-over-month" value={`${demoOwnerMetrics.monthOverMonthGrowth}%`}        accent="text-emerald-300" hint="Demo trailing 6 months" testId="tile-mom" />
        <MetricTile icon={ShieldAlert} label="At-risk clients"  value={atRisk.length}                                      accent="text-rose-300"   hint={`${critical.length} critical alerts`} testId="tile-owner-at-risk" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Revenue command summary */}
        <SectionCard title="Revenue command" icon={DollarSign} iconClass="text-emerald-400" contentClass="">
          <div className="rounded-md border border-border bg-muted/20 p-3 mb-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-muted-foreground">This month</p>
              <p className="text-2xl font-bold tabular-nums">{fmtMoney(last?.revenue ?? 0)}</p>
              <p className={`text-[11px] ${delta >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{delta >= 0 ? "+" : ""}{delta}% vs last month</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-muted-foreground">Retention score</p>
              <p className="text-2xl font-bold tabular-nums text-emerald-300">{demoOwnerMetrics.retentionScore}%</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {demoServicePlans.map((p) => (
              <div key={p.plan} className="flex items-center justify-between text-xs" data-testid={`plan-${p.plan.toLowerCase()}`}>
                <span className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${p.color}`} />
                  {p.plan} · ${p.price}
                </span>
                <span className="tabular-nums text-muted-foreground">{p.clients} client{p.clients === 1 ? "" : "s"}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Growth trend */}
        <SectionCard title="Growth trend (6 mo)" icon={TrendingUp} iconClass="text-sky-400" contentClass="">
          <div className="grid grid-cols-6 gap-1.5 mb-2">
            {demoRevenueTrend.map((p) => {
              const max = Math.max(...demoRevenueTrend.map((x) => x.revenue));
              const h = Math.max(8, Math.round((p.revenue / max) * 100));
              return (
                <div key={p.month} className="flex flex-col items-center gap-1" data-testid={`trend-${p.month}`}>
                  <div className="w-full bg-muted/20 rounded-sm overflow-hidden" style={{ height: 90 }}>
                    <div className="bg-emerald-500/70 w-full mt-auto" style={{ height: `${h}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{p.month}</span>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60">
            <div><p className="text-[10px] text-muted-foreground">Utilization</p><p className="text-sm font-semibold tabular-nums">{demoOwnerMetrics.teamUtilization}%</p></div>
            <div><p className="text-[10px] text-muted-foreground">Reporting</p><p className="text-sm font-semibold tabular-nums">{demoOwnerMetrics.reportingCompletionRate}%</p></div>
            <div><p className="text-[10px] text-muted-foreground">Onboarding</p><p className="text-sm font-semibold tabular-nums">{demoOwnerMetrics.onboardingCompletionRate}%</p></div>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Client risk snapshot */}
        <SectionCard title="Client risk snapshot" icon={ShieldAlert} iconClass="text-rose-400">
          <div className="grid grid-cols-4 gap-1.5 mb-2">
            {demoClientHealthDistribution.map((d) => (
              <div key={d.status} className="rounded-md border border-border bg-muted/20 px-2 py-1.5 text-center" data-testid={`dist-${d.status.toLowerCase()}`}>
                <p className="text-[10px] text-muted-foreground">{d.status}</p>
                <p className="text-lg font-bold tabular-nums">{d.count}</p>
              </div>
            ))}
          </div>
          {atRisk.length === 0 ? (
            <EmptyState title="No clients at risk" testId="empty-owner-risk" />
          ) : (
            atRisk.map((c) => (
              <StatRow
                key={c.clientId}
                primary={ClientRepository.nameOf(c.clientId)}
                secondary={`Health ${c.healthScore}% · ${c.lifecycleStage}`}
                badge={<StatusBadge tone={c.riskLevel === "Critical" ? "danger" : "warning"}>{c.riskLevel}</StatusBadge>}
                testId={`risk-${c.clientId}`}
              />
            ))
          )}
        </SectionCard>

        {/* Critical alerts */}
        <SectionCard title="Critical alerts only" icon={AlertTriangle} iconClass="text-rose-400">
          {critical.length === 0 ? (
            <EmptyState title="No critical alerts" message="Portfolio is stable." testId="empty-owner-critical" />
          ) : (
            critical.slice(0, 5).map((i) => (
              <div key={i.id} className="rounded-md border border-border bg-muted/20 px-3 py-2" data-testid={`crit-${i.id}`}>
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <p className="text-sm font-semibold leading-tight">{i.title}</p>
                  <StatusBadge tone={i.severity === "Critical" ? "danger" : "warning"}>{i.severity}</StatusBadge>
                </div>
                <p className="text-[11px] text-muted-foreground">{i.description}</p>
                <p className="text-[10px] text-foreground/70 mt-1">
                  <span className="text-muted-foreground">Action:</span> {i.recommendedAction}
                </p>
              </div>
            ))
          )}
        </SectionCard>
      </div>

      {/* Evidence Intelligence summary */}
      {(() => {
        const clientIds = ["demo-a", "demo-b", "demo-c", "demo-d"] as const;
        const recs = clientIds.map((id) => recommendNextPost(id));
        const highConfidence = recs.filter((r) => r.confidenceScore >= 80).length;
        const criticalCtx = demoEvidenceClientContexts.filter((c) => c.recentRisk === "Critical");
        const topOpportunity = [...demoEvidenceClientContexts].sort((a, b) => b.contentRunwayDays - a.contentRunwayDays)[0];
        const avgConfidence = Math.round(recs.reduce((s, r) => s + r.confidenceScore, 0) / recs.length);
        return (
          <SectionCard title="Evidence Intelligence" icon={Brain} iconClass="text-violet-400" contentClass="">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] text-muted-foreground">
                Demo-only · simulated rule engine · no AI API connected.
              </p>
              <Link
                href="/demo/operator/evidence-engine"
                className="text-[11px] text-amber-300 hover:underline"
                data-testid="link-evidence-engine-owner"
              >
                Open Evidence Engine →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div className="rounded-md border border-border bg-muted/20 p-3" data-testid="evidence-recs-generated">
                <p className="text-[11px] text-muted-foreground">Recs generated</p>
                <p className="text-2xl font-bold tabular-nums text-violet-300">{recs.length}</p>
                <p className="text-[10px] text-muted-foreground">Active clients</p>
              </div>
              <div className="rounded-md border border-border bg-muted/20 p-3" data-testid="evidence-high-confidence">
                <p className="text-[11px] text-muted-foreground">High-confidence</p>
                <p className="text-2xl font-bold tabular-nums text-emerald-300">{highConfidence}/{recs.length}</p>
                <p className="text-[10px] text-muted-foreground">≥ 80% threshold</p>
              </div>
              <div className="rounded-md border border-border bg-muted/20 p-3" data-testid="evidence-top-opportunity">
                <p className="text-[11px] text-muted-foreground">Top opportunity</p>
                <p className="text-sm font-bold text-sky-300 leading-tight mt-0.5">{topOpportunity.clientName}</p>
                <p className="text-[10px] text-muted-foreground">{topOpportunity.contentRunwayDays}d runway · {topOpportunity.scheduledPostsCount} scheduled</p>
              </div>
              <div className="rounded-md border border-border bg-muted/20 p-3" data-testid="evidence-active-risk">
                <p className="text-[11px] text-muted-foreground">Active risk flags</p>
                <p className={`text-2xl font-bold tabular-nums ${criticalCtx.length > 0 ? "text-rose-300" : "text-emerald-300"}`}>{criticalCtx.length}</p>
                <p className="text-[10px] text-muted-foreground">Critical clients · avg {avgConfidence}% confidence</p>
              </div>
            </div>
          </SectionCard>
        );
      })()}

      {/* AI system health summary */}
      <SectionCard title="AI system health" icon={Bot} iconClass="text-violet-400" contentClass="">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-md border border-border bg-muted/20 p-3" data-testid="ai-agents-demo">
            <p className="text-[11px] text-muted-foreground">Agents (demo)</p>
            <p className="text-2xl font-bold tabular-nums">{demoAiAgentSummary.agentsInDemoMode}</p>
          </div>
          <div className="rounded-md border border-border bg-muted/20 p-3" data-testid="ai-avg-confidence">
            <p className="text-[11px] text-muted-foreground">Avg confidence</p>
            <p className="text-2xl font-bold tabular-nums text-violet-300">{avgAgentConfidence}%</p>
          </div>
          <div className="rounded-md border border-border bg-muted/20 p-3" data-testid="ai-healthy">
            <p className="text-[11px] text-muted-foreground">Healthy agents</p>
            <p className="text-2xl font-bold tabular-nums text-emerald-300">{healthyAgents}/{agents.length}</p>
          </div>
          <div className="rounded-md border border-border bg-muted/20 p-3" data-testid="ai-portfolio">
            <p className="text-[11px] text-muted-foreground">Portfolio health</p>
            <p className="text-2xl font-bold tabular-nums text-sky-300">{portfolioHealth}%</p>
          </div>
          <div className="md:col-span-4 text-[11px] text-muted-foreground flex items-center gap-1">
            <Activity className="w-3 h-3" />
            {demoAiAgentSummary.recentPreviewOutputs} preview outputs · {demoAiAgentSummary.alertsGenerated} alerts generated this week.
          </div>
        </div>
      </SectionCard>
    </div>
    </PortalLayout>
  );
}
