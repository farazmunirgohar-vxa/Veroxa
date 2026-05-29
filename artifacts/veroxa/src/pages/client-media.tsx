import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  UploadCloud,
  Camera,
  AlertTriangle,
  ImageIcon,
  CheckCircle2,
  Info,
  X,
  Sparkles,
  Lightbulb,
  CalendarDays,
  MapPin,
  Ban,
  Inbox,
} from "lucide-react";
import {
  getLocalUploadSubmissions,
  subscribeToLocalUploadSubmissions,
} from "@/lib/uploadKeys/localUploadStore";
import { demoUploadCategoryLabels } from "@/data/uploadKeys/demoRestaurantUploadKeys";
import type { DemoUploadSubmission } from "@/data/uploadKeys/demoUploadSubmissions";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientPortalData } from "@/hooks/useClientPortalData";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import {
  getDefaultGuidance,
  getGuidanceForRestaurantType,
  getRestaurantTypeOptions,
  type RestaurantType,
} from "@/lib/mediaGuidance";
import { clientTeamWorkRepository } from "@/lib/repositories";
import { CLIENT_AI_DISCLOSURE } from "@/lib/ai/aiAgentTypes";
import { previewContentDraftForSubmission } from "@/lib/content/contentDraftPreviewEngine";
import { Brain } from "lucide-react";
import { createWorkflowItem } from "@/lib/workflow/workflowRepository";

const SHOWCASE_ID = "demo-a";

interface SelectedFile {
  name: string;
  sizeKb: number;
  kind: string;
}

const reviewPreview: Array<{
  title: string;
  status: string;
  tone: "ready" | "warn" | "good" | "promo";
}> = [
  { title: "Saffron rice plate — overhead", status: "Ready for editing", tone: "ready" },
  { title: "Kitchen pass — Friday service", status: "Needs better lighting", tone: "warn" },
  { title: "Charcoal grill close-up", status: "Good for Google post", tone: "good" },
  { title: "Family platter — table shot", status: "Use for weekend promo", tone: "promo" },
];

const toneStyles: Record<string, string> = {
  ready: "text-sky-400 bg-sky-500/10 border-sky-500/30",
  warn: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  good: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  promo: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30",
};

const difficultyStyles: Record<string, string> = {
  easy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  medium: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  advanced: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30",
};

export default function ClientMedia() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [pickerMessage, setPickerMessage] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitNote, setSubmitNote] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmitToTeam = () => {
    if (files.length === 0) return;
    const item = createWorkflowItem({
      clientId: SHOWCASE_ID,
      type: "media_upload",
      title:
        files.length > 1
          ? `${files.length} media items from your team`
          : files[0].name,
      clientNote: submitNote.trim(),
      fileName: files.length > 1 ? `${files.length} files` : files[0].name,
      fileCount: files.length,
      submittedBy: "client",
    });
    setFiles([]);
    setSubmitNote("");
    setPickerMessage(null);
    setSubmitMessage(
      `Submitted to the Veroxa team. Storage pending — your media is tracked in the workflow and a team member will review it. Tracking ref ${item.workflowItemId}.`,
    );
  };

  // Restaurant Media Guidance — local state only, never persisted.
  const [restaurantType, setRestaurantType] = useState<RestaurantType>(
    getDefaultGuidance().type,
  );
  const guidance = useMemo(
    () => getGuidanceForRestaurantType(restaurantType),
    [restaurantType],
  );
  const typeOptions = useMemo(() => getRestaurantTypeOptions(), []);

  // Demo "Content Supply Snapshot" values — static demo numbers, plus the
  // locally-selected file count so the snapshot reacts to the demo picker.
  const snapshot = useMemo(
    () => ({
      available: 42 + files.length,
      used: 18,
      needsReview: 6 + files.length,
      lowContentWarning: files.length === 0 && 42 < 50,
    }),
    [files.length],
  );

  const handlePick = (e: ChangeEvent<HTMLInputElement>) => {
    // Storage pending — file metadata is read into local state only; the
    // file itself is not uploaded yet. No fetch, no FormData, no cloud
    // storage, no API call until the storage backend is connected.
    const picked = Array.from(e.target.files ?? []).map<SelectedFile>((f) => ({
      name: f.name,
      sizeKb: Math.max(1, Math.round(f.size / 1024)),
      kind: f.type || "unknown",
    }));
    if (picked.length === 0) return;
    setFiles((prev) => [...prev, ...picked]);
    setSubmitMessage(null);
    setPickerMessage(
      "Files selected. Storage pending — submit to the Veroxa team to track them in your workflow.",
    );
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (index: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== index));

  const clearFiles = () => {
    setFiles([]);
    setPickerMessage(null);
  };

  const supplyPct = Math.min(
    100,
    Math.round((snapshot.used / Math.max(1, snapshot.available)) * 100),
  );

  const { source: portalSource, dataSourceMessage: portalSourceMessage } = useClientPortalData();

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <div className="flex flex-col gap-2">
        <DataSourceBadge source={portalSource} message={portalSourceMessage} className="-mb-1" />
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-3xl font-bold tracking-tight">Media Library</h2>
          <Badge
            variant="outline"
            className="border-amber-500/40 text-amber-400 bg-amber-500/10"
            data-testid="badge-storage-pending"
          >
            Storage pending
          </Badge>
        </div>
        <p className="text-muted-foreground max-w-3xl">
          Upload photos and videos for the Veroxa team to review and turn into
          content. Submissions are tracked in your workflow.
        </p>
        <div className="flex items-start gap-2 text-sm text-muted-foreground max-w-3xl">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Storage pending — files are tracked in your workflow but not yet
            stored until the storage connection is live.
          </span>
        </div>
      </div>

      {/* AI-assisted media review — client-safe preview. */}
      <Card
        className="bg-card border-primary/20 mt-3"
        data-testid="card-media-ai-preview"
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            How Veroxa reviews your uploads
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {CLIENT_AI_DISCLOSURE}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="rounded-md border border-border/60 bg-muted/10 p-3">
              <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold mb-1">
                AI-prepared suggestion
              </p>
              <p className="text-[11px] text-muted-foreground">
                Strong shots get a content angle and a draft caption ready for team review.
              </p>
            </div>
            <div className="rounded-md border border-border/60 bg-muted/10 p-3">
              <p className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold mb-1">
                Needs team review
              </p>
              <p className="text-[11px] text-muted-foreground">
                Mixed or borderline shots wait for a Veroxa team member to decide.
              </p>
            </div>
            <div className="rounded-md border border-border/60 bg-muted/10 p-3">
              <p className="text-[10px] uppercase tracking-wider text-sky-400 font-semibold mb-1">
                Needs client context
              </p>
              <p className="text-[11px] text-muted-foreground">
                If a shot is missing context, Veroxa will ask you a short question.
              </p>
            </div>
          </div>
          <div className="rounded-md border border-border/40 bg-muted/5 p-3 text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">Tip:</span> upload
            3–5 real photos or videos per week and add a short note when you
            can. Veroxa will organize, review, and prepare content ideas.
          </div>
        </CardContent>
      </Card>

      {/* Trust strip — what Veroxa needs / what happens after upload */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3"
        data-testid="media-trust-strip"
      >
        <Card className="bg-card border-border" data-testid="media-trust-needs">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
              What Veroxa needs from you
            </p>
            <p className="text-[12px] text-muted-foreground">
              Phone photos of dishes, prep moments, your space, and specials —
              raw is fine. Quick captions when you have them. Veroxa handles
              the editing, captions, and timing.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border" data-testid="media-trust-after">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
              What happens after upload
            </p>
            <p className="text-[12px] text-muted-foreground">
              Veroxa reviews each item, drafts captions and angles, and only
              then schedules posts at the right times. Nothing goes live
              without review on your account.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Restaurant Upload Key — daily content app entry */}
      <Card className="mt-4 border-primary/30 bg-primary/5" data-testid="card-restaurant-upload-key">
        <CardContent className="p-5 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3 max-w-2xl">
            <div className="w-10 h-10 rounded-lg bg-primary/15 border border-border flex items-center justify-center flex-shrink-0">
              <UploadCloud className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-base font-semibold mb-1">
                Need employees to upload daily content?
              </p>
              <p className="text-sm text-muted-foreground">
                Share your restaurant upload key with approved staff so they can submit food
                photos, prep clips, atmosphere shots, and specials without needing a full
                account. Each restaurant gets one key — keep it inside your team only.
              </p>
            </div>
          </div>
          <a
            href="/upload"
            className="inline-flex items-center gap-1 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
            data-testid="btn-open-restaurant-upload"
          >
            Open Restaurant Upload
          </a>
        </CardContent>
      </Card>

      {/* Open media-related items between you and Veroxa Team. */}
      {(() => {
        const mediaItems = clientTeamWorkRepository
          .getClientVisibleSubmissions(SHOWCASE_ID)
          .filter(
            (s) =>
              s.submissionType === "media" &&
              s.status !== "completed" &&
              s.status !== "archived",
          );
        if (mediaItems.length === 0) return null;
        return (
          <Card
            className="mt-4 border-border bg-card/60"
            data-testid="card-media-open-items"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Inbox className="w-4 h-4 text-primary" />
                Media items with Veroxa Team ({mediaItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mediaItems.map((s) => {
                const statusLabel = clientTeamWorkRepository.getSubmissionWorkItemForClient(s.id)?.statusLabel;
                const nextAction = clientTeamWorkRepository.getSubmissionWorkItemForClient(s.id)?.nextAction;
                const contentStatus = previewContentDraftForSubmission(s).clientStatus;
                return (
                  <div
                    key={s.id}
                    className="rounded-md border border-border bg-muted/20 px-3 py-2"
                    data-testid={`media-open-${s.id}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-medium leading-snug">{s.title}</p>
                      <div className="flex gap-1.5 flex-wrap">
                        <Badge
                          variant="outline"
                          className="text-[9px] flex-shrink-0 border-sky-500/30 bg-sky-500/10 text-sky-300"
                          data-testid={`media-content-status-${s.id}`}
                        >
                          {contentStatus}
                        </Badge>
                        {statusLabel && (
                          <Badge variant="outline" className="text-[9px] flex-shrink-0">
                            {statusLabel}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {s.clientVisibleNote}
                    </p>
                    {nextAction && (
                      <p className="text-[11px] text-amber-300 mt-1">
                        What to send: {nextAction}
                      </p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })()}

      {/* Recent uploads from this session */}
      <SessionUploadsSection />

      {/* Restaurant Media Guidance Engine — rule-based demo, local state only */}
      <Card className="bg-card border-primary/30 mt-4" data-testid="card-media-guidance">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg font-semibold">Restaurant Media Guidance</CardTitle>
                <Badge
                  variant="outline"
                  className="border-primary/30 bg-primary/10 text-primary text-[10px] font-semibold tracking-wide"
                  data-testid="badge-guidance-rule-based"
                >
                  Demo preview
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Choose your restaurant type and Veroxa will recommend what photos and videos to capture this week.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="guidance-restaurant-type" className="text-xs text-muted-foreground font-medium">
                Restaurant type
              </label>
              <select
                id="guidance-restaurant-type"
                value={restaurantType}
                onChange={(e) => setRestaurantType(e.target.value as RestaurantType)}
                className="bg-muted/40 border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                data-testid="select-restaurant-type"
              >
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-xs text-muted-foreground" data-testid="text-guidance-note">
            Based on Veroxa's content guidance for your restaurant type.
          </p>

          {/* Recommended Shots This Week */}
          <section data-testid="section-recommended-shots">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" />
              Recommended Shots This Week
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {guidance.bestPhotoIdeas.map((idea, i) => (
                <div
                  key={idea.title}
                  className="p-3 rounded-md border border-border bg-muted/20 space-y-2"
                  data-testid={`shot-idea-${i}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-snug">{idea.title}</p>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border ${difficultyStyles[idea.difficulty]}`}
                    >
                      {idea.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{idea.description}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {idea.bestFor.map((platform) => (
                      <Badge
                        key={platform}
                        variant="outline"
                        className="text-[10px] font-normal px-1.5 py-0 border-border bg-card"
                      >
                        {platform}
                      </Badge>
                    ))}
                    <span className="text-[10px] text-muted-foreground ml-auto">{idea.frequency}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground italic border-t border-border/40 pt-2">
                    Example: {idea.exampleShot}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Google Business Profile Shots */}
            <section data-testid="section-google-shots">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Google Business Profile Shots
              </h3>
              <ul className="space-y-2">
                {guidance.googleSpecificShots.map((shot, i) => (
                  <li
                    key={shot.category}
                    className="flex items-start gap-2 text-sm"
                    data-testid={`google-shot-${i}`}
                  >
                    <span className="text-xs font-semibold text-primary min-w-[110px]">{shot.category}</span>
                    <span className="text-xs text-muted-foreground">{shot.description}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* What to Avoid */}
            <section data-testid="section-avoid">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Ban className="w-4 h-4 text-amber-400" />
                What to Avoid
              </h3>
              <ul className="space-y-1.5">
                {guidance.avoid.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-muted-foreground"
                    data-testid={`avoid-item-${i}`}
                  >
                    <X className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <Separator />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Capture Plan */}
            <section data-testid="section-weekly-plan">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                Weekly Capture Plan
              </h3>
              <ul className="space-y-2">
                {guidance.weeklyCapturePlan.map((slot, i) => (
                  <li
                    key={`${slot.day}-${i}`}
                    className="flex items-start gap-3 p-2.5 rounded-md bg-muted/20 border border-border"
                    data-testid={`weekly-slot-${i}`}
                  >
                    <span className="text-xs font-bold text-primary min-w-[68px]">{slot.day}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug">{slot.what}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{slot.why}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Quick Tips */}
            <section data-testid="section-quick-tips">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                Quick Tips
              </h3>
              <ul className="space-y-2">
                {guidance.quickTips.map((tip, i) => (
                  <li
                    key={tip.title}
                    className="text-sm"
                    data-testid={`quick-tip-${i}`}
                  >
                    <p className="font-medium leading-snug">{tip.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{tip.text}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mt-6">
        <div className="space-y-6">
          {/* 1. Upload Placeholder */}
          <Card className="bg-card border-border" data-testid="card-upload">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-lg p-10 text-center bg-muted/20">
                <UploadCloud className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">
                  Drag & drop photos or videos
                </p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Or choose files from your device. Storage pending — files are
                  tracked in your workflow, not yet stored.
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handlePick}
                  data-testid="input-files"
                />
                <Button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  data-testid="button-choose-files"
                >
                  Choose Files
                </Button>
                {pickerMessage && (
                  <p
                    className="text-xs text-amber-400 mt-3"
                    data-testid="text-picker-message"
                    role="status"
                  >
                    {pickerMessage}
                  </p>
                )}
              </div>

              {files.length > 0 && (
                <div className="mt-4 space-y-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2.5" data-testid="callout-submit-team">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">Ready to send to Veroxa?</p>
                    <p className="text-[11px] text-muted-foreground">
                      This submits your selection into your Veroxa workflow for
                      team review. Storage pending — files are tracked, not yet
                      stored, until the storage connection is live.
                    </p>
                  </div>
                  <textarea
                    value={submitNote}
                    onChange={(e) => setSubmitNote(e.target.value)}
                    placeholder="Add a quick note for the team (optional) — e.g. what the dish is, or when it was taken."
                    rows={2}
                    className="w-full bg-muted/40 border border-border rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    data-testid="input-submit-note"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSubmitToTeam}
                      data-testid="btn-submit-to-team"
                      className="flex-shrink-0"
                    >
                      Submit to Veroxa Team
                    </Button>
                  </div>
                </div>
              )}

              {submitMessage && (
                <div
                  className="mt-4 flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-300"
                  data-testid="text-submit-message"
                  role="status"
                >
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{submitMessage}</span>
                </div>
              )}

              {files.length > 0 && (
                <div className="mt-5 space-y-2" data-testid="list-selected-files">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Selected files (not yet submitted)
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearFiles}
                      data-testid="button-clear-files"
                    >
                      Clear
                    </Button>
                  </div>
                  <ul className="space-y-1.5">
                    {files.map((f, i) => (
                      <li
                        key={`${f.name}-${i}`}
                        className="flex items-center justify-between gap-3 text-sm px-3 py-2 rounded-md bg-muted/30 border border-border"
                        data-testid={`selected-file-${i}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <ImageIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{f.name}</span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            · {f.sizeKb} KB
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={`Remove ${f.name}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. Media Review Preview */}
          <Card className="bg-card border-border" data-testid="card-review">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Media Review Preview
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                How the Veroxa team tags reviewed media for downstream use.
              </p>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {reviewPreview.map((r, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                    data-testid={`review-item-${i}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <ImageIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate">{r.title}</span>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${toneStyles[r.tone]}`}
                    >
                      {r.status}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

        </div>

        {/* 4. Content Supply Snapshot */}
        <aside className="space-y-4 lg:sticky lg:top-6 self-start">
          <Card className="bg-card border-border" data-testid="card-snapshot">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Content Supply Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Content supply</span>
                  <span>{supplyPct}%</span>
                </div>
                <Progress value={supplyPct} className="h-2" />
              </div>
              <Separator />
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between" data-testid="stat-available">
                  <dt className="text-muted-foreground">Available media</dt>
                  <dd className="font-medium">{snapshot.available}</dd>
                </div>
                <div className="flex justify-between" data-testid="stat-used">
                  <dt className="text-muted-foreground">Used media</dt>
                  <dd className="font-medium">{snapshot.used}</dd>
                </div>
                <div className="flex justify-between" data-testid="stat-review">
                  <dt className="text-muted-foreground">Needs review</dt>
                  <dd className="font-medium">{snapshot.needsReview}</dd>
                </div>
              </dl>
              {snapshot.lowContentWarning && (
                <div
                  className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-md p-2.5"
                  data-testid="low-content-warning"
                >
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Low content warning — fewer than 50 ready assets in the
                    library.
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-500" />
                <span>
                  Storage pending — files are tracked in your workflow until the
                  storage connection is live.
                </span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </PortalLayout>
  );
}

function SessionUploadsSection() {
  const [items, setItems] = useState<DemoUploadSubmission[]>(() =>
    getLocalUploadSubmissions().filter((s) => s.restaurantId === "demo-a"),
  );

  useEffect(() => {
    const refresh = () =>
      setItems(getLocalUploadSubmissions().filter((s) => s.restaurantId === "demo-a"));
    refresh();
    return subscribeToLocalUploadSubmissions(() => refresh());
  }, []);

  return (
    <Card className="mt-4 bg-card border-border" data-testid="card-session-uploads">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Inbox className="w-4 h-4 text-primary" /> Recent uploads from this session
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No session uploads yet. Open{" "}
            <a href="/upload" className="text-primary hover:underline">
              /upload
            </a>{" "}
            to send food photos, prep clips, or atmosphere shots.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-md border border-border bg-muted/20 text-sm"
                data-testid={`session-upload-${s.id}`}
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{s.fileLabel}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {demoUploadCategoryLabels[s.category]} · {s.submittedAtLabel}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {s.fileKind}
                </Badge>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[11px] text-muted-foreground mt-3">
          Session-only — no real files are stored. Clears when you close the browser.
        </p>
      </CardContent>
    </Card>
  );
}
