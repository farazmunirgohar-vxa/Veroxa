import {
  Inbox, Eye, Users, FileText, ImageIcon, ArrowRight, LayoutGrid, TrendingUp,
} from "lucide-react";
import { Link } from "wouter";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { TeamWorkflowPanel } from "@/components/TeamWorkflowPanel";
import { PageHeader, StatusBadge } from "@/components/common";
import type { StatusBadgeTone } from "@/components/common";
import {
  demoTeamMetrics, demoWorkQueue, demoTeamAlerts, getRestaurantName,
} from "@/data/demoData";
import { clientTeamWorkRepository } from "@/lib/repositories";
import { getTodaysSuggestedPushes } from "@/domain/dailyOpportunity";
import type { OpportunityPriority } from "@/domain/dailyOpportunity";

const mediaReviewQueue = [
  { id: "mrq-1", title: "Grilled platter — overhead", subtitle: "Demo Grill House · suggested: weekend feature",      status: "Approve",  tone: "good" as const },
  { id: "mrq-2", title: "Chef plating clip",           subtitle: "Demo Taco Bar · suggested: Reels — kitchen series", status: "Approve",  tone: "good" as const },
  { id: "mrq-3", title: "Brunch stack",                subtitle: "Demo Grill House · re-shoot suggested",             status: "Re-shoot", tone: "warn" as const },
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

const pushPriorityTone: Record<OpportunityPriority, StatusBadgeTone> = {
  high:   "warning",
  medium: "info",
  low:    "neutral",
};

const pushPriorityLabel: Record<OpportunityPriority, string> = {
  high:   "High",
  medium: "Medium",
  low:    "Low",
};

export default function TeamDashboard() {
  const criticalAlerts = demoTeamAlerts
    .filter((a) => a.severity === "Critical" || a.severity === "High")
    .slice(0, 3);

  // Priority cards — the four questions the team needs answered today,
  // derived from the live workflow foundation where possible.
  const summary = clientTeamWorkRepository.getTeamWorkCommunicationSummary();
  const priorityCards: {
    label: string;
    value: number;
    icon: typeof Inbox;
    href: string;
    color: string;
    testId: string;
  }[] = [
    {
      label: "New submissions",
      value: summary.newCount,
      icon: Inbox,
      href: "/team/upload-inbox",
      color: "text-sky-400",
      testId: "priority-new-submissions",
    },
    {
      label: "Needs review",
      value: demoTeamMetrics.contentWaitingReview,
      icon: Eye,
      href: "/team/work-queue",
      color: "text-violet-400",
      testId: "priority-needs-review",
    },
    {
      label: "Client follow-up",
      value: summary.needsClarificationCount + summary.blockedCount,
      icon: Users,
      href: "/team/work-queue",
      color: "text-amber-400",
      testId: "priority-client-follow-up",
    },
    {
      label: "Reports / updates due",
      value: demoTeamMetrics.reportsDueThisWeek,
      icon: FileText,
      href: "/team/report-queue",
      color: "text-cyan-400",
      testId: "priority-reports-due",
    },
  ];

  // Today's suggested pushes — rule-based daily opportunities (team-only).
  const suggestedPushes = getTodaysSuggestedPushes({}, 3);

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <PageHeader
        title="Today's Veroxa Work"
        description="A simple view of what needs review, follow-up, and posting today."
        testId="header-team-dashboard"
      />

      <DemoOnlyBanner
        message="The work below reflects real client submissions. Sample numbers are used only where live data isn't connected yet."
        testId="banner-team-dashboard"
      />

      {/* Priority cards — what needs my attention today */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {priorityCards.map(({ label, value, icon: Icon, href, color, testId }) => (
          <Link key={label} href={href}>
            <Card
              className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer h-full"
              data-testid={testId}
            >
              <CardContent className="p-4">
                <div className={`mb-2 flex items-center justify-between ${color}`}>
                  <Icon className="w-5 h-5" />
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                </div>
                <p className="text-2xl font-bold tabular-nums">{value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Today's Suggested Push — rule-based daily opportunities (team-only) */}
      {suggestedPushes.length > 0 && (
        <div className="mb-6" data-testid="section-suggested-push">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Today&apos;s Suggested Push
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestedPushes.map((push) => (
                <div
                  key={push.id}
                  className="rounded-md border border-border bg-muted/20 p-3"
                  data-testid={`suggested-push-${push.id}`}
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{push.title}</p>
                    <StatusBadge tone={pushPriorityTone[push.priority]}>
                      {pushPriorityLabel[push.priority]}
                    </StatusBadge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{push.restaurantName}</p>
                  <p className="text-xs text-foreground/80 mt-1.5">{push.whyItMatters}</p>
                  <p className="text-[12px] text-primary/85 mt-1.5">
                    <span className="text-muted-foreground">Next:</span> {push.recommendedAction.label}
                  </p>
                  {push.requiredClientInput.needed && push.requiredClientInput.ask && (
                    <p className="text-[11px] text-amber-300/90 mt-1">
                      Ask the client: {push.requiredClientInput.ask}
                    </p>
                  )}
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground/60 pt-1">
                Suggested opportunities to help bring more customers today.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Live workflow command center */}
      <div className="mb-6">
        <TeamWorkflowPanel
          title="Workflow command center"
          icon={<LayoutGrid className="w-4 h-4 text-primary" />}
          emptyText="No active workflow items right now."
          testId="card-team-workflow-command-center"
          limit={8}
        />
      </div>

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
          Pulled from the latest client submissions.
        </p>
      </div>

      {/* Media review queue */}
      <div className="mb-6" data-testid="section-media-review-queue">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Media review queue
          </h3>
          <span className="text-xs text-muted-foreground">
            Thumbnails not yet available
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

      {/* Active alerts / blockers */}
      <div className="mb-6" data-testid="section-active-alerts">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Active alerts &amp; blockers
        </h3>
        <Card className="bg-card border-border">
          <CardContent className="space-y-2 p-4">
            {criticalAlerts.length === 0 && (
              <p className="text-xs text-muted-foreground">Nothing urgent right now.</p>
            )}
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

      {/* Work queue summary — optional lower section */}
      <div data-testid="section-work-queue-summary">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Work queue summary
          </h3>
          <Link href="/team/work-queue">
            <span className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer">
              View all <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
        </div>
      </div>

    </PortalLayout>
  );
}
