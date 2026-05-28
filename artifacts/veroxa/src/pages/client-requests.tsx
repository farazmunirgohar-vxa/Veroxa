import { ClipboardCheck, ArrowRight, HelpCircle, Loader2, MessageSquare, Activity } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientPortalData } from "@/hooks/useClientPortalData";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { clientTeamWorkRepository } from "@/lib/repositories";

const SHOWCASE_ID = "demo-a";

export default function ClientRequests() {
  const { source, dataSourceMessage } = useClientPortalData();

  // Single source of truth: clientTeamWorkRepository. All sections below
  // (Action needed, Questions from Veroxa Team, Veroxa is working on,
  // Recently completed, Conversation) are derived from one normalized
  // submission pipeline. Internal team notes are stripped at the repo layer.
  const actionRequired = clientTeamWorkRepository.getClientActionRequiredItems(SHOWCASE_ID);
  const inProgress = clientTeamWorkRepository.getClientInProgressItems(SHOWCASE_ID);
  const completed = clientTeamWorkRepository.getClientCompletedItems(SHOWCASE_ID).slice(0, 6);
  const conversation = clientTeamWorkRepository.getClientVisibleMessages(SHOWCASE_ID).slice(-6);
  const recentStatusUpdates = clientTeamWorkRepository.getClientLatestStatusUpdates(SHOWCASE_ID, 5);

  // "Questions from Veroxa Team" is the subset of action-required items where
  // Veroxa is explicitly asking for input (not just waiting on materials).
  const teamQuestions = actionRequired.filter(
    (i) => i.nextClientAction && i.nextClientAction.length > 0,
  );

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="header-client-requests">
          Requests from Veroxa
        </h2>
        <DataSourceBadge source={source} message={dataSourceMessage} />
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Quick to-dos that help us keep your content fresh and on-brand.
        </p>
      </div>

      <DemoOnlyBanner message="Demo only — request items are illustrative. No notifications or messages are sent." testId="banner-client-requests" />

      {/* Action needed from you — derived from the submission pipeline. */}
      {actionRequired.length > 0 && (
        <Card className="bg-amber-500/5 border-amber-500/30 mb-4" data-testid="card-client-action-needed">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-amber-300" />
              Action needed from you ({actionRequired.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {actionRequired.map((item) => (
              <div
                key={item.id}
                className="rounded-md border border-border bg-muted/20 px-3 py-3"
                data-testid={`action-required-${item.submissionId}`}
              >
                <p className="text-sm font-medium leading-snug">{item.title}</p>
                <p className="text-xs text-foreground/80 leading-relaxed mt-1">
                  {item.clientVisibleNote}
                </p>
                {item.nextClientAction && (
                  <p className="text-[11px] text-amber-300 mt-1.5">
                    What to send: {item.nextClientAction}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Questions from Veroxa Team — the explicit-ask subset. */}
      {teamQuestions.length > 0 && (
        <Card className="bg-sky-500/5 border-sky-500/30 mb-4" data-testid="card-questions-from-team">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-sky-300" />
              Questions from Veroxa Team ({teamQuestions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {teamQuestions.map((item) => (
              <div
                key={`q-${item.submissionId}`}
                className="rounded-md border border-border bg-muted/20 px-3 py-3"
                data-testid={`team-question-${item.submissionId}`}
              >
                <p className="text-sm font-medium leading-snug">{item.title}</p>
                <p className="text-xs text-foreground/80 leading-relaxed mt-1">
                  {item.clientVisibleNote}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Veroxa is working on — derived from in-progress submissions. */}
      <Card className="bg-card border-border mb-4" data-testid="card-veroxa-working-on">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-primary" />
            Veroxa is working on ({inProgress.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {inProgress.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              Nothing is actively in progress this week.
            </p>
          ) : (
            inProgress.map((item) => (
              <div
                key={item.id}
                className="rounded-md border border-border bg-muted/20 px-3 py-3"
                data-testid={`in-progress-${item.submissionId}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                  <p className="text-sm font-medium leading-snug">{item.title}</p>
                  <Badge variant="outline" className="text-[9px]">
                    {item.clientStatusLabel}
                  </Badge>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">{item.clientVisibleNote}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Recent status updates — most-recent client-visible status events,
          using the four friendly buckets (Received / In progress /
          Waiting on your input / Completed). Internal-only events are
          filtered out at the repository layer. */}
      {recentStatusUpdates.length > 0 && (
        <Card className="bg-card border-border mb-4" data-testid="card-recent-status-updates">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Recent status updates ({recentStatusUpdates.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentStatusUpdates.map((u) => {
              const labelTone: Record<string, string> =
                {
                  "Received":              "border-sky-500/30 bg-sky-500/10 text-sky-300",
                  "In progress":           "border-primary/30 bg-primary/10 text-primary",
                  "Waiting on your input": "border-amber-500/30 bg-amber-500/10 text-amber-300",
                  "Completed":             "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
                };
              return (
                <div
                  key={u.id}
                  className="rounded-md border border-border bg-muted/20 px-3 py-2"
                  data-testid={`status-update-${u.id}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                    <p className="text-sm font-medium leading-snug">{u.submissionTitle}</p>
                    <Badge variant="outline" className={`text-[9px] ${labelTone[u.label]}`}>
                      {u.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed">{u.note}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Recently completed — derived from completed submissions. */}
      <Card className="bg-card border-border mb-4" data-testid="card-recently-completed">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-emerald-400" />
            Recently completed ({completed.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {completed.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No completed items yet.</p>
          ) : (
            completed.map((item) => (
              <div
                key={item.id}
                className="rounded-md border border-border bg-muted/10 px-3 py-2 opacity-80"
                data-testid={`completed-${item.submissionId}`}
              >
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {item.clientStatusLabel}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Conversation thread — client_and_team messages only. */}
      <Card className="bg-card border-border" data-testid="card-client-team-thread">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Conversation with Veroxa Team
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {conversation.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No messages yet.</p>
          ) : (
            conversation.map((m) => {
              const isYou = m.senderRole === "client";
              return (
                <div
                  key={m.id}
                  className={`rounded-md border px-3 py-2 ${
                    isYou
                      ? "border-primary/20 bg-primary/5"
                      : "border-border bg-muted/20"
                  }`}
                  data-testid={`thread-msg-${m.id}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {isYou ? "You" : "Veroxa Team"}
                    </p>
                    {m.actionRequired && !isYou && (
                      <Badge variant="outline" className="text-[9px] border-amber-500/30 bg-amber-500/10 text-amber-300">
                        Action needed
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-foreground/85 leading-relaxed">{m.body}</p>
                </div>
              );
            })
          )}
          <div className="pt-2 border-t border-border/50 space-y-1.5">
            <Input
              type="text"
              placeholder="Live messaging will connect after backend activation."
              disabled
              className="h-9 text-xs"
              data-testid="input-client-thread-disabled"
            />
            <p className="text-[10px] text-muted-foreground">
              Demo only — messages above are illustrative.
            </p>
          </div>
        </CardContent>
      </Card>
    </PortalLayout>
  );
}
