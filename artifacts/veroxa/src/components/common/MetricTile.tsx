import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  icon?:   LucideIcon;
  label:   string;
  value:   string | number;
  accent?: string;
  hint?:   string;
  testId?: string;
}

export function MetricTile({ icon: Icon, label, value, accent, hint, testId }: Props) {
  return (
    <Card className="bg-card border-border" data-testid={testId}>
      <CardContent className="p-3">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
          {Icon && <Icon className="w-3.5 h-3.5" />}{label}
        </div>
        <p className={`text-2xl font-bold tabular-nums ${accent ?? ""}`}>{value}</p>
        {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}
