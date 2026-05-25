import { useState } from "react";
import {
  TrendingUp,
  Globe,
  Star,
  CalendarCheck2,
  Image as ImageIcon,
  HeartPulse,
  StickyNote,
  Target,
  Crown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  demoMonthlyReports,
  getRestaurantName,
  type DemoMonthlyReport,
} from "@/data/demoData";

interface MonthlyReportViewProps {
  viewerRole: "client" | "operator" | "owner";
  clientId?: string;
}

export function MonthlyReportView({
  viewerRole,
  clientId,
}: MonthlyReportViewProps) {
  const visible = clientId
    ? demoMonthlyReports.filter((r) => r.clientId === clientId)
    : demoMonthlyReports;

  const [selectedId, setSelectedId] = useState<string>(
    visible[0]?.clientId ?? "",
  );
  const selected =
    visible.find((r) => r.clientId === selectedId) ?? visible[0];

  if (!selected) {
    return (
      <p className="text-sm text-muted-foreground">
        No monthly reports available.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {!clientId && visible.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {visible.map((r) => (
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
        Read-only demo. No real analytics, exports, or backend is connected.
      </p>
    </div>
  );
}

function ReportCard({ report }: { report: DemoMonthlyReport }) {
  return (
    <Card className="bg-card border-border/60">
      <CardContent className="p-5 md:p-7 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 pb-5 border-b border-border/40">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] uppercase tracking-wider font-bold text-primary">
                Executive monthly report
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-foreground">
              {getRestaurantName(report.clientId)}
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              {report.monthLabel}
            </p>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/30"
          >
            Read-only
          </Badge>
        </div>

        {/* 1. Growth Overview */}
        <Section title="1. Monthly Growth Overview" icon={TrendingUp}>
          <p className="text-sm text-foreground leading-relaxed">
            {report.growthOverview}
          </p>
        </Section>

        {/* 2. Content Performance */}
        <Section title="2. Content Performance">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {report.contentPerformance.map((m) => (
              <div
                key={m.label}
                className="rounded-md border border-border/40 bg-muted/20 p-3"
              >
                <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  {m.label}
                </div>
                <div className="text-base md:text-lg font-bold text-foreground mt-1">
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* 3. Visibility Trend */}
        <Section title="3. Google Visibility Trend" icon={Globe}>
          <TrendBars data={report.visibilityTrend} suffix="%" max={100} />
        </Section>

        {/* 4. Reviews Trend */}
        <Section title="4. Review Growth" icon={Star}>
          <TrendBars data={report.reviewsTrend} suffix="" />
        </Section>

        {/* 5. Posting Consistency */}
        <Section title="5. Posting Consistency" icon={CalendarCheck2}>
          <TrendBars data={report.postingConsistency} suffix=" posts" />
        </Section>

        {/* 6. Media Inventory Trend */}
        <Section title="6. Media Inventory" icon={ImageIcon}>
          <TrendBars data={report.inventoryTrend} suffix=" items" />
        </Section>

        {/* 7. Client Health Summary */}
        <Section title="7. Client Health Summary" icon={HeartPulse}>
          <p className="text-sm text-muted-foreground">
            {report.healthSummary}
          </p>
        </Section>

        {/* 8. Strategic Notes */}
        <Section title="8. Strategic Notes" icon={StickyNote}>
          <ul className="space-y-1.5">
            {report.strategicNotes.map((n, i) => (
              <li
                key={i}
                className="text-sm text-foreground flex items-start gap-2"
              >
                <span className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                {n}
              </li>
            ))}
          </ul>
        </Section>

        {/* 9. Next Month Focus */}
        <Section title="9. Next Month Focus" icon={Target}>
          <ul className="space-y-1.5">
            {report.nextMonthFocus.map((n, i) => (
              <li
                key={i}
                className="text-sm text-foreground flex items-start gap-2"
              >
                <span className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                {n}
              </li>
            ))}
          </ul>
        </Section>
      </CardContent>
    </Card>
  );
}

function TrendBars({
  data,
  suffix,
  max,
}: {
  data: { label: string; value: number }[];
  suffix: string;
  max?: number;
}) {
  const localMax = max ?? Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end justify-between gap-2 h-32 px-1">
      {data.map((d) => {
        const pct = Math.max(4, (d.value / localMax) * 100);
        return (
          <div
            key={d.label}
            className="flex-1 flex flex-col items-center gap-1.5"
          >
            <div className="text-[10px] font-semibold text-foreground">
              {d.value}
              {suffix}
            </div>
            <div className="w-full max-w-[40px] bg-muted/40 rounded-sm overflow-hidden flex-1 flex items-end">
              <div
                className="w-full bg-gradient-to-t from-primary/70 to-primary rounded-sm"
                style={{ height: `${pct}%` }}
              />
            </div>
            <div className="text-[10px] text-muted-foreground">{d.label}</div>
          </div>
        );
      })}
    </div>
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
