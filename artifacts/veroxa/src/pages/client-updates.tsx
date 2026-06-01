import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ImageIcon,
  MessageSquare,
} from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientPortalData } from "@/hooks/useClientPortalData";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { RealPortalReviewNotice } from "@/components/RealPortalSafeStates";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { ClientOperationalCard } from "@/components/client/ClientOperationalSpine";
import {
  getCurrentClientAccount,
  getClientContentWorkflow,
  getClientRiskStatus,
} from "@/lib/operations";
import { clientTeamWorkRepository } from "@/lib/repositories";
import {
  CLIENT_MEDIA_LIFECYCLE_STAGES,
  normalizeClientMediaDisplayStatus,
  type ClientMediaDisplayStatus,
} from "@/lib/clientMediaLifecycle";

const SHOWCASE_ID = "demo-a";

const statusTone: Record<
  | ClientMediaDisplayStatus
  | "Received"
  | "In Review"
  | "Handled"
  | "Waiting for you",
  string
> = {
  Uploaded: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  Reviewed: "border-primary/30 bg-primary/10 text-primary",
  Ready: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  Scheduled: "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300",
  Posted: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  "Needs better media": "border-amber-500/30 bg-amber-500/10 text-amber-300",
  "Saved for later": "border-border bg-muted/20 text-muted-foreground",
  "Waiting for direction": "border-amber-500/30 bg-amber-500/10 text-amber-300",
  "Not usable": "border-border bg-muted/20 text-muted-foreground",
  "Already used": "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  Received: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  "In Review": "border-primary/30 bg-primary/10 text-primary",
  Handled: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  "Waiting for you": "border-amber-500/30 bg-amber-500/10 text-amber-300",
};

function getSimpleRequestStatus(
  status: string,
): "Received" | "In Review" | "Handled" | "Waiting for you" {
  if (status === "completed" || status === "archived") return "Handled";
  if (status === "blocked" || status === "needs_client_clarification")
    return "Waiting for you";
  if (status === "new" || status === "needs_review") return "Received";
  return "In Review";
}

export default function ClientUpdates() {
  const { source, dataSourceMessage } = useClientPortalData();
  const portalDataMode = useRealPortalDataMode();
  const canUseFixtureData =
    portalDataMode.allowDemoFixtures || portalDataMode.isLiveDataConnected;
  const reviewAccount = getCurrentClientAccount();
  const reviewRisk = getClientRiskStatus(reviewAccount.id);
  const reviewContent = getClientContentWorkflow(reviewAccount.id);

  const mediaUpdates = canUseFixtureData
    ? clientTeamWorkRepository
        .getClientVisibleSubmissions(SHOWCASE_ID)
        .filter((item) => item.submissionType === "media")
        .slice(0, 5)
        .map((item) => ({
          id: item.id,
          title: item.title,
          note: item.clientVisibleNote,
          status: normalizeClientMediaDisplayStatus(
            item.status === "blocked" ? "Needs better media" : item.status,
          ),
        }))
    : [];
  const requestUpdates = canUseFixtureData
    ? clientTeamWorkRepository
        .getClientVisibleSubmissions(SHOWCASE_ID)
        .filter((item) => item.submissionType !== "media")
        .slice(0, 4)
        .map((item) => ({
          id: item.id,
          title: item.title,
          note: item.clientVisibleNote,
          status: getSimpleRequestStatus(item.status),
        }))
    : [];

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <RealPortalReviewNotice className="mb-4" />
      {!canUseFixtureData && (
        <ClientOperationalCard title="Account updates in review">
          <p>{reviewContent.clientVisibleMessage}</p>
          <p>{reviewRisk.clientVisibleMessage}</p>
          <p>
            Prepared updates will appear here once live account activity is
            connected.
          </p>
        </ClientOperationalCard>
      )}

      <div className="mb-4">
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight"
          data-testid="header-updates"
        >
          Updates
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Simple progress on your media, account work, and anything Veroxa needs
          from you.
        </p>
        <DataSourceBadge source={source} message={dataSourceMessage} />
      </div>

      <Card
        className="bg-card border-primary/20 mb-5"
        data-testid="card-media-progress-lane"
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary" /> Media progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {CLIENT_MEDIA_LIFECYCLE_STAGES.map((stage, index) => (
              <div key={stage} className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-border bg-muted/20 text-foreground/80"
                >
                  {stage}
                </Badge>
                {index < CLIENT_MEDIA_LIFECYCLE_STAGES.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
                )}
              </div>
            ))}
          </div>
          {mediaUpdates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Media updates will appear after uploads are reviewed.
            </p>
          ) : (
            <div className="space-y-2">
              {mediaUpdates.map((item) => (
                <div
                  key={item.id}
                  className="rounded-md border border-border bg-muted/20 px-3 py-3"
                  data-testid={`media-update-${item.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.note}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${statusTone[item.status]}`}
                    >
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card
          className="bg-card border-border"
          data-testid="card-account-progress"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Recent
              account progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {requestUpdates.map((item) => (
              <div
                key={item.id}
                className="rounded-md border border-border bg-muted/20 px-3 py-3"
                data-testid={`request-update-${item.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.note}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${statusTone[item.status]}`}
                  >
                    {item.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-border" data-testid="card-needs-client">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" /> Anything needed
              from you
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {requestUpdates.filter((item) => item.status === "Waiting for you")
              .length === 0 ? (
              <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-3">
                <p className="text-sm font-medium">Nothing needed right now</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Veroxa will ask here if a quick answer would help.
                </p>
              </div>
            ) : (
              requestUpdates
                .filter((item) => item.status === "Waiting for you")
                .map((item) => (
                  <div
                    key={item.id}
                    className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-3"
                  >
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.note}
                    </p>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>

      <p className="mt-6 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1">
        <Clock className="w-3 h-3" /> Updates stay simple. Reports stay in
        Reports.
      </p>
    </PortalLayout>
  );
}
