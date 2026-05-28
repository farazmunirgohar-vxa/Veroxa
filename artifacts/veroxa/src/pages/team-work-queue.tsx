import { PortalLayout } from "@/components/PortalLayout";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { demoClientTeamWorkflow } from "@/data/workflows/clientTeamWorkflow";
import { groupWorkflowItemsForTeam } from "@/lib/workflows/workflowStatus";
import { WorkflowItemCard } from "@/components/workflows/WorkflowItemCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRestaurantName } from "@/data/demoData";
import { workflowRepository, clientTeamWorkRepository } from "@/lib/repositories";

export default function TeamWorkQueue() {
  const groups = groupWorkflowItemsForTeam(demoClientTeamWorkflow);
  const summary = workflowRepository.getWorkflowSummary();

  const summaryTiles: { label: string; value: number; testId: string }[] = [
    { label: "Total items",       value: summary.total,              testId: "wq-summary-total" },
    { label: "Urgent",            value: summary.urgent,             testId: "wq-summary-urgent" },
    { label: "High priority",     value: summary.highPriority,       testId: "wq-summary-high" },
    { label: "Blocked",           value: summary.blocked,            testId: "wq-summary-blocked" },
    { label: "Awaiting client",   value: summary.awaitingClient,     testId: "wq-summary-awaiting-client" },
    { label: "Internal approval", value: summary.inInternalApproval, testId: "wq-summary-internal-approval" },
  ];

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
            The shared client-team workflow, grouped by what the team needs to do next.
          </p>
        </div>
        <Badge
          variant="outline"
          className="self-start border-border bg-muted/20 text-[10px] uppercase tracking-wider text-muted-foreground"
          data-testid="badge-data-source-work-queue"
        >
          Source: Demo repository layer
        </Badge>
      </div>

      <DemoOnlyBanner
        message="Demo only — workflow items are local sample data. No database writes."
        testId="banner-work-queue"
      />

      <Card
        className="bg-card/50 border-border/50 mb-4"
        data-testid="work-queue-summary-strip"
      >
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4">
          {summaryTiles.map((tile) => (
            <div key={tile.label} data-testid={tile.testId}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {tile.label}
              </p>
              <p className="text-xl font-semibold tabular-nums text-foreground">
                {tile.value}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground mb-4">
        Signed-client work surfaces here once direction or submissions land.
        Client direction is interpreted in the{" "}
        <a
          href="/demo/team/direction-queue"
          className="text-primary hover:underline"
          data-testid="link-direction-queue-from-work-queue"
        >
          Direction Queue
        </a>
        .
      </p>

      {/* Client submissions snapshot — surfaces inbound work + internal notes. */}
      {(() => {
        const inbox = clientTeamWorkRepository.getTeamInbox();
        const clarification = clientTeamWorkRepository.getTeamNeedsClientClarification();
        const blocked = clientTeamWorkRepository.getTeamBlockedItems();
        const blockedSpotlight = blocked[0];
        if (
          inbox.length === 0 &&
          clarification.length === 0 &&
          blocked.length === 0
        ) {
          return null;
        }
        return (
          <Card
            className="bg-card border-border mb-4"
            data-testid="card-client-submissions-snapshot"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                Client submissions snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div data-testid="cts-snap-inbox">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    New / needs review
                  </p>
                  <p className="text-xl font-semibold tabular-nums">{inbox.length}</p>
                </div>
                <div data-testid="cts-snap-clarification">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Needs clarification
                  </p>
                  <p className="text-xl font-semibold tabular-nums">{clarification.length}</p>
                </div>
                <div data-testid="cts-snap-blocked">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Blocked by client
                  </p>
                  <p className="text-xl font-semibold tabular-nums">{blocked.length}</p>
                </div>
              </div>
              {blockedSpotlight && (
                <div
                  className="rounded-md border border-rose-500/30 bg-rose-500/5 px-3 py-2"
                  data-testid="cts-snap-blocked-spotlight"
                >
                  <p className="text-[11px] uppercase tracking-wider text-rose-300 font-semibold mb-0.5">
                    Internal Team Note · {getRestaurantName(blockedSpotlight.clientId)}
                  </p>
                  <p className="text-sm font-medium leading-snug mb-0.5">
                    {blockedSpotlight.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {blockedSpotlight.internalTeamNote}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

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
              <p className="text-[11px] text-muted-foreground/70 mt-1">{group.description}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {group.items.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nothing here right now.</p>
              ) : (
                group.items.map((item) => (
                  <WorkflowItemCard
                    key={item.id}
                    item={item}
                    mode="team"
                    clientName={getRestaurantName(item.clientId)}
                  />
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </PortalLayout>
  );
}
