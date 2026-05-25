import { useMemo, useState } from "react";
import {
  Image as ImageIcon,
  Video,
  Library,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  demoMediaItems,
  getMediaSummary,
  demoRestaurants,
  getRestaurantName,
  type MediaStatus,
} from "@/data/demoData";

interface MediaInventoryViewProps {
  viewerRole: "client" | "team" | "operator" | "owner";
  clientId?: string;
}

const statusStyle: Record<MediaStatus, string> = {
  "Approved":       "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  "Pending Review": "bg-amber-500/10 text-amber-400 border-amber-500/30",
  "Scheduled":      "bg-blue-500/10 text-blue-400 border-blue-500/30",
  "Used":           "bg-muted text-muted-foreground border-border",
  "Reserved":       "bg-violet-500/10 text-violet-400 border-violet-500/30",
  "Blurry":         "bg-red-500/10 text-red-400 border-red-500/30",
  "Duplicate":      "bg-red-500/10 text-red-400 border-red-500/30",
};

export function MediaInventoryView({
  viewerRole,
  clientId,
}: MediaInventoryViewProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | MediaStatus>("all");
  const [clientFilter, setClientFilter] = useState<string>(clientId ?? "all");

  const summary = getMediaSummary();

  const filtered = useMemo(() => {
    return demoMediaItems.filter(
      (m) =>
        (statusFilter === "all" || m.status === statusFilter) &&
        (clientFilter === "all" || m.clientId === clientFilter),
    );
  }, [statusFilter, clientFilter]);

  const statuses: MediaStatus[] = [
    "Approved",
    "Pending Review",
    "Scheduled",
    "Reserved",
    "Used",
    "Blurry",
    "Duplicate",
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <SummaryCard icon={Library}       label="Total media"           value={summary.total} />
        <SummaryCard icon={CheckCircle2}  label="Approved"              value={summary.approved}      tone="good" />
        <SummaryCard icon={Clock}         label="Pending review"        value={summary.pendingReview} tone="warn" />
        <SummaryCard icon={AlertCircle}   label="Low-inventory clients" value={summary.lowInvClients} tone="bad"  />
        <SummaryCard icon={Library}       label="Scheduled this week"   value={summary.scheduledWeek} tone="good" />
      </div>

      {/* Filters */}
      <div className="space-y-2.5">
        {!clientId && viewerRole !== "client" && (
          <div className="flex flex-wrap gap-1.5">
            <Chip
              label="All clients"
              active={clientFilter === "all"}
              onClick={() => setClientFilter("all")}
            />
            {demoRestaurants.map((r) => (
              <Chip
                key={r.id}
                label={r.name}
                active={clientFilter === r.id}
                onClick={() => setClientFilter(r.id)}
              />
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-1.5">
          <Chip
            label="All statuses"
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
          />
          {statuses.map((s) => (
            <Chip
              key={s}
              label={s}
              active={statusFilter === s}
              onClick={() => setStatusFilter(s)}
            />
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card className="bg-card/40 border-dashed border-border/60">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No media items match the current filters.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((m) => (
            <Card
              key={m.id}
              className="bg-card border-border/60 overflow-hidden"
              data-testid={`media-item-${m.id}`}
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-muted/40 to-muted/10 border-b border-border/60 flex items-center justify-center relative">
                {m.type === "Photo" ? (
                  <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
                ) : (
                  <Video className="w-10 h-10 text-muted-foreground/40" />
                )}
                <Badge
                  variant="outline"
                  className="absolute top-2 right-2 text-[10px] font-semibold bg-card/80 backdrop-blur border-border/60"
                >
                  {m.type}
                </Badge>
              </div>
              <CardContent className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-foreground leading-snug min-w-0">
                    {m.title}
                  </h4>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-semibold flex-shrink-0",
                      statusStyle[m.status],
                    )}
                  >
                    {m.status}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {m.qualityNote}
                </p>
                <div className="text-[11px] space-y-1 pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Client</span>
                    <span className="text-foreground/80 truncate">
                      {getRestaurantName(m.clientId)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Suggested use</span>
                    <span className="text-foreground/80 truncate text-right">
                      {m.suggestedUse}
                    </span>
                  </div>
                  {m.campaign && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Campaign</span>
                      <span className="text-foreground/80 truncate text-right">
                        {m.campaign}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Added</span>
                    <span className="text-foreground/80">{m.dateAdded}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground/60">
        Viewing as: <span className="text-foreground/70">{viewerRole}</span> ·
        Demo media only. No file uploads, storage, AI image analysis, or backend
        is connected.
      </p>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone?: "good" | "warn" | "bad";
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-400"
      : tone === "warn"
      ? "text-amber-400"
      : tone === "bad"
      ? "text-red-400"
      : "text-foreground";
  return (
    <Card className="bg-card/60 border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1.5">
          <Icon className="w-3.5 h-3.5 text-muted-foreground/60" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        </div>
        <div className={cn("text-2xl font-bold", toneClass)}>{value}</div>
      </CardContent>
    </Card>
  );
}

function Chip({
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
        "px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors",
        active
          ? "bg-primary/15 text-primary border-primary/30"
          : "bg-card/40 text-muted-foreground border-border/60 hover:bg-card hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
