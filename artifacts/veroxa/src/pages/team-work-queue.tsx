import { PortalLayout } from "@/components/PortalLayout";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { demoClientTeamWorkflow } from "@/data/workflows/clientTeamWorkflow";
import { groupWorkflowItemsForTeam } from "@/lib/workflows/workflowStatus";
import { WorkflowItemCard } from "@/components/workflows/WorkflowItemCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRestaurantName } from "@/data/demoData";

export default function TeamWorkQueue() {
  const groups = groupWorkflowItemsForTeam(demoClientTeamWorkflow);

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <div className="mb-4">
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

      <DemoOnlyBanner
        message="Demo only — workflow items are local sample data. No database writes."
        testId="banner-work-queue"
      />

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
