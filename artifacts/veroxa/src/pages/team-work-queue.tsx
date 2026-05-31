import { useState } from "react";
import { ListChecks } from "lucide-react";
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
import { getRestaurantName } from "@/data/demoData";
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
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Next: {getTeamSuggestedNextStep(item)}
                        </p>
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
