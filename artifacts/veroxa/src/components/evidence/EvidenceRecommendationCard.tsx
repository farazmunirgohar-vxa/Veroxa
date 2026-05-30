import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EvidenceReasonStack } from "./EvidenceReasonStack";
import type { EvidenceRecommendation } from "@/lib/evidence/evidenceSelectionEngine";

interface Props {
  recommendation: EvidenceRecommendation;
  variant?: "client" | "team";
  ctaHref?: string;
  ctaLabel?: string;
  testId?: string;
}

export function EvidenceRecommendationCard({
  recommendation,
  variant = "team",
  ctaHref,
  ctaLabel,
  testId,
}: Props) {
  const { recommendationTitle, confidenceScore, evidenceReasons, riskNotes, nextStep, selectedItem } =
    recommendation;

  const isClient = variant === "client";
  const isTeam   = variant === "team";

  const cardTitle = isClient ? "Smart Recommendation" : "Evidence-Based Pick";
  const cardDesc = isClient
    ? "Veroxa recommends this next step based on your recent content performance, uploaded media, and upcoming schedule."
    : "Selected by the evidence engine based on historical performance, media quality, posting schedule, and client context.";

  const confidenceColor =
    confidenceScore >= 85
      ? "text-emerald-300"
      : confidenceScore >= 70
      ? "text-amber-300"
      : "text-rose-300";

  const reasonsToShow = isClient ? evidenceReasons.slice(0, 3) : evidenceReasons;

  return (
    <Card className="bg-card border-primary/30" data-testid={testId}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0" />
              <CardTitle className="text-base font-semibold">{cardTitle}</CardTitle>
              <Badge
                variant="outline"
                className="border-amber-500/40 bg-amber-500/10 text-amber-300 text-[10px]"
              >
                Demo only
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{cardDesc}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className={`text-2xl font-bold tabular-nums ${confidenceColor}`}>
              {confidenceScore}%
            </p>
            <p className="text-[10px] text-muted-foreground">confidence</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Recommendation */}
        <div className="rounded-md bg-primary/5 border border-primary/20 p-3">
          <p className="text-sm font-semibold leading-snug">{recommendationTitle}</p>
          {!isClient && (
            <p className="text-[11px] text-muted-foreground mt-1">Selected: {selectedItem}</p>
          )}
        </div>

        {/* Confidence bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
              Confidence score
            </span>
            <span className={`text-xs font-bold tabular-nums ${confidenceColor}`}>
              {confidenceScore}%
            </span>
          </div>
          <Progress value={confidenceScore} className="h-1.5" />
        </div>

        {/* Why */}
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Why
          </p>
          <EvidenceReasonStack reasons={reasonsToShow} testId={testId ? `${testId}-reasons` : undefined} />
        </div>

        {/* Risk notes — hide from client */}
        {!isClient && riskNotes.length > 0 && (
          <div className="rounded-md bg-rose-500/5 border border-rose-500/20 p-3 space-y-1">
            <p className="text-[11px] font-medium text-rose-400 uppercase tracking-wide">
              Risk notes
            </p>
            {riskNotes.map((n, i) => (
              <p key={i} className="text-xs text-muted-foreground">
                {n}
              </p>
            ))}
          </div>
        )}

        {/* Team-only action row */}
        {isTeam && (
          <div className="flex flex-wrap gap-2 border-t border-border/50 pt-3">
            <button
              onClick={() => {}}
              className="rounded px-3 py-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
            >
              Use this media
            </button>
            <button
              onClick={() => {}}
              className="rounded px-3 py-1.5 text-xs font-medium bg-sky-500/10 text-sky-300 border border-sky-500/30 hover:bg-sky-500/20 transition-colors"
            >
              Send to drafts
            </button>
            <button
              onClick={() => {}}
              className="rounded px-3 py-1.5 text-xs font-medium bg-muted/30 text-muted-foreground border border-border hover:bg-muted/50 transition-colors"
            >
              Mark for later
            </button>
            <p className="w-full text-[10px] text-muted-foreground/70 pt-0.5">
              Demo only — no action is saved
            </p>
          </div>
        )}

        {/* Next step + CTA */}
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/50">
          <div className="flex items-center gap-1.5 min-w-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <p className="text-xs text-muted-foreground truncate">{nextStep}</p>
          </div>
          {ctaHref && (
            <Link href={ctaHref}>
              <button className="flex items-center gap-1 rounded px-3 py-1.5 text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-colors flex-shrink-0">
                {ctaLabel ?? "Preview Drafts"}
                <ArrowRight className="w-3 h-3" />
              </button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
