import { useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Info,
  UploadCloud,
  X,
} from "lucide-react";
import { getWriteSafetyBanner } from "@/lib/data/writeReadiness";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  demoUploadCategoryLabels,
  type DemoRestaurantUploadKey,
  type DemoUploadAllowedCategory,
} from "@/data/uploadKeys/demoRestaurantUploadKeys";
import {
  demoUploadPriorityLabels,
  type DemoUploadPriority,
} from "@/data/uploadKeys/demoUploadSubmissions";
import { addLocalUploadSubmission } from "@/lib/uploadKeys/localUploadStore";

interface RestaurantUploadFlowProps {
  restaurant: DemoRestaurantUploadKey;
  onExit: () => void;
}

interface SelectedFile {
  name: string;
  sizeKb: number;
  kind: string;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const categoryOrder: DemoUploadAllowedCategory[] = [
  "food_photo",
  "kitchen_prep",
  "restaurant_atmosphere",
  "menu_special",
  "short_video",
  "other",
];

const priorityOrder: DemoUploadPriority[] = [
  "use_anytime",
  "use_next",
  "save_for_weekend",
  "google_post",
  "reel_tiktok_idea",
];

/**
 * App-style daily content upload flow (M013).
 *
 * Strictly local/demo:
 *   - No fetch, no FormData submit, no Supabase Storage upload.
 *   - File selection only reads name/size/type for display.
 *   - Submit produces a local demo submission ID (UP-DEMO-xxx).
 */
export function RestaurantUploadFlow({ restaurant, onExit }: RestaurantUploadFlowProps) {
  const [step, setStep] = useState<Step>(1);
  const [category, setCategory] = useState<DemoUploadAllowedCategory | null>(null);
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [pickerMessage, setPickerMessage] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [priority, setPriority] = useState<DemoUploadPriority>("use_anytime");
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allowedCategories = useMemo(
    () => categoryOrder.filter((c) => restaurant.allowedCategories.includes(c)),
    [restaurant],
  );

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    if (!list || list.length === 0) {
      setPickerMessage("No files selected.");
      return;
    }
    const next: SelectedFile[] = [];
    for (let i = 0; i < list.length; i++) {
      const f = list.item(i);
      if (!f) continue;
      next.push({
        name: f.name,
        sizeKb: Math.max(1, Math.round(f.size / 1024)),
        kind: f.type || "unknown",
      });
    }
    setFiles(next);
    setPickerMessage(`${next.length} file${next.length === 1 ? "" : "s"} ready (local preview only).`);
  }

  function removeFile(index: number) {
    setFiles((curr) => curr.filter((_, i) => i !== index));
  }

  function handleSubmitDemo() {
    // Local demo only — no network, no Supabase write, no Storage upload.
    // Persist metadata to sessionStorage so the Team Upload Inbox can see
    // the submission within the same browser session.
    const id = `UP-DEMO-${String(Math.floor(100 + Math.random() * 900))}`;
    if (category) {
      const primary = files[0];
      // Never persist user filenames (may contain names/locations/dates)
      // or raw notes (may contain emails/phones). The store sanitizes both.
      const fileKind: "image" | "video" =
        primary && primary.kind.startsWith("video") ? "video" : "image";
      addLocalUploadSubmission({
        id,
        restaurantId: restaurant.restaurantId,
        restaurantName: restaurant.restaurantName,
        category,
        priority,
        note,
        fileCount: files.length,
        fileKind,
        submittedAtLabel: "Just now",
      });
    }
    setSubmissionId(id);
    setStep(6);
  }

  function resetFlow() {
    setStep(1);
    setCategory(null);
    setFiles([]);
    setPickerMessage(null);
    setNote("");
    setPriority("use_anytime");
    setSubmissionId(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const canAdvanceFromStep2 = files.length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Restaurant Upload
            </p>
            <h1 className="text-xl font-bold leading-tight" data-testid="upload-flow-restaurant-name">
              {restaurant.restaurantName}
            </h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onExit}
            className="text-muted-foreground"
            data-testid="btn-upload-exit"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Exit
          </Button>
        </div>

        <div
          className="text-[11px] text-muted-foreground/80 mb-3"
          data-testid="banner-writes-disabled-upload-flow"
        >
          {getWriteSafetyBanner()}
        </div>
        <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/90" data-testid="upload-flow-demo-only-label">
          Demo-only upload-key preview. No live storage is connected, and nothing is published from this flow.
        </div>

        {/* Progress dots */}
        {step < 6 && (
          <div className="flex items-center gap-1.5 mb-6" aria-label="Upload progress">
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className={`h-1.5 rounded-full flex-1 ${
                  n <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        )}

        {/* Step 1 — content type */}
        {step === 1 && (
          <section data-testid="upload-step-1">
            <h2 className="text-lg font-semibold mb-1">What are you uploading?</h2>
            <p className="text-sm text-muted-foreground mb-4">Pick the closest match.</p>
            <div className="grid grid-cols-1 gap-2">
              {allowedCategories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCategory(c);
                    setStep(2);
                  }}
                  className="w-full text-left px-4 py-4 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors text-base font-medium"
                  data-testid={`upload-category-${c}`}
                >
                  {demoUploadCategoryLabels[c]}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Step 2 — file select */}
        {step === 2 && category && (
          <section data-testid="upload-step-2">
            <h2 className="text-lg font-semibold mb-1">Add photos or video</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {demoUploadCategoryLabels[category]} — pick from your phone or camera.
            </p>
            <label
              htmlFor="restaurant-upload-input"
              className="block w-full px-4 py-8 rounded-xl border-2 border-dashed border-border bg-card text-center cursor-pointer hover:bg-accent/40 transition-colors"
            >
              <UploadCloud className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="font-medium">Tap to choose files</p>
              <p className="text-xs text-muted-foreground mt-1">
                Photos and short videos welcome (local preview only — no real upload occurs in this demo).
              </p>
            </label>
            <input
              id="restaurant-upload-input"
              ref={inputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="sr-only"
              onChange={handleFileChange}
              data-testid="input-upload-files"
            />
            {pickerMessage && (
              <p className="text-xs text-muted-foreground mt-3" data-testid="upload-picker-message">
                {pickerMessage}
              </p>
            )}
            {files.length > 0 && (
              <ul className="mt-4 space-y-2">
                {files.map((f, i) => (
                  <li
                    key={`${f.name}-${i}`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-card text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{f.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {f.kind || "file"} · {f.sizeKb} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                      aria-label={`Remove ${f.name}`}
                      data-testid={`btn-remove-file-${i}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-between gap-2 mt-6">
              <Button variant="outline" onClick={() => setStep(1)} data-testid="btn-upload-back-1">
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!canAdvanceFromStep2}
                data-testid="btn-upload-next-2"
              >
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </section>
        )}

        {/* Step 3 — note */}
        {step === 3 && (
          <section data-testid="upload-step-3">
            <h2 className="text-lg font-semibold mb-1">Anything Veroxa should know?</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Optional. A short note helps the team use your content the right way.
            </p>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder='e.g. "Use this for lunch special", "Please use this next", "Chef preparing kabobs"'
              rows={4}
              data-testid="textarea-upload-note"
            />
            <div className="flex justify-between gap-2 mt-6">
              <Button variant="outline" onClick={() => setStep(2)} data-testid="btn-upload-back-2">
                Back
              </Button>
              <Button onClick={() => setStep(4)} data-testid="btn-upload-next-3">
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </section>
        )}

        {/* Step 4 — priority */}
        {step === 4 && (
          <section data-testid="upload-step-4">
            <h2 className="text-lg font-semibold mb-1">How should we use it?</h2>
            <p className="text-sm text-muted-foreground mb-4">Optional — pick one.</p>
            <div className="grid grid-cols-1 gap-2">
              {priorityOrder.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-base font-medium transition-colors ${
                    priority === p
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:bg-accent/40"
                  }`}
                  data-testid={`upload-priority-${p}`}
                >
                  {demoUploadPriorityLabels[p]}
                </button>
              ))}
            </div>
            <div className="flex justify-between gap-2 mt-6">
              <Button variant="outline" onClick={() => setStep(3)} data-testid="btn-upload-back-3">
                Back
              </Button>
              <Button onClick={() => setStep(5)} data-testid="btn-upload-next-4">
                Review <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </section>
        )}

        {/* Step 5 — review + submit */}
        {step === 5 && category && (
          <section data-testid="upload-step-5">
            <h2 className="text-lg font-semibold mb-1">Ready to send</h2>
            <p className="text-sm text-muted-foreground mb-4">
              One last check, then we'll let the Veroxa team know.
            </p>
            <Card className="mb-4">
              <CardContent className="p-4 space-y-3 text-sm">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Category</p>
                  <p className="font-medium">{demoUploadCategoryLabels[category]}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Files</p>
                  <p className="font-medium">
                    {files.length} item{files.length === 1 ? "" : "s"} selected
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Request</p>
                  <Badge variant="secondary">{demoUploadPriorityLabels[priority]}</Badge>
                </div>
                {note.trim() && (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Note</p>
                    <p className="text-foreground/90 whitespace-pre-wrap">{note.trim()}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <UploadGuidance />
            <div className="flex justify-between gap-2 mt-6">
              <Button variant="outline" onClick={() => setStep(4)} data-testid="btn-upload-back-4">
                Back
              </Button>
              <Button
                onClick={handleSubmitDemo}
                className="font-semibold"
                data-testid="btn-upload-submit"
              >
                Submit to Veroxa
              </Button>
            </div>
          </section>
        )}

        {/* Step 6 — confirmation */}
        {step === 6 && submissionId && (
          <section
            className="text-center py-6 animate-in fade-in duration-300"
            data-testid="upload-step-confirmation"
          >
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold mb-1">Submitted to Veroxa Team</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Reference: <span className="font-mono">{submissionId}</span>
            </p>
            <Card className="bg-amber-500/5 border-amber-500/30 text-left">
              <CardContent className="p-4 flex items-start gap-3 text-sm">
                <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-amber-200/90">
                  No real upload occurred in this demo. The Veroxa team will see this submission in
                  their local Upload Inbox.
                </p>
              </CardContent>
            </Card>
            <div className="flex flex-col gap-2 mt-6">
              <Button onClick={resetFlow} className="w-full" data-testid="btn-upload-another">
                Upload more
              </Button>
              <Button
                variant="outline"
                onClick={onExit}
                className="w-full"
                data-testid="btn-upload-done"
              >
                Done
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function UploadGuidance() {
  return (
    <details className="mt-2 group">
      <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
        What makes a good upload?
      </summary>
      <div className="mt-2 px-4 py-3 rounded-lg bg-muted/40 text-sm space-y-2">
        <p className="font-medium text-foreground">Good uploads</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
          <li>Clear food close-ups with good lighting</li>
          <li>Short prep clips (10–20 seconds)</li>
          <li>Restaurant atmosphere shots</li>
          <li>Menu specials and new items</li>
        </ul>
        <p className="font-medium text-foreground pt-1">Please avoid</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
          <li>Blurry or very dark shots</li>
          <li>Customer faces unless permission was given</li>
          <li>Private staff or customer information</li>
        </ul>
        <p className="text-xs text-muted-foreground pt-1">
          More daily content helps Veroxa make better posts and updates.
        </p>
      </div>
    </details>
  );
}
