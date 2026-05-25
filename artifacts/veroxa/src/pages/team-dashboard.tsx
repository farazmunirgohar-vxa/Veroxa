import {
  Users,
  AlertTriangle,
  Eye,
  FileText,
  ImageIcon,
  CheckSquare,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import {
  demoTeamMetrics,
  demoWorkQueue,
  demoTeamAlerts,
  getRestaurantName,
} from "@/data/demoData";

const statCards = [
  { label: "Active Clients",            value: demoTeamMetrics.activeClients,           icon: Users,         color: "text-sky-400"     },
  { label: "Clients Needing Attention", value: demoTeamMetrics.clientsNeedingAttention, icon: AlertTriangle, color: "text-amber-400"   },
  { label: "Content Waiting Review",    value: demoTeamMetrics.contentWaitingReview,    icon: Eye,           color: "text-violet-400"  },
  { label: "Reports Due This Week",     value: demoTeamMetrics.reportsDueThisWeek,      icon: FileText,      color: "text-cyan-400"    },
  { label: "Media Inventory Alerts",   value: demoTeamMetrics.mediaInventoryAlerts,    icon: ImageIcon,     color: "text-rose-400"    },
  { label: "Tasks Due Today",           value: demoTeamMetrics.tasksDueToday,           icon: CheckSquare,   color: "text-emerald-400" },
];

const workStatusColor: Record<string, string> = {
  "Healthy":          "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
  "Attention Needed": "border-amber-500/40 text-amber-300 bg-amber-500/10",
  "Waiting On Client":"border-sky-500/40 text-sky-300 bg-sky-500/10",
  "Ready To Post":    "border-violet-500/40 text-violet-300 bg-violet-500/10",
  "Reporting Due":    "border-rose-500/40 text-rose-300 bg-rose-500/10",
};

const alertSeverityColor: Record<string, string> = {
  Critical: "border-rose-500/40 text-rose-300 bg-rose-500/10",
  High:     "border-amber-500/40 text-amber-300 bg-amber-500/10",
  Medium:   "border-yellow-500/40 text-yellow-300 bg-yellow-500/10",
  Low:      "border-muted-foreground/40 text-muted-foreground bg-muted/30",
};

export default function TeamDashboard() {
  const criticalAlerts = demoTeamAlerts.filter((a) =>
    a.severity === "Critical" || a.severity === "High",
  ).slice(0, 3);

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <div className="mb-4">
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight"
          data-testid="header-team-dashboard"
        >
          Operations Dashboard
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          A live view of client work, content, and team priorities across the
          portfolio.
        </p>
      </div>

      <DemoOnlyBanner
        message="Demo only — all metrics and queue data are illustrative sample data."
        testId="banner-team-dashboard"
      />

      {/* Stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className={`mb-2 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold tabular-nums">{value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                {label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Work Queue snapshot */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Work Queue</CardTitle>
              <Link href="/demo/team/work-queue">
                <span className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer">
                  View all <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {demoWorkQueue.map((item) => (
              <div
                key={item.clientId}
                className="rounded-md border border-border bg-muted/20 p-3"
                data-testid={`dash-work-${item.clientId}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-medium">
                    {getRestaurantName(item.clientId)}
                  </p>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded border ${workStatusColor[item.status]}`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {item.nextAction}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {item.assignedTo} · {item.lastActivity}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Alert snapshot */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Active Alerts</CardTitle>
              <Link href="/demo/team/alerts">
                <span className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer">
                  View all <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {criticalAlerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-md border border-border bg-muted/20 p-3"
                data-testid={`dash-alert-${alert.id}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded border ${alertSeverityColor[alert.severity]}`}
                  >
                    {alert.severity}
                  </span>
                  <p className="text-sm font-medium">{alert.title}</p>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {alert.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
