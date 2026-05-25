import { useMemo, useRef, useState, type ChangeEvent } from "react";
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
} from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import {
  getDefaultGuidance,
  getGuidanceForRestaurantType,
  getRestaurantTypeOptions,
  type RestaurantType,
} from "@/lib/mediaGuidance";

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
  const inputRef = useRef<HTMLInputElement>(null);

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
    // DEMO ONLY — file metadata is read into local state and never uploaded.
    // No fetch, no FormData, no Supabase Storage, no API call.
    const picked = Array.from(e.target.files ?? []).map<SelectedFile>((f) => ({
      name: f.name,
      sizeKb: Math.max(1, Math.round(f.size / 1024)),
      kind: f.type || "unknown",
    }));
    if (picked.length === 0) return;
    setFiles((prev) => [...prev, ...picked]);
    setPickerMessage(
      "Files selected — preview only. Nothing is uploaded or stored in this demo.",
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

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-3xl font-bold tracking-tight">Media Library</h2>
          <Badge
            variant="outline"
            className="border-amber-500/40 text-amber-400 bg-amber-500/10"
            data-testid="badge-demo-only"
          >
            Demo only — no real uploads
          </Badge>
        </div>
        <p className="text-muted-foreground max-w-3xl">
          Demo preview of how restaurants will upload photos and videos for
          Veroxa to review.
        </p>
        <div className="flex items-start gap-2 text-sm text-muted-foreground max-w-3xl">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Files selected here are not uploaded or stored.</span>
        </div>
      </div>

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
                  Or choose files from your device. Nothing is uploaded in the
                  demo.
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
                  Choose Files — Coming Soon
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
                <div className="mt-5 space-y-2" data-testid="list-selected-files">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Selected files (preview only)
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
                Static demo statuses — illustrates how the team would tag
                uploaded media for downstream use.
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
                  Demo preview only — no files are stored.
                </span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </PortalLayout>
  );
}
