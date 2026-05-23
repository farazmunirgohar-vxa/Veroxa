import { Briefcase, Users, TrendingDown, FileCheck, ImageOff, RadioTower, ClipboardCheck, HeartPulse, Siren } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { operatorOversightSignals } from "@/lib/demo-data";
import { operatorPortalNavItems } from "@/lib/operatorPortalNav";

const kpis = [
  { label: "Active Clients",            value: "34",       icon: Briefcase,    trend: "+3 this month",      positive: true  as boolean | null },
  { label: "Avg Health Score",          value: "78 / 100", icon: Users,        trend: "5 below threshold",  positive: false as boolean | null },
  { label: "Low Content Clients",       value: "6",        icon: TrendingDown, trend: "Action required",    positive: false as boolean | null },
  { label: "Reports Pending Approval",  value: "4",        icon: FileCheck,    trend: "Due by Friday",      positive: null  as boolean | null },
];

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function OperatorOverview() {
  return (
    <PortalLayout items={operatorPortalNavItems} portalName="Operator Portal">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground" data-testid="header-overview">Operations Overview</h2>
        <p className="text-muted-foreground mt-1">Client health, active alerts, failed posts, and reports awaiting your sign-off.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi, i) => (
          <Card key={i} className="bg-card border-border shadow-sm" data-testid={`kpi-card-${i}`}>
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                <kpi.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold mt-2">{kpi.value}</p>
              <p className={cn("text-xs mt-1", kpi.positive === true ? "text-emerald-500" : kpi.positive === false ? "text-red-500" : "text-amber-500")}>
                {kpi.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-xl font-bold">AI Oversight Preview</h3>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[10px] font-semibold tracking-wide px-2 py-0.5">
            Demo Logic Only
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          A preview of how Veroxa's AI oversight layer will surface risk signals for operator review. All signals below are simulated.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {operatorOversightSignals.map((signal) => {
            const iconMap = {
              "content-supply-risk":  ImageOff,
              "publishing-risk":      RadioTower,
              "report-quality":       ClipboardCheck,
              "client-health-watch":  HeartPulse,
              "escalation-signal":    Siren,
            } as const;
            const SignalIcon = iconMap[signal.key];
            const colorMap = {
              amber:  { bg: "bg-amber-500/10",  text: "text-amber-500",  dot: "bg-amber-500",  badge: "bg-amber-500/10 text-amber-500"  },
              red:    { bg: "bg-red-500/10",     text: "text-red-500",    dot: "bg-red-500",    badge: "bg-red-500/10 text-red-500"      },
              blue:   { bg: "bg-blue-500/10",    text: "text-blue-500",   dot: "bg-blue-500",   badge: "bg-blue-500/10 text-blue-500"    },
              violet: { bg: "bg-primary/10",     text: "text-primary",    dot: "bg-primary",    badge: "bg-primary/10 text-primary"      },
            } as const;
            const c = colorMap[signal.color];
            return (
              <Card key={signal.name} className="bg-card border-border" data-testid={`oversight-card-${signal.name.toLowerCase().replace(/\s+/g, "-")}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className={`p-2 rounded-lg ${c.bg} ${c.text}`}>
                      <SignalIcon className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest">Simulated</span>
                  </div>
                  <h4 className="text-sm font-semibold text-foreground mb-1 leading-snug">{signal.name}</h4>
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.badge} mb-2`}>
                    <span className={`w-1 h-1 rounded-full ${c.dot}`} />
                    {signal.status}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{signal.meaning}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </PortalLayout>
  );
}
