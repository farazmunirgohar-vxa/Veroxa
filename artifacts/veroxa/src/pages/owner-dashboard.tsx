import {
  ArrowUpRight,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Info,
  HeartPulse,
  ImageIcon,
  CalendarClock,
  Sparkles,
  Activity,
  Briefcase,
  FileBarChart,
  Globe,
  Star,
  Users,
  ArrowRight,
} from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ownerPortalNavItems } from "@/lib/ownerPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import {
  demoOwnerKpis,
  demoClientHealth,
  demoNotifications,
  demoActivityEvents,
  demoAiAgentSummary,
  demoUpcomingReports,
  demoRestaurants,
  sortByHealthLevel,
  getRestaurantName,
  notificationCategoryOrder,
  type HealthLevel,
  type NotificationCategory,
} from "@/data/demoData";

const healthBadge: Record<HealthLevel, string> = {
  healthy:   "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  attention: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  critical:  "bg-red-500/10 text-red-400 border-red-500/30",
};
const healthLabel: Record<HealthLevel, string> = {
  healthy:   "Healthy",
  attention: "Attention",
  critical:  "Critical",
};

const notifIcon: Record<NotificationCategory, { Icon: React.ElementType; color: string }> = {
  critical: { Icon: AlertOctagon,  color: "text-red-400"     },
  warning:  { Icon: AlertTriangle, color: "text-amber-400"   },
  info:     { Icon: Info,          color: "text-blue-400"    },
  success:  { Icon: CheckCircle2,  color: "text-emerald-400" },
};

export default function OwnerDashboard() {
  const sortedHealth      = sortByHealthLevel(demoClientHealth);
  const criticalNotifs    = [...demoNotifications]
    .sort((a, b) => notificationCategoryOrder[a.category] - notificationCategoryOrder[b.category])
    .slice(0, 3);
  const recentActivity    = demoActivityEvents.slice(0, 6);
  const mediaRisk         = demoClientHealth
    .filter((c) => c.signals.mediaInventory.value <= 10)
    .sort((a, b) => a.signals.mediaInventory.value - b.signals.mediaInventory.value);

  return (
    <PortalLayout items={ownerPortalNavItems} portalName="Owner Portal">
      <div className="mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h2
            className="text-2xl md:text-3xl font-bold tracking-tight text-foreground"
            data-testid="header-owner"
          >
            Owner Command Center
          </h2>
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/10 text-primary text-[10px] font-semibold tracking-wide"
          >
            Executive view
          </Badge>
        </div>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          One screen for the entire Veroxa system — KPIs, client health,
          critical notifications, AI activity, upcoming reports.
        </p>
      </div>

      <DemoOnlyBanner
        message="Demo only — every number, signal, and notification on this screen is illustrative. No billing, analytics, AI, or automation backend is connected."
        testId="banner-owner-dashboard"
      />

      {/* ── KPI Summary ───────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionLabel icon={Briefcase} title="KPI Summary" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="Total clients"        value={String(demoOwnerKpis.totalClients)}            note="Active portfolio"            />
          <Kpi label="Active clients"       value={String(demoOwnerKpis.activeClients)}           note="All in delivery"             />
          <Kpi label="Monthly revenue"      value={demoOwnerKpis.monthlyRevenueDemo}              note="Demo figure"                 />
          <Kpi label="Scheduled posts"      value={String(demoOwnerKpis.scheduledPosts)}          note="Next 7 days"                 />
          <Kpi label="Published posts"      value={String(demoOwnerKpis.publishedPosts)}          note="This month"                  />
          <Kpi label="Google visibility"    value={`${demoOwnerKpis.googleVisibilityScore}%`}     note="Demo portfolio average"      icon={Globe} />
          <Kpi label="Review growth"        value={`+${demoOwnerKpis.reviewGrowthThisMonth}`}     note="New reviews this month"      icon={Star}  />
          <Kpi
            label="Needs attention"
            value={String(demoOwnerKpis.clientsNeedingAttention)}
            note="Attention + critical"
            tone="warn"
            icon={AlertTriangle}
          />
        </div>
      </section>

      {/* ── Two-column body ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">

        {/* LEFT (2/3) — Health Summary + Activity */}
        <div className="lg:col-span-2 space-y-6">

          {/* Client Health Summary */}
          <section className="space-y-3">
            <SectionLabel icon={HeartPulse} title="Client health summary" />
            <Card className="bg-card border-border/60">
              <CardContent className="p-4 md:p-5 space-y-3">
                {sortedHealth.map((c) => {
                  const r = demoRestaurants.find((d) => d.id === c.clientId)!;
                  return (
                    <div
                      key={c.clientId}
                      className="flex items-center gap-3 md:gap-4 py-2 border-b border-border/40 last:border-0 last:pb-0"
                      data-testid={`cc-health-${c.clientId}`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-foreground truncate">
                          {r.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {c.mainIssue}
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-2 w-32">
                        <Progress value={c.score} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground w-6 text-right">
                          {c.score}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-semibold flex-shrink-0",
                          healthBadge[c.level],
                        )}
                      >
                        {healthLabel[c.level]}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </section>

          {/* Recent Activity */}
          <section className="space-y-3">
            <SectionLabel icon={Activity} title="Recent activity" />
            <Card className="bg-card border-border/60">
              <CardContent className="p-4 md:p-5">
                <div className="relative space-y-4 pl-5 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-px before:bg-border">
                  {recentActivity.map((e) => (
                    <div
                      key={e.id}
                      className="relative"
                      data-testid={`cc-activity-${e.id}`}
                    >
                      <span
                        className={cn(
                          "absolute -left-[18px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-background",
                          e.status === "completed"   && "bg-emerald-500",
                          e.status === "in_progress" && "bg-amber-500",
                          e.status === "warning"     && "bg-red-500",
                        )}
                      />
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-0.5">
                        <span className="text-[11px] text-muted-foreground">
                          {e.timestamp}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
                          ·
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
                          {e.role}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {e.eventType} — {getRestaurantName(e.clientId)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {e.description}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* RIGHT (1/3) — Critical Notifs + AI + Media + Reports + Growth */}
        <div className="space-y-6">

          {/* Critical Notifications */}
          <section className="space-y-3">
            <SectionLabel icon={AlertOctagon} title="Critical notifications" />
            <Card className="bg-card border-border/60">
              <CardContent className="p-4 space-y-3">
                {criticalNotifs.map((n) => {
                  const { Icon, color } = notifIcon[n.category];
                  return (
                    <div
                      key={n.id}
                      className="flex items-start gap-2.5"
                      data-testid={`cc-notif-${n.id}`}
                    >
                      <Icon className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0", color)} />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground leading-snug">
                          {n.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {getRestaurantName(n.clientId)} · {n.time}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </section>

          {/* AI Agent Summary */}
          <section className="space-y-3">
            <SectionLabel icon={Sparkles} title="AI agent summary" />
            <Card className="bg-card border-border/60">
              <CardContent className="p-4 space-y-2.5">
                <SummaryRow label="Agents in demo mode"     value={demoAiAgentSummary.agentsInDemoMode} />
                <SummaryRow label="Recent preview outputs"  value={demoAiAgentSummary.recentPreviewOutputs} />
                <SummaryRow
                  label="Alerts generated"
                  value={demoAiAgentSummary.alertsGenerated}
                  tone="warn"
                />
                <p className="text-[10px] text-muted-foreground/70 pt-1">
                  Preview only — no live AI is running.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Media Inventory Risk */}
          <section className="space-y-3">
            <SectionLabel icon={ImageIcon} title="Media inventory risk" />
            <Card className="bg-card border-border/60">
              <CardContent className="p-4 space-y-3">
                {mediaRisk.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    All clients have healthy media supply.
                  </p>
                ) : (
                  mediaRisk.map((c) => (
                    <div
                      key={c.clientId}
                      className="flex items-start justify-between gap-3"
                      data-testid={`cc-media-${c.clientId}`}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">
                          {getRestaurantName(c.clientId)}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {c.signals.mediaInventory.note}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-semibold flex-shrink-0",
                          c.signals.mediaInventory.value <= 3
                            ? "bg-red-500/10 text-red-400 border-red-500/30"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30",
                        )}
                      >
                        {c.signals.mediaInventory.value} left
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </section>

          {/* Upcoming Reports */}
          <section className="space-y-3">
            <SectionLabel icon={FileBarChart} title="Upcoming reports" />
            <Card className="bg-card border-border/60">
              <CardContent className="p-4 space-y-3">
                {demoUpcomingReports.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-3"
                    data-testid={`cc-report-${i}`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">
                        {getRestaurantName(r.clientId)}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {r.type} · {r.status}
                      </div>
                    </div>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 flex-shrink-0">
                      <CalendarClock className="w-3 h-3" />
                      {r.due}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          {/* Growth Snapshot */}
          <section className="space-y-3">
            <SectionLabel icon={ArrowUpRight} title="Growth snapshot" />
            <Card className="bg-card border-border/60">
              <CardContent className="p-4 space-y-2">
                <SummaryRow
                  label="Visibility (portfolio avg)"
                  value={`${demoOwnerKpis.googleVisibilityScore}%`}
                  trailing={<TrendArrow direction="up" />}
                />
                <SummaryRow
                  label="Reviews this month"
                  value={`+${demoOwnerKpis.reviewGrowthThisMonth}`}
                  trailing={<TrendArrow direction="up" />}
                />
                <SummaryRow
                  label="Posts published"
                  value={String(demoOwnerKpis.publishedPosts)}
                  trailing={<TrendArrow direction="up" />}
                />
                <SummaryRow
                  label="Active clients"
                  value={String(demoOwnerKpis.activeClients)}
                  trailing={<Users className="w-3 h-3 text-muted-foreground" />}
                />
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </PortalLayout>
  );
}

// ── Sub-components ─────────────────────────────────────────────
function SectionLabel({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      <h3 className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
        {title}
      </h3>
    </div>
  );
}

function Kpi({
  label,
  value,
  note,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  note?: string;
  tone?: "good" | "warn" | "bad";
  icon?: React.ElementType;
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
    <Card className="bg-card border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground/60" />}
        </div>
        <div className={cn("text-xl md:text-2xl font-bold", toneClass)}>
          {value}
        </div>
        {note && (
          <div className="text-[10px] text-muted-foreground/70 mt-1">
            {note}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryRow({
  label,
  value,
  tone,
  trailing,
}: {
  label: string;
  value: string | number;
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
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5">
        <span className={cn("text-sm font-bold", toneClass)}>{value}</span>
        {trailing}
      </span>
    </div>
  );
}

function TrendArrow({ direction }: { direction: "up" | "down" }) {
  if (direction === "up") {
    return <ArrowUpRight className="w-3 h-3 text-emerald-400" />;
  }
  return <ArrowRight className="w-3 h-3 text-muted-foreground -rotate-45" />;
}
