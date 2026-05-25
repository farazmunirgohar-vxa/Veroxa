import { useState } from "react";
import {
  CalendarRange,
  Image as ImageIcon,
  Globe,
  Star,
  Trophy,
  ListChecks,
  StickyNote,
  Send,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  demoWeeklyReports,
  getRestaurantName,
  type DemoWeeklyReport,
  type WeeklyReportStatus,
} from "@/data/demoData";

interface WeeklyReportViewProps {
  viewerRole: "client" | "operator" | "owner";
  clientId?: string;
}

const statusStyle: Record<WeeklyReportStatus, string> = {
  "Draft":            "bg-muted text-muted-foreground border-border",
  "Operator Review":  "bg-amber-500/10 text-amber-400 border-amber-500/30",
  "Ready for Client": "bg-blue-500/10 text-blue-400 border-blue-500/30",
  "Published":        "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
};

export function WeeklyReportView({
  viewerRole,
  clientId,
}: WeeklyReportViewProps) {
  const visibleReports = clientId
    ? demoWeeklyReports.filter((r) => r.clientId === clientId)
    : demoWeeklyReports;

  const [selectedId, setSelectedId] = useState<string>(
    visibleReports[0]?.clientId ?? "",
  );
  const selected =
    visibleReports.find((r) => r.clientId === selectedId) ?? visibleReports[0];

  if (!selected) {
    return (
      <p className="text-sm text-muted-foreground">
        No weekly reports available.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {/* Client selector (when viewing multiple) */}
      {!clientId && visibleReports.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {visibleReports.map((r) => (
            <button
              key={r.clientId}
              onClick={() => setSelectedId(r.clientId)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors",
                selected.clientId === r.clientId
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-card/40 text-muted-foreground border-border/60 hover:bg-card hover:text-foreground",
              )}
            >
              {getRestaurantName(r.clientId)}
            </button>
          ))}
        </div>
      )}

      <ReportCard report={selected} />

      <p className="text-[11px] text-muted-foreground/60">
        Viewing as: <span className="text-foreground/70">{viewerRole}</span> ·
        Read-only demo. No real analytics, automation, PDF export, or backend is
        connected.
      </p>
    </div>
  );
}

function ReportCard({ report }: { report: DemoWeeklyReport }) {
  return (
    <Card className="bg-card border-border/60">
      <CardContent className="p-5 md:p-7 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 pb-5 border-b border-border/40">
          <div className="min-w-0">
            <h3 className="text-xl md:text-2xl font-bold text-foreground">
              {getRestaurantName(report.clientId)}
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <CalendarRange className="w-3.5 h-3.5" />
              {report.weekRange}
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-semibold",
              statusStyle[report.status],
            )}
          >
            {report.status}
          </Badge>
        </div>

        {/* 1. Week Summary */}
        <Section title="1. Week Summary">
          <p className="text-sm text-foreground leading-relaxed">
            {report.summary}
          </p>
        </Section>

        {/* 2. Content Published + Metrics */}
        <Section title="2. Content Published">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {report.metrics.map((m) => (
              <div
                key={m.label}
                className="rounded-md border border-border/40 bg-muted/20 p-3"
              >
                <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  {m.label}
                </div>
                <div className="text-lg font-bold text-foreground mt-1">
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* 3. Google Visibility */}
        <Section title="3. Google Visibility Activity" icon={Globe}>
          <p className="text-sm text-muted-foreground">
            Visibility estimate this week:{" "}
            <span className="font-semibold text-foreground">
              {report.metrics.find((m) => m.label.includes("Visibility"))?.value ?? "—"}
            </span>
            . Google profile updates and search appearance signals are tracked
            week over week.
          </p>
        </Section>

        {/* 4. Review Activity */}
        <Section title="4. Review Activity" icon={Star}>
          <p className="text-sm text-muted-foreground">
            New reviews this week:{" "}
            <span className="font-semibold text-foreground">
              {report.metrics.find((m) => m.label.includes("reviews"))?.value ?? "—"}
            </span>
            .
          </p>
        </Section>

        {/* 5. Top Performing Content */}
        <Section title="5. Top Performing Content" icon={Trophy}>
          <div className="rounded-md border border-border/40 bg-muted/20 p-3">
            <div className="text-sm font-semibold text-foreground">
              {report.topContent.title}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {report.topContent.engagement}
            </div>
          </div>
        </Section>

        {/* 6. Media Inventory Status */}
        <Section title="6. Media Inventory Status" icon={ImageIcon}>
          <p className="text-sm text-muted-foreground">{report.mediaStatus}</p>
        </Section>

        {/* 7. Next Week Plan */}
        <Section title="7. Next Week Plan" icon={ListChecks}>
          <ul className="space-y-2">
            {report.nextWeekPlan.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-foreground"
              >
                <Send className="w-3.5 h-3.5 mt-1 text-primary flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* Notes + Recommendation */}
        <Section title="Notes" icon={StickyNote}>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {report.notes}
          </p>
        </Section>
      </CardContent>
    </Card>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
        <h4 className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
          {title}
        </h4>
      </div>
      {children}
    </section>
  );
}
