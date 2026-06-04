import { useState } from "react";
import { ArrowRight, ListChecks } from "lucide-react";
import { Link } from "wouter";
import { PortalLayout } from "@/components/PortalLayout";
import {
  RealPortalReviewNotice,
  SafePortalEmptyCard,
} from "@/components/RealPortalSafeStates";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { TeamReviewModeRouteSummary } from "@/components/team/TeamOperationalSpine";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { demoClientLifecycle, getRestaurantName } from "@/data/demoData";
import {
  demoClientTeamWorkflow,
  type WorkflowItem,
} from "@/data/workflows/clientTeamWorkflow";
import {
  WorkflowItemCard,
  type WorkflowItemCardAction,
} from "@/components/workflows/WorkflowItemCard";
import {
  getTeamSuggestedNextStep,
  getWorkflowSummaryCounts,
  groupWorkflowItemsForTeam,
} from "@/lib/workflows/workflowStatus";
import {
  buildTeamAlerts,
  captionDraftTemplates,
  reviewMediaRules,
  scoreCustomerOpportunity,
  suggestManualSchedule,
} from "@/domain/ruleBasedAutomation";
import { buildManualExecutionPacks, getExecutionPackNextAction, getExecutionPackReadinessLabel } from "@/domain/manualExecution";
import { getFirstClientOpsTopActions } from "@/domain/firstClientOperatingSuite";
import { getRestaurantOnboardingSeedProfiles, getTeamNextOnboardingAction, getTeamOnboardingPriority } from "@/domain/restaurantOnboarding";

import { TeamSaasStatePanel } from "@/components/team/TeamSaasStatePanel";
type LocalDecision =
  | "pending"
  | "reviewed"
  | "ask_client"
  | "queue_later"
  | "hold_later";

const decisionLabel: Record<LocalDecision, string> = {
  pending: "Pending",
  reviewed: "Marked reviewed",
  ask_client: "Ask client",
  queue_later: "Queue for later",
  hold_later: "Hold for later",
};

const decisionTone: Record<LocalDecision, string> = {
  pending: "border-border bg-muted/20 text-muted-foreground",
  reviewed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  ask_client: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  queue_later: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  hold_later: "border-violet-500/30 bg-violet-500/10 text-violet-300",
};

function actionsForItem(
  item: WorkflowItem,
  setDecision: (id: string, decision: LocalDecision) => void,
): WorkflowItemCardAction[] {
  if (
    item.stage === "needs_better_photo" ||
    item.stage === "needs_client_action"
  ) {
    return [
      {
        label: "Ask client",
        tone: "warn",
        onClick: () => setDecision(item.id, "ask_client"),
      },
      {
        label: "Hold for later",
        onClick: () => setDecision(item.id, "hold_later"),
      },
    ];
  }

  if (item.stage === "scheduled") {
    return [
      {
        label: "Queue for later",
        tone: "primary",
        onClick: () => setDecision(item.id, "queue_later"),
      },
      {
        label: "Hold for later",
        onClick: () => setDecision(item.id, "hold_later"),
      },
    ];
  }

  return [
    {
      label: "Mark reviewed",
      tone: "primary",
      onClick: () => setDecision(item.id, "reviewed"),
    },
    {
      label: "Ask client",
      tone: "warn",
      onClick: () => setDecision(item.id, "ask_client"),
    },
    {
      label: "Queue for later",
      onClick: () => setDecision(item.id, "queue_later"),
    },
  ];
}

export default function TeamWorkQueue() {
  const portalDataMode = useRealPortalDataMode();
  const canUseFixtureData =
    portalDataMode.allowDemoFixtures || portalDataMode.isLiveDataConnected;

  const [decisions, setDecisions] = useState<Record<string, LocalDecision>>({});
  const groups = groupWorkflowItemsForTeam(demoClientTeamWorkflow);
  const summary = getWorkflowSummaryCounts(demoClientTeamWorkflow);
  const primaryLifecycle = demoClientLifecycle[0];
  const customerOpportunity = scoreCustomerOpportunity({
    mediaHealth: primaryLifecycle?.mediaStatus,
    healthScore: primaryLifecycle?.healthScore,
    pendingApprovals: summary.teamReviewReady,
    waitingOnClient: summary.waitingOnClient,
    reportOverdue: primaryLifecycle?.reportingStatus === "Overdue",
    bestSellerVisible: true,
  });
  const manualExecutionPacks = buildManualExecutionPacks().slice(0, 3);
  const firstClientOpsActions = getFirstClientOpsTopActions(3);
  const onboardingActions = getRestaurantOnboardingSeedProfiles()
    .sort((a, b) => getTeamOnboardingPriority(b) - getTeamOnboardingPriority(a))
    .slice(0, 3);

  const alerts = buildTeamAlerts({
    restaurantName: primaryLifecycle
      ? getRestaurantName(primaryLifecycle.clientId)
      : "Demo restaurant",
    mediaHealth: primaryLifecycle?.mediaStatus,
    pendingApprovals: summary.teamReviewReady,
    waitingOnClient: summary.waitingOnClient,
    reportDue: summary.alerts > 0,
    visibilityIssues: 1,
  });

  const setDecision = (id: string, decision: LocalDecision) => {
    setDecisions((prev) => ({ ...prev, [id]: decision }));
  };

  const summaryTiles = [
    { label: "Active", value: summary.active, testId: "wq-summary-active" },
    {
      label: "Needs review",
      value: summary.teamReviewReady,
      testId: "wq-summary-review",
    },
    {
      label: "Waiting on client",
      value: summary.waitingOnClient,
      testId: "wq-summary-waiting",
    },
    {
      label: "Queue / hold later",
      value: summary.readyToQueueOrHold,
      testId: "wq-summary-queue",
    },
    { label: "Alerts", value: summary.alerts, testId: "wq-summary-alerts" },
    {
      label: "Completed",
      value: summary.completed,
      testId: "wq-summary-completed",
    },
  ];

  if (!canUseFixtureData) {
    return (
      <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <TeamSaasStatePanel compact={true} />
        <RealPortalReviewNotice />
        <SafePortalEmptyCard
          title="Work Queue in review"
          body="Live client work items are not connected yet. The queue stays empty here instead of showing demo restaurants as active clients."
          testId="empty-team-work-queue"
        />
        <TeamReviewModeRouteSummary title="Work queue review-mode summary" />
      </PortalLayout>
    );
  }

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2
            className="text-2xl md:text-3xl font-bold tracking-tight"
            data-testid="header-work-queue"
          >
            Client Work Queue
          </h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Shared first-client workflow items grouped by the next team action.
          </p>
        </div>
        <Badge
          variant="outline"
          className="self-start border-border bg-muted/20 text-[10px] uppercase tracking-wider text-muted-foreground"
          data-testid="badge-data-source-work-queue"
        >
          Demo workflow
        </Badge>
      </div>

      <DemoOnlyBanner
        message="Demo only — button choices stay on this page. No database write, publishing action, or client message is sent."
        testId="banner-work-queue"
      />


      <Card className="mb-4 border-primary/20 bg-primary/5" data-testid="onboarding-next-actions">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ListChecks className="h-4 w-4 text-primary" />
            Top onboarding next actions
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <div className="grid gap-2 md:grid-cols-3">
            {onboardingActions.map((profile) => (
              <div key={profile.clientId} className="rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">{profile.restaurantName}</p>
                <p className="mt-1">{getTeamNextOnboardingAction(profile)}</p>
              </div>
            ))}
          </div>
          <Link href="/team/onboarding" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            Open onboarding queue <ArrowRight className="h-3 w-3" />
          </Link>
        </CardContent>
      </Card>

      <Card className="mb-4 border-emerald-500/20 bg-emerald-500/5" data-testid="first-client-ops-next-actions">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2"><ListChecks className="h-4 w-4 text-emerald-300" /> First-client ops next actions</span>
            <Link href="/team/first-client-ops" className="text-xs font-normal text-primary hover:underline">Open suite</Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {firstClientOpsActions.map((item) => (
            <div key={item.clientId} className="rounded-lg border border-border bg-background/30 p-3 text-sm">
              <p className="font-medium">{item.restaurantName}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.action}</p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">Actions can include requesting media, confirming business details, preparing manual execution, drafting weekly/monthly updates, or reviewing Premium readiness.</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
        {summaryTiles.map((tile) => (
          <Card
            key={tile.label}
            className="bg-card border-border"
            data-testid={tile.testId}
          >
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold tabular-nums">{tile.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {tile.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-4 rounded-md border border-border bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Local decision key:</span>{" "}
        Mark reviewed · Ask client · Queue for later · Hold for later. These are
        review notes only in this demo.
      </div>

      <Card className="mb-4 border-primary/20 bg-card" data-testid="work-manual-execution-next-actions">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Manual execution next actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {manualExecutionPacks.map((pack) => (
            <div key={pack.id} className="rounded-lg border border-border bg-muted/10 p-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-foreground">{pack.title}</p>
                <Badge variant="outline" className="border-border bg-muted/20 text-[10px]">{getExecutionPackReadinessLabel(pack)}</Badge>
              </div>
              <p className="mt-1 text-muted-foreground">{getExecutionPackNextAction(pack)}</p>
            </div>
          ))}
          <Link href="/team/manual-execution" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            Open Manual Execution Center <ArrowRight className="h-3 w-3" />
          </Link>
        </CardContent>
      </Card>

      <div className="mb-4 grid gap-3 lg:grid-cols-2">
        <Card
          className="bg-card border-primary/20"
          data-testid="work-rule-alerts"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Rule-based alerts / risk engine
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            {alerts.slice(0, 3).map((alert) => (
              <div
                key={alert.label}
                className="rounded-md border border-border/60 bg-muted/10 p-2"
              >
                <p className="font-medium text-foreground/85">
                  {alert.label} · {alert.restaurantName}
                </p>
                <p>{alert.whyItMatters}</p>
                <p className="text-primary/80">
                  Suggested next action: {alert.suggestedNextAction}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card
          className="bg-card border-primary/20"
          data-testid="work-customer-opportunity-score"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Customer opportunity scoring
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-foreground/85">
                {customerOpportunity.status}
              </p>
              <Badge
                variant="outline"
                className="border-border bg-muted/30 text-[10px]"
              >
                Internal score {customerOpportunity.score}
              </Badge>
            </div>
            <p>Main opportunity: {customerOpportunity.mainOpportunity}</p>
            <p>Main blocker: {customerOpportunity.mainBlocker}</p>
            <p className="text-primary/80">
              Suggested next action: {customerOpportunity.suggestedNextAction}
            </p>
            <p>
              Caption/draft template ready:{" "}
              {captionDraftTemplates[0].internalTitle} ·{" "}
              {captionDraftTemplates[0].suggestedChannel} · Faraz approval
              required before public use.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {groups.map((group) => (
          <Card
            key={group.key}
            className="bg-card border-border"
            data-testid={`work-group-${group.key}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-baseline justify-between gap-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.title}
                </CardTitle>
                <span className="text-[11px] text-muted-foreground/70 tabular-nums">
                  {group.items.length}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground/70 mt-1">
                {group.description}
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {group.items.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  Nothing here right now.
                </p>
              ) : (
                group.items.map((item) => {
                  const decision = decisions[item.id] ?? "pending";
                  return (
                    <div
                      key={item.id}
                      className="space-y-1.5"
                      data-testid={`work-item-${item.id}`}
                    >
                      <WorkflowItemCard
                        item={item}
                        mode="team"
                        clientName={getRestaurantName(item.clientId)}
                        actions={actionsForItem(item, setDecision)}
                      />
                      <div className="flex items-start justify-between gap-2 px-1">
                        <div className="text-[11px] text-muted-foreground leading-relaxed space-y-0.5">
                          <p>Next: {getTeamSuggestedNextStep(item)}</p>
                          {(() => {
                            const schedule = suggestManualSchedule({
                              mediaType: item.type,
                              contentAngle: item.title,
                              urgency:
                                item.priority === "urgent" ||
                                item.priority === "high"
                                  ? "high"
                                  : "medium",
                              weekendOrEvent: /weekend|sunday|friday/i.test(
                                item.title,
                              ),
                            });
                            return (
                              <p>
                                Manual publishing tracker: Prepared ·{" "}
                                {schedule.suggestedWindow}
                              </p>
                            );
                          })()}
                          {item.type === "media" &&
                            (() => {
                              const mediaAssist = reviewMediaRules({
                                type:
                                  item.title.toLowerCase().includes("reel") ||
                                  item.title.toLowerCase().includes("video")
                                    ? "Video"
                                    : "Photo",
                                title: item.title,
                                status:
                                  item.stage === "needs_better_photo"
                                    ? "Blurry"
                                    : item.stage === "media_review_needed"
                                      ? "Pending Review"
                                      : "Approved",
                                qualityNote:
                                  item.stage === "needs_better_photo"
                                    ? "Needs better angle/lighting"
                                    : "Review-mode media note",
                                suggestedUse: item.title,
                              });
                              return (
                                <p>
                                  Media assist: {mediaAssist.teamSuggestedUse} ·{" "}
                                  {mediaAssist.designPrepStatus}
                                </p>
                              );
                            })()}
                        </div>
                        <span
                          className={`rounded border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap ${decisionTone[decision]}`}
                        >
                          {decisionLabel[decision]}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </PortalLayout>
  );
}
