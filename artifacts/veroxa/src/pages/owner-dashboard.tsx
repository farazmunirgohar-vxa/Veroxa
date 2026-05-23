import { ArrowUpRight, ArrowDownRight, AlertTriangle, TrendingUp, HeartPulse, UserMinus, Sparkles, Siren } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ownerSnapshotSignals, activities } from "@/lib/demo-data";
import { ownerPortalNavItems } from "@/lib/ownerPortalNav";

export default function OwnerDashboard() {
  return (
    <PortalLayout items={ownerPortalNavItems} portalName="Owner Portal">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground" data-testid="header-owner">Owner Dashboard</h2>
        <p className="text-muted-foreground mt-1">Agency-wide revenue, client health, and critical alerts at a glance.</p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-card border-border shadow-sm" data-testid="metric-mrr">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">MRR</p>
            <h3 className="text-3xl font-bold text-foreground">$43,600</h3>
            <p className="text-xs text-emerald-500 font-medium mt-2 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> +8.7% vs last month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm" data-testid="metric-clients">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Active Clients</p>
            <h3 className="text-3xl font-bold text-foreground">34</h3>
            <p className="text-xs text-emerald-500 font-medium mt-2 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> +3 this month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm" data-testid="metric-health">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Avg Client Health</p>
            <h3 className="text-3xl font-bold text-foreground">78</h3>
            <p className="text-xs text-amber-500 font-medium mt-2 flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3" /> -2 pts vs last month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm" data-testid="metric-alerts">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Critical Alerts</p>
            <h3 className="text-3xl font-bold text-foreground text-red-500">2</h3>
            <p className="text-xs text-red-500 font-medium mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Require immediate action
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Business Snapshot */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-xl font-bold">AI Business Snapshot</h3>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[10px] font-semibold tracking-wide px-2 py-0.5">
            Demo Logic Only
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          A preview of how Veroxa's AI owner assistant will summarise business health at a glance. All signals below are simulated.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {ownerSnapshotSignals.map((signal) => {
            const iconMap = {
              "revenue-signal":      TrendingUp,
              "client-risk":         HeartPulse,
              "retention-watch":     UserMinus,
              "growth-opportunity":  Sparkles,
              "critical-escalation": Siren,
            } as const;
            const SignalIcon = iconMap[signal.key];
            const colorMap = {
              emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-500" },
              amber:   { bg: "bg-amber-500/10",   text: "text-amber-500",   dot: "bg-amber-500",   badge: "bg-amber-500/10 text-amber-500"   },
              red:     { bg: "bg-red-500/10",      text: "text-red-500",     dot: "bg-red-500",     badge: "bg-red-500/10 text-red-500"       },
              violet:  { bg: "bg-primary/10",      text: "text-primary",     dot: "bg-primary",     badge: "bg-primary/10 text-primary"       },
            } as const;
            const c = colorMap[signal.color];
            return (
              <Card key={signal.name} className="bg-card border-border" data-testid={`snapshot-card-${signal.name.toLowerCase().replace(/\s+/g, "-")}`}>
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

      {/* Recent Activity */}
      <div>
        <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="space-y-5">
              {activities.map((activity, i) => (
                <div key={i} className="flex items-start gap-3" data-testid={`activity-item-${i}`}>
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${activity.positive ? "bg-emerald-500" : "bg-red-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{activity.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{activity.target}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
