import { LayoutDashboard, AlertTriangle, Users, FileX, FileCheck, Briefcase, TrendingDown } from "lucide-react";
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
