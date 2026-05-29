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
} from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { getWriteSafetyBanner } from "@/lib/data/writeReadiness";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { demoUploadCategoryLabels } from "@/data/uploadKeys/demoRestaurantUploadKeys";
import {
  demoUploadPriorityLabels,
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
import {
  previewMediaReview,
  mediaReviewOutput,
} from "@/lib/ai/aiAgentPreviewEngine";
import {
  AI_AGENT_STATUS_LABELS,
  AI_MEDIA_USAGE_LABELS,
  AI_CONFIDENCE_LABELS,
  AI_AUTOMATION_READINESS_LABELS,
  TEAM_AI_DISCLOSURE,
} from "@/lib/ai/aiAgentTypes";
import { ContentDraftPipelineCard } from "@/components/ContentDraftPipelineCard";
import { ContentIntelligenceInboxList } from "@/components/ContentIntelligencePanel";
import { TeamWorkflowPanel } from "@/components/TeamWorkflowPanel";

const statusToneStyles: Record<DemoUploadStatus, string> = {
  received: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  in_review: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  accepted: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  needs_better_photo: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  saved_for_later: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30",
};

/**
 * /demo/team/upload-inbox — Team Upload Inbox (M014).
 *
 * Shows restaurant uploads submitted through the Restaurant Upload Key
 * flow. Triage actions persist through the workflow foundation (backend
 * pending) and never hit a cloud database or any external API yet.
 */
export default function TeamUploadInbox() {
  // Fixture submissions stay in component state for local triage practice.
  const [fixtureItems, setFixtureItems] = useState<DemoUploadSubmission[]>(() => [
    ...demoUploadSubmissions,
  ]);
  // Session-store submissions (from /upload during this browser session).
  const [localItems, setLocalItems] = useState<DemoUploadSubmission[]>(
    () => getLocalUploadSubmissions(),
  );

  useEffect(() => {
    const unsub = subscribeToLocalUploadSubmissions((next) => setLocalItems(next));
    setLocalItems(getLocalUploadSubmissions());
    return unsub;
  }, []);

  const items = useMemo(
    () => [...localItems, ...fixtureItems],
    [localItems, fixtureItems],
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
    if (isLocalUploadSubmission(id)) {
      updateLocalUploadSubmissionStatus(id, status);
      setLocalItems(getLocalUploadSubmissions());
      return;
    }
    setFixtureItems((curr) => curr.map((s) => (s.id === id ? { ...s, status } : s)));
  }

  function handleClearSession() {
    clearLocalUploadSubmissions();
    setLocalItems([]);
  }

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-2">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="upload-inbox-heading">
              <Inbox className="w-6 h-6 text-primary" /> Upload Inbox
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Daily restaurant uploads submitted through restaurant upload keys. Triage here,
              then move accepted items to{" "}
              <Link
                href="/demo/team/media-review"
                className="text-primary hover:underline"
                data-testid="link-to-media-review"
              >
                Media Review
              </Link>
              .
            </p>
          </div>
          <Link
            href="/upload"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            data-testid="link-open-upload"
          >
            Open Restaurant Upload <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <DemoOnlyBanner message="Triage actions persist in the workflow foundation for this browser (backend pending). No notifications or external sends happen — every client-facing step requires team approval." />

        <p
          className="mt-2 text-[11px] text-muted-foreground/80 px-1"
          data-testid="upload-inbox-flow-note"
        >
          Flow: uploads land here for team triage → accepted items move into
          Media Review and become work items in the Client Work Queue →
          re-shoot or clarification requests come back as a client action on
          the restaurant's portal.
        </p>

        <div
          className="mt-2 text-[11px] text-muted-foreground/80 px-1"
          data-testid="banner-writes-disabled-upload-inbox"
        >
          {getWriteSafetyBanner()}
        </div>

        {/* Live media uploads in the real workflow foundation — accept for
            content prep or ask the client for context. Actions persist
            (backend pending); nothing is published or sent. */}
        <div className="mt-3">
          <TeamWorkflowPanel
            title="Uploads in the workflow"
            icon={<Inbox className="w-4 h-4 text-primary" />}
            lifecycles={[
              "submitted",
              "team_reviewing",
              "ai_prepared",
              "needs_client_input",
            ]}
            emptyText="No new uploads in the workflow right now."
            testId="card-upload-inbox-workflow"
          />
        </div>

        {/* AI Media Review previews for active media submissions. */}
        {(() => {
          const mediaSubs = clientTeamWorkRepository
            .getClientSubmissions("demo-a")
            .concat(
              clientTeamWorkRepository.getClientSubmissions("demo-b"),
              clientTeamWorkRepository.getClientSubmissions("demo-c"),
            )
            .filter((s) => s.submissionType === "media")
            .filter((s) => s.status !== "completed" && s.status !== "archived")
            .slice(0, 3);
          if (mediaSubs.length === 0) return null;
          return (
            <Card className="mt-3 bg-card border-primary/20" data-testid="card-ai-media-review">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  AI Media Review preview ({mediaSubs.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {mediaSubs.map((s) => {
                  const review = previewMediaReview(s);
                  const structured = mediaReviewOutput(s);
                  const usageTone =
                    review.recommendedUsage === "use_now"
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                      : review.recommendedUsage === "save_for_later"
                      ? "border-sky-500/40 bg-sky-500/10 text-sky-300"
                      : review.recommendedUsage === "needs_context"
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                      : "border-rose-500/40 bg-rose-500/10 text-rose-300";
                  return (
                    <div
                      key={s.id}
                      className="rounded-md border border-border/60 bg-muted/10 p-3 text-[12px]"
                      data-testid={`ai-media-review-${s.id}`}
                    >
                      <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-foreground">{s.title}</p>
                        <div className="flex gap-1.5 flex-wrap">
                          <Badge variant="outline" className="border-border bg-muted/30 text-[10px]">
                            Quality: {review.qualityLabel} · {review.mediaQualityScore}
                          </Badge>
                          <Badge variant="outline" className={`${usageTone} text-[10px]`}>
                            {AI_MEDIA_USAGE_LABELS[review.recommendedUsage]}
                          </Badge>
                          <Badge variant="outline" className="border-border bg-muted/30 text-[10px]">
                            {AI_AGENT_STATUS_LABELS[review.status]}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-muted-foreground">
                        <span className="text-foreground font-medium">Suggested angle:</span>{" "}
                        {review.contentAngle}
                      </p>
                      <p className="text-muted-foreground mt-0.5">{review.note}</p>
                      <div className="mt-2 flex gap-1.5 flex-wrap">
                        <Badge variant="outline" className="border-border bg-muted/30 text-[10px]">
                          {AI_CONFIDENCE_LABELS[structured.confidenceLevel]}
                        </Badge>
                        <Badge variant="outline" className="border-border bg-muted/30 text-[10px]">
                          {AI_AUTOMATION_READINESS_LABELS[structured.automationReadiness]}
                        </Badge>
                      </div>
                      <p className="text-primary/85 mt-1">
                        Next: {structured.recommendedNextAction}
                      </p>
                      {structured.riskFlags.map((flag, i) => (
                        <p key={i} className="text-amber-300/90 mt-0.5">
                          Risk: {flag.message} — {flag.nextHumanAction}
                        </p>
                      ))}
                    </div>
                  );
                })}
                <p className="text-[10px] text-muted-foreground italic pt-1">
                  {TEAM_AI_DISCLOSURE}
                </p>
              </CardContent>
            </Card>
          );
        })()}

        {/* AI-assisted content draft pipeline (media → angle → caption → review). */}
        {(() => {
          const contentSubs = clientTeamWorkRepository
            .getClientSubmissions("demo-a")
            .concat(
              clientTeamWorkRepository.getClientSubmissions("demo-b"),
              clientTeamWorkRepository.getClientSubmissions("demo-c"),
            )
            .filter((s) => s.submissionType === "media")
            .filter((s) => s.status !== "completed" && s.status !== "archived")
            .slice(0, 3);
          return <ContentDraftPipelineCard submissions={contentSubs} />;
        })()}

        {/* Restaurant Content Intelligence — per-upload understanding:
            media usability, customer moment, content angle, caption gate,
            and recommended next action. Drafts require team approval. */}
        {(() => {
          const intelSubs = clientTeamWorkRepository
            .getClientSubmissions("demo-a")
            .concat(
              clientTeamWorkRepository.getClientSubmissions("demo-b"),
              clientTeamWorkRepository.getClientSubmissions("demo-c"),
            )
            .filter((s) => s.submissionType === "media")
            .filter((s) => s.status !== "completed" && s.status !== "archived")
            .slice(0, 3);
          return <ContentIntelligenceInboxList submissions={intelSubs} />;
        })()}

        {/* Related media submissions across the client/team workflow. */}
        {(() => {
          const mediaSubs = clientTeamWorkRepository
            .getClientSubmissions("demo-a")
            .filter((s) => s.submissionType === "media")
            .concat(
              clientTeamWorkRepository
                .getClientSubmissions("demo-b")
                .filter((s) => s.submissionType === "media"),
              clientTeamWorkRepository
                .getClientSubmissions("demo-c")
                .filter((s) => s.submissionType === "media"),
            )
            .filter((s) => s.status !== "completed" && s.status !== "archived")
            .slice(0, 4);
          if (mediaSubs.length === 0) return null;
          return (
            <Card className="mt-3 bg-card border-border" data-testid="card-related-media-subs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  Related media items from client/team workflow ({mediaSubs.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {mediaSubs.map((s) => (
                  <div
                    key={s.id}
                    className="text-xs text-muted-foreground flex items-start justify-between gap-2"
                    data-testid={`related-media-${s.id}`}
                  >
                    <span className="text-foreground/80">
                      {getRestaurantName(s.clientId)} — {s.title}
                    </span>
                    <Badge variant="outline" className="text-[9px] flex-shrink-0">
                      {s.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })()}

        <div className="flex flex-wrap items-center justify-between gap-2 mt-2 mb-4 px-1 text-xs text-muted-foreground">
          <span>
            Uploads from <span className="font-mono">/upload</span> appear here for this
            browser session only ({localItems.length} session upload
            {localItems.length === 1 ? "" : "s"}).
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
              No uploads yet. Restaurant employees can submit content at <code>/upload</code>.
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {grouped.map(([restaurantName, submissions]) => (
            <Card key={restaurantName} data-testid={`inbox-group-${restaurantName.replace(/\s+/g, "-").toLowerCase()}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{restaurantName}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {submissions.length} upload{submissions.length === 1 ? "" : "s"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="divide-y divide-border">
                  {submissions.map((s) => (
                    <li key={s.id} className="py-3 first:pt-0 last:pb-0" data-testid={`inbox-item-${s.id}`}>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          {s.fileKind === "video" ? (
                            <VideoIcon className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">{s.fileLabel}</span>
                            <Badge variant="outline" className="text-xs">
                              {demoUploadCategoryLabels[s.category]}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {demoUploadPriorityLabels[s.priority]}
                            </Badge>
                          </div>
                          {s.note && (
                            <p className="text-sm text-foreground/90 mb-1">"{s.note}"</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            <span className="font-mono">{s.id}</span> · Submitted {s.submittedAtLabel}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs ${statusToneStyles[s.status]}`}
                          data-testid={`inbox-status-${s.id}`}
                        >
                          {demoUploadStatusLabels[s.status]}
                        </Badge>
                      </div>

                      <Separator className="my-3" />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(s.id, "in_review")}
                          data-testid={`btn-mark-review-${s.id}`}
                        >
                          <Clock className="w-3.5 h-3.5 mr-1" /> Mark In Review
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(s.id, "accepted")}
                          data-testid={`btn-accept-${s.id}`}
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Accept for Content
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(s.id, "needs_better_photo")}
                          data-testid={`btn-needs-photo-${s.id}`}
                        >
                          <AlertCircle className="w-3.5 h-3.5 mr-1" /> Needs Better Photo
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(s.id, "saved_for_later")}
                          data-testid={`btn-save-later-${s.id}`}
                        >
                          <Bookmark className="w-3.5 h-3.5 mr-1" /> Save for Later
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PortalLayout>
  );
}
