import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DemoImage } from "@/data/demo/demoImages";

/**
 * Shared demo-visual components.
 *
 * Every component here renders DEMO-ONLY content. Nothing fetches
 * from a real backend, performs uploads, or calls an AI provider.
 * All images come from the `demoImages` catalog.
 */

// ─── DemoAIBadge ─────────────────────────────────────────────────
export function DemoAIBadge({
  label = "Simulated AI",
  testId,
}: {
  label?: string;
  testId?: string;
}) {
  return (
    <Badge
      variant="outline"
      className="border-amber-500/40 bg-amber-500/10 text-amber-300"
      data-testid={testId}
    >
      <Sparkles className="mr-1 h-3 w-3" />
      {label}
    </Badge>
  );
}

// ─── DemoStatusPill ─────────────────────────────────────────────
type StatusTone = "ready" | "warn" | "good" | "promo" | "info" | "neutral";

const STATUS_TONE: Record<StatusTone, string> = {
  ready: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  warn: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  good: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  promo: "border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300",
  info: "border-violet-500/40 bg-violet-500/10 text-violet-300",
  neutral: "border-border text-muted-foreground",
};

export function DemoStatusPill({
  tone = "neutral",
  children,
  testId,
}: {
  tone?: StatusTone;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={STATUS_TONE[tone]}
      data-testid={testId}
    >
      {children}
    </Badge>
  );
}

// ─── DemoImageCard ───────────────────────────────────────────────
export function DemoImageCard({
  image,
  title,
  subtitle,
  tone = "neutral",
  status,
  meta,
  testId,
}: {
  image: DemoImage;
  title?: string;
  subtitle?: string;
  tone?: StatusTone;
  status?: string;
  meta?: string;
  testId?: string;
}) {
  return (
    <Card
      className="overflow-hidden bg-card/60 border-border/60"
      data-testid={testId}
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-muted/30">
        <img
          src={image.url}
          alt={image.alt}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
      <CardContent className="space-y-2 p-3 text-sm">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-foreground line-clamp-1">
            {title ?? image.title}
          </p>
          {status && (
            <DemoStatusPill tone={tone} testId={testId ? `${testId}-status` : undefined}>
              {status}
            </DemoStatusPill>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground line-clamp-2">{subtitle}</p>
        )}
        {meta && (
          <p className="text-[11px] text-muted-foreground/80">{meta}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── DemoMediaPreviewCard ────────────────────────────────────────
// A compact thumbnail + label tile used inside dashboards / strips.
export function DemoMediaPreviewCard({
  image,
  label,
  caption,
  testId,
}: {
  image: DemoImage;
  label: string;
  caption?: string;
  testId?: string;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-md border border-border bg-muted/20 p-2"
      data-testid={testId}
    >
      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-muted/30">
        <img
          src={image.url}
          alt={image.alt}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground">{label}</p>
        {caption && (
          <p className="truncate text-[11px] text-muted-foreground">{caption}</p>
        )}
      </div>
    </div>
  );
}

// ─── DemoSchedulePreview ─────────────────────────────────────────
export interface DemoScheduleItem {
  id: string;
  image: DemoImage;
  day: string;
  time: string;
  platform: string;
  label: string;
}

export function DemoSchedulePreview({
  items,
  testId,
}: {
  items: DemoScheduleItem[];
  testId?: string;
}) {
  return (
    <ol
      className="space-y-2"
      data-testid={testId ?? "demo-schedule-preview"}
    >
      {items.map((item, idx) => (
        <li
          key={item.id}
          data-testid={`demo-schedule-${item.id}`}
          className="flex items-center gap-3 rounded-md border border-border bg-background/40 p-2"
        >
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-semibold text-amber-300">
            {idx + 1}
          </span>
          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md">
            <img
              src={item.image.url}
              alt={item.image.alt}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">
              {item.day} {item.time} — {item.label}
            </p>
            <p className="text-[11px] text-muted-foreground">{item.platform}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

// ─── DemoFlowTimeline ────────────────────────────────────────────
export interface DemoFlowStep {
  key: string;
  label: string;
  caption?: string;
}

export function DemoFlowTimeline({
  steps,
  testId,
}: {
  steps: DemoFlowStep[];
  testId?: string;
}) {
  return (
    <div
      className="flex flex-col gap-3 md:flex-row md:items-stretch"
      data-testid={testId ?? "demo-flow-timeline"}
    >
      {steps.map((step, idx) => (
        <div key={step.key} className="flex flex-1 items-stretch gap-3">
          <div className="flex flex-1 flex-col rounded-md border border-border bg-muted/20 p-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/15 text-[11px] font-semibold text-amber-300">
                {idx + 1}
              </span>
              <p className="text-sm font-medium text-foreground">{step.label}</p>
            </div>
            {step.caption && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                {step.caption}
              </p>
            )}
          </div>
          {idx < steps.length - 1 && (
            <div className="hidden self-center text-muted-foreground/50 md:block">
              →
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
