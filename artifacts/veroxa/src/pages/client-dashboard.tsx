import {
  CalendarDays,
  ImageIcon,
  Layers,
  BarChart2,
  ArrowRight,
  Images,
  ClipboardList,
  Bell,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { Link } from "wouter";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientPortalData } from "@/hooks/useClientPortalData";
import { ClientKeepMovingCard } from "@/components/ClientExecutionReinforcement";
import { ClientVisibilityProgressCard } from "@/components/ClientVisibilityProgressCard";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { workflowItemsToJourneyItems } from "@/lib/clientPortalJourney";
import { buildClientPortalProgressSummary } from "@/domain/clientPortalJourney";
import { useEffect, useState } from "react";
import { healthRepository, reportRepository, activityRepository, clientTeamWorkRepository } from "@/lib/repositories";
import {
  getClientWorkflowItems,
  subscribeToWorkflow,
} from "@/lib/workflow/workflowRepository";
import type {
  ClientVisibleStatus,
  WorkflowItem,
} from "@/lib/workflow/workflowTypes";

const CLIENT_STATUS_ORDER: ClientVisibleStatus[] = [
  "Needs your input",
  "Submitted",
  "Being reviewed",
  "Prepared by Veroxa",
  "In progress",
  "Completed",
  "Included in report",
];

function useClientWorkflowItems(clientId: string) {
  const [items, setItems] = useState<WorkflowItem[]>(() =>
    getClientWorkflowItems(clientId),
  );
  useEffect(() => {
    const refresh = () => setItems(getClientWorkflowItems(clientId));
    refresh();
    return subscribeToWorkflow(refresh);
  }, [clientId]);
  return items;
}

export default function ClientDashboard() {
  const { loading, data, source, dataSourceMessage } = useClientPortalData();
  const workflowItems = useClientWorkflowItems("demo-a");
  const activeWorkflowItems = workflowItems.filter(
    (i) =>
      i.clientVisibleStatus !== "Completed" &&
      i.clientVisibleStatus !== "Included in report",
  );
  const workflowGroups = CLIENT_STATUS_ORDER.map((status) => ({
    status,
    items: activeWorkflowItems.filter((i) => i.clientVisibleStatus === status),
  })).filter((g) => g.items.length > 0);

  const journeyItems = workflowItemsToJourneyItems(workflowItems);
  const journeySummary = buildClientPortalProgressSummary(journeyItems);
  const recentProgress = journeySummary.recentProgress.slice(0, 4);

  const quickActions = [
    { label: "Upload media", href: "/client/media", icon: Images },
    { label: "Send request", href: "/client/requests", icon: ClipboardList },
    { label: "View updates", href: "/client/updates", icon: Bell },
    { label: "View reports", href: "/client/reports", icon: FileText },
  ];

  const summaryCards = [
    { label: "Upcoming posts",   value: loading ? "—" : String(data.scheduledPosts.length), icon: CalendarDays },
    { label: "Media assets",     value: loading ? "—" : String(data.mediaAssetsCount),       icon: ImageIcon   },
    { label: "Social platforms", value: loading ? "—" : String(data.platformsCount),         icon: Layers      },
    { label: "Latest report",    value: loading ? "—" : data.monthlyReportPreview.status,    icon: BarChart2   },
  ];

  const healthSnapshot = healthRepository.getClientHealthSnapshot("demo-a");
  const clientReports = reportRepository.getClientReports("demo-a");
  const recentActivity = activityRepository.getClientVisibleActivity("demo-a");
  const openClientActions = clientTeamWorkRepository.getClientActionRequiredItems("demo-a");

  const snapshotItems = [
    healthSnapshot
      ? `You have ${healthSnapshot.unusedUsableMediaCount} approved media items ready — roughly ${healthSnapshot.weeksOfContentLeft} weeks of content at your current cadence.`
      : "Your upcoming content is scheduled and ready.",
    "Google visibility data is being tracked for this month.",
    clientReports.monthly.length > 0
      ? `Your latest monthly report (${clientReports.monthly[0].monthKey}) is available in Reports.`
      : "Your latest monthly report is available in Reports.",
    recentActivity.length > 0
      ? `Veroxa is working on your account — ${recentActivity.length} recent updates.`
      : "Veroxa is monitoring your content supply.",
  ];

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">

      {/* Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground" data-testid="header-welcome">
            {loading ? "Demo Grill House" : data.businessName}
          </h2>
          <p className="text-muted-foreground mt-1">Welcome back. Here is a quick overview of your account.</p>
          <DataSourceBadge source={source} message={dataSourceMessage} />
        </div>
        <Badge variant="outline" className="px-3 py-1 bg-card text-card-foreground border-border font-medium self-start md:self-auto">
          May 2026 — Week 3
        </Badge>
      </div>

      {/* Quick actions — the main things a client can do, one tap away. */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        data-testid="section-quick-actions"
      >
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card
              className="bg-card/50 border-border/50 hover:border-primary/40 hover:bg-card transition-colors cursor-pointer h-full"
              data-testid={`quick-action-${action.href.split("/").pop()}`}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                  <action.icon className="w-4 h-4" />
                </span>
                <span className="text-sm font-medium text-foreground">
                  {action.label}
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Upload reinforcement — keeps content supply visible to the client. */}
      <ClientKeepMovingCard clientId="demo-a" />

      {/* Action needed from you */}
      {openClientActions.length > 0 && (
        <Card
          className="bg-amber-500/5 border-amber-500/30"
          data-testid="card-dashboard-action-needed"
        >
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground mb-1">
                Action needed from you ({openClientActions.length})
              </p>
              <p className="text-xs text-muted-foreground">
                {openClientActions[0].title}
                {openClientActions.length > 1
                  ? ` · +${openClientActions.length - 1} more`
                  : ""}
              </p>
            </div>
            <Link href="/client/requests">
              <Button
                size="sm"
                variant="outline"
                className="border-amber-500/40 hover:bg-amber-500/10 flex-shrink-0"
                data-testid="btn-dashboard-action-open-requests"
              >
                Open Requests
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {openClientActions.length === 0 && (
        <Card
          className="bg-emerald-500/5 border-emerald-500/20"
          data-testid="card-dashboard-nothing-needed"
        >
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-foreground mb-1">
              Nothing needed from you right now
            </p>
            <p className="text-xs text-muted-foreground">
              Veroxa is handling this week&apos;s work. We&apos;ll let you know here
              if we need a quick reply.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Your workflow with Veroxa */}
      {workflowGroups.length > 0 && (
        <div data-testid="section-client-workflow">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Your workflow with Veroxa
          </h3>
          <div className="space-y-4">
            {workflowGroups.map((group) => (
              <div key={group.status} data-testid={`workflow-group-${group.status}`}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-2">
                  {group.status} ({group.items.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.items.slice(0, 6).map((item) => (
                    <Card
                      key={item.workflowItemId}
                      className="bg-card/60 border-border"
                      data-testid={`workflow-item-${item.workflowItemId}`}
                    >
                      <CardContent className="p-3.5">
                        <p className="text-sm font-semibold text-foreground leading-snug mb-1">
                          {item.title}
                        </p>
                        <Badge
                          variant="outline"
                          className="text-[10px] border-border bg-muted/20 text-muted-foreground mb-1.5"
                        >
                          {item.clientVisibleStatus}
                        </Badge>
                        {item.clientNote && (
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            {item.clientNote}
                          </p>
                        )}
                        {item.nextClientAction && (
                          <p className="text-[11px] text-amber-300 mt-1.5">
                            {item.nextClientAction}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground/70 mt-2">
            Nothing goes live without Veroxa team review.
          </p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <Card key={i} className="bg-card/50 border-border/50 shadow-sm" data-testid={`summary-card-${i}`}>
            <CardContent className="p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                <card.icon className="w-4 h-4 text-muted-foreground/40" />
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Local visibility progress — client-safe Google/local visibility surface. */}
      <ClientVisibilityProgressCard clientId="demo-a" />

      {/* What Veroxa is working on */}
      <div data-testid="section-veroxa-working-on">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          What Veroxa is working on
        </h3>
        {(() => {
          const inProgress = clientTeamWorkRepository
            .getClientInProgressItems("demo-a")
            .slice(0, 6);
          if (inProgress.length === 0) {
            return (
              <p className="text-xs text-muted-foreground italic">
                Nothing is actively in progress this week.
              </p>
            );
          }
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {inProgress.map((item) => (
                <Card
                  key={item.id}
                  className="bg-card/60 border-border"
                  data-testid={`dashboard-in-progress-${item.submissionId}`}
                >
                  <CardContent className="p-3.5">
                    <p className="text-sm font-semibold text-foreground leading-snug mb-1">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5">
                      {item.clientStatusLabel}
                    </p>
                    <p className="text-xs text-foreground/80 leading-relaxed">
                      {item.clientVisibleNote}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          );
        })()}
        <p className="text-[11px] text-muted-foreground/70 mt-2">
          Nothing goes live without Veroxa team review.
        </p>
      </div>

      {/* Recent progress — finished and report-included work. */}
      {recentProgress.length > 0 && (
        <div data-testid="section-recent-progress">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Recent progress
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentProgress.map((item) => (
              <Card
                key={item.id}
                className="bg-emerald-500/5 border-emerald-500/20"
                data-testid={`recent-progress-${item.id}`}
              >
                <CardContent className="p-3.5">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500/80 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-snug">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {item.status} · {item.updatedLabel}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* This week at a glance */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          This week at a glance
        </h3>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-5 space-y-3">
            {snapshotItems.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0 mt-1.5" />
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

    </PortalLayout>
  );
}
