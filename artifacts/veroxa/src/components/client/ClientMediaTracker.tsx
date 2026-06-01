import { CheckCircle2 } from "lucide-react";
import {
  CLIENT_MEDIA_LIFECYCLE_STAGES,
  getClientMediaLifecycleIndex,
  isClientMediaLifecycleStage,
  type ClientMediaDisplayStatus,
} from "@/lib/clientMediaLifecycle";

export function ClientMediaTracker({
  status,
}: {
  status: ClientMediaDisplayStatus;
}) {
  const currentIndex = isClientMediaLifecycleStage(status)
    ? getClientMediaLifecycleIndex(status)
    : 0;

  return (
    <div className="space-y-2" data-testid="client-media-tracker">
      <p className="text-xs font-medium text-muted-foreground">Media tracker</p>
      <div className="grid grid-cols-5 gap-1.5">
        {CLIENT_MEDIA_LIFECYCLE_STAGES.map((stage, index) => {
          const complete = index <= currentIndex;
          return (
            <div key={stage} className="min-w-0">
              <div
                className={`mb-1 flex h-7 items-center justify-center rounded-full border text-[10px] ${
                  complete
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-muted/20 text-muted-foreground"
                }`}
                aria-current={stage === status ? "step" : undefined}
              >
                {complete ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  index + 1
                )}
              </div>
              <p className="truncate text-center text-[10px] text-muted-foreground">
                {stage}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
