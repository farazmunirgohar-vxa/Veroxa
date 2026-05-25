import {
  Users, DollarSign, TrendingUp, Heart, Activity, Award,
  FileText, ClipboardCheck, ArrowUpRight,
} from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ownerPortalNavItems } from "@/lib/ownerPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import {
  demoOwnerMetrics, demoRevenueTrend, demoServicePlans,
  demoClientHealthDistribution,
} from "@/data/demoData";

const fmt$ = (n: number) => `$${n.toLocaleString()}`;

export default function OwnerExecutiveDashboard() {
  const maxRev    = Math.max(...demoRevenueTrend.map((p) => p.revenue));
  const totalPlan = demoServicePlans.reduce((s, p) => s + p.clients, 0);
  const totalHealth = demoClientHealthDistribution.reduce((s, h) => s + h.count, 0);

  return (
    <PortalLayout items={ownerPortalNavItems} portalName="Owner Portal">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="header-exec-dashboard">
          Executive Dashboard
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          High-level business health and growth across the entire portfolio.
        </p>
      </div>

      <DemoOnlyBanner message="Demo only — all metrics are sample data." testId="banner-exec-dashboard" />

      {/* Top metric grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Metric icon={Users}          label="Active clients"          value={String(demoOwnerMetrics.totalActiveClients)} />
        <Metric icon={DollarSign}     label="MRR"                     value={fmt$(demoOwnerMetrics.monthlyRecurringRevenue)} accent="text-emerald-400" />
        <Metric icon={TrendingUp}     label="Projected MRR"           value={fmt$(demoOwnerMetrics.projectedRevenue)}        accent="text-sky-400" />
        <Metric icon={Heart}          label="Client health avg"       value={`${demoOwnerMetrics.clientHealthAverage}%`} />
        <Metric icon={Activity}       label="Team utilisation"        value={`${demoOwnerMetrics.teamUtilization}%`} />
        <Metric icon={Award}          label="Retention score"         value={`${demoOwnerMetrics.retentionScore}%`}          accent="text-emerald-400" />
        <Metric icon={FileText}       label="Reporting completion"    value={`${demoOwnerMetrics.reportingCompletionRate}%`} />
        <Metric icon={ClipboardCheck} label="Onboarding completion"   value={`${demoOwnerMetrics.onboardingCompletionRate}%`} accent="text-amber-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Revenue trend */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Revenue trend
              <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />+{demoOwnerMetrics.monthOverMonthGrowth}% MoM
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 h-32 mb-2">
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

        {/* Client growth */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Client growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 h-32 mb-2">
              {demoRevenueTrend.map((p) => (
                <div key={p.month} className="flex-1 flex flex-col items-center justify-end gap-1.5">
                  <div className="w-full bg-emerald-500/80 rounded-t-sm" style={{ height: `${(p.clients / 4) * 100}%` }} />
                  <span className="text-[10px] text-muted-foreground">{p.month}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Active clients per month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Service plan distribution */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-base">Service plan distribution</CardTitle></CardHeader>
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
          <CardHeader><CardTitle className="text-base">Client health distribution</CardTitle></CardHeader>
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
          <CardHeader><CardTitle className="text-base">Monthly business summary</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/85 leading-relaxed">
              May brought a steady <span className="text-emerald-400 font-semibold">+12% MoM</span> revenue
              increase and held retention near <span className="font-semibold">94%</span>. Portfolio
              health is stable with 1 critical client requiring rescue. Three qualified leads in late
              discovery position the business for a possible <span className="text-sky-400 font-semibold">
              ${demoOwnerMetrics.projectedRevenue.toLocaleString()}</span> MRR next month.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <Stat label="MRR"      value={fmt$(demoOwnerMetrics.monthlyRecurringRevenue)} />
              <Stat label="Clients"  value={String(demoOwnerMetrics.totalActiveClients)}     />
              <Stat label="Health"   value={`${demoOwnerMetrics.clientHealthAverage}%`}     />
              <Stat label="Reports"  value={`${demoOwnerMetrics.reportingCompletionRate}%`}  />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-primary/30">
          <CardHeader><CardTitle className="text-base">Executive action center</CardTitle></CardHeader>
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

function Metric({ icon: Icon, label, value, accent }: { icon: typeof Users; label: string; value: string; accent?: string }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-3">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
          <Icon className="w-3.5 h-3.5" />{label}
        </div>
        <p className={`text-2xl font-bold tabular-nums ${accent ?? ""}`}>{value}</p>
      </CardContent>
    </Card>
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
