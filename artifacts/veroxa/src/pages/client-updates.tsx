import { CheckCircle2, ImageIcon, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { RealPortalReviewNotice } from "@/components/RealPortalSafeStates";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { useActiveClientPortalContext } from "@/lib/clientPortalContext";
import { clientTeamWorkRepository } from "@/lib/repositories";
import { normalizeClientMediaDisplayStatus } from "@/lib/clientMediaLifecycle";

type SimpleStatus =
  | "Reviewed"
  | "Ready"
  | "Scheduled"
  | "Posted"
  | "Waiting for you";

const statusTone: Record<SimpleStatus, string> = {
  Reviewed: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  Ready: "border-primary/30 bg-primary/10 text-primary",
  Scheduled: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  Posted: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  "Waiting for you": "border-amber-500/30 bg-amber-500/10 text-amber-300",
};

function toSimpleStatus(input: string): SimpleStatus {
  const status = normalizeClientMediaDisplayStatus(input);
  if (status === "Posted" || status === "Already used") return "Posted";
  if (status === "Scheduled") return "Scheduled";
  if (status === "Ready") return "Ready";
  if (status === "Needs better media" || status === "Waiting for direction") {
    return "Waiting for you";
  }
  return "Reviewed";
}

type MediaProgressItem = {
  id: string;
  title: string;
  note: string;
  status: SimpleStatus;
};

export default function ClientUpdates() {
  const mode = useRealPortalDataMode();
  const { activeClientId } = useActiveClientPortalContext();
  const canUseFixtureData =
    Boolean(activeClientId) &&
    (mode.allowDemoFixtures || mode.isLiveDataConnected);
  const submissions = canUseFixtureData
    ? clientTeamWorkRepository.getClientVisibleSubmissions(activeClientId!)
    : [];

  const mediaUpdates: MediaProgressItem[] = submissions
    .filter((item) => item.submissionType === "media")
    .slice(0, 8)
    .map((item) => ({
      id: item.id,
      title: item.title,
      note: item.clientVisibleNote,
      status: toSimpleStatus(item.status),
    }));

  const grouped = {
    Reviewed: mediaUpdates.filter((item) => item.status === "Reviewed"),
    Ready: mediaUpdates.filter((item) => item.status === "Ready"),
    Scheduled: mediaUpdates.filter((item) => item.status === "Scheduled"),
    Posted: mediaUpdates.filter((item) => item.status === "Posted"),
  };

  const waitingItems = canUseFixtureData
    ? clientTeamWorkRepository
        .getClientActionRequiredItems(activeClientId!)
        .slice(0, 3)
    : [];

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <RealPortalReviewNotice />

      <div>
        <h2
          className="text-3xl font-bold tracking-tight"
          data-testid="header-updates"
        >
          Updates
        </h2>
        <p className="mt-1 max-w-2xl text-sm md:text-base text-muted-foreground">
          A simple progress lane for media reviewed, ready, scheduled, posted,
          and anything Veroxa needs from you.
        </p>
      </div>

      <Card
        className="border-primary/20 bg-card"
        data-testid="card-media-progress"
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-4 w-4 text-primary" /> Media progress lane
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ProgressLane
            title="Reviewed"
            items={grouped.Reviewed}
            empty="Reviewed items will appear here."
          />
          <ProgressLane
            title="Ready"
            items={grouped.Ready}
            empty="Ready media will appear here."
          />
          <ProgressLane
            title="Scheduled"
            items={grouped.Scheduled}
            empty="Scheduled items will appear here."
          />
          <ProgressLane
            title="Posted"
            items={grouped.Posted}
            empty="Posted media will appear here."
          />
        </CardContent>
      </Card>

      <Card className="border-border bg-card" data-testid="card-needs-client">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-primary" /> What Veroxa needs
            from you
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {waitingItems.length === 0 ? (
            <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium">
                    Nothing needed right now
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Veroxa will ask here if a quick answer would help.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            waitingItems.map((item) => (
              <div
                key={item.id}
                className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-3"
              >
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.clientVisibleNote}
                </p>
                <Link href="/client/requests">
                  <span className="mt-2 inline-flex text-xs text-primary hover:underline">
                    Reply in Requests
                  </span>
                </Link>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </PortalLayout>
  );
}

function ProgressLane({
  title,
  items,
  empty,
}: {
  title: SimpleStatus;
  items: MediaProgressItem[];
  empty: string;
}) {
  return (
    <div
      className="rounded-md border border-border bg-muted/10 p-3"
      data-testid={`lane-${title.toLowerCase()}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{title}</p>
        <Badge variant="outline" className={`text-[10px] ${statusTone[title]}`}>
          {items.length}
        </Badge>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{empty}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-md border border-border bg-card/70 px-3 py-2"
              data-testid={`update-row-${item.id}`}
            >
              <p className="truncate text-sm font-medium">{item.title}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {item.note}
              </p>
              <Link href={`/client/media?media=${item.id}`}>
                <span className="mt-1 inline-flex text-[11px] text-primary/80 hover:underline">
                  Open Media details
                </span>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
