import {
  CheckCircle2,
  FileBarChart,
  Image as ImageIcon,
  CheckSquare,
  CalendarCheck2,
  CircleAlert,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { demoTeamKpis } from "@/data/demoData";

interface KpiDashboardViewProps {
  viewerRole: "team";
}

interface KpiSpec {
  label: string;
  value: string;
  trend: string;
  note: string;
  icon: React.ElementType;
  tone?: "good" | "warn" | "bad";
}

export function KpiDashboardView({ viewerRole }: KpiDashboardViewProps) {
  const kpis: KpiSpec[] = [
    { label: "Tasks completed this week", value: String(demoTeamKpis.tasksCompletedThisWeek), trend: "On pace", note: "Across team", icon: CheckSquare, tone: "good" },
    { label: "Reports pending review", value: String(demoTeamKpis.reportsPendingReview), trend: "Due by Friday", note: "Weekly + monthly", icon: FileBarChart, tone: "warn" },
    { label: "Media items pending review", value: String(demoTeamKpis.mediaItemsPendingReview), trend: "Action required", note: "Across all clients", icon: ImageIcon, tone: "warn" },
    { label: "Approved content ready", value: String(demoTeamKpis.approvedContentReady), trend: "Queued for schedule", note: "Ready to publish", icon: CheckCircle2, tone: "good" },
    { label: "Posts scheduled this week", value: String(demoTeamKpis.postsScheduledThisWeek), trend: "Next 7 days", note: "Across portfolio", icon: CalendarCheck2 },
    { label: "Client issues open", value: String(demoTeamKpis.clientIssuesOpen), trend: "Team aware", note: "Critical + warning", icon: CircleAlert, tone: "bad" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground/60">
        Viewing as: <span className="text-foreground/70">{viewerRole}</span> ·
        Demo values only. No live analytics, billing, or client account data is
        connected.
      </p>
    </div>
  );
}

function KpiCard({
  label,
  value,
  trend,
  note,
  icon: Icon,
  tone,
}: KpiSpec) {
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
      <CardContent className="p-4 md:p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight">
            {label}
          </span>
          <Icon className="w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0 ml-2" />
        </div>
        <div className={cn("text-2xl md:text-3xl font-bold", toneClass)}>
          {value}
        </div>
        <p className="text-[11px] text-muted-foreground mt-2 leading-snug">
          {trend}
        </p>
        <p className="text-[10px] text-muted-foreground/70 mt-0.5">{note}</p>
      </CardContent>
    </Card>
  );
}
