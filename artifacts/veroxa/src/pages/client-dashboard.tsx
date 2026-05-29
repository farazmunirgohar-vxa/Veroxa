import { CalendarDays, ImageIcon, Layers, BarChart2, ArrowRight, PlayCircle } from "lucide-react";
import { Link } from "wouter";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientPortalData } from "@/hooks/useClientPortalData";
import { ClientKeepMovingCard } from "@/components/ClientExecutionReinforcement";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { DemoFlowTimeline } from "@/components/demo/DemoVisuals";
import { useEffect, useState } from "react";
import { healthRepository, reportRepository, activityRepository, clientTeamWorkRepository } from "@/lib/repositories";
import { CLIENT_AI_DISCLOSURE } from "@/lib/ai/aiAgentTypes";
import { Brain } from "lucide-react";
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

const veroxaWeekFlow = [
  { key: "upload",   label: "You upload",    caption: "Food photos from your phone" },
  { key: "ai",       label: "AI drafts",     caption: "Captions + best angles" },
  { key: "review",   label: "Team checks",   caption: "Human review before anything posts" },
  { key: "schedule", label: "It schedules",  caption: "Right time, right platform" },
  { key: "report",   label: "You get a report", caption: "Weekly + monthly results" },
];

const weekMedia = [
  { id: "wm-1", title: "Grilled platter — overhead", subtitle: "Approved for weekend feature", status: "Approved",       tone: "good"  as const },
  { id: "wm-2", title: "Signature bowl — hero",       subtitle: "Scheduled · Tuesday lunch",   status: "Scheduled",      tone: "ready" as const },
  { id: "wm-3", title: "Chef plating — Reels clip",   subtitle: "Pending Veroxa team review",  status: "Pending review", tone: "warn"  as const },
];

const upcomingSchedule = [
  { id: "up-1", day: "Friday",   time: "11:30 AM", platform: "Instagram", label: "Lunch Special"     },
  { id: "up-2", day: "Saturday", time: "2:00 PM",  platform: "Facebook",  label: "Behind the Scenes" },
  { id: "up-3", day: "Sunday",   time: "6:15 PM",  platform: "Instagram", label: "Dinner Push"       },
];


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

  const summaryCards = [
    { label: "Upcoming posts",    value: loading ? "—" : String(data.scheduledPosts.length), icon: CalendarDays },
    { label: "Media assets",      value: loading ? "—" : String(data.mediaAssetsCount),       icon: ImageIcon   },
    { label: "Social platforms",  value: loading ? "—" : String(data.platformsCount),         icon: Layers      },
    { label: "Latest report",     value: loading ? "—" : data.monthlyReportPreview.status,    icon: BarChart2   },
  ];

  const healthSnapshot = healthRepository.getClientHealthSnapshot("demo-a");
  const clientReports = reportRepository.getClientReports("demo-a");
  const recentActivity = activityRepository.getClientVisibleActivity("demo-a");
  // Canonical "Action needed from you" source: submission-derived work items.
  // Includes both `needs_client_clarification` and `blocked` submissions, so
  // the dashboard tile, /demo/client/requests, and /demo/client/updates all
  // agree on the same count and the same first item.
  const openClientActions = clientTeamWorkRepository.getClientActionRequiredItems("demo-a");

  const snapshotItems = [
    healthSnapshot
      ? `You have ${healthSnapshot.unusedUsableMediaCount} approved media items ready — roughly ${healthSnapshot.weeksOfContentLeft} weeks of content at your current cadence.`
      : "Your upcoming content is scheduled and ready for review.",
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

      {/* AI-assisted workflow — client-safe explanation. */}
      <Card
        className="bg-card border-primary/20"
        data-testid="card-client-ai-disclosure"
      >
        <CardContent className="flex items-start gap-3 p-4">
          <div className="rounded-md bg-primary/10 p-2 text-primary flex-shrink-0">
            <Brain className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground mb-1">
              Veroxa AI-assisted workflow
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {CLIENT_AI_DISCLOSURE}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Keep Veroxa moving — calm, blame-free reinforcement (client-safe). */}
      <ClientKeepMovingCard clientId="demo-a" />

      {/* Action needed from you — quick callout linking to Requests. */}
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

      {/* Calm empty state — nothing is waiting on the client right now. */}
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

      {/* Your workflow with Veroxa — live, grouped by client-safe status,
          driven by the real workflow foundation (backend pending). */}
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
            Live workflow status. Nothing is published without your approval.
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


      {/* This week's media — demo visual strip */}
      <div data-testid="section-week-media">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            This week&apos;s media
          </h3>
          <Badge
            variant="outline"
            className="border-border text-muted-foreground"
          >
            Prepared by Veroxa
          </Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {weekMedia.map((item) => (
            <div
              key={item.id}
              className="rounded-md border border-border bg-card/60 p-3 flex items-start gap-3"
              data-testid={`week-media-${item.id}`}
            >
              <div className="p-2 rounded-md bg-muted/30 flex-shrink-0">
                <ImageIcon className="w-4 h-4 text-muted-foreground/50" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{item.subtitle}</p>
                <Badge
                  variant="outline"
                  className={`mt-1.5 text-[10px] ${
                    item.tone === "good"  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" :
                    item.tone === "ready" ? "border-sky-500/30 bg-sky-500/10 text-sky-300" :
                                           "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  }`}
                >
                  {item.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming content — schedule preview with thumbnails */}
      <div data-testid="section-upcoming-content">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Upcoming content
          </h3>
        </div>
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              From one photo to three scheduled posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2" data-testid="dashboard-schedule">
              {upcomingSchedule.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-md border border-border bg-muted/10 px-3 py-2"
                >
                  <div className="p-1.5 rounded bg-muted/30">
                    <CalendarDays className="w-3.5 h-3.5 text-muted-foreground/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground">{item.day} · {item.time} · {item.platform}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Prepared schedule — publishing connection pending. Nothing posts
              without your approval.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* What Veroxa is working on — derived from the client-team submission
          pipeline (single source of truth across client pages). */}
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
          Live workflow snapshot. Nothing is published without your approval.
        </p>
      </div>

      {/* Trust strip — what Veroxa needs / what happens after upload */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
        data-testid="dashboard-trust-strip"
      >
        <Card className="bg-card/50 border-border/50" data-testid="dashboard-trust-needs">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
              What Veroxa needs from you
            </p>
            <p className="text-[12px] text-muted-foreground">
              A few phone photos each week, plus a quick note in the Direction
              Center about what you want to push. Veroxa takes it from there.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50" data-testid="dashboard-trust-after">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
              What happens after upload
            </p>
            <p className="text-[12px] text-muted-foreground">
              Photos are reviewed, captions are drafted, and posts are
              scheduled at the right times. You see everything in your portal
              and approve before anything goes live.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* How Veroxa is working this week */}
      <div data-testid="section-veroxa-week-flow">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          How Veroxa is working this week
        </h3>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 space-y-4">
            <DemoFlowTimeline steps={veroxaWeekFlow} testId="client-dashboard-flow" />
            <p className="text-[11px] text-muted-foreground">
              How your week flows through Veroxa. Nothing posts without your
              Veroxa team&apos;s approval.
            </p>
          </CardContent>
        </Card>
      </div>



      {/* This week at a glance */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">This week at a glance</h3>
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

      {/* Guided Demo CTA — shown only in demo/placeholder mode */}
      <Card className="bg-primary/5 border-primary/20" data-testid="card-guided-demo-cta">
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PlayCircle className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">New to Veroxa?</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Start the guided demo to see how upload, drafts, scheduling, reports, and smart recommendations work together.
            </p>
          </div>
          <Link href="/guided-demo">
            <Button
              size="sm"
              variant="outline"
              className="border-primary/40 hover:bg-primary/10 flex-shrink-0"
              data-testid="btn-guided-demo-cta"
            >
              Open Guided Demo
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardContent>
      </Card>

    </PortalLayout>
  );
}
