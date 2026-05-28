import { PortalLayout } from "@/components/PortalLayout";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { demoClientTeamWorkflow } from "@/data/workflows/clientTeamWorkflow";
import { groupWorkflowItemsForTeam } from "@/lib/workflows/workflowStatus";
import { WorkflowItemCard } from "@/components/workflows/WorkflowItemCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRestaurantName } from "@/data/demoData";
import { workflowRepository } from "@/lib/repositories";

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
        Client direction feeds into this queue after team interpretation. See the{" "}
        <a
          href="/demo/team/direction-queue"
          className="text-primary hover:underline"
          data-testid="link-direction-queue-from-work-queue"
        >
          Direction Queue
        </a>
        . New client work originates from{" "}
        <a
          href="/demo/team/audit-leads"
          className="text-primary hover:underline"
          data-testid="link-audit-leads-from-work-queue"
        >
          Audit Leads
        </a>{" "}
        once a prospect converts.
      </p>

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
