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
import {
  normalizeClientMediaDisplayStatus,
  type ClientMediaDisplayStatus,
} from "@/lib/clientMediaLifecycle";

type LaneKey = "Reviewed" | "Ready" | "Scheduled" | "Posted";

const laneTone: Record<LaneKey, string> = {
  Reviewed: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  Ready: "border-primary/30 bg-primary/10 text-primary",
  Scheduled: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  Posted: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

function toProgressLane(input: string): LaneKey | null {
  const status = normalizeClientMediaDisplayStatus(input);
  if (status === "Posted" || status === "Already used") return "Posted";
  if (status === "Scheduled") return "Scheduled";
  if (status === "Ready") return "Ready";
  if (status === "Reviewed") return "Reviewed";
  return null;
}

type MediaProgressItem = {
  id: string;
  title: string;
  note: string;
  status: ClientMediaDisplayStatus;
  lane: LaneKey | null;
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
    .map((item) => ({
      id: item.id,
      title: item.title,
      note: item.clientVisibleNote,
      status: normalizeClientMediaDisplayStatus(item.status),
      lane: toProgressLane(item.status),
    }));

  const lanes: LaneKey[] = ["Reviewed", "Ready", "Scheduled", "Posted"];
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
          A simple progress lane for reviewed, ready, scheduled, and posted
          media. Reports stay in the Reports tab.
        </p>
      </div>

      <Card
        className="border-primary/20 bg-card"
        data-testid="card-media-progress"
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
            <span className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" /> Media progress
            </span>
            <Link
              href="/client/media"
              className="text-xs font-normal text-primary hover:underline"
            >
              Open Media
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {lanes.map((lane) => {
            const items = mediaUpdates
              .filter((item) => item.lane === lane)
              .slice(0, 3);
            return <ProgressLane key={lane} lane={lane} items={items} />;
          })}
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
  lane,
  items,
}: {
  lane: LaneKey;
  items: Array<{
    id: string;
    title: string;
    note: string;
    status: ClientMediaDisplayStatus;
  }>;
}) {
  return (
    <div
      className="rounded-lg border border-border bg-muted/10 p-3"
      data-testid={`progress-lane-${lane.toLowerCase()}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{lane}</p>
        <Badge variant="outline" className={`text-[10px] ${laneTone[lane]}`}>
          {items.length}
        </Badge>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No media in this step yet.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-md border border-border/70 bg-card/60 p-2"
              data-testid={`update-row-${item.id}`}
            >
              <p className="line-clamp-1 text-sm font-medium">{item.title}</p>
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
