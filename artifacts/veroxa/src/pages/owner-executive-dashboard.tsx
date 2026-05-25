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
            <ul className="space-y-2 text-sm">
              {[
                "2 clients require attention",
                "4 reports pending validation",
                "1 onboarding issue open",
                "Revenue increased 12% MoM",
                "3 qualified leads ready for proposals",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  {line}
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
