/**
 * ClientAccountSummary — premium "what Veroxa handles for you" card.
 *
 * Client-safe: no pricing, no backend terms, no internal IDs, no audit scores.
 * Shows the active service areas Veroxa manages for this restaurant partner.
 */

import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ACTIVE_SERVICES = [
  "Google Business Profile optimization",
  "Facebook + Instagram management",
  "Content planning and posting",
  "Local visibility monitoring",
  "Weekly progress updates",
  "Monthly performance reports",
];

interface ClientAccountSummaryProps {
  restaurantName?: string;
  className?: string;
}

export function ClientAccountSummary({
  restaurantName,
  className = "",
}: ClientAccountSummaryProps) {
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
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          What Veroxa handles for you
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4">
          {ACTIVE_SERVICES.map((service) => (
            <div key={service} className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary/60 flex-shrink-0" />
              <span className="text-xs text-foreground/80 leading-snug">
                {service}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground/60 mt-4 leading-relaxed">
          Nothing goes live on your account without review by your Veroxa team.
        </p>
      </CardContent>
    </Card>
  );
}
