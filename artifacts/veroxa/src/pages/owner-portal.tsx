import { LineChart, DollarSign, Target, Settings, Layers, ArrowUpRight, Activity } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const sidebarItems = [
  { label: "Dashboard", icon: LineChart },
  { label: "Revenue", icon: DollarSign },
  { label: "Pipeline", icon: Target },
  { label: "Team", icon: Layers },
  { label: "Settings", icon: Settings },
];

const revenueData = [
  { month: "Apr", rev: 35000 },
  { month: "May", rev: 38200 },
  { month: "Jun", rev: 37500 },
  { month: "Jul", rev: 40100 },
  { month: "Aug", rev: 41800 },
  { month: "Sep", rev: 42800 },
];

const pipeline = [
  { company: "Apex Media", value: "$45,000", stage: "Proposal", date: "Oct 15" },
  { company: "Starlight Corp", value: "$120,000", stage: "Negotiation", date: "Oct 20" },
  { company: "Vanguard LLC", value: "$18,500", stage: "Closed", date: "Sep 28" },
  { company: "Nexus Inc", value: "$32,000", stage: "Discovery", date: "Nov 05" },
];

const activities = [
  { title: "New client onboarded", target: "Apex Media", time: "2 hours ago", type: "positive" },
  { title: "Invoice paid", target: "$8,400 from Acme Corp", time: "5 hours ago", type: "positive" },
  { title: "Project delivered", target: "Brand Refresh", time: "Yesterday", type: "neutral" },
  { title: "Deal created", target: "$120k Starlight Corp", time: "Yesterday", type: "neutral" },
  { title: "Contract sent", target: "Nexus Inc", time: "2 days ago", type: "neutral" },
];

export default function OwnerPortal() {
  return (
    <PortalLayout items={sidebarItems} portalName="Owner Portal">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground" data-testid="header-owner">Owner Dashboard</h2>
        <p className="text-muted-foreground mt-1">High-level financial overview and agency growth metrics.</p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">MRR</p>
            <h3 className="text-3xl font-bold text-foreground">$42,800</h3>
            <p className="text-xs text-emerald-500 font-medium mt-2 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> +12.5% vs last month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">ARR</p>
            <h3 className="text-3xl font-bold text-foreground">$513,600</h3>
            <p className="text-xs text-emerald-500 font-medium mt-2 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> +8.2% vs last year
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Active Clients</p>
            <h3 className="text-3xl font-bold text-foreground">28</h3>
            <p className="text-xs text-emerald-500 font-medium mt-2 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> +2 this quarter
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">NPS</p>
            <h3 className="text-3xl font-bold text-foreground">72</h3>
            <p className="text-xs text-muted-foreground font-medium mt-2 flex items-center gap-1">
              Top 10% of industry
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Chart & Pipeline */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl">Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full" data-testid="revenue-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: "hsl(var(--muted-foreground))", fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: "hsl(var(--muted-foreground))", fontSize: 12}} tickFormatter={(value) => `$${value/1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                      itemStyle={{ color: "hsl(var(--foreground))" }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                    />
                    <Area type="monotone" dataKey="rev" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div>
            <h3 className="text-xl font-bold mb-6">Active Pipeline</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {pipeline.map((deal, i) => (
                <Card key={i} className="bg-card border-border hover:border-primary/50 transition-colors" data-testid={`deal-card-${i}`}>
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-lg">{deal.company}</h4>
                        <p className="text-2xl font-bold text-foreground mt-1">{deal.value}</p>
                      </div>
                      <Badge variant="outline" className={`border-none ${
                        deal.stage === 'Closed' ? 'bg-emerald-500/10 text-emerald-500' :
                        deal.stage === 'Negotiation' ? 'bg-primary/20 text-primary' :
                        deal.stage === 'Proposal' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {deal.stage}
                      </Badge>
                    </div>
                    <div className="pt-4 border-t border-border/50 flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Est. Close</span>
                      <span className="font-medium">{deal.date}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold">Recent Activity</h3>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {activities.map((activity, i) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active" data-testid={`activity-item-${i}`}>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border border-border bg-card shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-muted-foreground">
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-card/50">
                      <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-semibold text-sm text-foreground">{activity.title}</div>
                        <time className="text-xs font-medium text-muted-foreground">{activity.time}</time>
                      </div>
                      <div className="text-sm text-muted-foreground">{activity.target}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
}
