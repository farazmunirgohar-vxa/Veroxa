import { TrendingUp } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ownerPortalNavItems } from "@/lib/ownerPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { demoBiMetrics, type DemoTrendPoint } from "@/data/demoData";

type ChartConfig = {
  title:  string;
  series: DemoTrendPoint[];
  unit:   string;
  color:  string;
};

const charts: ChartConfig[] = [
  { title: "Client growth",          series: demoBiMetrics.clientGrowth,         unit: " clients", color: "bg-sky-500"     },
  { title: "Revenue growth",         series: demoBiMetrics.revenueGrowth,        unit: " $",        color: "bg-emerald-500" },
  { title: "Retention",              series: demoBiMetrics.retention,            unit: "%",         color: "bg-violet-500"  },
  { title: "Media inventory trend",  series: demoBiMetrics.mediaInventoryTrend,  unit: " items",    color: "bg-cyan-500"    },
  { title: "Content production",     series: demoBiMetrics.contentProduction,    unit: " posts",    color: "bg-amber-500"   },
  { title: "Reporting completion",   series: demoBiMetrics.reportingCompletion,  unit: "%",         color: "bg-pink-500"    },
  { title: "Client health avg",      series: demoBiMetrics.clientHealthOverTime, unit: "%",         color: "bg-orange-500"  },
];

export default function OwnerBiCenter() {
  return (
    <PortalLayout items={ownerPortalNavItems} portalName="Owner Portal">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="header-bi-center">
          Business Intelligence Center
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Cross-portfolio trends across revenue, retention, media, content, reporting, and health.
        </p>
      </div>

      <DemoOnlyBanner message="Demo only — all charts use sample data." testId="banner-bi-center" />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {charts.map((c) => <ChartCard key={c.title} {...c} />)}
      </div>
    </PortalLayout>
  );
}

function ChartCard({ title, series, unit, color }: ChartConfig) {
  const max     = Math.max(...series.map((p) => p.value));
  const first   = series[0].value;
  const last    = series[series.length - 1].value;
  const delta   = first === 0 ? 0 : Math.round(((last - first) / first) * 100);
  const trendUp = delta >= 0;
  return (
    <Card className="bg-card border-border" data-testid={`bi-chart-${title.replace(/\s/g, "-").toLowerCase()}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          {title}
          <span className={`text-xs font-medium flex items-center gap-1 ${trendUp ? "text-emerald-400" : "text-rose-400"}`}>
            <TrendingUp className={`w-3 h-3 ${trendUp ? "" : "rotate-180"}`} />{delta >= 0 ? "+" : ""}{delta}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 h-24 mb-2">
          {series.map((p) => (
            <div key={p.label} className="flex-1 flex flex-col items-center justify-end gap-1">
              <div className={`w-full rounded-t-sm ${color} opacity-80`} style={{ height: `${(p.value / max) * 100}%`, minHeight: "2px" }} />
              <span className="text-[9px] text-muted-foreground">{p.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Latest: <span className="font-semibold text-foreground tabular-nums">
            {unit === " $" ? `$${last.toLocaleString()}` : `${last}${unit}`}
          </span>
        </p>
      </CardContent>
    </Card>
  );
}
