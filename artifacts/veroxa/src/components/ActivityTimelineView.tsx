import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  demoActivityEvents,
  demoRestaurants,
  getRestaurantName,
  type ActivityRole,
} from "@/data/demoData";

interface ActivityTimelineViewProps {
  viewerRole: "owner" | "operator";
}

const roleBadge: Record<ActivityRole, string> = {
  client:   "bg-blue-500/10 text-blue-400 border-blue-500/30",
  team:     "bg-violet-500/10 text-violet-400 border-violet-500/30",
  operator: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  owner:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  agent:    "bg-primary/10 text-primary border-primary/30",
  system:   "bg-muted text-muted-foreground border-border",
};

export function ActivityTimelineView({ viewerRole }: ActivityTimelineViewProps) {
  const [clientFilter, setClientFilter] = useState<string>("all");

  const filtered = useMemo(
    () =>
      clientFilter === "all"
        ? demoActivityEvents
        : demoActivityEvents.filter((e) => e.clientId === clientFilter),
    [clientFilter],
  );

  return (
    <div className="space-y-5">
      {/* Filter */}
      <div className="flex flex-wrap gap-1.5">
        <FilterChip
          label="All clients"
          active={clientFilter === "all"}
          onClick={() => setClientFilter("all")}
        />
        {demoRestaurants.map((r) => (
          <FilterChip
            key={r.id}
            label={r.name}
            active={clientFilter === r.id}
            onClick={() => setClientFilter(r.id)}
          />
        ))}
      </div>

      <Card className="bg-card border-border/60">
        <CardContent className="p-5 md:p-6">
          <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
            {filtered.map((e) => (
              <div
                key={e.id}
                className="relative"
                data-testid={`timeline-event-${e.id}`}
              >
                <span
                  className={cn(
                    "absolute -left-[18px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-background",
                    e.status === "completed"   && "bg-emerald-500",
                    e.status === "in_progress" && "bg-amber-500",
                    e.status === "warning"     && "bg-red-500",
                  )}
                />
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                  <span className="text-[11px] text-muted-foreground">
                    {e.timestamp}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-semibold capitalize",
                      roleBadge[e.role],
                    )}
                  >
                    {e.role}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-semibold bg-card/40 border-border/60 text-muted-foreground"
                  >
                    {e.eventType}
                  </Badge>
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {getRestaurantName(e.clientId)}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {e.description}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No activity for this client yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground/60">
        Viewing as: <span className="text-foreground/70">{viewerRole}</span> ·
        Demo events only. No real tracking, logging, or backend is connected.
      </p>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors",
        active
          ? "bg-primary/15 text-primary border-primary/30"
          : "bg-card/40 text-muted-foreground border-border/60 hover:bg-card hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
