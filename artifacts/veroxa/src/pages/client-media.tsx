import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { ImageIcon, Inbox, Send, UploadCloud, X } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClientMediaTracker } from "@/components/client/ClientMediaTracker";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import {
  RealPortalReviewNotice,
  SafePortalEmptyCard,
} from "@/components/RealPortalSafeStates";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { clientTeamWorkRepository } from "@/lib/repositories";
import { createWorkflowItem } from "@/lib/workflow/workflowRepository";
import { veroxaWriteAdapter } from "@/lib/data/writeAdapter";
import { WRITES_ENABLED } from "@/lib/data/writeReadiness";
import { getDevClientIdFromEnv } from "@/lib/data/devClientId";
import { useActiveClientPortalContext } from "@/lib/clientPortalContext";
import {
  getClientMediaNextStepCopy,
  getClientMediaStatusTone,
  normalizeClientMediaDisplayStatus,
  type ClientMediaDisplayStatus,
} from "@/lib/clientMediaLifecycle";

const DIRECTION_OPTIONS = [
  { value: "", label: "No direction — use where helpful" },
  { value: "Use this next", label: "Use this next" },
  { value: "Save for later", label: "Save for later" },
  { value: "Push a special/event", label: "Push a special/event" },
  { value: "Avoid this item", label: "Avoid this item" },
  { value: "General note", label: "General note" },
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
  source: "upload" | "ready" | "posted";
}

const SUBMISSION_KEY_PREFIX = "veroxa.mediaSubmissionKeys.v1";

function getSubmissionKeyStore(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.sessionStorage.getItem(SUBMISSION_KEY_PREFIX);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(
      Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : [],
    );
  } catch {
    return new Set();
  }
}

function saveSubmissionKeyStore(keys: Set<string>): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    SUBMISSION_KEY_PREFIX,
    JSON.stringify([...keys].slice(-100)),
  );
}

function buildClientSubmissionKey(
  clientId: string,
  file: SelectedFile,
  note: string,
): string {
  return [clientId, file.name, file.sizeKb, file.kind, note]
    .join("|")
    .toLowerCase();
}

function hasRecordedSubmissionKey(key: string): boolean {
  return getSubmissionKeyStore().has(key);
}

function recordSubmissionKey(key: string): void {
  const keys = getSubmissionKeyStore();
  keys.add(key);
  saveSubmissionKeyStore(keys);
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
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("media");
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const { activeClientId, isRealClientSession } =
    useActiveClientPortalContext();
  const mode = useRealPortalDataMode();
  const canUseFixtureData =
    Boolean(activeClientId) &&
    (mode.allowDemoFixtures || mode.isLiveDataConnected);

  const repositoryMediaItems = useMemo<ClientMediaItem[]>(() => {
    if (!canUseFixtureData) return [];
    return clientTeamWorkRepository
      .getClientVisibleSubmissions(activeClientId!)
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
          source:
            status === "Posted" || status === "Already used"
              ? "posted"
              : status === "Ready" || status === "Scheduled"
                ? "ready"
                : "upload",
        };
      });
  }, [activeClientId, canUseFixtureData]);

  const mediaItems = [...localUploads, ...repositoryMediaItems];
  const selectedMedia = selectedMediaId
    ? (mediaItems.find((item) => item.id === selectedMediaId) ?? null)
    : null;
  const uploadedMedia = mediaItems.filter((item) => item.source === "upload");
  const readyMedia = mediaItems.filter((item) => item.source === "ready");
  const postedMedia = mediaItems.filter((item) => item.source === "posted");

  const handleSubmitToTeam = async () => {
    if (files.length === 0) return;
    const workflowClientId =
      canUseFixtureData && activeClientId
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
    setSelectedMediaId(createdItems[0]?.id ?? null);
    setFiles([]);
    setSubmitNote("");
    setDirection("");
    setPickerMessage(null);
    setSubmitMessage(
      "Received. Veroxa can review this session item here and will follow up if anything else is needed.",
    );

    const devClientId =
      isRealClientSession && activeClientId
        ? activeClientId
        : getDevClientIdFromEnv();
    if (!WRITES_ENABLED || !devClientId) return;

    const results = await Promise.all(
      filesToWrite.map(async (file) => {
        const submissionKey = buildClientSubmissionKey(
          devClientId,
          file,
          noteWithDirection,
        );
        if (hasRecordedSubmissionKey(submissionKey))
          return "duplicate-skipped" as const;
        const result = await veroxaWriteAdapter.createUploadSubmission({
          restaurantId: devClientId,
          uploadKeyId: null,
          category: file.kind.startsWith("video/")
            ? "short_video"
            : file.kind.startsWith("image/")
              ? "food_photo"
              : "other",
          priority: "use_anytime",
          note: noteWithDirection || null,
          submittedByLabel: "client_portal",
        });
        if (result.ok) {
          recordSubmissionKey(submissionKey);
          return "saved" as const;
        }
        return result.status === "disabled"
          ? ("disabled" as const)
          : ("failed" as const);
      }),
    );

    if (results.some((result) => result === "failed")) {
      setSubmitMessage(
        "Received in this session. The media note could not be saved for later review; please try again if needed.",
      );
    } else if (results.some((result) => result === "saved")) {
      setSubmitMessage(
        "Received by Veroxa for review. File storage is not connected yet, so this session keeps the tracker visible here.",
      );
    } else if (results.every((result) => result === "duplicate-skipped")) {
      setSubmitMessage(
        "Already received in this browser session. No duplicate item was created.",
      );
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            className="text-3xl font-bold tracking-tight"
            data-testid="header-client-media"
          >
            Media
          </h2>
          <p className="mt-1 max-w-2xl text-sm md:text-base text-muted-foreground">
            Drop off photos and videos, then track what is uploaded, ready, or
            posted.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => inputRef.current?.click()}
          data-testid="button-quick-upload"
        >
          <UploadCloud className="mr-2 h-4 w-4" /> Upload media
        </Button>
      </div>

      <Card
        className="border-primary/30 bg-card"
        data-testid="card-upload-dropoff"
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UploadCloud className="h-4 w-4 text-primary" /> Upload media
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Add a quick note if Veroxa should know a dish, event, or preference.
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
            <ImageIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">
              Choose restaurant photos or videos
            </p>
            <p className="mb-3 text-xs text-muted-foreground">
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
              <p className="mt-3 text-xs text-amber-300" role="status">
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
                  className="w-full resize-none rounded-md border border-border bg-muted/40 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  data-testid="input-submit-note"
                />
                <select
                  value={direction}
                  onChange={(event) => setDirection(event.target.value)}
                  className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
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
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-card/70 px-3 py-2 text-sm"
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
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleSubmitToTeam}
                  data-testid="button-submit-media"
                >
                  <Send className="mr-2 h-4 w-4" /> Submit media
                </Button>
              </div>
            </div>
          )}
          {submitMessage && (
            <p
              className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-200"
              role="status"
            >
              {submitMessage}
            </p>
          )}
        </CardContent>
      </Card>

      <MediaDetailCard item={selectedMedia} />

      <div className="grid gap-4 lg:grid-cols-3">
        <MediaSection
          title="Uploaded Media"
          items={uploadedMedia}
          empty="New uploads and items waiting for review appear here."
          selectedId={selectedMedia?.id ?? null}
          onSelect={setSelectedMediaId}
        />
        <MediaSection
          title="Ready Media"
          items={readyMedia}
          empty="Reviewed media that is ready or scheduled appears here."
          selectedId={selectedMedia?.id ?? null}
          onSelect={setSelectedMediaId}
        />
        <MediaSection
          title="Posted Media"
          items={postedMedia}
          empty="Posted or already-used media appears here."
          selectedId={selectedMedia?.id ?? null}
          onSelect={setSelectedMediaId}
        />
      </div>
    </PortalLayout>
  );
}

function MediaDetailCard({ item }: { item: ClientMediaItem | null }) {
  return (
    <Card className="border-primary/20 bg-card" data-testid="card-media-detail">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ImageIcon className="h-4 w-4 text-primary" /> Media details
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!item ? (
          <SafePortalEmptyCard
            title="No media selected"
            body="Select a media item to see status details, next step, and Veroxa notes."
            testId="empty-media-detail"
          />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{item.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <MediaStatusBadge status={item.status} />
            </div>
            <ClientMediaTracker status={item.status} />
            <div className="grid gap-2 md:grid-cols-2">
              <div className="rounded-md border border-border bg-muted/20 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Next step
                </p>
                <p className="mt-1 text-sm">
                  {getClientMediaNextStepCopy(item.status)}
                </p>
              </div>
              <div className="rounded-md border border-border bg-muted/20 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Schedule / use
                </p>
                <p className="mt-1 text-sm">
                  {item.status === "Scheduled"
                    ? "Planned for an upcoming update."
                    : item.status === "Posted" || item.status === "Already used"
                      ? "Already used in Veroxa work."
                      : "No posting date is shown yet."}
                </p>
              </div>
              <div className="rounded-md border border-border bg-muted/20 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Note
                </p>
                <p className="mt-1 text-sm">
                  {item.note || "No extra note yet."}
                </p>
              </div>
              <div className="rounded-md border border-border bg-muted/20 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Direction
                </p>
                <p className="mt-1 text-sm">
                  {item.direction || "No direction added."}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MediaSection({
  title,
  items,
  empty,
  selectedId,
  onSelect,
}: {
  title: string;
  items: ClientMediaItem[];
  empty: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <Card
      className="border-border bg-card"
      data-testid={`section-${title.toLowerCase().replaceAll(" ", "-")}`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Inbox className="h-4 w-4 text-primary" /> {title}
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
                  className={`w-full rounded-md border px-3 py-3 text-left transition-colors ${selectedId === item.id ? "border-primary/40 bg-primary/10 ring-1 ring-primary/30" : "border-border bg-muted/20 hover:border-primary/30"}`}
                  aria-current={selectedId === item.id ? "true" : undefined}
                  aria-label={`Select ${item.name} for media status details`}
                  data-testid={`media-item-${item.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {item.name}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {item.note || item.description}
                      </p>
                    </div>
                    <MediaStatusBadge status={item.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {item.direction && (
                      <Badge
                        variant="outline"
                        className="border-primary/20 bg-primary/5 text-[10px] text-primary"
                      >
                        {item.direction}
                      </Badge>
                    )}
                    {selectedId === item.id && (
                      <span className="text-[11px] text-primary">Selected</span>
                    )}
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
