import {
  Images, Calendar, Upload, Radio, FileBarChart, ShieldAlert, ArrowRight, AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/common";
import type { CHCClientProfile, CHCHealthCategory } from "@/domain/clientHealth/engine";

// ── Health category meta ────────────────────────────────────────────────────

const categoryMeta: Record<CHCHealthCategory, { border: string }> = {
  Healthy: { border: "border-emerald-500/20" },
  Caution: { border: "border-amber-500/30"   },
  Urgent:  { border: "border-orange-500/30"  },
  Broken:  { border: "border-red-500/30"     },
};

const categoryTone: Record<CHCHealthCategory, "success" | "info" | "warning" | "danger"> = {
  Healthy: "success",
  Caution: "info",
  Urgent:  "warning",
  Broken:  "danger",
};

const reportTone: Record<string, string> = {
  Approved: "text-emerald-400",
  Pending:  "text-amber-400",
  Draft:    "text-amber-400",
  Overdue:  "text-red-400",
  Unknown:  "text-muted-foreground",
};

// ── Sub-components ──────────────────────────────────────────────────────────

function DataRow({ icon: Icon, label, value, tone }: {
  icon: LucideIcon; label: string; value: string; tone?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <div className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-semibold leading-tight">{label}</div>
        <div className={cn("text-xs font-semibold truncate", tone ?? "text-foreground")}>{value}</div>
      </div>
    </div>
  );
}

// ── Main card ───────────────────────────────────────────────────────────────

export function CommandCard({ profile }: { profile: CHCClientProfile }) {
  const meta = categoryMeta[profile.healthCategory];

  return (
    <Card
      className={cn("bg-card border", meta.border)}
      data-testid={`chc-card-${profile.clientId}`}
    >
      <CardContent className="p-4 md:p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-foreground truncate">{profile.name}</h3>
            <p className="text-[11px] text-muted-foreground">{profile.cuisine}</p>
          </div>
          <StatusBadge tone={categoryTone[profile.healthCategory]} testId={`chc-badge-${profile.clientId}`}>
            {profile.healthCategory}
          </StatusBadge>
        </div>

        {/* Plan + status pills */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className="text-[10px] rounded-full px-2 py-0.5 border border-border bg-muted/30 text-foreground/70">
            {profile.planType}
          </span>
          <span className={cn(
            "text-[10px] rounded-full px-2 py-0.5 border",
            profile.accountStatus === "At Risk"
              ? "border-red-500/30 bg-red-500/10 text-red-400"
              : "border-border bg-muted/30 text-foreground/70",
          )}>
            {profile.accountStatus}
          </span>
        </div>

        {/* Health score meter */}
        <div className="mb-4">
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Health score</span>
            <span className="text-sm font-bold tabular-nums">{profile.healthScore}</span>
          </div>
          <Progress value={profile.healthScore} className="h-1.5" />
        </div>

        {/* Content runway highlight */}
        <div className={cn(
          "rounded-md border px-3 py-2 mb-3 flex items-center justify-between",
          meta.border, "bg-muted/10",
        )}>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Content runway</p>
            <p className={cn("text-lg font-bold tabular-nums", {
              "text-emerald-400": profile.healthCategory === "Healthy",
              "text-amber-400":   profile.healthCategory === "Caution",
              "text-orange-400":  profile.healthCategory === "Urgent",
              "text-red-400":     profile.healthCategory === "Broken",
            })}>
              {profile.weeksOfContentLeft}w
              <span className="text-xs font-normal text-muted-foreground ml-1">({profile.daysOfContentLeft}d)</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Unused media</p>
            <p className="text-lg font-bold tabular-nums">{profile.unusedMediaCount}</p>
          </div>
        </div>

        {/* Data grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 mb-3">
          <DataRow icon={Calendar}    label="Weekly commitment" value={`${profile.weeklyPostingCommit} posts/wk`} />
          <DataRow icon={ShieldAlert} label="Open alerts"       value={String(profile.openAlertsCount)}
            tone={profile.openAlertsCount > 0 ? "text-rose-400" : "text-emerald-400"} />
          <DataRow icon={Upload}      label="Last upload"       value={profile.lastUploadDate} />
          <DataRow icon={Radio}       label="Last published"    value={profile.lastPublishedPost} />
          <DataRow icon={Images}      label="Monthly report"    value={profile.monthlyReportStatus}
            tone={reportTone[profile.monthlyReportStatus] ?? "text-foreground"} />
          <DataRow icon={FileBarChart} label="Account status"   value={profile.accountStatus}
            tone={profile.accountStatus === "At Risk" ? "text-red-400" : "text-foreground"} />
        </div>

        {/* Main issue */}
        <div className="rounded-md bg-muted/20 border border-border/40 px-3 py-2 mb-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Main issue
          </p>
          <p className="text-[11px] text-foreground/85">{profile.mainIssue}</p>
        </div>

        {/* Recommended action */}
        <div className="rounded-md bg-muted/20 border border-border/40 px-3 py-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Recommended action</p>
          <p className="text-[11px] text-foreground/85 flex items-start gap-1.5">
            <ArrowRight className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
            {profile.recommendedAction}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
