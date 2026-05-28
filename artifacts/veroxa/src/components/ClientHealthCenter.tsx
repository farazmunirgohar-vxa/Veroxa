import {
  HeartPulse,
  ImageIcon,
  CalendarCheck2,
  ClipboardList,
  FileBarChart,
  Gauge,
  Clock3,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { healthRepository } from "@/lib/repositories";
import type {
  ClientHealthSnapshot,
  ContentHealthStatus,
} from "@/lib/data/veroxaDataContracts";

interface ClientHealthCenterProps {
  viewerRole: "owner" | "operator";
}

const statusMeta: Record<
  ContentHealthStatus,
  { label: string; badge: string; accent: string; dot: string }
> = {
  healthy: {
    label:  "Healthy",
    badge:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    accent: "border-emerald-500/20",
    dot:    "bg-emerald-500",
  },
  caution: {
    label:  "Caution",
    badge:  "bg-amber-500/10 text-amber-400 border-amber-500/30",
    accent: "border-amber-500/20",
    dot:    "bg-amber-500",
  },
  urgent: {
    label:  "Urgent",
    badge:  "bg-rose-500/10 text-rose-400 border-rose-500/30",
    accent: "border-rose-500/30",
    dot:    "bg-rose-500",
  },
  broken: {
    label:  "Broken",
    badge:  "bg-destructive/10 text-destructive border-destructive/40",
    accent: "border-destructive/40",
    dot:    "bg-destructive",
  },
};

const STATUS_ORDER: Record<ContentHealthStatus, number> = {
  broken: 0,
  urgent: 1,
  caution: 2,
  healthy: 3,
};

const REPORT_STATUS_LABEL: Record<string, string> = {
  not_started:     "Not started",
  drafted:         "Drafted",
  team_validated:  "Team validated",
  operator_review: "Operator review",
  approved:        "Approved",
  delivered:       "Delivered",
  blocked:         "Blocked",
};

function nextActionFor(snapshot: ClientHealthSnapshot): string {
  if (snapshot.ownerEscalationRequired) return "Owner escalation required";
  if (snapshot.operatorActionRequired)  return "Operator follow-up required";
  if (snapshot.clientActionRequired)    return "Client action required";
  return "Maintain current cadence";
}

function formatPercent(rate: number): string {
  return `${Math.round(Math.max(0, Math.min(1, rate)) * 100)}%`;
}

function postingTone(rate: number): "good" | "warn" | "bad" {
  if (rate >= 0.9) return "good";
  if (rate >= 0.6) return "warn";
  return "bad";
}

function runwayTone(weeks: number): "good" | "warn" | "bad" {
  if (weeks >= 3) return "good";
  if (weeks >= 1) return "warn";
  return "bad";
}

function reportTone(status: string): "good" | "warn" | "bad" {
  if (status === "approved" || status === "delivered") return "good";
  if (status === "blocked")                            return "bad";
  return "warn";
}

function HealthCard({ snapshot }: { snapshot: ClientHealthSnapshot }) {
  const meta = statusMeta[snapshot.contentHealthStatus];
  const reportLabel = REPORT_STATUS_LABEL[snapshot.reportStatus] ?? snapshot.reportStatus;

  return (
    <Card
      className={cn("bg-card border", meta.accent)}
      data-testid={`health-card-${snapshot.clientId}`}
    >
      <CardContent className="p-5 md:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3 className="text-base md:text-lg font-bold text-foreground truncate">
              {snapshot.businessName}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Client ID: {snapshot.clientId}
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn("text-[10px] font-semibold flex-shrink-0", meta.badge)}
            data-testid={`health-status-${snapshot.clientId}`}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", meta.dot)} />
            {meta.label}
          </Badge>
        </div>

        {/* Posting completion as the headline metric */}
        <div className="flex items-end gap-3 mb-4">
          <div className="text-3xl md:text-4xl font-extrabold tracking-tight">
            {formatPercent(snapshot.postingCompletionRate)}
          </div>
          <div className="text-xs text-muted-foreground pb-1.5">
            posting completion
          </div>
        </div>
        <Progress
          value={Math.round(Math.max(0, Math.min(1, snapshot.postingCompletionRate)) * 100)}
          className="h-1.5 mb-5"
        />

        {/* Main issue + recommended action */}
        <div className="space-y-3 mb-5">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
              Main issue
            </div>
            <p className="text-sm text-foreground leading-snug">
              {snapshot.riskReason}
            </p>
          </div>
          <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-muted/40 border border-border/40">
            <ArrowRight className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-foreground">
              <span className="font-semibold">Next action: </span>
              {nextActionFor(snapshot)}
            </p>
          </div>
        </div>

        {/* Signal grid */}
        <div className="grid grid-cols-2 gap-3">
          <SignalRow
            icon={ImageIcon}
            label="Media inventory"
            value={`${snapshot.unusedUsableMediaCount}`}
            note="unused usable assets"
          />
          <SignalRow
            icon={CalendarCheck2}
            label="Posting"
            value={formatPercent(snapshot.postingCompletionRate)}
            tone={postingTone(snapshot.postingCompletionRate)}
          />
          <SignalRow
            icon={Clock3}
            label="Content runway"
            value={`${snapshot.weeksOfContentLeft} wk`}
            tone={runwayTone(snapshot.weeksOfContentLeft)}
          />
          <SignalRow
            icon={Gauge}
            label="Frequency"
            value={`${snapshot.postingFrequencyWeekly}/wk`}
          />
          <SignalRow
            icon={FileBarChart}
            label="Report"
            value={reportLabel}
            tone={reportTone(snapshot.reportStatus)}
          />
          <SignalRow
            icon={ClipboardList}
            label="Action flags"
            value={[
              snapshot.ownerEscalationRequired ? "Owner" : null,
              snapshot.operatorActionRequired  ? "Operator" : null,
              snapshot.clientActionRequired    ? "Client" : null,
            ].filter(Boolean).join(" · ") || "None"}
          />
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
      ? "text-rose-400"
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
  const snapshots = healthRepository.getAllClientHealthSnapshots();
  const summary = healthRepository.getHealthSummary();

  const sorted = [...snapshots].sort(
    (a, b) => STATUS_ORDER[a.contentHealthStatus] - STATUS_ORDER[b.contentHealthStatus],
  );

  return (
    <div className="space-y-6">
      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-card/60 border-border/60" data-testid="chc-summary-total">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <HeartPulse className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Total clients
              </span>
            </div>
            <div className="text-2xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>
        <SummaryTile label="Healthy" count={summary.healthy} tone="good"        testId="chc-summary-healthy" />
        <SummaryTile label="Caution" count={summary.caution} tone="warn"        testId="chc-summary-caution" />
        <SummaryTile label="Urgent"  count={summary.urgent}  tone="bad"         testId="chc-summary-urgent"  />
        <SummaryTile label="Broken"  count={summary.broken}  tone="destructive" testId="chc-summary-broken"  />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {sorted.map((snapshot) => (
          <HealthCard key={snapshot.clientId} snapshot={snapshot} />
        ))}
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
  testId,
}: {
  label: string;
  count: number;
  tone: "good" | "warn" | "bad" | "destructive";
  testId?: string;
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-400"
      : tone === "warn"
      ? "text-amber-400"
      : tone === "bad"
      ? "text-rose-400"
      : "text-destructive";
  const dotClass =
    tone === "good"
      ? "bg-emerald-500"
      : tone === "warn"
      ? "bg-amber-500"
      : tone === "bad"
      ? "bg-rose-500"
      : "bg-destructive";
  return (
    <Card className="bg-card/60 border-border/60" data-testid={testId}>
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
