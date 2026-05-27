// TODO(client-health-drift): the "Client health avg" tile reads
//   `demoOwnerMetrics.clientHealthAverage` (a single hard-coded %), and the
//   "Client health" distribution bars read `demoClientHealthDistribution`
//   (vocabulary `Excellent | Healthy | Warning | Critical`). The canonical
//   source is `ClientHealthEngine.portfolioSummary()` in
//   `src/domain/clientHealth/engine.ts`, which emits counts in
//   `Healthy | Caution | Urgent | Broken` and does NOT expose a portfolio %.
//   See `docs/CLIENT_HEALTH_ENGINE_CONTRACT.md` §5.1 (Owner shell). The %
//   shown today is not derivable from any engine output. No fix in this pass
//   — documentation only.
import {
  Users, DollarSign, Heart, Award,
  ArrowUpRight,
} from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ownerPortalNavItems } from "@/lib/ownerPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { PageHeader, MetricTile } from "@/components/common";
import {
  demoOwnerMetrics, demoRevenueTrend, demoServicePlans,
  demoClientHealthDistribution,
} from "@/data/demoData";
import { DemoFlowTimeline } from "@/components/demo/DemoVisuals";

const veroxaOsFlow = [
  { key: "upload",   label: "Client Upload",  caption: "Restaurant adds media" },
  { key: "ai",       label: "AI Drafts",      caption: "Captions + angles" },
  { key: "review",   label: "Team Review",    caption: "Human approval" },
  { key: "schedule", label: "Schedule",       caption: "Best posting times" },
  { key: "report",   label: "Report",         caption: "Weekly + monthly" },
  { key: "retain",   label: "Retain",         caption: "Client sees results" },
];

const ACTION_ITEMS: Array<{
  text: string;
  severity: "critical" | "attention" | "normal";
}> = [
  { text: "2 clients require immediate attention", severity: "critical" },
  { text: "4 reports pending operator validation",  severity: "attention" },
  { text: "1 onboarding issue open",               severity: "attention" },
  { text: "Revenue increased 12% MoM",             severity: "normal" },
  { text: "3 qualified leads ready for proposals", severity: "normal" },
];

const SEVERITY_STYLE = {
  critical:  "bg-rose-500    w-2 h-2 rounded-full flex-shrink-0 mt-1",
  attention: "bg-amber-400   w-2 h-2 rounded-full flex-shrink-0 mt-1",
  normal:    "bg-primary/60  w-2 h-2 rounded-full flex-shrink-0 mt-1",
};

const fmt$ = (n: number) => `$${n.toLocaleString()}`;

export default function OwnerExecutiveDashboard() {
  const maxRev      = Math.max(...demoRevenueTrend.map((p) => p.revenue));
  const totalPlan   = demoServicePlans.reduce((s, p) => s + p.clients, 0);
  const totalHealth = demoClientHealthDistribution.reduce((s, h) => s + h.count, 0);

  return (
    <PortalLayout items={ownerPortalNavItems} portalName="Owner Portal">
      <PageHeader
        title="Executive Dashboard"
        description="High-level business health and growth across your portfolio."
        testId="header-exec-dashboard"
      />

      <DemoOnlyBanner message="Demo only — all metrics are sample data." testId="banner-exec-dashboard" />

      {/* Veroxa OS flow — visual */}
      <Card className="bg-card border-border mb-4" data-testid="card-veroxa-os-flow">
        <CardHeader>
          <CardTitle className="text-base">Veroxa OS flow</CardTitle>
        </CardHeader>
        <CardContent>
          <DemoFlowTimeline steps={veroxaOsFlow} testId="owner-veroxa-flow" />
          <p className="mt-3 text-[11px] text-muted-foreground">
            Demo only — illustrative flow. No real automation is running.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricTile icon={Users}      label="Active clients"    value={demoOwnerMetrics.totalActiveClients}                       testId="tile-active-clients" />
        <MetricTile icon={DollarSign} label="MRR"               value={fmt$(demoOwnerMetrics.monthlyRecurringRevenue)} accent="text-emerald-400" testId="tile-mrr" />
        <MetricTile icon={Heart}      label="Client health avg" value={`${demoOwnerMetrics.clientHealthAverage}%`}                testId="tile-health-avg" />
        <MetricTile icon={Award}      label="Retention score"   value={`${demoOwnerMetrics.retentionScore}%`}           accent="text-emerald-400" testId="tile-retention" />
      </div>

      {/* Revenue trend — full width */}
      <Card className="bg-card border-border mb-4">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            Revenue trend
            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />+{demoOwnerMetrics.monthOverMonthGrowth}% MoM
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 h-36 mb-2">
            {demoRevenueTrend.map((p) => (
              <div key={p.month} className="flex-1 flex flex-col items-center justify-end gap-1.5">
                <div className="w-full bg-primary/80 rounded-t-sm relative group" style={{ height: `${(p.revenue / maxRev) * 100}%` }}>
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-popover border border-border rounded px-1.5 py-0.5 text-[10px] whitespace-nowrap">
                    {fmt$(p.revenue)}
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground">{p.month}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Service plan distribution */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-base">Service plans</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex w-full h-3 rounded-full overflow-hidden">
              {demoServicePlans.map((p) => (
                <div key={p.plan} className={p.color} style={{ width: `${(p.clients / totalPlan) * 100}%` }} title={`${p.plan}: ${p.clients}`} />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoServicePlans.map((p) => (
                <div key={p.plan} className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-2.5 py-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-2.5 h-2.5 rounded-sm ${p.color}`} />
                    <span>{p.plan}</span>
                  </div>
                  <span className="text-xs font-semibold tabular-nums">${p.price}/mo · {p.clients}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Client health distribution */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-base">Client health</CardTitle></CardHeader>
          <CardContent className="space-y-2.5">
            {demoClientHealthDistribution.map((h) => {
              const pct = totalHealth === 0 ? 0 : Math.round((h.count / totalHealth) * 100);
              return (
                <div key={h.status}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>{h.status}</span>
                    <span className="text-muted-foreground tabular-nums">{h.count} · {pct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted/40">
                    <div className={`h-1.5 rounded-full ${h.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Monthly summary + executive action center */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-base">Monthly summary</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/85 leading-relaxed">
              May brought a steady <span className="text-emerald-400 font-semibold">+12% MoM</span> revenue
              increase and held retention near <span className="font-semibold">94%</span>. Portfolio
              health is stable with 1 critical client requiring attention. Three qualified leads in late
              discovery position the business for a possible{" "}
              <span className="text-sky-400 font-semibold">${demoOwnerMetrics.projectedRevenue.toLocaleString()}</span> MRR next month.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <Stat label="MRR"       value={fmt$(demoOwnerMetrics.monthlyRecurringRevenue)} />
              <Stat label="Clients"   value={String(demoOwnerMetrics.totalActiveClients)}    />
              <Stat label="Health"    value={`${demoOwnerMetrics.clientHealthAverage}%`}     />
              <Stat label="Retention" value={`${demoOwnerMetrics.retentionScore}%`}          />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-primary/30">
          <CardHeader><CardTitle className="text-base">Action items</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
              {(["critical","attention","normal"] as const).map((s) => {
                const count = ACTION_ITEMS.filter(i => i.severity === s).length;
                const cls = s === "critical" ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                          : s === "attention" ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                          : "border-border bg-muted/20 text-muted-foreground";
                return (
                  <span key={s} className={`rounded-full border px-2 py-0.5 font-medium capitalize ${cls}`}>
                    {count} {s}
                  </span>
                );
              })}
            </div>
            <ul className="space-y-2 text-sm">
              {ACTION_ITEMS.map((item) => (
                <li key={item.text} className="flex items-start gap-2">
                  <span className={SEVERITY_STYLE[item.severity]} />
                  {item.text}
                </li>
              ))}
            </ul>
            <div className="mt-3">
              <Progress value={demoOwnerMetrics.onboardingCompletionRate} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground mt-1">Onboarding completion {demoOwnerMetrics.onboardingCompletionRate}%</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="font-semibold tabular-nums">{value}</p>
    </div>
  );
}
