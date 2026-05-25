import { FileText, FileBarChart, CheckCircle2, Send, Clock } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ownerPortalNavItems } from "@/lib/ownerPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { demoReportingAnalytics } from "@/data/demoData";

export default function OwnerReportingAnalytics() {
  const r       = demoReportingAnalytics;
  const max     = Math.max(...r.historicalCompletion.map((p) => p.value));

  return (
    <PortalLayout items={ownerPortalNavItems} portalName="Owner Portal">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="header-reporting-analytics">
          Reporting Analytics
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Weekly and monthly reporting performance, validation rates, and historical trends.
        </p>
      </div>

      <DemoOnlyBanner message="Demo only — reporting metrics are sample data." testId="banner-reporting-analytics" />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <Metric icon={FileText}      label="Weekly drafted"          value={String(r.weeklyDrafted)}                  />
        <Metric icon={CheckCircle2}  label="Weekly validation rate"  value={`${r.weeklyValidationRate}%`} accent="text-emerald-400" />
        <Metric icon={Send}          label="Weekly publish rate"     value={`${r.weeklyPublishRate}%`}   accent="text-sky-400" />
        <Metric icon={FileBarChart}  label="Monthly drafted"         value={String(r.monthlyDrafted)}                 />
        <Metric icon={Send}          label="Monthly publish rate"    value={`${r.monthlyPublishRate}%`}  accent="text-emerald-400" />
        <Metric icon={Clock}         label="Avg draft → publish"     value={`${r.avgDraftToPublishHours}h`} />
      </div>

      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-base">Historical reporting completion (6 months)</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 h-32 mb-3">
            {r.historicalCompletion.map((p) => (
              <div key={p.label} className="flex-1 flex flex-col items-center justify-end gap-1">
                <div className="w-full bg-violet-500/80 rounded-t-sm relative group" style={{ height: `${(p.value / max) * 100}%` }}>
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 bg-popover border border-border rounded px-1.5 py-0.5 text-[10px] whitespace-nowrap">
                    {p.value}%
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground">{p.label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Validated weekly reports as a percentage of drafted.</p>
        </CardContent>
      </Card>
    </PortalLayout>
  );
}

function Metric({ icon: Icon, label, value, accent }: { icon: typeof FileText; label: string; value: string; accent?: string }) {
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
