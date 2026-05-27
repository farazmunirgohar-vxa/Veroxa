import { Brain, Sparkles, AlertTriangle, ImageIcon, MapPin, Megaphone, Clock, Ban, ListTodo } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  AdaptiveRecommendation,
  AdaptiveConfidence,
  AdaptiveRecommendationType,
} from "@/lib/intelligence/adaptiveRules";

interface AdaptiveRecommendationCardProps {
  recommendation: AdaptiveRecommendation;
  audience: "client" | "team";
}

const confidenceTone: Record<AdaptiveConfidence, string> = {
  high: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  medium: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  low: "bg-muted text-muted-foreground border-border",
};

const typeIcon: Record<AdaptiveRecommendationType, typeof Sparkles> = {
  content_focus: Sparkles,
  media_request: ImageIcon,
  google_action: MapPin,
  ads_direction: Megaphone,
  schedule_priority: Clock,
  avoid_action: Ban,
  team_priority: ListTodo,
};

export function AdaptiveRecommendationCard({
  recommendation,
  audience,
}: AdaptiveRecommendationCardProps) {
  const Icon = typeIcon[recommendation.type] ?? Sparkles;
  return (
    <Card
      className="border-primary/20 bg-card"
      data-testid={`adaptive-rec-${recommendation.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-start gap-2 min-w-0">
            <div className="w-8 h-8 rounded-md bg-primary/10 border border-border flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">{recommendation.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {audience === "client"
                  ? recommendation.clientSafeSummary
                  : recommendation.recommendation}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <Badge
              variant="outline"
              className={`text-[10px] uppercase tracking-wide ${confidenceTone[recommendation.confidence]}`}
            >
              {recommendation.confidence} confidence
            </Badge>
            <Badge
              variant="outline"
              className="text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-400 inline-flex items-center gap-1"
            >
              <Brain className="w-3 h-3" /> Rule-based
            </Badge>
          </div>
        </div>

        {audience === "team" && (
          <>
            <div className="mt-3 px-3 py-2 rounded-md bg-muted/40 text-xs">
              <p className="font-medium text-foreground/90 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Suggested team action
              </p>
              <p className="text-muted-foreground">{recommendation.suggestedTeamAction}</p>
            </div>

            {recommendation.sourceSignals.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                  Source signals
                </p>
                <ul className="space-y-1">
                  {recommendation.sourceSignals.map((s, i) => (
                    <li
                      key={`${recommendation.id}-sig-${i}`}
                      className="text-xs text-foreground/80 flex items-start gap-1.5"
                    >
                      <span className="text-[10px] uppercase text-muted-foreground font-medium pt-0.5 w-16 flex-shrink-0">
                        {s.source}
                      </span>
                      <span className="flex-1 min-w-0">{s.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="mt-3 text-[11px] text-muted-foreground italic">
              Reason: {recommendation.reason}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
