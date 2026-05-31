/**
 * ClientAccountSummary — premium "what Veroxa handles for you" card.
 *
 * Client-safe: no backend terms, no internal IDs, no audit scores.
 * Shows the active service areas Veroxa manages for this restaurant partner.
 */

import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DEFAULT_CLIENT_PACKAGE_READINESS,
  buildClientPackageReadiness,
} from "@/domain/clientPortalJourney";

interface ClientAccountSummaryProps {
  restaurantName?: string;
  className?: string;
}

export function ClientAccountSummary({
  restaurantName,
  className = "",
}: ClientAccountSummaryProps) {
  const readiness = buildClientPackageReadiness(DEFAULT_CLIENT_PACKAGE_READINESS);

  return (
    <Card
      className={`bg-card/60 border-border/50 ${className}`}
      data-testid="card-account-summary"
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Active account
            </p>
            <h3 className="text-base font-bold mt-0.5 text-foreground">
              {restaurantName ?? "Your Restaurant"}
            </h3>
          </div>
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[10px] flex-shrink-0"
          >
            Active
          </Badge>
        </div>
        <div className="mb-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/80">
            Current package
          </p>
          <p className="text-xs text-foreground/85 leading-relaxed mt-0.5">
            {readiness.planLabel} account — {readiness.postingLimitSummary}
          </p>
          <p className="text-[11px] text-muted-foreground/80 leading-relaxed mt-1">
            {readiness.discountStatusLabel}
          </p>
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          What Veroxa handles for you
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4">
          {readiness.veroxaResponsibilities.map((service) => (
            <div key={service} className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary/60 flex-shrink-0" />
              <span className="text-xs text-foreground/80 leading-snug">
                {service}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-4 mb-2">
          What your restaurant handles
        </p>
        <div className="grid gap-1.5">
          {readiness.restaurantResponsibilities.map((service) => (
            <div key={service} className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-muted-foreground leading-snug">
                {service}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-2 text-[11px] text-muted-foreground/70 leading-relaxed">
          <p>{readiness.mediaDependencyReminder}</p>
          <p>
            Nothing goes live on your account without review by your Veroxa
            team.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
