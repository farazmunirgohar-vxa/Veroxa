/**
 * ContentIntelligencePanel.tsx — team-facing surfaces for the Restaurant
 * Content Intelligence Pipeline. These render the full rule-based reasoning
 * (media understanding, customer moment, content angle, caption gate, three
 * strategic drafts, scheduling, claim/risk, and recommended next action).
 *
 * TEAM-ONLY. Every output is a DRAFT requiring team approval. Nothing here is
 * published, sent, or guaranteed. Client pages must NOT use these panels —
 * they expose internal reasoning and risk flags.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRestaurantName } from "@/data/demoData";
import type { ClientTeamSubmission } from "@/data/demoData";
import { TEAM_AI_DISCLOSURE } from "@/lib/ai/aiAgentTypes";
import {
  analyzeRestaurantContent,
  summarizeContentIntelligence,
  MEDIA_USABILITY_LABELS,
  type MediaUsability,
} from "@/lib/content/restaurantContentIntelligence";

const usabilityTone: Record<MediaUsability, string> = {
  usable_now: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  save_for_later: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  needs_context: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  not_recommended: "border-rose-500/40 bg-rose-500/10 text-rose-300",
};

function clientName(submission: ClientTeamSubmission): string {
  return getRestaurantName(submission.clientId);
}

// ===========================================================================
// Upload Inbox surface — understanding + moment + angle + caption gate + next.
// ===========================================================================

export function ContentIntelligenceInboxList({
  submissions,
  limit = 3,
}: {
  submissions: ClientTeamSubmission[];
  limit?: number;
}) {
  const items = submissions.slice(0, limit);
  if (items.length === 0) return null;

  return (
    <Card
      className="mt-3 bg-card border-primary/20"
      data-testid="card-content-intelligence-inbox"
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">
          Content Intelligence — upload understanding ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((s) => {
          const intel = analyzeRestaurantContent(s, clientName(s));
          const media = intel.mediaUnderstanding;
          return (
            <div
              key={s.id}
              className="rounded-md border border-border/60 bg-muted/10 p-3 text-[12px]"
              data-testid={`content-intel-inbox-${s.id}`}
            >
              <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                <p className="font-semibold text-foreground">
                  {clientName(s)} — {s.title}
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  <Badge
                    variant="outline"
                    className={`${usabilityTone[media.usability]} text-[10px]`}
                  >
                    {MEDIA_USABILITY_LABELS[media.usability]}
                  </Badge>
                  <Badge variant="outline" className="border-border bg-muted/30 text-[10px]">
                    Quality: {media.qualityLabel}
                  </Badge>
                </div>
              </div>
              <p className="text-muted-foreground">
                <span className="text-foreground font-medium">Customer moment:</span>{" "}
                {intel.customerMoment.momentLabel} — {intel.customerMoment.why}
              </p>
              <p className="text-muted-foreground mt-0.5">
                <span className="text-foreground font-medium">Content angle:</span>{" "}
                {intel.contentAngle.primaryAngleLabel}
                {intel.contentAngle.secondaryAngleLabel
                  ? ` + ${intel.contentAngle.secondaryAngleLabel}`
                  : ""}
              </p>
              <div className="mt-1.5">
                {media.captionDraftingAllowed ? (
                  <Badge
                    variant="outline"
                    className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-[10px]"
                  >
                    Caption drafting: allowed
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-amber-500/40 bg-amber-500/10 text-amber-300 text-[10px]"
                  >
                    Needs client context before caption drafting
                  </Badge>
                )}
              </div>
              <p className="text-primary/85 mt-1">
                Next: {intel.teamRecommendation.nextActionLabel} —{" "}
                {intel.teamRecommendation.rationale}
              </p>
            </div>
          );
        })}
        <p className="text-[10px] text-muted-foreground italic pt-1">
          {TEAM_AI_DISCLOSURE}
        </p>
      </CardContent>
    </Card>
  );
}

// ===========================================================================
// Work Queue surface — 3 strategic drafts + best + schedule + claim/risk.
// ===========================================================================

export function ContentIntelligenceDraftsList({
  submissions,
  limit = 4,
}: {
  submissions: ClientTeamSubmission[];
  limit?: number;
}) {
  const items = submissions.slice(0, limit);
  if (items.length === 0) return null;

  return (
    <Card
      className="bg-card border-primary/20 mb-4"
      data-testid="card-content-intelligence-drafts"
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          Content Intelligence — strategic caption drafts (review required)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((s) => {
          const intel = analyzeRestaurantContent(s, clientName(s));
          const { captionDraftSet, scheduleRecommendation, claimRiskReview, teamRecommendation } =
            intel;
          return (
            <div
              key={s.id}
              className="rounded-md border border-border/60 bg-muted/10 p-3 text-[12px]"
              data-testid={`content-intel-drafts-${s.id}`}
            >
              <div className="flex items-start justify-between gap-2 flex-wrap mb-1.5">
                <p className="font-semibold text-foreground">
                  {clientName(s)} — {s.title}
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  <Badge
                    variant="outline"
                    className="border-amber-500/40 bg-amber-500/10 text-amber-300 text-[10px]"
                  >
                    Team review required
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      claimRiskReview.claimRisk === "warning"
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                        : "border-border bg-muted/30"
                    }`}
                  >
                    Claim risk: {claimRiskReview.claimRisk}
                  </Badge>
                </div>
              </div>

              {captionDraftSet.draftingAllowed ? (
                <div className="space-y-1.5">
                  {captionDraftSet.drafts.map((d, i) => {
                    const isBest = teamRecommendation.bestDraftIndex === i;
                    return (
                      <div
                        key={d.purpose}
                        className={`rounded border p-2 ${
                          isBest
                            ? "border-emerald-500/40 bg-emerald-500/5"
                            : "border-border/50 bg-background/40"
                        }`}
                        data-testid={`caption-draft-${s.id}-${d.purpose}`}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap mb-0.5">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                            {String.fromCharCode(65 + i)} · {d.purposeLabel} ·{" "}
                            {d.bestPlatformLabel}
                          </span>
                          {isBest && (
                            <Badge
                              variant="outline"
                              className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-[9px]"
                            >
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <p className="text-foreground/90">"{d.draftText}"</p>
                        <p className="text-muted-foreground mt-0.5">{d.recommendedUse}</p>
                        {d.needsClientConfirmation && (
                          <p className="text-amber-300/90 mt-0.5">
                            Confirm with client before public use.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  className="rounded border border-amber-500/40 bg-amber-500/5 p-2"
                  data-testid={`caption-gate-${s.id}`}
                >
                  <p className="text-amber-300 font-medium">{captionDraftSet.teamNote}</p>
                  {captionDraftSet.clarificationQuestion && (
                    <p className="text-muted-foreground mt-0.5">
                      Ask client: {captionDraftSet.clarificationQuestion}
                    </p>
                  )}
                </div>
              )}

              <p className="text-muted-foreground mt-2">
                <span className="text-foreground font-medium">Suggested window:</span>{" "}
                {scheduleRecommendation.recommendedWindow} —{" "}
                {scheduleRecommendation.momentLabel}
              </p>
              {claimRiskReview.inventedFactRisk.length > 0 && (
                <p className="text-amber-300/90 mt-0.5">
                  Verify claims: {claimRiskReview.inventedFactRisk.join(", ")}.
                </p>
              )}
              <p className="text-primary/85 mt-1">
                Next: {teamRecommendation.nextActionLabel} — {teamRecommendation.rationale}
              </p>
            </div>
          );
        })}
        <p className="text-[10px] text-muted-foreground italic pt-1">
          {TEAM_AI_DISCLOSURE} Drafts only — no menu items, prices, or claims
          invented. Nothing is published; scheduling connection pending.
        </p>
      </CardContent>
    </Card>
  );
}

// ===========================================================================
// Dashboard surface — compact summary strip.
// ===========================================================================

export function ContentIntelligenceSummaryStrip({
  submissions,
}: {
  submissions: ClientTeamSubmission[];
}) {
  const summary = summarizeContentIntelligence(submissions);
  const tiles = [
    { label: "Drafts ready", value: summary.draftsReady, color: "text-emerald-400" },
    { label: "Needs context", value: summary.needsContext, color: "text-amber-400" },
    {
      label: "Ready for scheduling prep",
      value: summary.readyForSchedulingPrep,
      color: "text-sky-400",
    },
    { label: "Claim review needed", value: summary.claimReviewNeeded, color: "text-rose-400" },
  ];

  return (
    <Card
      className="bg-card border-primary/20 mb-4"
      data-testid="card-content-intelligence-summary"
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          Content Intelligence — pipeline summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-md border border-border/60 bg-muted/10 p-3">
              <p className={`text-2xl font-bold tabular-nums ${t.color}`}>{t.value}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                {t.label}
              </p>
            </div>
          ))}
        </div>
        <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
          <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-1">
            Top next action
          </p>
          <p className="text-[12px] text-foreground/90">{summary.topNextAction}</p>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          {TEAM_AI_DISCLOSURE} Every draft requires team approval before use.
        </p>
      </CardContent>
    </Card>
  );
}
