import { LayoutDashboard, AlertTriangle, Users, FileX, FileCheck, Briefcase, TrendingDown, ImageOff, RadioTower, ClipboardCheck, HeartPulse, Siren } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const sidebarItems = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Alerts", icon: AlertTriangle },
  { label: "Client Health", icon: Users },
  { label: "Failed Posts", icon: FileX },
  { label: "Report Approvals", icon: FileCheck },
];

const kpis = [
  { label: "Active Clients", value: "34", icon: Briefcase, trend: "+3 this month", positive: true },
  { label: "Avg Health Score", value: "78 / 100", icon: Users, trend: "5 below threshold", positive: false },
  { label: "Low Content Clients", value: "6", icon: TrendingDown, trend: "Action required", positive: false },
  { label: "Reports Pending Approval", value: "4", icon: FileCheck, trend: "Due by Friday", positive: null },
];

const alerts = [
  { severity: "Critical", client: "Mamadali Kebab House", message: "0 posts scheduled for next week — content pipeline empty.", time: "2 hours ago" },
  { severity: "Warning", client: "Bayleaf Indian Kitchen", message: "Instagram post failed to publish — account token expired.", time: "4 hours ago" },
  { severity: "Warning", client: "Rosso Trattoria", message: "No media uploaded in 18 days — shoot overdue.", time: "Yesterday" },
  { severity: "Info", client: "Sushi Nori Shoreditch", message: "Monthly report ready — awaiting operator approval.", time: "Yesterday" },
  { severity: "Critical", client: "The Grill House", message: "Google Business Profile disconnected — visibility data paused.", time: "2 days ago" },
];

const clientHealth = [
  { name: "Mamadali Kebab House", score: 58, postsThisMonth: 6, scheduled: 0, lastShoot: "12 days ago", status: "At Risk" },
  { name: "Bayleaf Indian Kitchen", score: 71, postsThisMonth: 14, scheduled: 4, lastShoot: "8 days ago", status: "Warning" },
  { name: "Rosso Trattoria", score: 44, postsThisMonth: 3, scheduled: 2, lastShoot: "18 days ago", status: "At Risk" },
  { name: "Sushi Nori Shoreditch", score: 89, postsThisMonth: 19, scheduled: 8, lastShoot: "3 days ago", status: "Healthy" },
  { name: "The Grill House", score: 35, postsThisMonth: 2, scheduled: 0, lastShoot: "24 days ago", status: "Critical" },
  { name: "Cafe Levant", score: 94, postsThisMonth: 22, scheduled: 10, lastShoot: "1 day ago", status: "Healthy" },
];

const failedPosts = [
  { client: "Bayleaf Indian Kitchen", platform: "Instagram", reason: "Auth token expired", date: "23 May", assignee: "JD" },
  { client: "The Grill House", platform: "Facebook", reason: "Page role removed", date: "21 May", assignee: "SM" },
  { client: "Rosso Trattoria", platform: "Instagram", reason: "Media file corrupted", date: "20 May", assignee: "AK" },
];

const reportApprovals = [
  { client: "Sushi Nori Shoreditch", period: "April 2026", preparedBy: "Jordan D.", status: "Ready" },
  { client: "Cafe Levant", period: "April 2026", preparedBy: "Sarah M.", status: "Ready" },
  { client: "Bayleaf Indian Kitchen", period: "April 2026", preparedBy: "Alex K.", status: "In Review" },
  { client: "Mamadali Kebab House", period: "April 2026", preparedBy: "Jordan D.", status: "In Review" },
];

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function OperatorPortal() {
  return (
    <PortalLayout items={sidebarItems} portalName="Operator Portal">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground" data-testid="header-overview">Operations Overview</h2>
        <p className="text-muted-foreground mt-1">Client health, active alerts, failed posts, and reports awaiting your sign-off.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi, i) => (
          <Card key={i} className="bg-card border-border shadow-sm" data-testid={`kpi-card-${i}`}>
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                <kpi.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold mt-2">{kpi.value}</p>
              <p className={cn("text-xs mt-1", kpi.positive === true ? 'text-emerald-500' : kpi.positive === false ? 'text-red-500' : 'text-amber-500')}>
                {kpi.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Oversight Preview */}
      <div className="mb-8">
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
          {([
            {
              icon: ImageOff,
              name: "Content Supply Risk",
              status: "6 clients need attention",
              meaning: "Flags clients with low usable media supply or an empty upcoming content pipeline.",
              color: "amber",
            },
            {
              icon: RadioTower,
              name: "Publishing Risk",
              status: "3 failed posts detected",
              meaning: "Highlights failed posts, expired platform access, or posts needing reschedule.",
              color: "red",
            },
            {
              icon: ClipboardCheck,
              name: "Report Quality Check",
              status: "4 reports pending review",
              meaning: "Prepares report summaries — operator approval still required before client release.",
              color: "blue",
            },
            {
              icon: HeartPulse,
              name: "Client Health Watch",
              status: "5 accounts below threshold",
              meaning: "Watches content supply, posting consistency, Google visibility, and recurring issues.",
              color: "violet",
            },
            {
              icon: Siren,
              name: "Escalation Signal",
              status: "2 critical alerts",
              meaning: "Recommends which problems should reach operator or owner-level visibility.",
              color: "red",
            },
          ] as const).map((signal) => {
            const colorMap = {
              amber:  { bg: "bg-amber-500/10",  text: "text-amber-500",  dot: "bg-amber-500",  badge: "bg-amber-500/10 text-amber-500"  },
              red:    { bg: "bg-red-500/10",     text: "text-red-500",    dot: "bg-red-500",    badge: "bg-red-500/10 text-red-500"      },
              blue:   { bg: "bg-blue-500/10",    text: "text-blue-500",   dot: "bg-blue-500",   badge: "bg-blue-500/10 text-blue-500"    },
              violet: { bg: "bg-primary/10",     text: "text-primary",    dot: "bg-primary",    badge: "bg-primary/10 text-primary"      },
            } as const;
            const c = colorMap[signal.color];
            return (
              <Card key={signal.name} className="bg-card border-border" data-testid={`oversight-card-${signal.name.toLowerCase().replace(/\s+/g, '-')}`}>
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
          {/* Alerts */}
          <div>
            <h3 className="text-xl font-bold mb-4">Active Alerts</h3>
            <div className="space-y-3">
              {alerts.map((alert, i) => (
                <div key={i} className={cn(
                  "flex items-start gap-4 p-4 rounded-xl border",
                  alert.severity === 'Critical' ? 'border-red-500/30 bg-red-500/5' :
                  alert.severity === 'Warning' ? 'border-amber-500/30 bg-amber-500/5' :
                  'border-border bg-card/50'
                )} data-testid={`alert-row-${i}`}>
                  <AlertTriangle className={cn("w-4 h-4 mt-0.5 flex-shrink-0",
                    alert.severity === 'Critical' ? 'text-red-500' :
                    alert.severity === 'Warning' ? 'text-amber-500' :
                    'text-muted-foreground'
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{alert.client}</span>
                      <span className="text-xs text-muted-foreground">{alert.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{alert.message}</p>
                  </div>
                  <Badge variant="outline" className={cn("border-none flex-shrink-0",
                    alert.severity === 'Critical' ? 'bg-red-500/10 text-red-500' :
                    alert.severity === 'Warning' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-blue-500/10 text-blue-500'
                  )}>
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Client Health Table */}
          <div>
            <h3 className="text-xl font-bold mb-4">Client Health</h3>
            <Card className="bg-card border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border/50">
                    <TableHead className="py-4">Client</TableHead>
                    <TableHead>Health</TableHead>
                    <TableHead>Posts / Sched.</TableHead>
                    <TableHead>Last Shoot</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientHealth.map((client, i) => (
                    <TableRow key={i} className="border-border/50 hover:bg-accent/20" data-testid={`client-row-${i}`}>
                      <TableCell className="font-semibold text-sm">{client.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={client.score} className="h-1.5 w-16" />
                          <span className="text-xs text-muted-foreground w-10">{client.score}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{client.postsThisMonth} / {client.scheduled}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{client.lastShoot}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={cn("border-none",
                          client.status === 'Healthy' ? 'bg-emerald-500/10 text-emerald-500' :
                          client.status === 'Warning' ? 'bg-amber-500/10 text-amber-500' :
                          client.status === 'At Risk' ? 'bg-red-500/10 text-red-500' :
                          'bg-red-900/20 text-red-400'
                        )}>
                          {client.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </div>

        <div className="space-y-8">
          {/* Failed Posts */}
          <div>
            <h3 className="text-xl font-bold mb-4">Failed Posts</h3>
            <div className="space-y-3">
              {failedPosts.map((post, i) => (
                <Card key={i} className="bg-card border-red-500/20" data-testid={`failed-post-${i}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{post.client}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{post.platform} · {post.date}</p>
                        <p className="text-xs text-red-400 mt-1">{post.reason}</p>
                      </div>
                      <Avatar className="w-7 h-7 flex-shrink-0">
                        <AvatarFallback className="text-[10px] bg-secondary text-secondary-foreground">{post.assignee}</AvatarFallback>
                      </Avatar>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Report Approvals */}
          <div>
            <h3 className="text-xl font-bold mb-4">Report Approvals</h3>
            <div className="space-y-3">
              {reportApprovals.map((report, i) => (
                <Card key={i} className="bg-card border-border" data-testid={`report-approval-${i}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{report.client}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{report.period} · {report.preparedBy}</p>
                      </div>
                      <Badge variant="outline" className={cn("border-none",
                        report.status === 'Ready' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                      )}>
                        {report.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
