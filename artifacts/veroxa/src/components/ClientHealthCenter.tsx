import {
  HeartPulse,
  ImageIcon,
  CalendarCheck2,
  Globe,
  Star,
  ClipboardList,
  FileBarChart,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  demoClientHealth,
  demoRestaurants,
  sortByHealthLevel,
  type DemoClientHealth,
  type DemoRestaurant,
  type HealthLevel,
} from "@/data/demoData";

interface ClientHealthCenterProps {
  viewerRole: "owner" | "operator";
}

const levelMeta: Record<
  HealthLevel,
  { label: string; badge: string; accent: string; dot: string }
> = {
  healthy: {
    label:  "Healthy",
    badge:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    accent: "border-emerald-500/20",
    dot:    "bg-emerald-500",
  },
  attention: {
    label:  "Attention Needed",
    badge:  "bg-amber-500/10 text-amber-400 border-amber-500/30",
    accent: "border-amber-500/20",
    dot:    "bg-amber-500",
  },
  critical: {
    label:  "Critical",
    badge:  "bg-red-500/10 text-red-400 border-red-500/30",
    accent: "border-red-500/30",
    dot:    "bg-red-500",
  },
};

function TrendIcon({ trend }: { trend: "up" | "flat" | "down" }) {
  if (trend === "up")   return <TrendingUp   className="w-3 h-3 text-emerald-400" />;
  if (trend === "down") return <TrendingDown className="w-3 h-3 text-red-400"     />;
  return <Minus className="w-3 h-3 text-muted-foreground" />;
}

function HealthCard({
  health,
  restaurant,
}: {
  health: DemoClientHealth;
  restaurant: DemoRestaurant;
}) {
  const meta = levelMeta[health.level];

  return (
    <Card
      className={cn("bg-card border", meta.accent)}
      data-testid={`health-card-${health.clientId}`}
    >
      <CardContent className="p-5 md:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3 className="text-base md:text-lg font-bold text-foreground truncate">
              {restaurant.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {restaurant.cuisine}
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn("text-[10px] font-semibold flex-shrink-0", meta.badge)}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", meta.dot)} />
            {meta.label}
          </Badge>
        </div>

        {/* Score */}
        <div className="flex items-end gap-3 mb-4">
          <div className="text-3xl md:text-4xl font-extrabold tracking-tight">
            {health.score}
          </div>
          <div className="text-xs text-muted-foreground pb-1.5">
            health score
          </div>
        </div>
        <Progress value={health.score} className="h-1.5 mb-5" />

        {/* Main issue + recommended action */}
        <div className="space-y-3 mb-5">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
              Main issue
            </div>
            <p className="text-sm text-foreground leading-snug">
              {health.mainIssue}
            </p>
          </div>
          <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-muted/40 border border-border/40">
            <ArrowRight className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-foreground">
              <span className="font-semibold">Next action: </span>
              {health.recommendedAction}
            </p>
          </div>
        </div>

        {/* Signal grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <SignalRow
            icon={ImageIcon}
            label="Media inventory"
            value={`${health.signals.mediaInventory.value}/${health.signals.mediaInventory.max}`}
            note={health.signals.mediaInventory.note}
          />
          <SignalRow
            icon={CalendarCheck2}
            label="Posting"
            value={health.signals.postingConsistency.label}
            tone={
              health.signals.postingConsistency.status === "good"
                ? "good"
                : health.signals.postingConsistency.status === "warn"
                ? "warn"
                : "bad"
            }
          />
          <SignalRow
            icon={Globe}
            label="Google visibility"
            value={`${health.signals.googleVisibility.score}`}
            trailing={<TrendIcon trend={health.signals.googleVisibility.trend} />}
          />
          <SignalRow
            icon={Star}
            label="Reviews"
            value={`${health.signals.reviewActivity.recent} new`}
            note={health.signals.reviewActivity.note}
          />
          <SignalRow
            icon={ClipboardList}
            label="Onboarding"
            value={`${health.signals.onboardingComplete}%`}
            tone={
              health.signals.onboardingComplete >= 95
                ? "good"
                : health.signals.onboardingComplete >= 70
                ? "warn"
                : "bad"
            }
          />
          <SignalRow
            icon={FileBarChart}
            label="Report"
            value={health.signals.reportStatus}
            tone={
              health.signals.reportStatus === "Approved"
                ? "good"
                : health.signals.reportStatus === "Overdue"
                ? "bad"
                : "warn"
            }
          />
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/40 text-[11px] text-muted-foreground">
          <span>Last activity: {health.lastActivity}</span>
          <span>
            Team: <span className="text-foreground/80">{restaurant.assignedTeam}</span>
            <span className="mx-1.5 text-muted-foreground/40">·</span>
            Operator: <span className="text-foreground/80">{restaurant.assignedOperator}</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function SignalRow({
  icon: Icon,
  label,
  value,
  note,
  tone,
  trailing,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  note?: string;
  tone?: "good" | "warn" | "bad";
  trailing?: React.ReactNode;
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
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 text-muted-foreground/60 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
          {label}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("text-xs font-semibold", toneClass)}>{value}</span>
          {trailing}
        </div>
        {note && (
          <div className="text-[10px] text-muted-foreground/70 mt-0.5 leading-snug">
            {note}
          </div>
        )}
      </div>
    </div>
  );
}

export function ClientHealthCenter({ viewerRole }: ClientHealthCenterProps) {
  const sorted = sortByHealthLevel(demoClientHealth);

  const counts = {
    healthy:   demoClientHealth.filter((c) => c.level === "healthy").length,
    attention: demoClientHealth.filter((c) => c.level === "attention").length,
    critical:  demoClientHealth.filter((c) => c.level === "critical").length,
  };

  return (
    <div className="space-y-6">
      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card/60 border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <HeartPulse className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Total clients
              </span>
            </div>
            <div className="text-2xl font-bold">{demoClientHealth.length}</div>
          </CardContent>
        </Card>
        <SummaryTile label="Healthy"   count={counts.healthy}   tone="good" />
        <SummaryTile label="Attention" count={counts.attention} tone="warn" />
        <SummaryTile label="Critical"  count={counts.critical}  tone="bad"  />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {sorted.map((health) => {
          const restaurant = demoRestaurants.find(
            (r) => r.id === health.clientId
          )!;
          return (
            <HealthCard
              key={health.clientId}
              health={health}
              restaurant={restaurant}
            />
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground/60">
        Viewing as: <span className="text-foreground/70">{viewerRole}</span> ·
        Health scoring is illustrative only. No real scoring logic, monitoring,
        or backend is connected.
      </p>
    </div>
  );
}

function SummaryTile({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: "good" | "warn" | "bad";
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-400"
      : tone === "warn"
      ? "text-amber-400"
      : "text-red-400";
  const dotClass =
    tone === "good"
      ? "bg-emerald-500"
      : tone === "warn"
      ? "bg-amber-500"
      : "bg-red-500";
  return (
    <Card className="bg-card/60 border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("w-1.5 h-1.5 rounded-full", dotClass)} />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        </div>
        <div className={cn("text-2xl font-bold", toneClass)}>{count}</div>
      </CardContent>
    </Card>
  );
}
