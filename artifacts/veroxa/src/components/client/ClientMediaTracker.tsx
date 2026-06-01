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
  const activeIndex = getClientMediaLifecycleIndex(status);
  const isException = !isClientMediaLifecycleStage(status);

  return (
    <div className="space-y-2" data-testid="client-media-tracker">
      <div className="flex flex-wrap gap-2">
        {CLIENT_MEDIA_LIFECYCLE_STAGES.map((stage, index) => {
          const isComplete = !isException && index <= activeIndex;
          const isCurrent = !isException && index === activeIndex;
          return (
            <div
              key={stage}
              className="flex min-w-[76px] flex-1 items-center gap-2"
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold ${
                  isComplete
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-muted/20 text-muted-foreground"
                }`}
                aria-label={`${stage}${isCurrent ? " current" : ""}`}
              >
                {index + 1}
              </span>
              <span
                className={`text-[11px] ${isComplete ? "text-foreground" : "text-muted-foreground"}`}
              >
                {stage}
              </span>
            </div>
          );
        })}
      </div>
      {isException && (
        <p className="text-xs text-muted-foreground">
          Current status: {status}. Veroxa will show progress here when this
          item moves forward.
        </p>
      )}
    </div>
  );
}
