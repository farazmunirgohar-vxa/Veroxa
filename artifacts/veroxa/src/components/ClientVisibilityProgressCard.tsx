/**
 * ClientVisibilityProgressCard — client-safe local visibility surface.
 *
 * The restaurant partner's calm view of their Google / local visibility work.
 * Uses ONLY client-safe wording ("Google profile freshness", "local visibility",
 * "review response", "photo freshness"). Never exposes API/connector/crawler/
 * ranking-guarantee/backend terms, audit scores, severities, or internal IDs.
 *
 * Derives its focus areas from the rule-based visibility audit's client-safe
 * summary when available, and otherwise falls back to calm defaults.
 */

import { MapPin, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  getVisibilityAuditForClient,
} from "@/lib/visibilityAudit";
import { getClientSafeVisibilitySummary } from "@/domain/visibilityAudit";

/** Calm, client-safe areas that make up "local visibility" work. */
const LOCAL_VISIBILITY_FOCUS = [
  "Google profile freshness",
  "Photo freshness",
  "Review response",
  "Business details confirmation",
];

interface ClientVisibilityProgressCardProps {
  clientId: string;
  /** Optional heading override. */
  title?: string;
  testId?: string;
}

export function ClientVisibilityProgressCard({
  clientId,
  title = "Local visibility progress",
  testId = "card-client-visibility",
}: ClientVisibilityProgressCardProps) {
  const audit = getVisibilityAuditForClient(clientId);
  const summary = audit ? getClientSafeVisibilitySummary(audit.result) : null;

  const statusLine =
    summary?.status ??
    "Veroxa is keeping your Google profile fresh and your local visibility strong.";

  // Focus areas come from the client-safe audit summary; fall back to the calm
  // default local-visibility checklist so the card always reads well.
  const focusAreas =
    summary && summary.focusAreas.length > 0
      ? summary.focusAreas
      : LOCAL_VISIBILITY_FOCUS;

  return (
    <Card className="bg-card/50 border-border/50" data-testid={testId}>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {statusLine}
        </p>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Part of your visibility work
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {focusAreas.slice(0, 4).map((area) => (
            <div key={area} className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary/70 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-foreground/80 leading-snug">
                {area}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground/70 mt-4">
          Veroxa confirms any business details with you before updating them.
        </p>
      </CardContent>
    </Card>
  );
}
