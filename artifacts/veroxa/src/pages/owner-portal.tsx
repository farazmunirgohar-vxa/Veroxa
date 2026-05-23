import { LineChart, DollarSign, Target, Settings, Layers, ArrowUpRight, ArrowDownRight, Activity, AlertTriangle } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const sidebarItems = [
  { label: "Dashboard", icon: LineChart },
  { label: "Revenue", icon: DollarSign },
  { label: "Client Health", icon: Target },
  { label: "Alerts", icon: AlertTriangle },
  { label: "Settings", icon: Settings },
];

const revenueData = [
  { month: "Dec", rev: 28400 },
  { month: "Jan", rev: 31200 },
  { month: "Feb", rev: 33800 },
  { month: "Mar", rev: 36500 },
  { month: "Apr", rev: 40100 },
  { month: "May", rev: 43600 },
];

const criticalAlerts = [
  { client: "The Grill House", issue: "Google Business Profile disconnected — visibility paused.", severity: "Critical" },
  { client: "Mamadali Kebab House", issue: "No posts scheduled next week — pipeline empty.", severity: "Critical" },
  { client: "Rosso Trattoria", issue: "No media uploaded in 18 days — shoot overdue.", severity: "Warning" },
];

const clientHealthBands = [
  { band: "Healthy (80–100)", count: 18, pct: 53 },
  { band: "Warning (60–79)", count: 10, pct: 29 },
  { band: "At Risk (40–59)", count: 4, pct: 12 },
  { band: "Critical (0–39)", count: 2, pct: 6 },
];

const growthSummary = [
  { label: "New clients onboarded (May)", value: "3", positive: true },
  { label: "Churned clients (May)", value: "0", positive: true },
  { label: "Avg posts per client / month", value: "16.4", positive: true },
  { label: "Avg Google visibility lift", value: "+38%", positive: true },
  { label: "Clients below health threshold", value: "6", positive: false },
  { label: "Failed posts requiring action", value: "3", positive: false },
];

const activities = [
  { title: "New client onboarded", target: "Saffron Street Kitchen", time: "1 hour ago", positive: true },
  { title: "Monthly report approved", target: "Sushi Nori Shoreditch — April 2026", time: "3 hours ago", positive: true },
  { title: "Critical alert raised", target: "The Grill House — GBP disconnected", time: "2 days ago", positive: false },
  { title: "MRR milestone reached", target: "Agency crossed $43k MRR", time: "3 days ago", positive: true },
  { title: "Client health drop detected", target: "Rosso Trattoria — score fell to 44", time: "4 days ago", positive: false },
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
                  <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
