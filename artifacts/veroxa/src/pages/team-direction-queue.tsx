import { useEffect, useMemo, useState } from "react";
import {
  Compass,
  CheckCircle2,
  Megaphone,
  MapPin,
  ImageIcon,
  Ban,
  Clock,
  ListTodo,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { WRITES_ENABLED } from "@/lib/data/writeReadiness";
import { veroxaWriteAdapter } from "@/lib/data/writeAdapter";
import { isValidUuid } from "@/lib/data/devClientIdValidation";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import {
  demoClientDirection,
  directionChannelLabels,
  directionFocusLabels,
  directionStatusTeamLabels,
  directionUrgencyLabels,
  type DirectionRequest,
  type DirectionStatus,
} from "@/data/direction/demoClientDirection";
import { demoUploadSubmissions } from "@/data/uploadKeys/demoUploadSubmissions";
import { demoClientTeamWorkflow } from "@/data/workflows/clientTeamWorkflow";
import {
  buildAdaptiveRecommendations,
  rankRecommendations,
} from "@/lib/intelligence/adaptiveRules";
import { AdaptiveRecommendationCard } from "@/components/intelligence/AdaptiveRecommendationCard";
import {
  clearLocalDirectionRequests,
  getLocalDirectionRequests,
  isLocalDirectionRequest,
  subscribeToLocalDirectionRequests,
  updateLocalDirectionRequestStatus,
} from "@/lib/direction/localDirectionStore";
import { getLocalUploadSubmissions } from "@/lib/uploadKeys/localUploadStore";
import { clientTeamWorkRepository } from "@/lib/repositories";
import { getRestaurantName } from "@/data/demoData";
import type { FirstClientDirectionStatus } from "@/lib/firstClient/firstClientContracts";

type GroupKey =
  | "urgent_high"
  | "content"
  | "google"
  | "ads"
  | "avoid"
  | "completed";

interface GroupDef {
  key: GroupKey;
  title: string;
  description: string;
  icon: typeof ListTodo;
  filter: (d: DirectionRequest) => boolean;
}

const groups: GroupDef[] = [
  {
    key: "urgent_high",
    title: "Urgent / High priority",
    description: "Restaurant flagged this as urgent or high.",
    icon: AlertTriangle,
    filter: (d) =>
      (d.urgency === "urgent" || d.urgency === "high") && d.status !== "completed",
  },
  {
    key: "content",
    title: "Content direction",
    description: "Organic social / content focus requests.",
    icon: ImageIcon,
    filter: (d) =>
      (d.channel === "organic_social" || d.channel === "all") &&
      d.focus !== "avoid_item" &&
      d.focus !== "ads_goal" &&
      d.focus !== "google_visibility" &&
      d.status !== "completed",
  },
  {
    key: "google",
    title: "Google direction",
    description: "Google profile / posts / visibility.",
    icon: MapPin,
    filter: (d) =>
      (d.channel === "google" || d.focus === "google_visibility") && d.status !== "completed",
  },
  {
    key: "ads",
    title: "Ads direction",
    description: "Ads angle requests. No launches happen here.",
    icon: Megaphone,
    filter: (d) =>
      (d.channel === "ads" || d.focus === "ads_goal") && d.status !== "completed",
  },
  {
    key: "avoid",
    title: "Avoid / blocked items",
    description: "Things the restaurant asked us not to post.",
    icon: Ban,
    filter: (d) => d.focus === "avoid_item" && d.status !== "completed",
  },
  {
    key: "completed",
    title: "Completed / planned",
    description: "Closed out or planned for this week.",
    icon: CheckCircle2,
    filter: (d) => d.status === "completed" || d.status === "planned",
  },
];

const urgencyTone: Record<string, string> = {
  low: "bg-muted text-muted-foreground border-border",
  normal: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  high: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  urgent: "bg-rose-500/10 text-rose-400 border-rose-500/30",
};

const statusTone: Record<DirectionStatus, string> = {
  received: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  interpreted: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  in_team_review: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  planned: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  completed: "bg-muted text-muted-foreground border-border",
};

type DirectionWriteStatusKind =
  | "idle"
  | "local_updated"
  | "dev_write_attempting"
  | "dev_write_saved"
  | "dev_write_skipped"
  | "dev_write_failed";

interface DirectionWriteStatus {
  status: DirectionWriteStatusKind;
  message: string;
}

function suggestedAction(d: DirectionRequest): string {
  switch (d.focus) {
    case "lunch_traffic":
      return "Plan 2 lunch posts + 1 Google lunch post.";
    case "dinner_traffic":
      return "Queue dinner-feature post + Reel for weekend evenings.";
    case "catering":
      return "Open catering media request + draft 2 catering posts.";
    case "family_platters":
    case "weekend_push":
      return "Schedule Fri teaser + Sat/Sun feature posts.";
    case "new_item":
      return "Draft launch post + Google post + Reel.";
    case "dessert":
      return "Schedule dessert-focused post for weekend evening.";
    case "slow_day":
      return "Plan slow-day organic post + Google post + small offer.";
    case "google_visibility":
      return "Draft Google post + request storefront/interior photos.";
    case "event_or_holiday":
      return "Add event-themed content + Google event post.";
    case "ads_goal":
      return "Draft ads angle for owner/operator approval (no launch).";
    case "avoid_item":
      return "Tag item as avoid; pull from drafts and Google posts.";
    case "use_media_next":
      return "Move flagged upload to top of scheduling queue.";
    default:
      return "Clarify with the restaurant; draft a content angle.";
  }
}

export default function TeamDirectionQueue() {
  const [fixtureItems, setFixtureItems] = useState<DirectionRequest[]>(
    () => [...demoClientDirection],
  );
  const [localItems, setLocalItems] = useState<DirectionRequest[]>(
    () => getLocalDirectionRequests(),
  );
  const [writeStatuses, setWriteStatuses] = useState<Record<string, DirectionWriteStatus>>({});

  useEffect(() => {
    const refresh = () => setLocalItems(getLocalDirectionRequests());
    refresh();
    return subscribeToLocalDirectionRequests(refresh);
  }, []);

  const items = useMemo(
    () => [...localItems, ...fixtureItems],
    [localItems, fixtureItems],
  );

  function setWriteStatus(id: string, s: DirectionWriteStatus) {
    setWriteStatuses((prev) => ({ ...prev, [id]: s }));
  }

  async function updateStatus(id: string, status: DirectionStatus) {
    // Step 1 — update local/session state first (always)
    if (isLocalDirectionRequest(id)) {
      updateLocalDirectionRequestStatus(id, status);
      setLocalItems(getLocalDirectionRequests());
    } else {
      setFixtureItems((curr) =>
        curr.map((d) => (d.id === id ? { ...d, status } : d)),
      );
    }

    // Step 2 — if writes are disabled, stop here
    if (!WRITES_ENABLED) {
      setWriteStatus(id, {
        status: "local_updated",
        message: "Status updated locally. Dev database saving is disabled.",
      });
      return;
    }

    // Step 3 — check whether this direction id is a real UUID
    if (!isValidUuid(id)) {
      setWriteStatus(id, {
        status: "dev_write_skipped",
        message:
          "Status updated locally. Dev database update skipped because this item does not have a dev database id.",
      });
      return;
    }

    // Step 4 — attempt dev write
    setWriteStatus(id, {
      status: "dev_write_attempting",
      message: "Status updated locally. Saving to dev database\u2026",
    });

    try {
      const result = await veroxaWriteAdapter.updateDirectionStatus({
        directionId: id,
        nextStatus: status as FirstClientDirectionStatus,
        internalNote: "Team direction queue status update.",
      });
      if (result.ok) {
        setWriteStatus(id, {
          status: "dev_write_saved",
          message: "Status updated locally and to dev database.",
        });
      } else {
        setWriteStatus(id, {
          status: "dev_write_failed",
          message: "Status updated locally. Dev database update did not complete.",
        });
      }
    } catch {
      setWriteStatus(id, {
        status: "dev_write_failed",
        message: "Status updated locally. Dev database update did not complete.",
      });
    }
  }

  function handleClearSessionDirection() {
    clearLocalDirectionRequests();
    setLocalItems([]);
  }

  // Adaptive recommendations for demo-a (the active first client).
  const recommendations = useMemo(
    () =>
      rankRecommendations(
        buildAdaptiveRecommendations({
          clientId: "demo-a",
          direction: items.filter((d) => d.clientId === "demo-a"),
          uploads: [
            ...getLocalUploadSubmissions().filter(
              (u) => u.restaurantId === "demo-a",
            ),
            ...demoUploadSubmissions.filter((u) => u.restaurantId === "demo-a"),
          ],
          workflow: demoClientTeamWorkflow.filter((w) => w.clientId === "demo-a"),
        }),
      ),
    [items],
  );

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <div className="mb-4">
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2"
          data-testid="header-direction-queue"
        >
          <Compass className="w-6 h-6 text-primary" /> Direction Queue
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base max-w-3xl">
          Restaurant priorities submitted through the Client Direction Center. Review,
          interpret, and convert into content, Google, or ads actions.
        </p>
      </div>

      <DemoOnlyBanner
        message="Demo/dev only — team status updates save locally first. Dev database saving only runs when explicitly enabled. No publishing or ads launch from this page."
        testId="banner-direction-queue"
      />

      <div className="flex flex-wrap items-center justify-between gap-2 mt-2 mb-4 px-1 text-xs text-muted-foreground">
        <span>
          Direction submitted from the Client Direction Center appears here for
          this browser session only ({localItems.length} session item
          {localItems.length === 1 ? "" : "s"}).
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={handleClearSessionDirection}
          disabled={localItems.length === 0}
          data-testid="btn-clear-session-direction"
        >
          <Trash2 className="w-3 h-3 mr-1" /> Clear session direction
        </Button>
      </div>

      {/* Cross-link to client/team submissions awaiting clarification. */}
      {(() => {
        const clarification = clientTeamWorkRepository.getTeamNeedsClientClarification();
        if (clarification.length === 0) return null;
        return (
          <Card
            className="bg-sky-500/5 border-sky-500/30 mb-4"
            data-testid="card-direction-needs-clarification"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Client submissions awaiting clarification ({clarification.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {clarification.slice(0, 4).map((s) => {
                const latestEvent = clientTeamWorkRepository
                  .getTeamSubmissionStatusEvents(s.id)
                  .slice(-1)[0];
                return (
                  <div
                    key={s.id}
                    className="rounded-md border border-border bg-muted/20 px-3 py-2"
                    data-testid={`dir-clarification-${s.id}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-medium text-foreground/90">
                        {getRestaurantName(s.clientId)} — {s.title}
                      </span>
                      {s.requestedClientAction && (
                        <Badge variant="outline" className="text-[9px] border-sky-500/30 text-sky-300 flex-shrink-0">
                          Awaiting reply
                        </Badge>
                      )}
                    </div>
                    {latestEvent && (
                      <p className="text-[11px] text-muted-foreground/85" data-testid={`dir-clarification-latest-${s.id}`}>
                        Latest status update: {latestEvent.note}
                        {!latestEvent.clientVisible && (
                          <span className="ml-1 text-muted-foreground/60">(internal only)</span>
                        )}
                      </p>
                    )}
                  </div>
                );
              })}
              <p className="text-[10px] text-muted-foreground/70 pt-1">
                Internal — surfaced from client/team workflow. Resolve in Work Queue / Requests.
              </p>
            </CardContent>
          </Card>
        );
      })()}

      {/* Adaptive top-of-queue snapshot */}
      {recommendations.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Adaptive priorities — top 2
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommendations.slice(0, 2).map((r) => (
              <AdaptiveRecommendationCard key={r.id} recommendation={r} audience="team" />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {groups.map((g) => {
          const groupItems = items.filter(g.filter);
          const Icon = g.icon;
          return (
            <Card key={g.key} className="bg-card border-border" data-testid={`direction-group-${g.key}`}>
              <CardHeader className="pb-3">
                <div className="flex items-baseline justify-between gap-2">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    {g.title}
                  </CardTitle>
                  <span className="text-[11px] text-muted-foreground/70 tabular-nums">
                    {groupItems.length}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground/70 mt-1">{g.description}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Nothing here right now.</p>
                ) : (
                  groupItems.map((d) => {
                    const ws = writeStatuses[d.id];
                    return (
                      <div
                        key={d.id}
                        className="p-3 rounded-md border border-border bg-muted/20"
                        data-testid={`direction-card-${d.id}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-semibold leading-tight">{d.title}</p>
                          <Badge variant="outline" className={`text-[10px] ${urgencyTone[d.urgency]}`}>
                            {directionUrgencyLabels[d.urgency]}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mb-1">
                          {d.restaurantName} · {directionFocusLabels[d.focus]} ·{" "}
                          {directionChannelLabels[d.channel]} · {d.preferredTimingLabel}
                        </p>
                        {d.clientNote && d.clientNote !== "—" && (
                          <p className="text-sm text-foreground/90 mb-2">"{d.clientNote}"</p>
                        )}
                        <p className="text-[11px] text-muted-foreground italic mb-2">
                          Suggested: {suggestedAction(d)}
                        </p>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <Badge variant="outline" className={`text-[10px] ${statusTone[d.status]}`}>
                            {directionStatusTeamLabels[d.status]}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {d.submittedAtLabel}
                          </span>
                        </div>

                        {/* Per-item dev write status message */}
                        {ws && ws.status !== "idle" && (
                          <p
                            className={`text-[10px] mb-1.5 ${
                              ws.status === "dev_write_saved"
                                ? "text-emerald-400/80"
                                : "text-muted-foreground/70"
                            }`}
                            data-testid={`direction-write-status-${d.id}`}
                          >
                            {ws.message}
                          </p>
                        )}

                        <Separator className="my-2" />
                        <div className="flex flex-wrap gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px]"
                            onClick={() => updateStatus(d.id, "interpreted")}
                            data-testid={`btn-dir-interpret-${d.id}`}
                          >
                            Mark Interpreted
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px]"
                            onClick={() => updateStatus(d.id, "planned")}
                            data-testid={`btn-dir-content-${d.id}`}
                          >
                            Send to Content Plan
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px]"
                            onClick={() => updateStatus(d.id, "planned")}
                            data-testid={`btn-dir-google-${d.id}`}
                          >
                            Send to Google Action
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px]"
                            onClick={() => updateStatus(d.id, "planned")}
                            data-testid={`btn-dir-ads-${d.id}`}
                          >
                            Send to Ads Planning
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px]"
                            onClick={() => updateStatus(d.id, "completed")}
                            data-testid={`btn-dir-complete-${d.id}`}
                          >
                            Mark Completed
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PortalLayout>
  );
}
