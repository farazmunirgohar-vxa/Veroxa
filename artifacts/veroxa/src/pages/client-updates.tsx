import { CalendarDays, CheckCircle2, FileText, Clock, Loader2, ArrowRight, Activity, ImageIcon } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientPortalData } from "@/hooks/useClientPortalData";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { clientTeamWorkRepository } from "@/lib/repositories";
import { ClientVisibilityProgressCard } from "@/components/ClientVisibilityProgressCard";
import { useEffect, useState } from "react";
import {
  getClientWorkflowItems,
  subscribeToWorkflow,
} from "@/lib/workflow/workflowRepository";
import { toClientActivityViews } from "@/lib/workflow/workflowActivity";
import type { WorkflowItem } from "@/lib/workflow/workflowTypes";
import { generateClientWeeklyUpdate } from "@/domain/clientPortalJourney";

const SHOWCASE_ID = "demo-a";

interface TimelineEntry {
  id: string;
  at: string;
  label: string;
  itemTitle: string;
}

function useWorkflowTimeline(clientId: string): TimelineEntry[] {
  const [items, setItems] = useState<WorkflowItem[]>(() =>
    getClientWorkflowItems(clientId),
  );
  useEffect(() => {
    const refresh = () => setItems(getClientWorkflowItems(clientId));
    refresh();
    return subscribeToWorkflow(refresh);
  }, [clientId]);

  return items
    .flatMap((item) =>
      toClientActivityViews(item.activityEvents).map((view) => ({
        id: view.id,
        at: view.at,
        label: view.label as string,
        itemTitle: item.title,
      })),
    )
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 12);
}

const PAST_UPDATES = [
  {
    week: "Week 2 — May 12–18",
    summary: "Content and local visibility work moved forward. Monthly report notes were prepared for review.",
    focus: "Content and visibility",
    status: "Published",
  },
  {
    week: "Week 1 — May 5–11",
    summary: "Content preparation continued and the next media needs were shared.",
    focus: "Content preparation",
    status: "Published",
  },
];

export default function ClientUpdates() {
  const { source, dataSourceMessage } = useClientPortalData();
  const timeline = useWorkflowTimeline(SHOWCASE_ID);
  const weeklyUpdate = generateClientWeeklyUpdate(SHOWCASE_ID);

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="header-updates">
          Weekly Updates
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          What your Veroxa team has been working on — content, local visibility, and what's coming next.
        </p>
        <DataSourceBadge source={source} message={dataSourceMessage} />
      </div>

      {/* Weekly update foundation — deterministic, client-safe journey data. */}
      <Card
        className="bg-card border-primary/20 mb-5"
        data-testid="weekly-update-foundation"
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            {weeklyUpdate.weekLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-foreground/85">{weeklyUpdate.clientSafeSummary}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[12px]">
            {[
              ["Completed", weeklyUpdate.completedWork[0]],
              ["In progress", weeklyUpdate.inProgressWork[0]],
              ["Needs from you", weeklyUpdate.needsClientInput[0]],
              ["Next focus", weeklyUpdate.nextWeekFocus[0]],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-border/50 bg-muted/10 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                  {label}
                </p>
                <p className="text-foreground/85">{value}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground italic pt-1">
            Prepared by Veroxa; nothing goes live without Veroxa team review.
          </p>
        </CardContent>
      </Card>

      {/* Current week update */}
      <Card
        className="bg-card border-primary/30 mb-5"
        data-testid="weekly-update"
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-base font-semibold">
              {weeklyUpdate.headline}
            </CardTitle>
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[10px]"
            >
              Current week
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {[...weeklyUpdate.completedWork, ...weeklyUpdate.inProgressWork, ...weeklyUpdate.visibilityProgress].slice(0, 6).map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm text-foreground/85">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* Post thumbnail strip — current week */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
            {(["Post 1", "Post 2", "Post 3"] as const).map((label, i) => (
              <div
                key={i}
                className="aspect-square rounded-md bg-muted/20 border border-border/40 flex flex-col items-center justify-center gap-1"
                data-testid={`update-photo-${i}`}
              >
                <ImageIcon className="w-5 h-5 text-muted-foreground/40" />
                <span className="text-[9px] text-muted-foreground/50">{label}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Post thumbnails will appear here once your restaurant&apos;s media is connected.
          </p>
        </CardContent>
      </Card>

      {/* Local visibility progress — client-safe Google/local visibility surface. */}
      <div className="mb-5">
        <ClientVisibilityProgressCard clientId={SHOWCASE_ID} />
      </div>

      {/* Actions needed from you — derived from the submission pipeline so
          this section agrees with the client dashboard and /requests page. */}
      {(() => {
        const actions = clientTeamWorkRepository.getClientActionRequiredItems(SHOWCASE_ID);
        if (actions.length === 0) return null;
        return (
          <div className="mb-5" data-testid="section-upcoming-actions">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              What we need from you this week
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {actions.map((item) => (
                <Card
                  key={item.id}
                  className="bg-card/60 border-border"
                  data-testid={`action-item-${item.submissionId}`}
                >
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className="p-2 rounded-md bg-amber-500/10 flex-shrink-0">
                      <ArrowRight className="w-4 h-4 text-amber-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <Badge
                          variant="outline"
                          className="flex-shrink-0 text-[10px] border bg-amber-500/10 text-amber-300 border-amber-500/30"
                        >
                          {item.clientStatusLabel}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.clientVisibleNote}
                      </p>
                      {item.nextClientAction && (
                        <p className="text-[11px] text-amber-300 mt-1.5">
                          What to send: {item.nextClientAction}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })()}

      {/* What Veroxa is working on for you — derived from in-progress work items. */}
      {(() => {
        const inProgress = clientTeamWorkRepository.getClientInProgressItems(SHOWCASE_ID);
        if (inProgress.length === 0) return null;
        return (
          <div className="mb-5" data-testid="section-veroxa-working-on">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              What Veroxa is working on for you
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {inProgress.slice(0, 4).map((item) => (
                <Card
                  key={item.id}
                  className="bg-card/60 border-border"
                  data-testid={`working-on-${item.submissionId}`}
                >
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className="p-2 rounded-md bg-primary/10 flex-shrink-0">
                      <Loader2 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground mb-1">{item.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.clientVisibleNote}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Recent Veroxa progress — derived from client-visible status events
          using the four friendly buckets. Internal-only events stay hidden. */}
      {(() => {
        const updates = clientTeamWorkRepository.getClientLatestStatusUpdates(SHOWCASE_ID, 5);
        if (updates.length === 0) return null;
        const labelTone: Record<string, string> = {
          "Received":              "border-sky-500/30 bg-sky-500/10 text-sky-300",
          "In progress":           "border-primary/30 bg-primary/10 text-primary",
          "Waiting on your input": "border-amber-500/30 bg-amber-500/10 text-amber-300",
          "Completed":             "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        };
        return (
          <div className="mb-5" data-testid="section-recent-veroxa-progress">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" /> Recent Veroxa progress
            </h3>
            <Card className="bg-card/60 border-border">
              <CardContent className="p-4 space-y-2">
                {updates.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-start justify-between gap-3 border-b border-border/40 last:border-0 pb-2 last:pb-0"
                    data-testid={`recent-progress-${u.id}`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug">{u.submissionTitle}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{u.note}</p>
                    </div>
                    <Badge variant="outline" className={`text-[9px] flex-shrink-0 ${labelTone[u.label]}`}>
                      {u.label}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* Activity timeline — client-safe events from the real workflow
          foundation. Internal-only events are never shown here. */}
      {timeline.length > 0 && (
        <div className="mb-5" data-testid="section-workflow-timeline">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" /> Activity timeline
          </h3>
          <Card className="bg-card/60 border-border">
            <CardContent className="p-4 space-y-2">
              {timeline.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start justify-between gap-3 border-b border-border/40 last:border-0 pb-2 last:pb-0"
                  data-testid={`timeline-${entry.id}`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug">
                      {entry.itemTitle}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {entry.label}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                    {new Date(entry.at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Past updates */}
      <div data-testid="section-past-updates">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Previous weeks
        </h3>
        <div className="space-y-3">
          {PAST_UPDATES.map((u, i) => (
            <Card key={i} className="bg-card/40 border-border" data-testid={`past-update-${i}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm font-semibold text-foreground">{u.week}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-muted-foreground/30 text-muted-foreground text-[10px]"
                  >
                    {u.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">{u.summary}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Included in updates
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" /> {u.focus}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400/80">
                    <Clock className="w-3 h-3" /> On schedule
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        Your recent activity updates as Veroxa works on your account.
      </p>
    </PortalLayout>
  );
}
