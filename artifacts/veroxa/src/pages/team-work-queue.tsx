import { PortalLayout } from "@/components/PortalLayout";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRestaurantName } from "@/data/demoData";
import { clientTeamWorkRepository } from "@/lib/repositories";
import type { TeamWorkItem } from "@/lib/repositories/clientTeamWorkRepository";

export default function TeamWorkQueue() {
  // Submission-derived sections — single source of truth is the
  // clientTeamWorkRepository. The old workflow-derived groups (read from
  // demoClientTeamWorkflow + workflowRepository.getWorkflowSummary) have
  // been retired here so this queue reflects the same submission pipeline
  // the client portal sees, rather than a separate workflow fixture.
  const ready       = clientTeamWorkRepository.getTeamReadyWorkItems();
  const inProgress  = clientTeamWorkRepository.getTeamInProgressWorkItems();
  const blocked     = clientTeamWorkRepository.getTeamBlockedWorkItems();
  // `getTeamWaitingOnClientItems` includes both `needs_client_clarification`
  // and `blocked` for the team's "anything paused on the client" view, but
  // this queue renders Blocked as its own section — so filter blocked out
  // here to keep sections mutually exclusive and counts honest.
  const blockedIds  = new Set(blocked.map((b) => b.id));
  const waiting     = clientTeamWorkRepository
    .getTeamWaitingOnClientItems()
    .filter((i) => !blockedIds.has(i.id));
  const completed   = clientTeamWorkRepository.getTeamCompletedWorkItems();
  const summary     = clientTeamWorkRepository.getTeamWorkCommunicationSummary();

  const allActive = [...ready, ...inProgress, ...waiting, ...blocked];
  const urgentOrHigh = allActive.filter(
    (i) => i.priority === "urgent" || i.priority === "high",
  ).length;

  const summaryTiles: { label: string; value: number; testId: string }[] = [
    { label: "Ready for team",    value: ready.length,                       testId: "wq-summary-ready" },
    { label: "In progress",       value: inProgress.length,                  testId: "wq-summary-in-progress" },
    { label: "Urgent / high",     value: urgentOrHigh,                       testId: "wq-summary-urgent" },
    { label: "Waiting on client", value: waiting.length,                     testId: "wq-summary-waiting" },
    { label: "Blocked",           value: blocked.length,                     testId: "wq-summary-blocked" },
    { label: "Completed",         value: summary.completedCount,             testId: "wq-summary-completed" },
  ];

  const sections: {
    key: string;
    title: string;
    description: string;
    items: TeamWorkItem[];
    tone: string;
  }[] = [
    {
      key: "ready",
      title: "Ready for team",
      description: "New submissions and items waiting for team triage.",
      items: ready,
      tone: "border-sky-500/30",
    },
    {
      key: "in_progress",
      title: "In progress",
      description: "Work the team has accepted and is actively executing.",
      items: inProgress,
      tone: "border-primary/30",
    },
    {
      key: "waiting",
      title: "Waiting on client",
      description: "Asked the client a question — paused until they reply.",
      items: waiting,
      tone: "border-amber-500/30",
    },
    {
      key: "blocked",
      title: "Blocked by client",
      description: "Cannot progress without something from the client.",
      items: blocked,
      tone: "border-rose-500/30",
    },
    {
      key: "completed",
      title: "Recently completed",
      description: "Closed-out submissions for reference.",
      items: completed.slice(0, 6),
      tone: "border-emerald-500/30",
    },
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
            Client submissions grouped by what the team needs to do next. Shares the
            same pipeline the client portal sees.
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
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4" data-testid="work-queue-summary-grid">
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
        {sections.map((section) => (
          <Card
            key={section.key}
            className={`bg-card ${section.tone}`}
            data-testid={`work-group-${section.key}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-baseline justify-between gap-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </CardTitle>
                <span className="text-[11px] text-muted-foreground/70 tabular-nums">
                  {section.items.length}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground/70 mt-1">{section.description}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {section.items.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nothing here right now.</p>
              ) : (
                section.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-md border border-border bg-muted/20 px-3 py-2"
                    data-testid={`work-item-${item.submissionId}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-medium leading-snug">
                        {getRestaurantName(item.clientId)} — {item.title}
                      </p>
                      <Badge variant="outline" className="text-[9px] flex-shrink-0">
                        {item.teamStatusLabel}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.clientVisibleNote}</p>
                    {item.internalTeamNote && (
                      <p className="text-[11px] text-muted-foreground/80 italic mt-1">
                        Internal: {item.internalTeamNote}
                      </p>
                    )}
                    <p className="text-[11px] text-primary/80 mt-1">
                      Next: {item.nextTeamAction}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </PortalLayout>
  );
}
