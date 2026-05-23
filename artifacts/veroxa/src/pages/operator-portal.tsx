import { Briefcase, FolderKanban, Users, BoxSelect, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const sidebarItems = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Projects", icon: FolderKanban },
  { label: "Clients", icon: Briefcase },
  { label: "Team", icon: Users },
  { label: "Deliverables", icon: BoxSelect },
];

import { LayoutDashboard } from "lucide-react";

const kpis = [
  { label: "Active Projects", value: "12", icon: FolderKanban, trend: "+2 this month" },
  { label: "Clients", value: "28", icon: Briefcase, trend: "Stable" },
  { label: "Tasks Due This Week", value: "34", icon: CheckCircle, trend: "12 overdue" },
  { label: "Team Utilization", value: "78%", icon: TrendingUp, trend: "+4% vs last week" },
];

const projects = [
  { name: "Brand Refresh 2025", client: "Acme Corp", status: "On Track", progress: 75, owner: "Sarah M.", due: "Oct 12" },
  { name: "Q4 Marketing Campaign", client: "Acme Corp", status: "At Risk", progress: 40, owner: "Jordan D.", due: "Oct 05" },
  { name: "Website Redesign", client: "Nexus Inc", status: "Planning", progress: 15, owner: "Alex K.", due: "Nov 30" },
  { name: "SEO Audit", client: "Vanguard LLC", status: "On Track", progress: 90, owner: "Sarah M.", due: "Sep 28" },
  { name: "Product Launch Videos", client: "Horizon Tech", status: "Delayed", progress: 55, owner: "Jordan D.", due: "Oct 15" },
];

const teamWorkload = [
  { name: "Sarah M.", role: "Lead Designer", tasks: 12, utilization: 85 },
  { name: "Jordan D.", role: "Content Strategist", tasks: 8, utilization: 60 },
  { name: "Alex K.", role: "Frontend Dev", tasks: 15, utilization: 95 },
  { name: "Rachel L.", role: "Project Manager", tasks: 24, utilization: 75 },
];

export default function OperatorPortal() {
  return (
    <PortalLayout items={sidebarItems} portalName="Operator Portal">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground" data-testid="header-overview">Operations Overview</h2>
        <p className="text-muted-foreground mt-1">High-density view of agency production and resource allocation.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi, i) => (
          <Card key={i} className="bg-card border-border shadow-sm" data-testid={`kpi-card-${i}`}>
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                <kpi.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="mt-2">
                <p className="text-3xl font-bold">{kpi.value}</p>
                <p className={`text-xs mt-1 ${kpi.trend.includes('+') ? 'text-emerald-500' : kpi.trend.includes('overdue') || kpi.trend.includes('At Risk') ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {kpi.trend}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold">Active Projects Status</h3>
          <Card className="bg-card border-border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border/50">
                  <TableHead className="py-4">Project Name</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]">Progress</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project, i) => (
                  <TableRow key={i} className="border-border/50 hover:bg-accent/20" data-testid={`project-row-${i}`}>
                    <TableCell className="font-semibold">{project.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{project.client}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`border-none ${
                        project.status === 'On Track' ? 'bg-emerald-500/10 text-emerald-500' :
                        project.status === 'At Risk' ? 'bg-amber-500/10 text-amber-500' :
                        project.status === 'Delayed' ? 'bg-red-500/10 text-red-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={project.progress} className="h-1.5 flex-1" />
                        <span className="text-[10px] text-muted-foreground w-6 text-right">{project.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className="text-[9px] bg-secondary text-secondary-foreground">{project.owner.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        {project.owner}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                      {project.due}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold">Team Workload</h3>
          <div className="space-y-4">
            {teamWorkload.map((member, i) => (
              <Card key={i} className="bg-card border-border" data-testid={`workload-card-${i}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-10 h-10 border border-border">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {member.name.split(' ').map(n=>n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="text-sm font-semibold">{member.name}</h4>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{member.tasks} active tasks</span>
                      <span className={`font-medium ${member.utilization > 90 ? 'text-red-500' : member.utilization < 50 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {member.utilization}% util.
                      </span>
                    </div>
                    <Progress 
                      value={member.utilization} 
                      className="h-1.5" 
                      indicatorClassName={member.utilization > 90 ? 'bg-red-500' : member.utilization < 50 ? 'bg-amber-500' : 'bg-emerald-500'} 
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}

// Adding a custom indicator prop to Progress if not supported natively. For pure tailwind, it might need a trick, but standard Shadcn Progress supports it if we pass it down or we can just use inline styles if needed. Let's patch standard Progress if it doesn't support indicatorClassName by just using the standard class.
