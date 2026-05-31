import {
  Inbox,
  Eye,
  Users,
  FileText,
  ArrowRight,
  LayoutGrid,
  TrendingUp,
  ClipboardCheck,
  ScanSearch,
  AlertTriangle,
} from "lucide-react";
import { Link } from "wouter";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import {
  LaunchReadinessBenchmarkNotice,
  RealPortalReviewNotice,
  SafePortalEmptyCard,
} from "@/components/RealPortalSafeStates";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { TeamWorkflowPanel } from "@/components/TeamWorkflowPanel";
import { PageHeader, StatusBadge } from "@/components/common";
import type { StatusBadgeTone } from "@/components/common";
import { getRestaurantName } from "@/data/demoData";
import { demoClientTeamWorkflow } from "@/data/workflows/clientTeamWorkflow";
import { WorkflowItemCard } from "@/components/workflows/WorkflowItemCard";
import {
  getTeamAlertWorkflowItems,
  getTeamQueueOrHoldItems,
  getTeamReviewReadyItems,
  getTeamStatusLabel,
  getTeamSuggestedNextStep,
  getTeamTodayQueueItems,
  getWorkflowSummaryCounts,
} from "@/lib/workflows/workflowStatus";
import { getTodaysSuggestedPushes } from "@/domain/dailyOpportunity";
import type { OpportunityPriority } from "@/domain/dailyOpportunity";
import {
  preparedActionRepository,
  usePreparedActions,
} from "@/lib/preparedActions";
import { getVisibilityAuditOverview } from "@/lib/visibilityAudit";
import {
  getFirstFiveTeamCommandCenterSummary,
  getFirstFiveTeamViewModels,
} from "@/domain/clientPortalJourney";
import {
  PREPARED_ACTION_CHANNEL_LABELS,
  APPROVAL_REQUIREMENT_LABELS,
} from "@/domain/preparedActions";

const pushPriorityTone: Record<OpportunityPriority, StatusBadgeTone> = {
  high: "warning",
  medium: "info",
  low: "neutral",
};

const pushPriorityLabel: Record<OpportunityPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export default function TeamDashboard() {
  const portalDataMode = useRealPortalDataMode();
  const canUseFixtureData =
    portalDataMode.allowDemoFixtures || portalDataMode.isLiveDataConnected;
  const workflowSummary = canUseFixtureData
    ? getWorkflowSummaryCounts(demoClientTeamWorkflow)
    : { teamReviewReady: 0, waitingOnClient: 0 };
  const todayQueue = canUseFixtureData
    ? getTeamTodayQueueItems(demoClientTeamWorkflow, 6)
    : [];
  const reviewReady = canUseFixtureData
    ? getTeamReviewReadyItems(demoClientTeamWorkflow).slice(0, 3)
    : [];
  const waitingOnClient = canUseFixtureData
    ? demoClientTeamWorkflow.filter(
        (item) =>
          item.stage === "needs_client_action" ||
          item.stage === "needs_better_photo",
      )
    : [];
  const queueOrHold = canUseFixtureData
    ? getTeamQueueOrHoldItems(demoClientTeamWorkflow)
    : [];
  const workflowAlerts = canUseFixtureData
    ? getTeamAlertWorkflowItems(demoClientTeamWorkflow, 3)
    : [];
  const firstFiveSummary = getFirstFiveTeamCommandCenterSummary();
  const firstFiveClients = getFirstFiveTeamViewModels();

  // Priority cards — the four questions the team needs answered today,
  // derived from the shared workflow foundation.
  const priorityCards: {
    label: string;
    value: number;
    icon: typeof Inbox;
    href: string;
    color: string;
    testId: string;
  }[] = [
    {
      label: "Today's priority work",
      value: todayQueue.length,
      icon: Inbox,
      href: "/team/work-queue",
      color: "text-sky-400",
      testId: "priority-new-submissions",
    },
    {
      label: "Needs review",
      value: reviewReady.length,
      icon: Eye,
      href: "/team/work-queue",
      color: "text-violet-400",
      testId: "priority-needs-review",
    },
    {
      label: "Client follow-up",
      value: workflowSummary.waitingOnClient,
      icon: Users,
      href: "/team/work-queue",
      color: "text-amber-400",
      testId: "priority-client-follow-up",
    },
    {
      label: "Queue / hold later",
      value: queueOrHold.length,
      icon: FileText,
      href: "/team/work-queue",
      color: "text-cyan-400",
      testId: "priority-reports-due",
    },
  ];

  // Today's suggested pushes — rule-based daily opportunities (team-only).
  const suggestedPushes = canUseFixtureData
    ? getTodaysSuggestedPushes({}, 3)
    : [];

  // Prepared actions waiting for review (the Approval-to-Execution queue).
  usePreparedActions();
  const pendingApprovals = canUseFixtureData
    ? preparedActionRepository.getPendingApprovalActions()
    : [];
  const approvalsPreview = pendingApprovals.slice(0, 3);

  // Visibility Audit roll-up — rule-based findings ready to prepare (team-only).
  const visibilityOverview = canUseFixtureData
    ? getVisibilityAuditOverview()
    : {
        auditedCount: 0,
        totalFindings: 0,
        openFindings: 0,
        highSeverityFindings: 0,
        preparedActionCount: 0,
      };

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <RealPortalReviewNotice />

      <PageHeader
        title="Today's Veroxa Work"
        description="A simple view of what needs review, follow-up, and posting today."
        testId="header-team-dashboard"
      />

      {canUseFixtureData ? (
        <DemoOnlyBanner
          message="Demo only — today's work is derived from shared workflow items. No write or publishing action is connected."
          testId="banner-team-dashboard"
        />
      ) : (
        <SafePortalEmptyCard
          title="Solo founder command center shell"
          body="Live client operations are not connected yet. Active work queues stay empty here instead of showing demo restaurants as real clients."
          testId="empty-team-command-center-shell"
        />
      )}

      <div className="mb-6" data-testid="section-first-five-command-center">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-primary" />
              First-5 Launch Readiness Benchmark
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <LaunchReadinessBenchmarkNotice />
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-2xl font-bold tabular-nums">
                  {firstFiveSummary.totalClients}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Launch profiles
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-2xl font-bold tabular-nums">
                  {firstFiveSummary.clientsNeedingMedia}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Clients needing media
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-2xl font-bold tabular-nums">
                  {firstFiveSummary.clientsReadyForContent}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Ready for content
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-2xl font-bold tabular-nums">
                  {firstFiveSummary.reportsNeedingReview}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Reports need review
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-2xl font-bold tabular-nums">
                  {firstFiveSummary.premiumAssessmentCandidates}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Premium candidates
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {firstFiveSummary.firstFiveCoverage}.{" "}
              {firstFiveSummary.workloadSummary}
            </p>
            <div className="grid gap-3 lg:grid-cols-2">
              {firstFiveClients.map((client) => (
                <div
                  key={client.key}
                  className="rounded-lg border border-border bg-muted/20 p-3"
                  data-testid={`first-five-${client.key}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">
                        {client.restaurantName}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {client.readinessCategory} · {client.packageLabel}
                      </p>
                    </div>
                    <StatusBadge
                      tone={
                        client.premiumCandidate
                          ? "accent"
                          : client.mediaRiskLevel === "Needs media"
                            ? "warning"
                            : "info"
                      }
                    >
                      {client.premiumCandidate
                        ? "Premium assessment candidate"
                        : client.mediaRiskLevel}
                    </StatusBadge>
                  </div>
                  <p className="text-xs text-foreground/80 mt-2">
                    <span className="text-muted-foreground">Next:</span>{" "}
                    {client.nextTeamAction}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {client.contentQueueState} · {client.reportReadinessState} ·{" "}
                    {client.recommendedHumanFollowUp}
                  </p>
                  <p className="text-[11px] text-primary/80 mt-1">
                    {client.deterministicSuggestion}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority cards — what needs my attention today */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <Link href="/team/approval-queue">
          <Card
            className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer h-full"
            data-testid="priority-approvals-ready"
          >
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between text-emerald-400">
                <ClipboardCheck className="w-5 h-5" />
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50" />
              </div>
              <p className="text-2xl font-bold tabular-nums">
                {pendingApprovals.length}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                Approvals ready
              </p>
            </CardContent>
          </Card>
        </Link>
        {priorityCards.map(
          ({ label, value, icon: Icon, href, color, testId }) => (
            <Link key={label} href={href}>
              <Card
                className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer h-full"
                data-testid={testId}
              >
                <CardContent className="p-4">
                  <div
                    className={`mb-2 flex items-center justify-between ${color}`}
                  >
                    <Icon className="w-5 h-5" />
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                  </div>
                  <p className="text-2xl font-bold tabular-nums">{value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    {label}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ),
        )}
      </div>

      {/* Visibility issues ready — calm link into the Visibility Audit (team-only) */}
      {visibilityOverview.preparedActionCount > 0 && (
        <Link href="/team/visibility-audit">
          <Card
            className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer mb-6"
            data-testid="card-visibility-tasks-ready"
          >
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-md bg-muted/30 flex-shrink-0">
                  <ScanSearch className="w-4 h-4 text-sky-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    Visibility issues ready
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {visibilityOverview.preparedActionCount} prepared from{" "}
                    {visibilityOverview.totalFindings} visibility issues across{" "}
                    {visibilityOverview.auditedCount} restaurants
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
            </CardContent>
          </Card>
        </Link>
      )}

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
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {push.restaurantName}
                  </p>
                  <p className="text-xs text-foreground/80 mt-1.5">
                    {push.whyItMatters}
                  </p>
                  <p className="text-[12px] text-primary/85 mt-1.5">
                    <span className="text-muted-foreground">Next:</span>{" "}
                    {push.recommendedAction.label}
                  </p>
                  {push.requiredClientInput.needed &&
                    push.requiredClientInput.ask && (
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

      {/* Approvals ready — a calm peek at the Approval Queue */}
      {approvalsPreview.length > 0 && (
        <div className="mb-6" data-testid="section-approvals-preview">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-emerald-400" />
                  Approvals ready
                </span>
                <Link href="/team/approval-queue">
                  <span className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer font-normal">
                    Open queue <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {approvalsPreview.map((action) => (
                <div
                  key={action.id}
                  className="rounded-md border border-border bg-muted/20 p-3"
                  data-testid={`approval-preview-${action.id}`}
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{action.title}</p>
                    <StatusBadge
                      tone={
                        action.riskLevel === "sensitive" ? "danger" : "info"
                      }
                    >
                      {APPROVAL_REQUIREMENT_LABELS[action.approvalRequirement]}
                    </StatusBadge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {action.restaurantName} ·{" "}
                    {PREPARED_ACTION_CHANNEL_LABELS[action.channel]}
                  </p>
                  <p className="text-[12px] text-primary/85 mt-1.5">
                    <span className="text-muted-foreground">Next:</span>{" "}
                    {action.suggestedNext}
                  </p>
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground/60 pt-1">
                Nothing is posted or sent until you approve it here.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Live workflow command center */}
      <div className="mb-6">
        {canUseFixtureData ? (
          <TeamWorkflowPanel
            title="Workflow command center"
            icon={<LayoutGrid className="w-4 h-4 text-primary" />}
            emptyText="No active workflow items right now."
            testId="card-team-workflow-command-center"
            limit={8}
          />
        ) : (
          <SafePortalEmptyCard
            title="No active client work connected yet"
            body="Work items will appear here after live client operations are connected."
            testId="empty-team-workflow-command-center"
          />
        )}
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
          {todayQueue.map((item) => (
            <WorkflowItemCard
              key={item.id}
              item={item}
              mode="team"
              clientName={getRestaurantName(item.clientId)}
            />
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground/60 mt-2">
          Pulled from the shared first-client workflow model.
        </p>
      </div>

      {/* Media and draft review queue */}
      <div className="mb-6" data-testid="section-media-review-queue">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Items needing review
          </h3>
          <Link href="/team/work-queue">
            <span className="text-xs text-primary hover:underline cursor-pointer">
              Open board
            </span>
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {reviewReady.map((item) => (
            <WorkflowItemCard
              key={item.id}
              item={item}
              mode="team"
              clientName={getRestaurantName(item.clientId)}
            />
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
            {workflowAlerts.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Nothing urgent right now.
              </p>
            )}
            {workflowAlerts.map((item) => (
              <div
                key={item.id}
                className="rounded-md border border-border bg-muted/20 p-3"
                data-testid={`dash-alert-${item.id}`}
              >
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <StatusBadge
                    tone={
                      item.priority === "urgent"
                        ? "danger"
                        : item.priority === "high"
                          ? "warning"
                          : "info"
                    }
                  >
                    {item.priority === "urgent"
                      ? "Critical"
                      : item.priority === "high"
                        ? "High"
                        : "Watch"}
                  </StatusBadge>
                  <p className="text-sm font-medium">{item.title}</p>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {getTeamStatusLabel(item.stage)} ·{" "}
                  {getTeamSuggestedNextStep(item)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Work queue summary — same helper counts used by the queue and alert center. */}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="bg-muted/20 border-border">
            <CardContent className="p-3">
              <p className="text-2xl font-bold tabular-nums">
                {workflowSummary.teamReviewReady}
              </p>
              <p className="text-[11px] text-muted-foreground">Need review</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/20 border-border">
            <CardContent className="p-3">
              <p className="text-2xl font-bold tabular-nums">
                {waitingOnClient.length}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Waiting on client
              </p>
            </CardContent>
          </Card>
          <Card className="bg-muted/20 border-border">
            <CardContent className="p-3">
              <p className="text-2xl font-bold tabular-nums">
                {queueOrHold.length}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Queue / hold later
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
}
