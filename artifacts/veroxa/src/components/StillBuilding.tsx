import { Hammer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StillBuildingProps {
  /** Optional area name, e.g. "Reports". Shown in the heading when provided. */
  area?: string;
  /** Optional supporting line under the standard message. */
  detail?: string;
}

/**
 * StillBuilding — calm in-portal card for a real /client/* or /team/* section
 * that is not finished yet. Real portal routes render this instead of ever
 * redirecting to a demo route. No demo, preview, or sample wording.
 */
export function StillBuilding({ area, detail }: StillBuildingProps) {
  return (
    <Card className="bg-card border-border" data-testid="card-still-building">
      <CardContent className="p-6 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          <Hammer className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold tracking-tight">
            {area ? `${area} — Still Building` : "Still Building"}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This part of Veroxa OS is being prepared.
          </p>
          {detail && (
            <p className="text-xs text-muted-foreground/80 leading-relaxed pt-1">
              {detail}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
