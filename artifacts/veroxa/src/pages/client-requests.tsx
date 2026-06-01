import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
  Send,
} from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientPortalData } from "@/hooks/useClientPortalData";
import { ClientRequestsClarity } from "@/components/ClientExecutionReinforcement";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { RealPortalReviewNotice } from "@/components/RealPortalSafeStates";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { ClientOperationalCard } from "@/components/client/ClientOperationalSpine";
import {
  getCurrentClientAccount,
  getClientMediaStatus,
  getClientRiskStatus,
  getClientContentWorkflow,
} from "@/lib/operations";
import { demoClientTeamWorkflow } from "@/data/workflows/clientTeamWorkflow";
import {
  getClientActionNeededItems,
  getClientRequestHelpText,
} from "@/lib/workflows/workflowStatus";
import { createWorkflowItem } from "@/lib/workflow/workflowRepository";
import { useActiveClientPortalContext } from "@/lib/clientPortalContext";

const SHOWCASE_ID = "demo-a";

const priorityLabel = {
  urgent: "Needed soon",
  high: "Helpful this week",
  normal: "When you can",
  low: "Low pressure",
} as const;

const priorityTone = {
  urgent: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  high: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  normal: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  low: "border-border bg-muted/20 text-muted-foreground",
} as const;

function getSimpleRequestStatus(stage: string) {
  if (stage === "done") return "Handled";
  if (stage === "needs_client_action") return "Waiting for you";
  if (stage === "in_progress") return "In Review";
  return "Received";
}

export default function ClientRequests() {
  const { source, dataSourceMessage } = useClientPortalData();
  const portalDataMode = useRealPortalDataMode();
  const canUseFixtureData =
    portalDataMode.allowDemoFixtures || portalDataMode.isLiveDataConnected;
  const reviewAccount = getCurrentClientAccount();
  const reviewMedia = getClientMediaStatus(reviewAccount.id);
  const reviewRisk = getClientRiskStatus(reviewAccount.id);
  const reviewContent = getClientContentWorkflow(reviewAccount.id);
  const actionItems = canUseFixtureData
    ? getClientActionNeededItems(demoClientTeamWorkflow, SHOWCASE_ID)
    : [];
  const { activeClientId } = useActiveClientPortalContext();
  const [noteText, setNoteText] = useState("");
  const [requestType, setRequestType] = useState("general note");
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const requestOptions = useMemo(
    () => [
      "special push",
      "use specific media",
      "save something for later",
      "event/special announcement",
      "avoid an item",
      "general note",
    ],
    [],
  );

  const handleSendNote = () => {
    const trimmed = noteText.trim();
    if (!trimmed) return;
    if (!canUseFixtureData) {
      setNoteText("");
      setSentMessage(
        "Your note is captured in this review shell. Live account requests will be connected before launch.",
      );
      return;
    }

    createWorkflowItem({
      clientId: activeClientId,
      type: "client_request",
      title: `${requestType}: ${trimmed.length > 45 ? `${trimmed.slice(0, 45)}…` : trimmed}`,
      clientNote: trimmed,
      submittedBy: "client",
    });
    setNoteText("");
    setRequestType("general note");
    setSentMessage(
      "Your note has been sent to the Veroxa team. We'll follow up here if we need more detail.",
    );
  };

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <RealPortalReviewNotice className="mb-4" />
      {!canUseFixtureData && (
        <ClientOperationalCard title="Next helpful request">
          <p>{reviewRisk.clientVisibleMessage}</p>
          <p>
            {reviewMedia.needsMoreMedia
              ? reviewMedia.nextMediaRequest
              : reviewContent.clientVisibleMessage}
          </p>
          <p>Nothing goes live without Veroxa team review.</p>
        </ClientOperationalCard>
      )}

      <div className="mb-4">
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight"
          data-testid="header-client-requests"
        >
          Requests
        </h2>
        <DataSourceBadge source={source} message={dataSourceMessage} />
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Tell Veroxa what you want, or answer simple follow-ups when Veroxa
          needs a detail.
        </p>
      </div>

      {canUseFixtureData && (
        <div className="mb-4">
          <ClientRequestsClarity clientId={SHOWCASE_ID} />
        </div>
      )}

      <Card
        className="bg-card border-border mb-4"
        data-testid="card-client-action-needed"
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-primary" />
            What Veroxa needs from you ({actionItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {actionItems.length === 0 ? (
            <div className="flex items-start gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">
                  Nothing needed from you right now
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Veroxa is handling the current work. We&apos;ll ask here if we
                  need a quick detail.
                </p>
              </div>
            </div>
          ) : (
            actionItems.map((item) => (
              <div
                key={item.id}
                className="rounded-md border border-border bg-muted/20 px-3 py-3"
                data-testid={`client-request-${item.id}`}
              >
                <div className="flex items-start justify-between gap-2 flex-wrap mb-1.5">
                  <p className="text-sm font-medium leading-snug">
                    {item.title}
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${priorityTone[item.priority]}`}
                  >
                    {priorityLabel[item.priority]}
                  </Badge>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  {getClientRequestHelpText(item)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Status: {getSimpleRequestStatus(item.stage)} · {item.dueLabel}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card
        className="bg-primary/5 border-primary/20"
        data-testid="card-client-request-note"
      >
        <CardContent className="p-4 flex items-start gap-3">
          <ArrowRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold">How this works</p>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              Send the requested detail or photo when convenient. Veroxa reviews
              everything before anything is shown publicly.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Send a request — client-initiated communication, local state only. */}
      <Card className="bg-card border-border" data-testid="card-send-note">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Send a request to Veroxa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Use this for a special push, media direction, an event, an item to
            avoid, or a general note. Veroxa will review it before anything
            public changes.
          </p>

          {sentMessage ? (
            <>
              <div
                className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-300"
                data-testid="send-note-confirmation"
                role="status"
              >
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{sentMessage}</span>
              </div>
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => setSentMessage(null)}
                data-testid="btn-send-another"
              >
                Send another request
              </button>
            </>
          ) : (
            <>
              <div className="grid gap-2 md:grid-cols-[220px_minmax(0,1fr)]">
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  className="bg-muted/40 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  data-testid="select-request-type"
                >
                  {requestOptions.map((option) => (
                    <option key={option} value={option}>
                      {option[0].toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="e.g. Use the burger photo this weekend, or please avoid posting the dining room photo."
                  rows={3}
                  className="w-full bg-muted/40 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  data-testid="input-send-note"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSendNote}
                  disabled={!noteText.trim()}
                  data-testid="btn-send-note"
                >
                  <Send className="w-3.5 h-3.5 mr-2" /> Send to Veroxa
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </PortalLayout>
  );
}
