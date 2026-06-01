import { useState } from "react";
import { CheckCircle2, MessageSquare, Send } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { RealPortalReviewNotice } from "@/components/RealPortalSafeStates";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { clientTeamWorkRepository } from "@/lib/repositories";
import {
  createWorkflowItem,
  getClientWorkflowItems,
} from "@/lib/workflow/workflowRepository";
import { useActiveClientPortalContext } from "@/lib/clientPortalContext";
import {
  CLIENT_REQUEST_TYPES,
  getClientRequestStatus,
  type ClientRequestStatus,
  type ClientRequestType,
} from "@/lib/clientRequestStatus";

const statusTone: Record<ClientRequestStatus, string> = {
  Received: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  "In Review": "border-primary/30 bg-primary/10 text-primary",
  Handled: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  "Waiting for you": "border-amber-500/30 bg-amber-500/10 text-amber-300",
};

export default function ClientRequests() {
  const mode = useRealPortalDataMode();
  const { activeClientId } = useActiveClientPortalContext();
  const canUseFixtureData =
    Boolean(activeClientId) &&
    (mode.allowDemoFixtures || mode.isLiveDataConnected);
  const [noteText, setNoteText] = useState("");
  const [requestType, setRequestType] =
    useState<ClientRequestType>("General note");
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [localRequests, setLocalRequests] = useState<
    Array<{
      id: string;
      title: string;
      note: string;
      status: ClientRequestStatus;
    }>
  >([]);

  const sampleRequests = canUseFixtureData
    ? clientTeamWorkRepository
        .getClientVisibleSubmissions(activeClientId!)
        .filter((item) => item.submissionType !== "media")
        .slice(0, 4)
        .map((item) => ({
          id: item.id,
          title: item.title,
          note: item.clientVisibleNote,
          status: getClientRequestStatus(item.status),
        }))
    : [];

  const workflowRequests =
    canUseFixtureData && activeClientId
      ? getClientWorkflowItems(activeClientId)
          .filter((item) => item.type === "client_request")
          .map((item) => ({
            id: item.workflowItemId,
            title: item.title,
            note: item.clientNote || "Veroxa received your request.",
            status: toClientRequestStatus(item.clientVisibleStatus),
          }))
      : [];
  const actionItems = canUseFixtureData
    ? clientTeamWorkRepository.getClientActionRequiredItems(activeClientId!)
    : [];
  const requests = [
    ...localRequests,
    ...workflowRequests,
    ...sampleRequests,
  ].filter(
    (item, index, all) =>
      all.findIndex((candidate) => candidate.id === item.id) === index,
  );

  const handleSendNote = () => {
    const trimmed = noteText.trim();
    if (!trimmed) return;
    const title = buildClientRequestTitle(requestType, trimmed);
    if (canUseFixtureData && activeClientId) {
      createWorkflowItem({
        clientId: activeClientId,
        type: "client_request",
        title,
        clientNote: `${requestType}: ${trimmed}`,
        submittedBy: "client",
      });
    }
    setLocalRequests((prev) => [
      { id: `local-${Date.now()}`, title, note: trimmed, status: "Received" },
      ...prev,
    ]);
    setNoteText("");
    setRequestType("General note");
    setSentMessage(
      "Received. Veroxa will review your note and follow up here if needed.",
    );
  };

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <RealPortalReviewNotice />

      <div>
        <h2
          className="text-3xl font-bold tracking-tight"
          data-testid="header-client-requests"
        >
          Requests
        </h2>
        <p className="mt-1 max-w-2xl text-sm md:text-base text-muted-foreground">
          Tell Veroxa what you want: use media, save something for later, push a
          special, avoid an item, or leave a general note.
        </p>
      </div>

      <Card
        className="border-primary/30 bg-card"
        data-testid="card-send-request"
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-primary" /> Send a request
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-[220px_minmax(0,1fr)]">
            <select
              value={requestType}
              onChange={(event) =>
                setRequestType(event.target.value as ClientRequestType)
              }
              className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              data-testid="select-request-type"
            >
              {CLIENT_REQUEST_TYPES.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <textarea
              value={noteText}
              onChange={(event) => setNoteText(event.target.value)}
              placeholder="Write a short note for Veroxa."
              rows={3}
              className="w-full resize-none rounded-md border border-border bg-muted/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              data-testid="textarea-request-note"
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleSendNote}
              disabled={!noteText.trim()}
              data-testid="button-send-request"
            >
              <Send className="mr-2 h-4 w-4" /> Send request
            </Button>
          </div>
          {sentMessage && (
            <p
              className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-200"
              role="status"
            >
              {sentMessage}
            </p>
          )}
        </CardContent>
      </Card>

      <Card
        className="border-border bg-card"
        data-testid="card-request-statuses"
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Request status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {actionItems.length === 0 && requests.length === 0 ? (
            <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium">No open requests</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Send Veroxa a note whenever you want to guide the work.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {actionItems.map((item) => (
                <RequestRow
                  key={item.id}
                  title={item.title}
                  note={item.clientVisibleNote}
                  status="Waiting for you"
                />
              ))}
              {requests.map((item) => (
                <RequestRow
                  key={item.id}
                  title={item.title}
                  note={item.note}
                  status={item.status}
                />
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </PortalLayout>
  );
}

function RequestRow({
  title,
  note,
  status,
}: {
  title: string;
  note: string;
  status: ClientRequestStatus;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/20 px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>
        </div>
        <Badge
          variant="outline"
          className={`text-[10px] ${statusTone[status]}`}
        >
          {status}
        </Badge>
      </div>
    </div>
  );
}
