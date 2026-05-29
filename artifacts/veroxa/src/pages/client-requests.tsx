import { ClipboardCheck, ArrowRight, HelpCircle, Loader2, MessageSquare, Activity, Send, Megaphone, CheckCircle2 } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientPortalData } from "@/hooks/useClientPortalData";
import { ClientRequestsClarity } from "@/components/ClientExecutionReinforcement";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { clientTeamWorkRepository } from "@/lib/repositories";
import { useEffect, useState } from "react";
import {
  addClientClarificationResponse,
  createWorkflowItem,
  getClientItemsNeedingInput,
  subscribeToWorkflow,
} from "@/lib/workflow/workflowRepository";
import type { WorkflowItem } from "@/lib/workflow/workflowTypes";

const SHOWCASE_ID = "demo-a";

function WorkflowClarifications({ clientId }: { clientId: string }) {
  const [items, setItems] = useState<WorkflowItem[]>(() =>
    getClientItemsNeedingInput(clientId),
  );
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const refresh = () => setItems(getClientItemsNeedingInput(clientId));
    refresh();
    return subscribeToWorkflow(refresh);
  }, [clientId]);

  if (items.length === 0) return null;

  const submit = (id: string) => {
    const text = (drafts[id] ?? "").trim();
    if (!text) return;
    addClientClarificationResponse(id, text);
    setDrafts((prev) => ({ ...prev, [id]: "" }));
  };

  return (
    <Card
      className="bg-sky-500/5 border-sky-500/30 mb-4"
      data-testid="card-workflow-clarifications"
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-sky-300" />
          Veroxa needs your input ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div
            key={item.workflowItemId}
            className="rounded-md border border-border bg-muted/20 px-3 py-3"
            data-testid={`clarification-${item.workflowItemId}`}
          >
            <p className="text-sm font-medium leading-snug">{item.title}</p>
            {item.nextClientAction && (
              <p className="text-[12px] text-sky-200 mt-1">
                {item.nextClientAction}
              </p>
            )}
            <div className="flex gap-2 mt-2">
              <Input
                type="text"
                value={drafts[item.workflowItemId] ?? ""}
                onChange={(e) =>
                  setDrafts((prev) => ({
                    ...prev,
                    [item.workflowItemId]: e.target.value,
                  }))
                }
                placeholder="Type your reply to Veroxa…"
                className="h-9 text-xs"
                data-testid={`clarification-input-${item.workflowItemId}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit(item.workflowItemId);
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={() => submit(item.workflowItemId)}
                disabled={!(drafts[item.workflowItemId] ?? "").trim()}
                data-testid={`clarification-send-${item.workflowItemId}`}
                className="flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

const BUSINESS_UPDATE_TYPES = [
  "Hours change",
  "New or updated menu item",
  "Temporary closure or holiday hours",
  "Promotion or special idea",
  "Photos or video to feature",
  "Something else",
];

/**
 * Client-initiated business update composer. Creates a `client_request`
 * workflow item locally so the update flows into the same journey the team
 * sees. No network, no auto-publish: business facts (hours, menu, closures)
 * are always confirmed by Veroxa before anything changes.
 */
function SendBusinessUpdate({ clientId }: { clientId: string }) {
  const [updateType, setUpdateType] = useState<string>(BUSINESS_UPDATE_TYPES[0]);
  const [note, setNote] = useState("");
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const submit = () => {
    const text = note.trim();
    if (!text) return;
    createWorkflowItem({
      clientId,
      type: "client_request",
      title: updateType,
      clientNote: text,
      submittedBy: "client",
    });
    setNote("");
    setConfirmation(
      "Thanks — your update has been sent to the Veroxa team. We'll confirm any business details with you before anything changes.",
    );
  };

  return (
    <Card
      className="bg-card border-primary/20 mb-4"
      data-testid="card-send-business-update"
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-primary" />
          Send Veroxa a business update
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Changed your hours, added a dish, or have a promotion in mind? Let the
          Veroxa team know and we'll take it from there.
        </p>
        <select
          value={updateType}
          onChange={(e) => {
            setUpdateType(e.target.value);
            setConfirmation(null);
          }}
          className="bg-muted/40 border border-border rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-72"
          data-testid="select-business-update-type"
        >
          {BUSINESS_UPDATE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <textarea
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setConfirmation(null);
          }}
          rows={3}
          placeholder="Share the details — e.g. new Friday hours, a new dish name, or a promo you'd like to run."
          className="w-full bg-muted/40 border border-border rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          data-testid="input-business-update-note"
        />
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-[10px] text-muted-foreground max-w-md">
            Veroxa confirms hours, menu, and other business details with you
            before anything goes live.
          </p>
          <Button
            type="button"
            size="sm"
            onClick={submit}
            disabled={!note.trim()}
            data-testid="btn-send-business-update"
            className="flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" /> Send to Veroxa
          </Button>
        </div>
        {confirmation && (
          <div
            className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-300"
            role="status"
            data-testid="text-business-update-confirmation"
          >
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{confirmation}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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

      {/* What helps us help you — calm, blame-free reinforcement (client-safe). */}
      <div className="mb-4">
        <ClientRequestsClarity clientId={SHOWCASE_ID} />
      </div>

      {/* Clarifications you can respond to — driven by the real workflow
          foundation. Responses are saved into your workflow (backend pending).
          No notifications or external messages are sent. */}
      <WorkflowClarifications clientId={SHOWCASE_ID} />

      {/* Client-initiated business updates — the outbound half of the journey. */}
      <SendBusinessUpdate clientId={SHOWCASE_ID} />

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
              placeholder="Direct replies coming soon."
              disabled
              className="h-9 text-xs"
              data-testid="input-client-thread-disabled"
            />
            <p className="text-[10px] text-muted-foreground">
              Direct replies are coming soon. Use the fields above to respond for now.
            </p>
          </div>
        </CardContent>
      </Card>
    </PortalLayout>
  );
}
