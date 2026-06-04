import {
  Eye,
  Users,
  FileText,
  MessageSquare,
  ArrowRight,
  LayoutGrid,
  TrendingUp,
  ClipboardCheck,
  ScanSearch,
  AlertTriangle,
  ShieldCheck,
  CopyCheck,
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
import {
  canUseAuthenticatedClientData,
  canUseDemoFixtures,
  getDataModeLabel,
  mapRealPortalDataModeToSaasDataMode,
} from "@/domain/saas/dataMode";
import { createSaasRepositoryBundle } from "@/domain/saas/repositoryProvider";
import { buildActivityLogPreview } from "@/domain/saas/activityLogScaffold";
import { buildProfitValidationSnapshot } from "@/domain/saas/profitValidationPersistence";
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
} from "@/lib/workflows/workflowStatus";
import { getTodaysSuggestedPushes } from "@/domain/dailyOpportunity";
import type { OpportunityPriority } from "@/domain/dailyOpportunity";
import {
  preparedActionRepository,
  usePreparedActions,
} from "@/lib/preparedActions";
import { getVisibilityAuditOverview } from "@/lib/visibilityAudit";
import {
  getTeamWorkflowItems,
  getTeamWorkflowSnapshot,
} from "@/lib/workflow/workflowRepository";
import {
  getFirstFiveTeamCommandCenterSummary,
  getFirstFiveTeamViewModels,
} from "@/domain/clientPortalJourney";
import {
  PREPARED_ACTION_CHANNEL_LABELS,
  APPROVAL_REQUIREMENT_LABELS,
} from "@/domain/preparedActions";
import {
  getTeamActionQueue,
  getTeamClientOverview,
  getTeamDailyCommandSummary,
} from "@/lib/operations";
import {
  TeamActionQueueList,
  TeamClientOverviewList,
  TeamCommandSummaryGrid,
} from "@/components/team/TeamOperationalSpine";
import { toTeamRequestPreviewStatus } from "@/lib/clientRequestStatus";
import {
  getBlockingChecks,
  getReadinessStatusLabel,
  getReadinessSummary,
} from "@/domain/firstClientReadiness";
import { VEROXA_PLANS } from "@/data/pricing/veroxaPricing";
import { evaluateVeroxaProfitValidation } from "@/domain/profitValidation";
import { buildManualExecutionPacks, evaluateManualExecutionLaunchGate } from "@/domain/manualExecution";
import { getFirstClientOperatingSnapshots, getFirstClientOpsSummary } from "@/domain/firstClientOperatingSuite";
import { getOnboardingQueueSummary, getRestaurantOnboardingSeedProfiles } from "@/domain/restaurantOnboarding";
import { summarizePackageBoundary, packageBoundarySeedDecisions } from "@/domain/packageBoundary";
import { summarizeRequestSla, getRequestSlaSeedData } from "@/domain/requestSla";
import { buildTeamValueProofQueue, valueProofSeedSummaries } from "@/domain/valueProof";

import { TeamSaasStatePanel } from "@/components/team/TeamSaasStatePanel";
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
  const saasDataMode = mapRealPortalDataModeToSaasDataMode(portalDataMode);
  const repositoryBundle = createSaasRepositoryBundle(saasDataMode);
  const repositoryActivityPreview = buildActivityLogPreview({
    restaurantId: "placeholder-team",
    dataMode: saasDataMode,
    entityType: "prepared_action",
    entityId: "preview",
    action: "snapshot_previewed",
    summary: "Repository boundary preview only; not persisted.",
  });
  const repositoryProfitSnapshot = buildProfitValidationSnapshot({
    restaurantId: "placeholder-team",
    dataMode: saasDataMode,
    daysSinceStart: 30,
    monthlyFee: VEROXA_PLANS.starter.priceMonthly,
    trackingConfidence: "unknown",
    createdAt: "2026-06-03T00:00:00.000Z",
  });
  const canUseFixtureData =
    portalDataMode.allowDemoFixtures || portalDataMode.isLiveDataConnected;
  const requestSlaSeedData = getRequestSlaSeedData();
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
  const reviewModeSummary = getTeamDailyCommandSummary();
  const reviewModeOverview = getTeamClientOverview();
  const reviewModeActions = getTeamActionQueue();
  const firstClientReadinessSummary = getReadinessSummary();
  const firstClientBlockingChecks = getBlockingChecks();
  const internalProfitValidation = evaluateVeroxaProfitValidation({
    daysSinceStart: 30,
    monthlyFee: VEROXA_PLANS.starter.priceMonthly,
    trackingConfidence: "unknown",
  });
  const manualExecutionPacks = buildManualExecutionPacks();
  const manualExecutionGate = evaluateManualExecutionLaunchGate(manualExecutionPacks);
  const firstClientOpsSnapshots = getFirstClientOperatingSnapshots();
  const firstClientOpsSummary = getFirstClientOpsSummary(firstClientOpsSnapshots);
  const onboardingSummary = getOnboardingQueueSummary(getRestaurantOnboardingSeedProfiles());
  const packageBoundarySummary = summarizePackageBoundary(packageBoundarySeedDecisions);
  const requestSlaSummary = summarizeRequestSla(requestSlaSeedData);
  const valueProofQueue = buildTeamValueProofQueue(valueProofSeedSummaries);

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
  const workflowSnapshot = getTeamWorkflowSnapshot();
  const clientRequestItems = getTeamWorkflowItems()
    .filter((item) => item.type === "client_request")
    .slice(0, 3);

  const cockpitCards = [
    {
      label: "Needs review",
      value:
        pendingApprovals.length +
        reviewReady.length +
        workflowSnapshot.needsTeamReview,
      href: "/team/work-queue",
      icon: Eye,
      color: "text-violet-400",
      action: "Open review work",
    },
    {
      label: "Ready to schedule",
      value: queueOrHold.length + workflowSnapshot.schedulePrepReady,
      href: "/team/work-queue",
      icon: ClipboardCheck,
      color: "text-emerald-400",
      action: "Open scheduling work",
    },
    {
      label: "Client requests",
      value: clientRequestItems.length,
      href: "/team/direction-queue",
      icon: MessageSquare,
      color: "text-sky-400",
      action: "Open requests",
    },
    {
      label: "Blocked / needs input",
      value:
        waitingOnClient.length +
        workflowSnapshot.needsClientInput +
        workflowSnapshot.blocked,
      href: "/team/work-queue",
      icon: Users,
      color: "text-amber-400",
      action: "Check blockers",
    },
    {
      label: "Reports due",
      value: workflowSnapshot.reportReady,
      href: "/team/report-queue",
      icon: FileText,
      color: "text-cyan-400",
      action: "Open report queue",
    },
  ];

  const visibilityOverview = canUseFixtureData
    ? getVisibilityAuditOverview()
    : {
        auditedCount: 0,
        totalFindings: 0,
        openFindings: 0,
        highSeverityFindings: 0,
        preparedActionCount: 0,
      };

  const reportPreviewText =
    workflowSnapshot.reportReady > 0
      ? `${workflowSnapshot.reportReady} report${workflowSnapshot.reportReady === 1 ? "" : "s"} due for review.`
      : "No reports need review right now.";

  const startHereAction = (() => {
    if (pendingApprovals.length > 0) {
      return {
        eyebrow: "Start here",
        title: "Review prepared approvals first",
        body: `${pendingApprovals.length} prepared action${pendingApprovals.length === 1 ? "" : "s"} need a calm Veroxa team review before anything moves forward.`,
        href: "/team/approval-queue",
        cta: "Open approvals",
        icon: ClipboardCheck,
        tone: "text-emerald-400",
      };
    }

    if (clientRequestItems.length > 0) {
      return {
        eyebrow: "Start here",
        title: "Answer client requests first",
        body: `${clientRequestItems.length} client request${clientRequestItems.length === 1 ? "" : "s"} need direction or a next step from the Veroxa team.`,
        href: "/team/direction-queue",
        cta: "Open requests",
        icon: MessageSquare,
        tone: "text-sky-400",
      };
    }

    if (workflowAlerts.length > 0 || waitingOnClient.length > 0) {
      return {
        eyebrow: "Start here",
        title: "Clear blocked work",
        body: "A client input item is slowing down today’s queue. Check what Faraz should ask for next.",
        href: "/team/work-queue",
        cta: "Check blockers",
        icon: Users,
        tone: "text-amber-400",
      };
    }

    if (workflowSnapshot.reportReady > 0) {
      return {
        eyebrow: "Start here",
        title: "Review reports due",
        body: reportPreviewText,
        href: "/team/report-queue",
        cta: "Open reports",
        icon: FileText,
        tone: "text-cyan-400",
      };
    }

    if (firstClientBlockingChecks.length > 0) {
      return {
        eyebrow: "Start here",
        title: "Review first-client readiness blockers",
        body: `${firstClientBlockingChecks.length} readiness check${firstClientBlockingChecks.length === 1 ? "" : "s"} still need attention before the first-client flow feels launch-ready.`,
        href: "/team/first-client-readiness",
        cta: "Review readiness",
        icon: ShieldCheck,
        tone: "text-primary",
      };
    }

    return {
      eyebrow: "Start here",
      title: "Open the work queue for today’s review",
      body: "No urgent blocker is at the top. Use the work queue to review prepared work and keep the day moving.",
      href: "/team/work-queue",
      cta: "Open work queue",
      icon: Eye,
      tone: "text-violet-400",
    };
  })();

  const StartHereIcon = startHereAction.icon;

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <TeamSaasStatePanel compact={false} />
      <RealPortalReviewNotice />

      <PageHeader
        title="Today's Veroxa Work"
        description="A calmer Today View for review, scheduling, client requests, blockers, approvals, and reports."
        testId="header-team-dashboard"
      />


      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Card className="border-amber-500/20 bg-amber-500/5" data-testid="card-dashboard-package-boundary">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Package boundary</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p className="text-2xl font-semibold text-foreground">{packageBoundarySummary.routedBoundaryWork}</p>
            <p>Routed boundary work: coming-soon, add-on, confirmation, and not-included requests. Included work proceeds to review; no upgrade/payment flow is created.</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5" data-testid="card-dashboard-request-sla">
          <CardHeader className="pb-2"><CardTitle className="text-sm">24-hour request SLA</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p className="text-2xl font-semibold text-foreground">{requestSlaSummary.needsResponse}</p>
            <p>Portal requests needing an answer/review. This does not promise completion within 24 hours.</p>
          </CardContent>
        </Card>
        <Card className="border-sky-500/20 bg-sky-500/5" data-testid="card-dashboard-value-proof-reach">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Value proof / reach</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p className="text-2xl font-semibold text-foreground">{valueProofQueue[0]?.status.replaceAll("_", " ") ?? "not enough data"}</p>
            <p>Reach and customer-action signals stay separated for internal review.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4 border-primary/25 bg-primary/5" data-testid="card-onboarding-os-summary">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            Restaurant Onboarding OS
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <div className="grid grid-cols-2 gap-3 text-center text-xs md:grid-cols-5">
            <div className="rounded-lg border border-border bg-background/30 p-3"><p className="text-xl font-semibold tabular-nums">{onboardingSummary.total}</p><p className="text-muted-foreground">Onboarding</p></div>
            <div className="rounded-lg border border-border bg-background/30 p-3"><p className="text-xl font-semibold tabular-nums">{onboardingSummary.needsMedia}</p><p className="text-muted-foreground">Need media</p></div>
            <div className="rounded-lg border border-border bg-background/30 p-3"><p className="text-xl font-semibold tabular-nums">{onboardingSummary.needsBusinessInfo}</p><p className="text-muted-foreground">Need info</p></div>
            <div className="rounded-lg border border-border bg-background/30 p-3"><p className="text-xl font-semibold tabular-nums">{onboardingSummary.needsConfirmation}</p><p className="text-muted-foreground">Need confirmation</p></div>
            <div className="rounded-lg border border-border bg-background/30 p-3"><p className="text-xl font-semibold tabular-nums">{onboardingSummary.readyForManualService}</p><p className="text-muted-foreground">Manual ready</p></div>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Preview/manual setup only — no paid systems active.</p>
            <Link href="/team/onboarding" className="inline-flex items-center gap-2 text-primary hover:underline">
              Open Onboarding Queue <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4 border-emerald-500/20 bg-emerald-500/5" data-testid="card-first-client-ops-summary">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            First-Client Ops
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <div className="grid grid-cols-2 gap-3 text-center text-xs md:grid-cols-5">
            <div className="rounded-lg border border-border bg-background/30 p-3"><p className="text-xl font-semibold tabular-nums">{firstClientOpsSummary.total}</p><p className="text-muted-foreground">Benchmarks</p></div>
            <div className="rounded-lg border border-border bg-background/30 p-3"><p className="text-xl font-semibold tabular-nums">{firstClientOpsSummary.healthy}</p><p className="text-muted-foreground">Healthy</p></div>
            <div className="rounded-lg border border-border bg-background/30 p-3"><p className="text-xl font-semibold tabular-nums">{firstClientOpsSummary.needingMedia}</p><p className="text-muted-foreground">Need media</p></div>
            <div className="rounded-lg border border-border bg-background/30 p-3"><p className="text-xl font-semibold tabular-nums">{firstClientOpsSummary.needingConfirmation}</p><p className="text-muted-foreground">Need confirmation</p></div>
            <div className="rounded-lg border border-border bg-background/30 p-3"><p className="text-xl font-semibold tabular-nums">{firstClientOpsSummary.readyForManualExecution}</p><p className="text-muted-foreground">Ready manual</p></div>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{firstClientOpsSummary.atRiskOrBlocked} benchmark snapshots are at risk, blocked, paused, or need review.</p>
            <Link href="/team/first-client-ops" className="inline-flex items-center gap-2 text-primary hover:underline">
              Open First-Client Ops <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4 border-primary/20 bg-card" data-testid="card-manual-execution-summary">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <CopyCheck className="h-4 w-4 text-primary" />
            Manual Execution Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-xl font-semibold tabular-nums">{manualExecutionGate.readyToCopyCount}</p>
              <p className="text-muted-foreground">Ready to copy</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-xl font-semibold tabular-nums">{manualExecutionGate.needsClientConfirmationCount}</p>
              <p className="text-muted-foreground">Needs confirmation</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-xl font-semibold tabular-nums">{manualExecutionGate.blockedByMediaOrContextCount}</p>
              <p className="text-muted-foreground">Blocked</p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Prepared work only — nothing publishes automatically.</p>
            <Link href="/team/manual-execution" className="inline-flex items-center gap-2 text-primary hover:underline">
              Open Manual Execution <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardContent>
      </Card>


      <Card
        className="mb-6 border-sky-500/20 bg-sky-500/5"
        data-testid="card-team-saas-data-mode"
      >
        <CardContent className="grid gap-3 p-4 text-xs md:grid-cols-5">
          <div>
            <p className="text-muted-foreground">Data mode</p>
            <p className="font-semibold">{getDataModeLabel(saasDataMode)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Demo fixtures allowed?</p>
            <p className="font-semibold">{canUseDemoFixtures(saasDataMode) ? "Yes" : "No"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Authenticated client data</p>
            <p className="font-semibold">{canUseAuthenticatedClientData(saasDataMode) ? "Placeholder only" : "Not connected"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Repository mode</p>
            <p className="font-semibold capitalize">{repositoryBundle.repositoryMode}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Activity / profit hooks</p>
            <p className="font-semibold">{repositoryActivityPreview.isPersisted ? "Persisted" : "Scaffold only"} · {repositoryProfitSnapshot.validationStatus.replaceAll("_", " ")}</p>
          </div>
        </CardContent>
      </Card>

      {canUseFixtureData ? (
        <DemoOnlyBanner
          message="Demo only — today's work is derived from shared workflow items. No write or publishing action is connected."
          testId="banner-team-dashboard"
        />
      ) : (
        <SafePortalEmptyCard
          title="Team review shell"
          body="Live client operations are not connected yet. Active work queues stay empty here instead of showing demo restaurants as real clients."
          testId="empty-team-cockpit-shell"
        />
      )}

      <Link href={startHereAction.href}>
        <Card
          className="mb-6 border-primary/30 bg-primary/5 transition-colors hover:border-primary/50"
          data-testid="card-team-start-here"
        >
          <CardContent className="flex items-start justify-between gap-3 p-4">
            <div className="flex min-w-0 gap-3">
              <div className="rounded-md bg-background/80 p-2">
                <StartHereIcon className={`h-5 w-5 ${startHereAction.tone}`} />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                  {startHereAction.eyebrow}
                </p>
                <p className="text-base font-semibold leading-snug">
                  {startHereAction.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {startHereAction.body}
                </p>
              </div>
            </div>
            <span className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary sm:inline-flex">
              {startHereAction.cta} <ArrowRight className="h-4 w-4" />
            </span>
          </CardContent>
        </Card>
      </Link>

      <div className="mb-6" data-testid="section-team-cockpit">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Today at a glance</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {cockpitCards.map(
              ({ label, value, href, icon: Icon, color, action }) => (
                <Link key={label} href={href}>
                  <div className="h-full rounded-lg border border-border bg-muted/20 p-3 transition-colors hover:border-primary/30">
                    <div
                      className={`mb-2 flex items-center justify-between ${color}`}
                    >
                      <Icon className="h-4 w-4" />
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                    </div>
                    <p className="text-2xl font-bold tabular-nums">{value}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                      {label}
                    </p>
                    <p className="mt-2 text-[11px] font-medium text-primary">
                      {action}
                    </p>
                  </div>
                </Link>
              ),
            )}
          </CardContent>
        </Card>
      </div>

      <Card
        className="mb-6 border-amber-500/30 bg-amber-500/5"
        data-testid="card-dashboard-profit-validation"
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-300" />
            Profit validation · Internal only
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-sm text-foreground/90">
              {internalProfitValidation.headline}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Track online-influenced actions/orders, break-even progress, and
              attribution confidence. Keep exact proof targets internal and out
              of client/public pages.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
            <div className="rounded-md border border-border bg-background/60 p-2">
              <p className="text-muted-foreground">Break-even progress</p>
              <p className="font-semibold tabular-nums">
                {internalProfitValidation.requiredOrdersPerDay}/day
              </p>
            </div>
            <div className="rounded-md border border-border bg-background/60 p-2">
              <p className="text-muted-foreground">2-month standard</p>
              <p className="font-semibold tabular-nums">
                {internalProfitValidation.starterMinimumTarget}/day
              </p>
            </div>
            <div className="rounded-md border border-border bg-background/60 p-2">
              <p className="text-muted-foreground">Status</p>
              <p className="font-semibold capitalize">
                {internalProfitValidation.status.replaceAll("_", " ")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card
          className="bg-card border-border"
          data-testid="section-client-requests-cockpit"
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" /> Client
                requests
              </span>
              <Link href="/team/direction-queue">
                <span className="text-xs font-normal text-primary hover:underline cursor-pointer">
                  Open requests
                </span>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {clientRequestItems.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No client requests need review right now.
              </p>
            )}
            {clientRequestItems.map((item) => (
              <div
                key={item.workflowItemId}
                className="rounded-md border border-border bg-muted/20 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.restaurantName} · Client request ·{" "}
                      {toTeamRequestPreviewStatus(item.internalTeamStatus)}
                    </p>
                  </div>
                  <StatusBadge tone="info">
                    {toTeamRequestPreviewStatus(item.internalTeamStatus)}
                  </StatusBadge>
                </div>
                <p className="mt-1.5 text-xs text-foreground/80">
                  <span className="text-muted-foreground">Next:</span>{" "}
                  {item.nextTeamAction}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card
          className="bg-card border-border"
          data-testid="section-active-alerts"
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-amber-400" /> Blocked / needs input
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {workflowAlerts.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Nothing urgent is waiting on the client right now.
              </p>
            )}
            {workflowAlerts.map((item) => (
              <div
                key={item.id}
                className="rounded-md border border-border bg-muted/20 p-3"
                data-testid={`dash-alert-${item.id}`}
              >
                <div className="mb-1 flex flex-wrap items-center gap-2">
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
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {getTeamStatusLabel(item.stage)} ·{" "}
                  {getTeamSuggestedNextStep(item)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card
          className="bg-card border-border"
          data-testid="section-approvals-preview"
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-emerald-400" />{" "}
                Approvals ready
              </span>
              <Link href="/team/approval-queue">
                <span className="flex items-center gap-1 text-xs font-normal text-primary hover:underline cursor-pointer">
                  Open queue <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {approvalsPreview.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No prepared approvals need review right now.
              </p>
            )}
            {approvalsPreview.map((action) => (
              <div
                key={action.id}
                className="rounded-md border border-border bg-muted/20 p-3"
                data-testid={`approval-preview-${action.id}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{action.title}</p>
                  <StatusBadge
                    tone={action.riskLevel === "sensitive" ? "danger" : "info"}
                  >
                    {APPROVAL_REQUIREMENT_LABELS[action.approvalRequirement]}
                  </StatusBadge>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {action.restaurantName} ·{" "}
                  {PREPARED_ACTION_CHANNEL_LABELS[action.channel]}
                </p>
                <p className="mt-1.5 text-[12px] text-primary/85">
                  <span className="text-muted-foreground">Next:</span>{" "}
                  {action.suggestedNext}
                </p>
              </div>
            ))}
            <p className="pt-1 text-[10px] text-muted-foreground/60">
              Nothing is posted or sent until you approve it here.
            </p>
          </CardContent>
        </Card>

        <Card
          className="bg-card border-border"
          data-testid="section-reports-readiness-preview"
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-cyan-400" /> Reports due
              </span>
              <Link href="/team/report-queue">
                <span className="flex items-center gap-1 text-xs font-normal text-primary hover:underline cursor-pointer">
                  Open reports <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{reportPreviewText}</p>
            {visibilityOverview.preparedActionCount > 0 && (
              <Link href="/team/visibility-audit">
                <div
                  className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/20 p-3 transition-colors hover:border-primary/30"
                  data-testid="card-visibility-tasks-ready"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <ScanSearch className="h-4 w-4 shrink-0 text-sky-400" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        Visibility issues ready
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {visibilityOverview.preparedActionCount} prepared from{" "}
                        {visibilityOverview.totalFindings} visibility issues.
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                </div>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mb-6" data-testid="card-first-client-readiness-preview">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-4 w-4 text-primary" /> First-client
              readiness
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  tone={
                    firstClientBlockingChecks.length > 0 ? "danger" : "info"
                  }
                >
                  {getReadinessStatusLabel(
                    firstClientReadinessSummary.overallStatus,
                  )}
                </StatusBadge>
                <span className="text-sm font-medium">
                  {firstClientReadinessSummary.completionPercentage}% ready ·{" "}
                  {firstClientBlockingChecks.length} blocking checks
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {firstClientReadinessSummary.recommendedNextAction}
              </p>
            </div>
            <Link
              href="/team/first-client-readiness"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
            >
              Review readiness <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {suggestedPushes.length > 0 && (
        <div className="mb-6" data-testid="section-suggested-push">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-primary" /> Today's
                Suggested Push
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestedPushes.map((push) => (
                <div
                  key={push.id}
                  className="rounded-md border border-border bg-muted/20 p-3"
                  data-testid={`suggested-push-${push.id}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{push.title}</p>
                    <StatusBadge tone={pushPriorityTone[push.priority]}>
                      {pushPriorityLabel[push.priority]}
                    </StatusBadge>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {push.restaurantName}
                  </p>
                  <p className="mt-1.5 text-xs text-foreground/80">
                    {push.whyItMatters}
                  </p>
                  <p className="mt-1.5 text-[12px] text-primary/85">
                    <span className="text-muted-foreground">Next:</span>{" "}
                    {push.recommendedAction.label}
                  </p>
                  {push.requiredClientInput.needed &&
                    push.requiredClientInput.ask && (
                      <p className="mt-1 text-[11px] text-amber-300/90">
                        Ask the client: {push.requiredClientInput.ask}
                      </p>
                    )}
                </div>
              ))}
              <p className="pt-1 text-[10px] text-muted-foreground/60">
                Suggested opportunities to help bring more customers today.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mb-6" data-testid="section-first-five-cockpit">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-primary" /> First-5 Launch
              Readiness
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <LaunchReadinessBenchmarkNotice />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
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
                  <p className="mt-2 text-xs text-foreground/80">
                    <span className="text-muted-foreground">Next:</span>{" "}
                    {client.nextTeamAction}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {client.contentQueueState} · {client.reportReadinessState} ·{" "}
                    {client.recommendedHumanFollowUp}
                  </p>
                  <p className="mt-1 text-[11px] text-primary/80">
                    {client.deterministicSuggestion}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {!canUseFixtureData && (
        <div
          className="mb-6 space-y-4"
          data-testid="section-review-mode-operations"
        >
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Review-mode operations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Review-mode operational records only. Live integrations are not
                connected yet, and public demo fixtures are not treated as
                active clients.
              </p>
              <TeamCommandSummaryGrid summary={reviewModeSummary} />
              <p className="text-sm text-muted-foreground">
                {reviewModeSummary.workloadSummary}
              </p>
            </CardContent>
          </Card>
          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Next human actions</CardTitle>
              </CardHeader>
              <CardContent>
                <TeamActionQueueList actions={reviewModeActions} />
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  Review-mode client overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TeamClientOverviewList overview={reviewModeOverview} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="mb-6">
        {canUseFixtureData ? (
          <TeamWorkflowPanel
            title="Workflow preview"
            icon={<LayoutGrid className="h-4 w-4 text-primary" />}
            emptyText="No active workflow items right now."
            testId="card-team-workflow-preview"
            limit={8}
          />
        ) : (
          <SafePortalEmptyCard
            title="No active client work connected yet"
            body="Work items will appear here after live client operations are connected."
            testId="empty-team-workflow-cockpit"
          />
        )}
      </div>

      <div className="mb-6" data-testid="section-todays-client-work">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Ready to schedule
          </h3>
          <Link href="/team/work-queue">
            <span className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer">
              Open work queue <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {todayQueue.map((item) => (
            <WorkflowItemCard
              key={item.id}
              item={item}
              mode="team"
              clientName={getRestaurantName(item.clientId)}
            />
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground/60">
          Pulled from the shared first-client workflow model.
        </p>
      </div>

      <div className="mb-6" data-testid="section-media-review-queue">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Needs review
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
    </PortalLayout>
  );
}
