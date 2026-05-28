import { ClipboardCheck, CalendarDays, ArrowRight, HelpCircle, Loader2, MessageSquare } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientPortalData } from "@/hooks/useClientPortalData";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { demoClientRequests, requestStatusColor, requestPriorityColor } from "@/data/demoData";
import { demoClientTeamWorkflow } from "@/data/workflows/clientTeamWorkflow";
import { sortWorkflowItems, isClientActionNeeded } from "@/lib/workflows/workflowStatus";
import { WorkflowItemCard } from "@/components/workflows/WorkflowItemCard";
import { clientTeamWorkRepository } from "@/lib/repositories";
import {
  clientTeamSubmissionStatusLabels,
  clientTeamSubmissionTypeLabels,
} from "@/data/demo/demoClientTeamWork";

const SHOWCASE_ID = "demo-a";

export default function ClientRequests() {
  const { source, dataSourceMessage } = useClientPortalData();
  const open = demoClientRequests.filter((r) => r.clientId === SHOWCASE_ID && r.status !== "Completed");
  const done = demoClientRequests.filter((r) => r.clientId === SHOWCASE_ID && r.status === "Completed");

  // Client/team workflow data — read-only, client-visible only
  // (internal team notes are stripped at the repository layer).
  const clientSubmissions = clientTeamWorkRepository.getClientVisibleSubmissions(SHOWCASE_ID);
  const teamQuestions = clientSubmissions.filter((s) => s.status === "needs_client_clarification");
  const inProgress = clientSubmissions.filter(
    (s) => s.status === "in_progress" || s.status === "accepted",
  );
  const recentlyCompleted = clientSubmissions.filter((s) => s.status === "completed").slice(0, 4);
  const conversation = clientTeamWorkRepository.getClientVisibleMessages(SHOWCASE_ID).slice(-6);

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

      {/* Workflow-derived "Action needed" strip — friendly labels only. */}
      {(() => {
        const actionItems = sortWorkflowItems(
          demoClientTeamWorkflow.filter(
            (i) => i.clientId === SHOWCASE_ID && isClientActionNeeded(i.stage),
          ),
        );
        if (actionItems.length === 0) return null;
        return (
          <Card className="bg-amber-500/5 border-amber-500/30 mb-4" data-testid="card-client-action-needed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-amber-300" />
                Action needed from you ({actionItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {actionItems.map((item) => (
                <WorkflowItemCard key={item.id} item={item} mode="client" />
              ))}
            </CardContent>
          </Card>
        );
      })()}

      {/* Questions from Veroxa Team — needs_client_clarification only. */}
      {teamQuestions.length > 0 && (
        <Card className="bg-sky-500/5 border-sky-500/30 mb-4" data-testid="card-questions-from-team">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-sky-300" />
              Questions from Veroxa Team ({teamQuestions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {teamQuestions.map((s) => (
              <div
                key={s.id}
                className="rounded-md border border-border bg-muted/20 px-3 py-3"
                data-testid={`team-question-${s.id}`}
              >
                <p className="text-sm font-medium leading-snug">{s.title}</p>
                <p className="text-xs text-foreground/80 leading-relaxed mt-1">
                  {s.clientVisibleNote}
                </p>
                {s.requestedClientAction && (
                  <p className="text-[11px] text-sky-300 mt-1.5">
                    What to send: {s.requestedClientAction}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Veroxa is working on — in progress + accepted. */}
      {inProgress.length > 0 && (
        <Card className="bg-card border-border mb-4" data-testid="card-veroxa-working-on">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-primary" />
              Veroxa is working on ({inProgress.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {inProgress.map((s) => (
              <div
                key={s.id}
                className="rounded-md border border-border bg-muted/20 px-3 py-3"
                data-testid={`in-progress-${s.id}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                  <p className="text-sm font-medium leading-snug">{s.title}</p>
                  <Badge variant="outline" className="text-[9px]">
                    {clientTeamSubmissionStatusLabels[s.status]}
                  </Badge>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">{s.clientVisibleNote}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border-primary/30 mb-4">
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><ArrowRight className="w-4 h-4 text-primary" /> Open ({open.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {open.length === 0 ? (
            <p className="text-xs text-emerald-400">You're all caught up. Thank you!</p>
          ) : open.map((r) => (
            <div key={r.id} className="rounded-md border border-border bg-muted/20 px-3 py-3" data-testid={`request-${r.id}`}>
              <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                <p className="text-sm font-medium leading-snug">{r.title}</p>
                <div className="flex gap-1">
                  <Badge variant="outline" className={`text-[9px] ${requestPriorityColor[r.priority]}`}>{r.priority}</Badge>
                  <Badge variant="outline" className={`text-[9px] ${requestStatusColor[r.status]}`}>{r.status}</Badge>
                </div>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">{r.description}</p>
              <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
                <CalendarDays className="w-3 h-3" /> Due {r.dueDate}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-card border-border mb-4">
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-emerald-400" /> Recently completed ({done.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {done.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No completed requests yet.</p>
          ) : done.map((r) => (
            <div key={r.id} className="rounded-md border border-border bg-muted/10 px-3 py-2 opacity-80">
              <p className="text-sm font-medium">{r.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Completed by {r.dueDate}</p>
            </div>
          ))}
          {recentlyCompleted.length > 0 && (
            <div className="pt-2 border-t border-border/50 space-y-1.5">
              {recentlyCompleted.map((s) => (
                <div key={s.id} className="text-[12px] text-muted-foreground" data-testid={`completed-sub-${s.id}`}>
                  <span className="text-foreground/80">{s.title}</span>
                  <span className="text-[10px] ml-2 uppercase tracking-wider">
                    {clientTeamSubmissionTypeLabels[s.submissionType]}
                  </span>
                </div>
              ))}
            </div>
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
