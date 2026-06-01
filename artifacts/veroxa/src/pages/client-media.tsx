import { useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ImageIcon,
  Inbox,
  Send,
  UploadCloud,
  X,
} from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientPortalData } from "@/hooks/useClientPortalData";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import {
  RealPortalReviewNotice,
  SafePortalEmptyCard,
} from "@/components/RealPortalSafeStates";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { ClientOperationalCard } from "@/components/client/ClientOperationalSpine";
import {
  getCurrentClientAccount,
  getClientMediaStatus,
} from "@/lib/operations";
import { clientTeamWorkRepository } from "@/lib/repositories";
import { createWorkflowItem } from "@/lib/workflow/workflowRepository";
import { veroxaWriteAdapter } from "@/lib/data/writeAdapter";
import { getDevClientIdFromEnv } from "@/lib/data/devClientId";
import { useActiveClientPortalContext } from "@/lib/clientPortalContext";
import {
  CLIENT_MEDIA_LIFECYCLE_STAGES,
  getClientMediaLifecycleIndex,
  getClientMediaStatusTone,
  normalizeClientMediaDisplayStatus,
  type ClientMediaDisplayStatus,
} from "@/lib/clientMediaLifecycle";

const SHOWCASE_ID = "demo-a";

const DIRECTION_OPTIONS = [
  { value: "", label: "No direction — use where helpful" },
  { value: "Use this next", label: "Use this next" },
  { value: "Save for weekend", label: "Save for weekend" },
  { value: "Use for Google", label: "Use for Google" },
  { value: "Use for Reel/TikTok", label: "Use for Reel/TikTok" },
  { value: "Avoid this item", label: "Avoid this item" },
] as const;

interface SelectedFile {
  name: string;
  sizeKb: number;
  kind: string;
}

interface ClientMediaItem {
  id: string;
  name: string;
  description: string;
  status: ClientMediaDisplayStatus;
  note?: string;
  direction?: string;
  scheduledPlatform?: string;
  scheduledDate?: string;
  postedLink?: string;
  source: "upload" | "ready" | "posted";
}

const toneStyles: Record<
  ReturnType<typeof getClientMediaStatusTone>,
  string
> = {
  complete: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  attention: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  muted: "border-border bg-muted/20 text-muted-foreground",
  ready: "border-primary/30 bg-primary/10 text-primary",
  progress: "border-sky-500/30 bg-sky-500/10 text-sky-300",
};

function MediaStatusBadge({ status }: { status: ClientMediaDisplayStatus }) {
  return (
    <Badge
      variant="outline"
      className={`text-[10px] ${toneStyles[getClientMediaStatusTone(status)]}`}
    >
      {status}
    </Badge>
  );
}

export default function ClientMedia() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [pickerMessage, setPickerMessage] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitNote, setSubmitNote] = useState("");
  const [direction, setDirection] = useState("");
  const [localUploads, setLocalUploads] = useState<ClientMediaItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { activeClientId, isRealClientSession } =
    useActiveClientPortalContext();
  const portalDataMode = useRealPortalDataMode();
  const canUseFixtureData =
    portalDataMode.allowDemoFixtures || portalDataMode.isLiveDataConnected;
  const reviewAccount = getCurrentClientAccount();
  const reviewMedia = getClientMediaStatus(reviewAccount.id);
  const { source: portalSource, dataSourceMessage: portalSourceMessage } =
    useClientPortalData();

  const repositoryMediaItems = useMemo<ClientMediaItem[]>(() => {
    if (!canUseFixtureData) return [];
    return clientTeamWorkRepository
      .getClientVisibleSubmissions(SHOWCASE_ID)
      .filter((submission) => submission.submissionType === "media")
      .map((submission) => {
        const workItem =
          clientTeamWorkRepository.getSubmissionWorkItemForClient(
            submission.id,
          );
        const status = normalizeClientMediaDisplayStatus(
          submission.status === "blocked"
            ? "Needs better media"
            : (workItem?.statusLabel ?? submission.status),
        );
        return {
          id: submission.id,
          name: submission.title,
          description: submission.description,
          status,
          note: submission.clientVisibleNote,
          direction: submission.requestedClientAction,
          scheduledPlatform: status === "Scheduled" ? "Instagram" : undefined,
          scheduledDate: status === "Scheduled" ? "This week" : undefined,
          postedLink: status === "Posted" ? "Available in Reports" : undefined,
          source:
            status === "Posted" || status === "Already used"
              ? "posted"
              : status === "Ready" || status === "Scheduled"
                ? "ready"
                : "upload",
        };
      });
  }, [canUseFixtureData]);

  const mediaItems = [...localUploads, ...repositoryMediaItems];
  const uploadedMedia = mediaItems.filter((item) => item.source === "upload");
  const readyMedia = mediaItems.filter((item) => item.source === "ready");
  const postedMedia = mediaItems.filter((item) => item.source === "posted");
  const selectedItem =
    mediaItems.find((item) => item.id === selectedItemId) ?? mediaItems[0];

  const handleSubmitToTeam = () => {
    if (files.length === 0) return;
    const workflowClientId = canUseFixtureData
      ? activeClientId
      : "pending-live-client";
    const noteWithDirection = [direction, submitNote.trim()]
      .filter(Boolean)
      .join(" — ");
    const item = createWorkflowItem({
      clientId: workflowClientId,
      type: "media_upload",
      title:
        files.length > 1
          ? `${files.length} media items from your restaurant`
          : files[0].name,
      clientNote: noteWithDirection,
      fileName: files.length > 1 ? `${files.length} files` : files[0].name,
      fileCount: files.length,
      submittedBy: "client",
    });

    const filesToWrite = [...files];
    const noteToWrite = noteWithDirection;
    const createdItems: ClientMediaItem[] = filesToWrite.map((file, index) => ({
      id: `${item.workflowItemId}-${index}`,
      name: file.name,
      description: `${file.kind || "Media"} · ${file.sizeKb} KB`,
      status: "Uploaded",
      note: submitNote.trim() || undefined,
      direction: direction || undefined,
      source: "upload",
    }));

    setLocalUploads((prev) => [...createdItems, ...prev]);
    setSelectedItemId(createdItems[0]?.id ?? null);
    setFiles([]);
    setSubmitNote("");
    setDirection("");
    setPickerMessage(null);
    setSubmitMessage(
      "Uploaded. Veroxa has your media and will review it before anything goes live.",
    );

    const devClientId = isRealClientSession
      ? activeClientId
      : getDevClientIdFromEnv();
    if (devClientId) {
      void Promise.all(
        filesToWrite.map((file) => {
          const category = file.kind.startsWith("video/")
            ? ("short_video" as const)
            : file.kind.startsWith("image/")
              ? ("food_photo" as const)
              : ("other" as const);
          return veroxaWriteAdapter.createUploadSubmission({
            restaurantId: devClientId,
            uploadKeyId: null,
            category,
            priority: "use_anytime",
            note: noteToWrite || null,
            submittedByLabel: "client_portal",
          });
        }),
      ).catch(() => {
        /* local/review flow remains the visible source of truth */
      });
    }
  };

  const handlePick = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []).map<SelectedFile>(
      (file) => ({
        name: file.name,
        sizeKb: Math.max(1, Math.round(file.size / 1024)),
        kind: file.type || "media",
      }),
    );
    if (picked.length === 0) return;
    setFiles((prev) => [...prev, ...picked]);
    setSubmitMessage(null);
    setPickerMessage(
      "Added. Direction is optional — you can submit without it.",
    );
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (index: number) =>
    setFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <RealPortalReviewNotice />
      {!canUseFixtureData && (
        <ClientOperationalCard title="Media status">
          <p>{reviewMedia.clientVisibleMessage}</p>
          <p>
            Usable media:{" "}
            <span className="text-foreground">
              {reviewMedia.usableMediaCount}
            </span>
          </p>
          <p>
            Waiting for Veroxa review:{" "}
            <span className="text-foreground">
              {reviewMedia.pendingReviewCount}
            </span>
          </p>
          <p>{reviewMedia.nextMediaRequest}</p>
        </ClientOperationalCard>
      )}

      <div className="flex flex-col gap-2">
        <DataSourceBadge
          source={portalSource}
          message={portalSourceMessage}
          className="-mb-1"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              className="text-3xl font-bold tracking-tight"
              data-testid="header-client-media"
            >
              Media
            </h2>
            <p className="text-muted-foreground max-w-3xl mt-1">
              Drop off photos and videos. Veroxa reviews, prepares, schedules,
              and posts what is usable.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => inputRef.current?.click()}
            data-testid="button-quick-upload"
          >
            <UploadCloud className="w-4 h-4 mr-2" /> Upload media
          </Button>
        </div>
      </div>

      <Card
        className="bg-card border-primary/30 mt-4"
        data-testid="card-upload-dropoff"
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-primary" /> Upload media
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Add a quick note or direction if helpful. It is optional.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={handlePick}
            data-testid="input-files"
          />
          <div className="rounded-lg border border-dashed border-border bg-muted/10 p-5 text-center">
            <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm font-medium">
              Choose restaurant photos or videos
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Raw phone media is fine.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              data-testid="button-choose-files"
            >
              Choose files
            </Button>
            {pickerMessage && (
              <p className="text-xs text-amber-300 mt-3" role="status">
                {pickerMessage}
              </p>
            )}
          </div>

          {files.length > 0 && (
            <div
              className="space-y-3 rounded-md border border-primary/30 bg-primary/5 p-3"
              data-testid="pending-upload-panel"
            >
              <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_220px]">
                <textarea
                  value={submitNote}
                  onChange={(event) => setSubmitNote(event.target.value)}
                  placeholder="Optional note — dish name, event, special, or anything Veroxa should know."
                  rows={2}
                  className="w-full bg-muted/40 border border-border rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  data-testid="input-submit-note"
                />
                <select
                  value={direction}
                  onChange={(event) => setDirection(event.target.value)}
                  className="bg-muted/40 border border-border rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  data-testid="select-media-direction"
                >
                  {DIRECTION_OPTIONS.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <ul className="space-y-1.5">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between gap-3 text-sm px-3 py-2 rounded-md bg-card/70 border border-border"
                    data-testid={`selected-file-${index}`}
                  >
                    <span className="truncate">
                      {file.name}{" "}
                      <span className="text-xs text-muted-foreground">
                        · {file.sizeKb} KB
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSubmitToTeam}
                  data-testid="btn-submit-to-team"
                >
                  <Send className="w-3.5 h-3.5 mr-2" /> Submit to Veroxa
                </Button>
              </div>
            </div>
          )}

          {submitMessage && (
            <div
              className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-300"
              data-testid="text-submit-message"
              role="status"
            >
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{submitMessage}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] mt-4">
        <div className="space-y-4">
          <MediaSection
            title="Uploaded Media"
            items={uploadedMedia}
            empty="New uploads and items waiting for review appear here."
            onSelect={setSelectedItemId}
          />
          <MediaSection
            title="Ready Media"
            items={readyMedia}
            empty="Reviewed media that is ready or scheduled appears here."
            onSelect={setSelectedItemId}
          />
          <MediaSection
            title="Posted Media"
            items={postedMedia}
            empty="Posted or already-used media appears here."
            onSelect={setSelectedItemId}
          />
        </div>

        <MediaDetailCard item={selectedItem} />
      </div>
    </PortalLayout>
  );
}

function MediaSection({
  title,
  items,
  empty,
  onSelect,
}: {
  title: string;
  items: ClientMediaItem[];
  empty: string;
  onSelect: (id: string) => void;
}) {
  return (
    <Card
      className="bg-card border-border"
      data-testid={`section-${title.toLowerCase().replaceAll(" ", "-")}`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Inbox className="w-4 h-4 text-primary" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <SafePortalEmptyCard
            title={title}
            body={empty}
            testId={`empty-${title.toLowerCase().replaceAll(" ", "-")}`}
          />
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className="w-full text-left rounded-md border border-border bg-muted/20 px-3 py-3 hover:border-primary/40 transition-colors"
                  data-testid={`media-item-${item.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {item.note || item.description}
                      </p>
                    </div>
                    <MediaStatusBadge status={item.status} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function MediaDetailCard({ item }: { item?: ClientMediaItem }) {
  if (!item) {
    return (
      <SafePortalEmptyCard
        title="Media details"
        body="Click a media item to see where it is."
        testId="empty-media-detail"
      />
    );
  }
  const activeIndex = getClientMediaLifecycleIndex(item.status);

  return (
    <Card
      className="bg-card border-primary/20 lg:sticky lg:top-6 self-start"
      data-testid="card-media-detail"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base truncate">{item.name}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {item.description}
            </p>
          </div>
          <MediaStatusBadge status={item.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-video rounded-lg border border-border bg-muted/20 flex items-center justify-center">
          <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
        </div>

        <div className="space-y-2" data-testid="media-progress-tracker">
          {CLIENT_MEDIA_LIFECYCLE_STAGES.map((stage, index) => {
            const isDone = index <= activeIndex && item.status !== "Not usable";
            return (
              <div key={stage} className="flex items-center gap-2 text-sm">
                <span
                  className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] ${isDone ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}
                >
                  {index + 1}
                </span>
                <span
                  className={
                    isDone ? "text-foreground" : "text-muted-foreground"
                  }
                >
                  {stage}
                </span>
                {index < CLIENT_MEDIA_LIFECYCLE_STAGES.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-muted-foreground/40 ml-auto" />
                )}
              </div>
            );
          })}
        </div>

        {(item.note || item.direction) && (
          <div className="rounded-md border border-border bg-muted/20 p-3 text-xs text-muted-foreground space-y-1">
            {item.direction && (
              <p>
                <span className="text-foreground font-medium">Direction:</span>{" "}
                {item.direction}
              </p>
            )}
            {item.note && (
              <p>
                <span className="text-foreground font-medium">Note:</span>{" "}
                {item.note}
              </p>
            )}
          </div>
        )}

        {(item.scheduledPlatform || item.scheduledDate) && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <CalendarDays className="w-4 h-4 text-primary mt-0.5" />
            <span>
              {item.scheduledPlatform}{" "}
              {item.scheduledDate ? `· ${item.scheduledDate}` : ""}
            </span>
          </div>
        )}
        {item.postedLink && (
          <p className="text-xs text-emerald-300">
            Posted status: {item.postedLink}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
