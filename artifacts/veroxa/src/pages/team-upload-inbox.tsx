import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Inbox,
  Image as ImageIcon,
  Video as VideoIcon,
  Check,
  AlertCircle,
  Clock,
  Bookmark,
  ExternalLink,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import {
  RealPortalReviewNotice,
  SafePortalEmptyCard,
} from "@/components/RealPortalSafeStates";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TeamReviewCard } from "@/components/TeamReviewCard";
import { PageHeader } from "@/components/common";
import type { StatusBadgeTone } from "@/components/common";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { TeamReviewModeRouteSummary } from "@/components/team/TeamOperationalSpine";
import { demoUploadCategoryLabels } from "@/data/uploadKeys/demoRestaurantUploadKeys";
import {
  demoUploadStatusLabels,
  demoUploadSubmissions,
  type DemoUploadStatus,
  type DemoUploadSubmission,
} from "@/data/uploadKeys/demoUploadSubmissions";
import {
  clearLocalUploadSubmissions,
  getLocalUploadSubmissions,
  isLocalUploadSubmission,
  subscribeToLocalUploadSubmissions,
  updateLocalUploadSubmissionStatus,
} from "@/lib/uploadKeys/localUploadStore";
import { clientTeamWorkRepository } from "@/lib/repositories";
import { getRestaurantName } from "@/data/demoData";
import { isSupabaseReadonlyMode } from "@/lib/data/dataMode";
import { readUploadSubmissionsInbox } from "@/lib/data/uploadSubmissionsReadOnly";
import {
  previewMediaReview,
  mediaReviewOutput,
} from "@/lib/ai/aiAgentPreviewEngine";
import {
  AI_AGENT_STATUS_LABELS,
  AI_MEDIA_USAGE_LABELS,
  TEAM_AI_DISCLOSURE,
} from "@/lib/ai/aiAgentTypes";
import { ContentDraftPipelineCard } from "@/components/ContentDraftPipelineCard";
import { ContentIntelligenceInboxList } from "@/components/ContentIntelligencePanel";
import { buildTeamMediaSummary, mediaIntelligenceSeedData } from "@/domain/mediaIntelligence";

const statusTone: Record<DemoUploadStatus, StatusBadgeTone> = {
  received: "info",
  in_review: "warning",
  accepted: "success",
  needs_better_photo: "danger",
  saved_for_later: "accent",
};

/** A calm, plain-language "what happens next" line per triage status. */
const nextActionByStatus: Record<DemoUploadStatus, string> = {
  received: "Review and decide how to use this.",
  in_review: "Finish review and accept or request a better photo.",
  accepted: "Move into content prep in the work queue.",
  needs_better_photo: "Ask the restaurant for a better shot.",
  saved_for_later: "Revisit when planning upcoming content.",
};

/**
 * /team/upload-inbox — Team Upload Inbox.
 *
 * Focused triage surface: new restaurant uploads, the client's note, a
 * suggested next action, and quick triage buttons. Heavier internal preview
 * tools live in a collapsed section at the bottom so they never dominate the
 * daily review flow. Reads real uploads read-only when enabled and always
 * falls back to sample data so the inbox is never empty.
 */
export default function TeamUploadInbox() {
  const portalDataMode = useRealPortalDataMode();
  const canUseFixtureData =
    portalDataMode.allowDemoFixtures || portalDataMode.isLiveDataConnected;

  const [fixtureItems, setFixtureItems] = useState<DemoUploadSubmission[]>(
    () => [...demoUploadSubmissions],
  );
  const [localItems, setLocalItems] = useState<DemoUploadSubmission[]>(() =>
    getLocalUploadSubmissions(),
  );
  const [liveItems, setLiveItems] = useState<DemoUploadSubmission[]>([]);
  const [liveIds, setLiveIds] = useState<Set<string>>(() => new Set());
  const [showInternalTools, setShowInternalTools] = useState(false);

  useEffect(() => {
    const unsub = subscribeToLocalUploadSubmissions((next) =>
      setLocalItems(next),
    );
    setLocalItems(getLocalUploadSubmissions());
    return unsub;
  }, []);

  // Opportunistic, fail-safe read of real upload rows. Any failure, missing
  // config, or empty result silently keeps the inbox on sample data.
  useEffect(() => {
    if (!isSupabaseReadonlyMode()) return;
    let cancelled = false;
    void readUploadSubmissionsInbox().then((res) => {
      if (cancelled) return;
      if (res.status === "live" && res.items.length > 0) {
        setLiveItems(res.items);
        setLiveIds(new Set(res.items.map((i) => i.id)));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const liveActive = liveItems.length > 0;

  const items = useMemo(
    () =>
      liveActive
        ? [...liveItems, ...localItems]
        : [...localItems, ...fixtureItems],
    [liveActive, liveItems, localItems, fixtureItems],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, DemoUploadSubmission[]>();
    for (const s of items) {
      const list = map.get(s.restaurantName) ?? [];
      list.push(s);
      map.set(s.restaurantName, list);
    }
    return Array.from(map.entries());
  }, [items]);

  function updateStatus(id: string, status: DemoUploadStatus) {
    // Live (read-only) rows: triage stays in-memory only — no write-back.
    if (liveIds.has(id)) {
      setLiveItems((curr) =>
        curr.map((s) => (s.id === id ? { ...s, status } : s)),
      );
      return;
    }
    if (isLocalUploadSubmission(id)) {
      updateLocalUploadSubmissionStatus(id, status);
      setLocalItems(getLocalUploadSubmissions());
      return;
    }
    setFixtureItems((curr) =>
      curr.map((s) => (s.id === id ? { ...s, status } : s)),
    );
  }

  function handleClearSession() {
    clearLocalUploadSubmissions();
    setLocalItems([]);
  }

  // Shared selection for the collapsed internal preview tools.
  const previewMediaSubs = useMemo(
    () =>
      ["demo-a", "demo-b", "demo-c"]
        .flatMap((id) => clientTeamWorkRepository.getClientSubmissions(id))
        .filter((s) => s.submissionType === "media")
        .filter((s) => s.status !== "completed" && s.status !== "archived")
        .slice(0, 3),
    [],
  );

  if (!canUseFixtureData) {
    return (
      <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
        <RealPortalReviewNotice />
        <SafePortalEmptyCard
          title="Upload Inbox in review"
          body="Live upload submissions are not connected yet. New restaurant media submissions will appear here after live account data is prepared."
          testId="empty-team-upload-inbox"
        />
        <TeamReviewModeRouteSummary title="Upload inbox pending connection" />
      </PortalLayout>
    );
  }

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <PageHeader
          title="Upload Inbox"
          description="Review new restaurant media and decide what happens next."
          testId="upload-inbox-heading"
        />
        <Link
          href="/upload"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mt-1"
          data-testid="link-open-upload"
        >
          Open Restaurant Upload <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      <p
        className="text-xs text-muted-foreground mb-4"
        data-testid="upload-inbox-source-line"
      >
        {liveActive ? "Showing live submissions." : "Showing sample fallback."}
      </p>

      <Card className="mb-4 border-sky-500/20 bg-sky-500/5" data-testid="upload-inbox-media-intelligence">
        <CardContent className="p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Media intelligence tags</p>
          <p className="mt-1">{buildTeamMediaSummary(mediaIntelligenceSeedData)}</p>
          <p className="mt-2 text-xs">Platform fit, quality status, and next best use are deterministic preview labels only.</p>
        </CardContent>
      </Card>

      {/* Session controls — subtle */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 text-xs text-muted-foreground">
        <span>
          {localItems.length} upload{localItems.length === 1 ? "" : "s"} from
          this browser session.
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={handleClearSession}
          disabled={localItems.length === 0}
          data-testid="btn-clear-session-uploads"
        >
          <Trash2 className="w-3 h-3 mr-1" /> Clear session uploads
        </Button>
      </div>

      {grouped.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No uploads yet. Restaurant teams can submit content from the upload
            page.
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {grouped.map(([restaurantName, submissions]) => (
          <div
            key={restaurantName}
            data-testid={`inbox-group-${restaurantName.replace(/\s+/g, "-").toLowerCase()}`}
          >
            <div className="mb-2 flex items-center justify-between px-0.5">
              <h3 className="text-sm font-semibold">{restaurantName}</h3>
              <span className="text-xs text-muted-foreground">
                {submissions.length} upload{submissions.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {submissions.map((s) => (
                <TeamReviewCard
                  key={s.id}
                  testId={`inbox-item-${s.id}`}
                  restaurantName={restaurantName}
                  title={s.fileLabel}
                  icon={
                    s.fileKind === "video" ? (
                      <VideoIcon className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    )
                  }
                  context={s.note ? `"${s.note}"` : undefined}
                  suggestedAction={nextActionByStatus[s.status]}
                  status={{
                    label: demoUploadStatusLabels[s.status],
                    tone: statusTone[s.status],
                  }}
                  meta={`${demoUploadCategoryLabels[s.category]} · Submitted ${s.submittedAtLabel}`}
                  actions={[
                    {
                      label: "Mark In Review",
                      icon: <Clock className="w-3.5 h-3.5" />,
                      onClick: () => updateStatus(s.id, "in_review"),
                      testId: `btn-mark-review-${s.id}`,
                    },
                    {
                      label: "Accept for Content",
                      icon: <Check className="w-3.5 h-3.5" />,
                      onClick: () => updateStatus(s.id, "accepted"),
                      testId: `btn-accept-${s.id}`,
                    },
                    {
                      label: "Needs Better Photo",
                      icon: <AlertCircle className="w-3.5 h-3.5" />,
                      onClick: () => updateStatus(s.id, "needs_better_photo"),
                      testId: `btn-needs-photo-${s.id}`,
                    },
                    {
                      label: "Save for Later",
                      icon: <Bookmark className="w-3.5 h-3.5" />,
                      onClick: () => updateStatus(s.id, "saved_for_later"),
                      testId: `btn-save-later-${s.id}`,
                    },
                  ]}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <p
        className="text-[11px] text-muted-foreground/70 mt-4 px-0.5"
        data-testid="upload-inbox-flow-note"
      >
        Accepted uploads become work items in the{" "}
        <Link
          href="/team/work-queue"
          className="text-primary hover:underline"
          data-testid="link-to-work-queue"
        >
          Work Queue
        </Link>
        . Re-shoot requests come back to the restaurant as a simple action on
        their portal.
      </p>

      {/* Internal preview tools — collapsed by default so they never dominate. */}
      <div
        className="mt-6 border-t border-border pt-4"
        data-testid="section-internal-preview-tools"
      >
        <button
          type="button"
          onClick={() => setShowInternalTools((v) => !v)}
          className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          data-testid="toggle-internal-preview-tools"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${showInternalTools ? "rotate-180" : ""}`}
          />
          Internal preview tools
        </button>

        {showInternalTools && (
          <div className="mt-3 space-y-3">
            {previewMediaSubs.length > 0 && (
              <Card
                className="bg-card border-border"
                data-testid="card-ai-media-review"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    Suggested media notes ({previewMediaSubs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {previewMediaSubs.map((s) => {
                    const review = previewMediaReview(s);
                    const structured = mediaReviewOutput(s);
                    return (
                      <div
                        key={s.id}
                        className="rounded-md border border-border/60 bg-muted/10 p-3 text-[12px]"
                        data-testid={`ai-media-review-${s.id}`}
                      >
                        <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                          <p className="font-semibold text-foreground">
                            {s.title}
                          </p>
                          <div className="flex gap-1.5 flex-wrap">
                            <Badge
                              variant="outline"
                              className="border-border bg-muted/30 text-[10px]"
                            >
                              Quality: {review.qualityLabel}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="border-border bg-muted/30 text-[10px]"
                            >
                              {AI_MEDIA_USAGE_LABELS[review.recommendedUsage]}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="border-border bg-muted/30 text-[10px]"
                            >
                              {AI_AGENT_STATUS_LABELS[review.status]}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-muted-foreground">
                          <span className="text-foreground font-medium">
                            Suggested angle:
                          </span>{" "}
                          {review.contentAngle}
                        </p>
                        <p className="text-primary/85 mt-1">
                          Next: {structured.recommendedNextAction}
                        </p>
                      </div>
                    );
                  })}
                  <p className="text-[10px] text-muted-foreground italic pt-1">
                    {TEAM_AI_DISCLOSURE}
                  </p>
                </CardContent>
              </Card>
            )}

            <ContentDraftPipelineCard submissions={previewMediaSubs} />
            <ContentIntelligenceInboxList submissions={previewMediaSubs} />

            {previewMediaSubs.length > 0 && (
              <Card
                className="bg-card border-border"
                data-testid="card-related-media-subs"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    Related media items ({previewMediaSubs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {previewMediaSubs.map((s) => (
                    <div
                      key={s.id}
                      className="text-xs text-muted-foreground flex items-start justify-between gap-2"
                      data-testid={`related-media-${s.id}`}
                    >
                      <span className="text-foreground/80">
                        {getRestaurantName(s.clientId)} — {s.title}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[9px] flex-shrink-0"
                      >
                        {s.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
