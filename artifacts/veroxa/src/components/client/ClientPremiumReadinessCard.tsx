/**
 * ClientPremiumReadinessCard — light, client-safe future ads readiness concept.
 *
 * Local only: no reads or writes, no new routes, no ads automation.
 * Communicates how future ads support becomes available without implying it is on
 * by default. Calm, plain, blame-free language.
 */

import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DEFAULT_CLIENT_PACKAGE_READINESS,
  buildClientPackageReadiness,
} from "@/domain/clientPortalJourney";

const READINESS_POINTS = [
  "Reviewed only after the online presence foundation is stable",
  "Readiness assessment by phone, Zoom, or in person",
  "Starts only with your approval and an agreed ad budget",
  "Ad spend is separate and paid by the restaurant",
];

interface ClientPremiumReadinessCardProps {
  className?: string;
}

export function ClientPremiumReadinessCard({
  className = "",
}: ClientPremiumReadinessCardProps) {
  const readiness = buildClientPackageReadiness(
    DEFAULT_CLIENT_PACKAGE_READINESS,
  );

  return (
    <Card
      className={`bg-card/50 border-border/50 ${className}`}
      data-testid="card-premium-readiness"
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Future ads readiness
              </p>
              <h3 className="text-sm font-bold text-foreground leading-snug">
                Ads become available once your foundation is ready
              </h3>
            </div>
          </div>
          <Badge
            variant="outline"
            className="border-border bg-muted/30 text-muted-foreground text-[10px] flex-shrink-0"
          >
            {readiness.premiumStatus === "eligible_for_assessment"
              ? "Assessment available"
              : "Reviewed later"}
          </Badge>
        </div>
        <p className="text-xs text-foreground/80 leading-relaxed mb-3">
          {readiness.premiumStatusLabel}
        </p>
        <div className="grid gap-1.5">
          {READINESS_POINTS.map((point) => (
            <div key={point} className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary/60 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-foreground/80 leading-snug">
                {point}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground/70 leading-relaxed mt-3">
          Ads are not a launch service — they are reviewed later with you once
          your presence is stable, so any future ads start from a stronger foundation.
        </p>
      </CardContent>
    </Card>
  );
}
