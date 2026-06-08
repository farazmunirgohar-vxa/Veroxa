import { AlertCircle, CheckCircle2, Info, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";

export function RealPortalReviewNotice({
  className = "",
}: {
  className?: string;
}) {
  const mode = useRealPortalDataMode();

  if (mode.isPublicDemoRoute || mode.isLiveDataConnected) return null;

  return (
    <Card
      className={`bg-primary/5 border-primary/20 ${className}`}
      data-testid="card-real-portal-review-notice"
    >
      <CardContent className="p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {mode.portal === "client"
              ? "Client Portal in review"
              : "Team Portal in review"}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {mode.portal === "client"
              ? "Live account data is being prepared. This real route keeps the portal shell visible without showing another restaurant as your account."
              : "Live client operations are not connected yet. This real internal route keeps Faraz's command center visible with safe empty states and clearly labeled launch benchmarks."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function LaunchReadinessBenchmarkNotice({
  className = "",
}: {
  className?: string;
}) {
  return (
    <Card
      className={`bg-amber-500/5 border-amber-500/30 ${className}`}
      data-testid="card-launch-readiness-benchmark-notice"
    >
      <CardContent className="p-4 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">
              Launch readiness benchmark
            </p>
            <Badge
              variant="outline"
              className="border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px]"
            >
              Not active client data
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Used to validate first 5 client scenarios before live account data
            is connected. Do not treat these rows as active restaurants.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function SafePortalEmptyCard({
  title,
  body,
  testId,
  icon = "info",
}: {
  title: string;
  body: string;
  testId?: string;
  icon?: "info" | "check";
}) {
  const Icon = icon === "check" ? CheckCircle2 : Info;
  return (
    <Card className="bg-card/50 border-border/50" data-testid={testId}>
      <CardContent className="p-5 flex items-start gap-3">
        <Icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed mt-1">
            {body}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
