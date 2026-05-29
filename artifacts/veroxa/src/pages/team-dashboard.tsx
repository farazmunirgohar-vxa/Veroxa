// TODO(client-health-drift): this page does not render per-client health, but
//   the "Clients Needing Attention" tile reads
//   `demoTeamMetrics.clientsNeedingAttention` (a literal count) which is not
//   bound to `ClientHealthEngine.portfolioSummary().atRisk` in
//   `src/domain/clientHealth/engine.ts`. The tile can silently disagree with
//   the engine count and with other shells. See
//   `docs/CLIENT_HEALTH_ENGINE_CONTRACT.md` §5.2 (Operator/team shell). No
//   fix in this pass — documentation only.
import {
  Users, AlertTriangle, Eye, FileText, ImageIcon, CheckSquare, ArrowRight,
} from "lucide-react";
import { Link } from "wouter";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { TeamWorkflowPanel } from "@/components/TeamWorkflowPanel";
import { LayoutGrid } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/common";
import type { StatusBadgeTone } from "@/components/common";
import {
  demoTeamMetrics, demoWorkQueue, demoTeamAlerts, getRestaurantName,
} from "@/data/demoData";
import { clientTeamWorkRepository } from "@/lib/repositories";

const mediaReviewQueue = [
  { id: "mrq-1", title: "Grilled platter — overhead", subtitle: "Demo Grill House · suggested: weekend feature",      status: "Approve",  tone: "good" as const },
  { id: "mrq-2", title: "Chef plating clip",           subtitle: "Demo Taco Bar · suggested: Reels — kitchen series", status: "Approve",  tone: "good" as const },
  { id: "mrq-3", title: "Brunch stack",                subtitle: "Demo Grill House · re-shoot suggested",             status: "Re-shoot", tone: "warn" as const },
];

const statCards = [
  { label: "Active Clients",            value: demoTeamMetrics.activeClients,           icon: Users,         color: "text-sky-400"     },
  { label: "Clients Needing Attention", value: demoTeamMetrics.clientsNeedingAttention, icon: AlertTriangle, color: "text-amber-400"   },
  { label: "Needs Review",               value: demoTeamMetrics.contentWaitingReview,    icon: Eye,           color: "text-violet-400"  },
  { label: "Reports Due This Week",     value: demoTeamMetrics.reportsDueThisWeek,      icon: FileText,      color: "text-cyan-400"    },
  { label: "Media Alerts",              value: demoTeamMetrics.mediaInventoryAlerts,    icon: ImageIcon,     color: "text-rose-400"    },
  { label: "Tasks Due Today",           value: demoTeamMetrics.tasksDueToday,           icon: CheckSquare,   color: "text-emerald-400" },
];

const workTone: Record<string, StatusBadgeTone> = {
  "Healthy":           "success",
  "Attention Needed":  "warning",
  "Waiting On Client": "info",
  "Ready To Post":     "accent",
  "Reporting Due":     "danger",
};

const severityTone: Record<string, StatusBadgeTone> = {
  Critical: "danger",
  High:     "warning",
  Medium:   "caution",
  Low:      "neutral",
};

export default function TeamDashboard() {
  const criticalAlerts = demoTeamAlerts
    .filter((a) => a.severity === "Critical" || a.severity === "High")
    .slice(0, 3);

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <PageHeader
        title="Operations Dashboard"
        description="A live view of client work, content, and team priorities across the portfolio."
        testId="header-team-dashboard"
      />

      <DemoOnlyBanner
        message="Portfolio metrics below are illustrative until the reporting backend is connected. The live workflow command center reflects real client submissions."
        testId="banner-team-dashboard"
      />

      {/* Live workflow command center */}
      <div className="mb-4">
        <TeamWorkflowPanel
          title="Workflow command center"
          icon={<LayoutGrid className="w-4 h-4 text-primary" />}
          emptyText="No active workflow items right now."
          testId="card-team-workflow-command-center"
          limit={8}
        />
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className={`mb-2 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold tabular-nums">{value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Client Submissions — workflow/communication snapshot */}
      {(() => {
        const summary = clientTeamWorkRepository.getTeamWorkCommunicationSummary();
        const readyForTeam = clientTeamWorkRepository.getTeamReadyWorkItems().length;
        const urgentOrHigh = clientTeamWorkRepository
          .getTeamReadyWorkItems()
          .concat(clientTeamWorkRepository.getTeamInProgressWorkItems())
          .filter((i) => i.priority === "urgent" || i.priority === "high")
          .length;
        const tiles: { label: string; value: number; testId: string }[] = [
          { label: "New submissions",     value: summary.newCount,                testId: "cts-summary-new" },
          { label: "Ready for team",      value: readyForTeam,                    testId: "cts-summary-ready" },
          { label: "Urgent / high",       value: urgentOrHigh,                    testId: "cts-summary-urgent" },
          { label: "Needs clarification", value: summary.needsClarificationCount, testId: "cts-summary-clarification" },
          { label: "Blocked by client",   value: summary.blockedCount,            testId: "cts-summary-blocked" },
          { label: "In progress",         value: summary.inProgressCount,         testId: "cts-summary-in-progress" },
          { label: "Completed",           value: summary.completedCount,          testId: "cts-summary-completed" },
        ];
        return (
          <div className="mb-6" data-testid="section-client-submissions">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Client Submissions
              </h3>
              <Link href="/team/work-queue">
                <span className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer">
                  Open work queue <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
            <Card className="bg-card border-border">
              <CardContent className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 p-4">
                {tiles.map((t) => (
                  <div key={t.label} data-testid={t.testId}>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t.label}
                    </p>
                    <p className="text-xl font-semibold tabular-nums text-foreground">
                      {t.value}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* Today's Client Work */}
      <div className="mb-6" data-testid="section-todays-client-work">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Today&apos;s Client Work
          </h3>
          <Link href="/team/work-queue">
            <span className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer">
              Open work queue <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[
            ...clientTeamWorkRepository.getTeamReadyWorkItems(),
            ...clientTeamWorkRepository.getTeamInProgressWorkItems(),
          ]
            .slice(0, 6)
            .map((item) => (
              <Card
                key={item.id}
                className="bg-card border-border"
                data-testid={`today-client-work-${item.id}`}
              >
                <CardContent className="p-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold truncate">{item.title}</p>
                    <StatusBadge
                      tone={item.priority === "urgent" || item.priority === "high" ? "warning" : "info"}
                    >
                      {item.teamStatusLabel}
                    </StatusBadge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {getRestaurantName(item.clientId)} · {item.workType.replace("_", " ")}
                  </p>
                  {item.clientVisibleNote && (
                    <p className="text-xs text-foreground/85 line-clamp-2">
                      {item.clientVisibleNote}
                    </p>
                  )}
                  <p className="text-[11px] text-primary/85">
                    Next: {item.nextTeamAction}
                  </p>
                </CardContent>
              </Card>
            ))}
        </div>
        <p className="text-[11px] text-muted-foreground/60 mt-2">
          Derived from the client/team workflow foundation (backend pending).
        </p>
      </div>

      {/* Media review queue */}
      <div className="mb-6" data-testid="section-media-review-queue">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Media review queue
          </h3>
          <span className="text-xs text-muted-foreground">
            Thumbnails pending storage
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mediaReviewQueue.map((item) => (
            <div
              key={item.id}
              className="rounded-md border border-border bg-card/60 p-3 flex items-start gap-3"
              data-testid={`media-review-${item.id}`}
            >
              <div className="p-2 rounded-md bg-muted/30 flex-shrink-0">
                <ImageIcon className="w-4 h-4 text-muted-foreground/50" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{item.subtitle}</p>
                <StatusBadge tone={item.tone === "good" ? "success" : "warning"}>
                  {item.status}
                </StatusBadge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Work Queue + Active Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Work Queue</CardTitle>
              <Link href="/team/work-queue">
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
                  <p className="text-sm font-medium">{getRestaurantName(item.clientId)}</p>
                  <StatusBadge tone={workTone[item.status] ?? "neutral"}>{item.status}</StatusBadge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{item.nextAction}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{item.assignedTo} · {item.lastActivity}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {criticalAlerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-md border border-border bg-muted/20 p-3"
                data-testid={`dash-alert-${alert.id}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge tone={severityTone[alert.severity] ?? "neutral"}>{alert.severity}</StatusBadge>
                  <p className="text-sm font-medium">{alert.title}</p>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{alert.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

    </PortalLayout>
  );
}
