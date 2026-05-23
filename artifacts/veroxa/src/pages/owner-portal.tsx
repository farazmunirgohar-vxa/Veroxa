import { LineChart, DollarSign, Target, Settings, Layers, ArrowUpRight, ArrowDownRight, Activity, AlertTriangle, TrendingUp, HeartPulse, UserMinus, Sparkles, Siren } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { revenueData, ownerCriticalAlerts as criticalAlerts, clientHealthBands, growthSummary, activities } from "@/lib/demo-data";

const sidebarItems = [
  { label: "Dashboard", icon: LineChart },
  { label: "Revenue", icon: DollarSign },
  { label: "Client Health", icon: Target },
  { label: "Alerts", icon: AlertTriangle },
  { label: "Settings", icon: Settings },
];

export default function OwnerPortal() {
  return (
    <PortalLayout items={sidebarItems} portalName="Owner Portal">
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
          {([
            {
              icon: TrendingUp,
              name: "Revenue Signal",
              status: "MRR up 8.7%",
              meaning: "Highlights business-level revenue movement and whether growth is healthy.",
              color: "emerald",
            },
            {
              icon: HeartPulse,
              name: "Client Risk Signal",
              status: "6 clients need attention",
              meaning: "Summarises client health problems without surfacing daily execution clutter.",
              color: "amber",
            },
            {
              icon: UserMinus,
              name: "Retention Watch",
              status: "2 accounts at elevated churn risk",
              meaning: "Flags accounts that may need owner awareness due to recurring content, performance, or communication issues.",
              color: "red",
            },
            {
              icon: Sparkles,
              name: "Growth Opportunity",
              status: "3 expansion candidates",
              meaning: "Identifies clients ready for ads, upsell, referral request, or case study.",
              color: "violet",
            },
            {
              icon: Siren,
              name: "Critical Escalation",
              status: "2 owner-level alerts",
              meaning: "Surfaces only serious problems that require strategic attention.",
              color: "red",
            },
          ] as const).map((signal) => {
            const colorMap = {
              emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-500" },
              amber:   { bg: "bg-amber-500/10",   text: "text-amber-500",   dot: "bg-amber-500",   badge: "bg-amber-500/10 text-amber-500"   },
              red:     { bg: "bg-red-500/10",      text: "text-red-500",     dot: "bg-red-500",     badge: "bg-red-500/10 text-red-500"       },
              violet:  { bg: "bg-primary/10",      text: "text-primary",     dot: "bg-primary",     badge: "bg-primary/10 text-primary"       },
            } as const;
            const c = colorMap[signal.color];
            return (
              <Card key={signal.name} className="bg-card border-border" data-testid={`snapshot-card-${signal.name.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className={`p-2 rounded-lg ${c.bg} ${c.text}`}>
                      <signal.icon className="w-4 h-4" />
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

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Revenue Chart */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl">MRR Trend — Last 6 Months</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[260px] w-full" data-testid="revenue-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[...revenueData]} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={(value) => `$${value / 1000}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                      itemStyle={{ color: "hsl(var(--foreground))" }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, "MRR"]}
                    />
                    <Area type="monotone" dataKey="rev" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Client Health Bands */}
          <div>
            <h3 className="text-xl font-bold mb-4">Client Health Distribution</h3>
            <div className="space-y-3">
              {clientHealthBands.map((band, i) => (
                <div key={i} className="flex items-center gap-4" data-testid={`health-band-${i}`}>
                  <span className="text-sm text-muted-foreground w-44 flex-shrink-0">{band.band}</span>
                  <Progress value={band.pct} className="h-2 flex-1" />
                  <span className="text-sm font-semibold w-20 text-right">{band.count} clients</span>
                </div>
              ))}
            </div>
          </div>

          {/* Growth Summary */}
          <div>
            <h3 className="text-xl font-bold mb-4">Growth Summary — May 2026</h3>
            <div className="grid grid-cols-2 gap-3">
              {growthSummary.map((item, i) => (
                <Card key={i} className="bg-card/50 border-border/50" data-testid={`growth-item-${i}`}>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                    <p className={`text-2xl font-bold ${item.positive ? 'text-foreground' : 'text-red-500'}`}>{item.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Critical Alerts */}
          <div>
            <h3 className="text-xl font-bold mb-4">Critical Alerts</h3>
            <div className="space-y-3">
              {criticalAlerts.map((alert, i) => (
                <Card key={i} className={`border ${alert.severity === 'Critical' ? 'border-red-500/30 bg-red-500/5' : 'border-amber-500/30 bg-amber-500/5'}`} data-testid={`critical-alert-${i}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${alert.severity === 'Critical' ? 'text-red-500' : 'text-amber-500'}`} />
                      <div>
                        <p className="text-sm font-semibold">{alert.client}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{alert.issue}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div>
            <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <div className="space-y-5">
                  {activities.map((activity, i) => (
                    <div key={i} className="flex items-start gap-3" data-testid={`activity-item-${i}`}>
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${activity.positive ? 'bg-emerald-500' : 'bg-red-500'}`} />
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
        </div>
      </div>
    </PortalLayout>
  );
}
