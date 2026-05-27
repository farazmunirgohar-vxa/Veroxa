import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  UploadCloud,
  Sparkles,
  Image as ImageIcon,
  CalendarDays,
  Clock,
  CheckCircle2,
  Instagram,
  Facebook,
  Loader2,
  X,
  ShieldAlert,
} from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";

type Platform = "Instagram" | "Facebook";

interface DemoDraft {
  number: 1 | 2 | 3;
  angle: string;
  caption: string;
  cta: string;
  platform: Platform;
  day: string;
  time: string;
}

const DEMO_DRAFTS: DemoDraft[] = [
  {
    number: 1,
    angle: "Lunch Special",
    caption:
      "Fresh, hot, and ready for your next lunch break. Stop by today and enjoy a plate made with care.",
    cta: "Visit us today",
    platform: "Instagram",
    day: "Friday",
    time: "11:30 AM",
  },
  {
    number: 2,
    angle: "Behind the Scenes",
    caption:
      "A closer look at what goes into every plate before it reaches the table.",
    cta: "Follow for more kitchen moments",
    platform: "Facebook",
    day: "Saturday",
    time: "2:00 PM",
  },
  {
    number: 3,
    angle: "Craving / Dinner Push",
    caption: "Dinner plans? This plate is ready when you are.",
    cta: "Bring the family tonight",
    platform: "Instagram",
    day: "Sunday",
    time: "6:15 PM",
  },
];

const LOADING_STEPS = [
  "Reviewing image quality...",
  "Detecting food angle...",
  "Creating captions...",
  "Choosing posting times...",
];

const PLACEHOLDER_LABEL =
  "Sample food photo — no image uploaded yet";

type Phase = "upload" | "generating" | "results";

function PlatformIcon({ platform }: { platform: Platform }) {
  if (platform === "Instagram") {
    return <Instagram className="h-4 w-4" />;
  }
  return <Facebook className="h-4 w-4" />;
}

function PlaceholderImage() {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-amber-500/15 via-rose-500/10 to-fuchsia-500/15 text-amber-200/70"
      data-testid="placeholder-food-image"
    >
      <ImageIcon className="h-10 w-10" />
      <p className="px-4 text-center text-xs">{PLACEHOLDER_LABEL}</p>
    </div>
  );
}

export default function ClientAiDraftPreview() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("upload");
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [pickerMessage, setPickerMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Revoke object URL when image changes / on unmount to avoid leaks.
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  // Simulated loading-step ticker.
  useEffect(() => {
    if (phase !== "generating") return;
    setLoadingStepIndex(0);
    const interval = window.setInterval(() => {
      setLoadingStepIndex((prev) => {
        if (prev >= LOADING_STEPS.length - 1) {
          window.clearInterval(interval);
          window.setTimeout(() => setPhase("results"), 500);
          return prev;
        }
        return prev + 1;
      });
    }, 700);
    return () => window.clearInterval(interval);
  }, [phase]);

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPickerMessage("Please choose an image file.");
      return;
    }
    setPickerMessage(null);
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(URL.createObjectURL(file));
    setFileName(file.name);
    setPhase("upload");
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    handleFile(e.target.files?.[0]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  }

  function clearImage() {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    setFileName(null);
    setPhase("upload");
  }

  function startGenerate() {
    setPhase("generating");
  }

  function resetAll() {
    clearImage();
    setPhase("upload");
  }

  const stepActive: Record<"upload" | "drafts" | "schedule", boolean> = {
    upload: phase === "upload",
    drafts: phase === "generating",
    schedule: phase === "results",
  };

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2
            className="text-2xl md:text-3xl font-bold tracking-tight text-foreground"
            data-testid="header-client-ai-draft-preview"
          >
            AI Draft Preview
          </h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Upload one food photo and see how Veroxa turns it into ready-to-schedule content.
          </p>
        </div>
        <Badge
          variant="outline"
          className="self-start border-amber-500/40 bg-amber-500/10 text-amber-300 md:self-auto"
          data-testid="badge-demo-preview"
        >
          <Sparkles className="mr-1 h-3 w-3" />
          Demo Preview — simulated AI only
        </Badge>
      </div>

      <DemoOnlyBanner
        message="Demo only — simulated AI. Nothing is uploaded, posted, or stored. The image preview disappears on refresh."
        testId="banner-client-ai-draft-preview"
      />

      {/* Progress row */}
      <div
        className="mb-6 grid grid-cols-3 gap-2 rounded-lg border border-border bg-card/40 p-3 text-xs md:text-sm"
        data-testid="progress-row"
      >
        {[
          { key: "upload", label: "1. Upload", active: stepActive.upload },
          { key: "drafts", label: "2. AI Drafts", active: stepActive.drafts },
          { key: "schedule", label: "3. Schedule Preview", active: stepActive.schedule },
        ].map((step) => (
          <div
            key={step.key}
            data-testid={`progress-step-${step.key}`}
            className={`flex items-center justify-center gap-2 rounded-md px-2 py-2 text-center transition ${
              step.active
                ? "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/40"
                : "text-muted-foreground"
            }`}
          >
            <span className="font-medium">{step.label}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload card */}
        <Card data-testid="card-upload">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <UploadCloud className="h-5 w-5 text-amber-300" />
              Upload one food photo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed transition ${
                isDragging
                  ? "border-amber-400 bg-amber-500/10"
                  : "border-border bg-background/40 hover:border-amber-500/50"
              }`}
              data-testid="dropzone"
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={fileName ?? "Uploaded food preview"}
                  className="h-full w-full object-cover"
                  data-testid="image-preview"
                />
              ) : (
                <PlaceholderImage />
              )}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onInputChange}
              data-testid="input-file"
            />

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => inputRef.current?.click()}
                data-testid="button-choose-image"
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                {imageUrl ? "Change image" : "Choose image"}
              </Button>
              {imageUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={clearImage}
                  data-testid="button-clear-image"
                >
                  <X className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              )}
              {fileName && (
                <span
                  className="text-xs text-muted-foreground"
                  data-testid="text-filename"
                >
                  {fileName}
                </span>
              )}
            </div>

            {pickerMessage && (
              <p
                className="flex items-center gap-2 text-xs text-amber-400"
                data-testid="text-picker-message"
              >
                <ShieldAlert className="h-3 w-3" />
                {pickerMessage}
              </p>
            )}

            <Separator />

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                No upload happens. The image stays in your browser only.
              </p>
              <Button
                type="button"
                onClick={startGenerate}
                disabled={phase === "generating"}
                data-testid="button-generate-drafts"
                className="bg-amber-500 text-amber-950 hover:bg-amber-400"
              >
                {phase === "generating" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate 3 Drafts
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Status / Explanation card */}
        <Card data-testid="card-status">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Sparkles className="h-5 w-5 text-amber-300" />
              What happens next
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {phase === "generating" ? (
              <ul className="space-y-2" data-testid="list-loading-steps">
                {LOADING_STEPS.map((step, idx) => (
                  <li
                    key={step}
                    className={`flex items-center gap-2 ${
                      idx <= loadingStepIndex
                        ? "text-foreground"
                        : "text-muted-foreground/60"
                    }`}
                    data-testid={`loading-step-${idx}`}
                  >
                    {idx < loadingStepIndex ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : idx === loadingStepIndex ? (
                      <Loader2 className="h-4 w-4 animate-spin text-amber-300" />
                    ) : (
                      <span className="h-4 w-4 rounded-full border border-border" />
                    )}
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">
                Veroxa uses your uploaded restaurant media to create content
                angles, captions, and posting times. In the live system, your
                Veroxa team reviews everything before anything is posted.
              </p>
            )}
            <Separator />
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-border text-muted-foreground">
                Demo only
              </Badge>
              <Badge variant="outline" className="border-border text-muted-foreground">
                Simulated AI
              </Badge>
              <Badge variant="outline" className="border-border text-muted-foreground">
                Not posted
              </Badge>
              <Badge variant="outline" className="border-border text-muted-foreground">
                No real upload
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Draft cards */}
      {phase === "results" && (
        <section className="mt-8" data-testid="section-drafts">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground md:text-xl">
              3 AI-generated drafts
            </h3>
            <Button
              type="button"
              variant="ghost"
              onClick={resetAll}
              data-testid="button-reset"
            >
              Start over
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {DEMO_DRAFTS.map((draft) => (
              <Card
                key={draft.number}
                data-testid={`card-draft-${draft.number}`}
                className="flex h-full flex-col"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className="border-amber-500/40 bg-amber-500/10 text-amber-300"
                    >
                      Draft {draft.number}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                      data-testid={`badge-status-${draft.number}`}
                    >
                      Ready to Schedule
                    </Badge>
                  </div>
                  <CardTitle className="mt-2 text-base md:text-lg">
                    {draft.angle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3 text-sm">
                  <p className="text-muted-foreground">{draft.caption}</p>
                  <div className="rounded-md border border-border bg-background/40 p-2 text-xs">
                    <span className="text-muted-foreground">CTA: </span>
                    <span className="text-foreground">{draft.cta}</span>
                  </div>
                  <div className="mt-auto flex flex-wrap items-center gap-2 text-xs">
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 border-border"
                    >
                      <PlatformIcon platform={draft.platform} />
                      {draft.platform}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 border-border"
                    >
                      <Clock className="h-3 w-3" />
                      {draft.day} {draft.time}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Schedule preview */}
          <Card className="mt-6" data-testid="card-schedule">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <CalendarDays className="h-5 w-5 text-amber-300" />
                Visual schedule preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {DEMO_DRAFTS.map((draft) => (
                  <li
                    key={draft.number}
                    data-testid={`schedule-row-${draft.number}`}
                    className="flex flex-col gap-2 rounded-md border border-border bg-background/40 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/15 text-xs font-semibold text-amber-300">
                        {draft.number}
                      </span>
                      <div>
                        <p className="font-medium text-foreground">
                          {draft.day} {draft.time}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {draft.angle}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="flex w-fit items-center gap-1 border-border"
                    >
                      <PlatformIcon platform={draft.platform} />
                      {draft.platform}
                    </Badge>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-xs text-muted-foreground">
                One photo, three posts, three scheduled moments — simulated for
                preview only.
              </p>
            </CardContent>
          </Card>
        </section>
      )}
    </PortalLayout>
  );
}
