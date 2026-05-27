import { Link } from "wouter";
import { Sparkles, ArrowRight, Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AdaptiveRecommendation } from "@/lib/intelligence/adaptiveRules";

interface WeeklyStrategySnapshotProps {
  recommendations: AdaptiveRecommendation[];
  audience: "client" | "team";
  /** Optional CTA path. Defaults to /demo/client/direction. */
  ctaHref?: string;
  ctaLabel?: string;
}

/**
 * Compact "This Week's Veroxa Strategy" card built from rule-based
 * adaptive recommendations. Client audience hides internal language.
 */
export function WeeklyStrategySnapshot({
  recommendations,
  audience,
  ctaHref = "/demo/client/direction",
  ctaLabel = "Open Direction Center",
}: WeeklyStrategySnapshotProps) {
  const top = recommendations.slice(0, 4);

  const findOne = (predicate: (r: AdaptiveRecommendation) => boolean) =>
    recommendations.find(predicate);

  const focus = findOne((r) => r.type === "content_focus" || r.type === "schedule_priority");
  const mediaAsk = findOne((r) => r.type === "media_request");
  const google = findOne((r) => r.type === "google_action");
  const ads = findOne((r) => r.type === "ads_direction");
  const teamFirst = findOne((r) => r.type === "team_priority") ?? top[0];
  const avoid = findOne((r) => r.type === "avoid_action");

  return (
    <Card className="border-primary/30 bg-primary/5" data-testid="weekly-strategy-snapshot">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-2 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-primary/15 border border-border flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-base font-semibold leading-tight">
                {audience === "client" ? "This Week's Veroxa Strategy" : "Adaptive Team Priorities"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {audience === "client"
                  ? "Based on your recent direction and uploads."
                  : "Top rule-based recommendations across the active client."}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-400 inline-flex items-center gap-1 flex-shrink-0"
          >
            <Brain className="w-3 h-3" /> Rule-based preview
          </Badge>
        </div>

        {top.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Not enough signals yet — share direction or uploads to unlock recommendations.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {focus && (
              <StrategyRow
                label="Recommended focus"
                value={audience === "client" ? focus.clientSafeSummary : focus.recommendation}
              />
            )}
            {mediaAsk && (
              <StrategyRow
                label={audience === "client" ? "What you can upload next" : "Media request"}
                value={
                  audience === "client" ? mediaAsk.clientSafeSummary : mediaAsk.recommendation
                }
              />
            )}
            {google && (
              <StrategyRow
                label="Google action"
                value={audience === "client" ? google.clientSafeSummary : google.recommendation}
              />
            )}
            {ads && (
              <StrategyRow
                label="Ads direction"
                value={audience === "client" ? ads.clientSafeSummary : ads.recommendation}
              />
            )}
            {audience === "team" && teamFirst && (
              <StrategyRow label="Team should work on first" value={teamFirst.suggestedTeamAction} />
            )}
            {avoid && (
              <StrategyRow
                label="Avoid"
                value={audience === "client" ? avoid.clientSafeSummary : avoid.recommendation}
              />
            )}
          </ul>
        )}

        {audience === "client" && (
          <div className="mt-4 flex justify-end">
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              data-testid="link-weekly-strategy-cta"
            >
              {ctaLabel} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StrategyRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-start gap-2">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground w-32 pt-0.5 flex-shrink-0">
        {label}
      </span>
      <span className="text-foreground/90 flex-1">{value}</span>
    </li>
  );
}
