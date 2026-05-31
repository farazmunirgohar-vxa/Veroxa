import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/common";
import type { TeamActionQueueItem, TeamClientOverviewItem, TeamDailyCommandSummary } from "@/domain/operations";
import { getTeamActionQueue, getTeamDailyCommandSummary } from "@/lib/operations";

export function TeamCommandSummaryGrid({ summary }: { summary: TeamDailyCommandSummary }) {
  const items = [
    ["Accounts", summary.totalAccounts],
    ["Need media", summary.clientsNeedingMedia],
    ["Ready for content", summary.clientsReadyForContent],
    ["Reports to review", summary.reportsNeedingReview],
    ["Premium assessments", summary.premiumCandidates],
    ["Risk flags", summary.riskFlags],
  ] as const;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3" data-testid="team-command-summary-grid">
      {items.map(([label, value]) => (
        <Card key={label} className="bg-card/60 border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TeamActionQueueList({ actions }: { actions: TeamActionQueueItem[] }) {
  if (actions.length === 0) {
    return <p className="text-sm text-muted-foreground">No review-mode actions are queued right now.</p>;
  }
  return (
    <div className="space-y-2" data-testid="team-action-queue-list">
      {actions.map((action) => (
        <div key={action.id} className="rounded-md border border-border bg-muted/20 p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{action.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{action.clientName}</p>
            </div>
            <StatusBadge tone={action.priority === "high" ? "danger" : action.priority === "medium" ? "warning" : "info"}>
              {action.priority}
            </StatusBadge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Next human action: {action.nextHumanAction}</p>
        </div>
      ))}
    </div>
  );
}

export function TeamClientOverviewList({ overview }: { overview: TeamClientOverviewItem[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2" data-testid="team-client-overview-list">
      {overview.map((item) => (
        <Card key={item.account.id} className="bg-card/60 border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between gap-2">
              <span>{item.account.businessName}</span>
              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
                {item.account.lifecycleStage.replaceAll("_", " ")}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <p>Media: {item.media.teamInternalMessage}</p>
            <p>Content: {item.content.teamInternalMessage}</p>
            <p>Reports: {item.report.teamInternalMessage}</p>
            <p>Risk: {item.risk.teamInternalMessage}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TeamReviewModeRouteSummary({ title }: { title: string }) {
  const summary = getTeamDailyCommandSummary();
  const actions = getTeamActionQueue().slice(0, 3);
  return (
    <Card className="bg-card/60 border-border/60 mt-4" data-testid="team-review-mode-route-summary">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p>Review-mode operational records only. Live connectors and public demo fixtures are not used as active clients here.</p>
        <TeamCommandSummaryGrid summary={summary} />
        <TeamActionQueueList actions={actions} />
      </CardContent>
    </Card>
  );
}
