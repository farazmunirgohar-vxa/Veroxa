import {
  Heart, AlertTriangle, Images, FileBarChart, Bot, Activity, Calendar, ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { PageHeader, MetricTile, StatusBadge, EmptyState } from "@/components/common";
import { ClientRepository } from "@/domain/clients/repository";
import { HealthService, RiskService } from "@/domain/clients/service";
import { MediaService } from "@/domain/media/service";
import { ReportService } from "@/domain/reports/service";
import { AIRepository } from "@/domain/ai/repository";
import {
  demoTeamAlerts, demoUpcomingReports, demoOperatorMetrics,
} from "@/data/demoData";

export default function OperatorOS() {
  const portfolioHealth   = HealthService.portfolioAverage();
  const atRisk            = RiskService.atRisk();
  const lowMediaClients   = MediaService.needsUpload();
  const criticalMedia     = MediaService.critical();
  const monthlyReports    = ReportService.pending().filter((r) => r.type === "Monthly");
  const agents            = AIRepository.agents();
  const criticalAlerts    = demoTeamAlerts.filter((a) => a.severity === "Critical" || a.severity === "High");

  // Failed / reschedule queue — surface published-blocker items as a demo proxy
  const failedQueue = demoTeamAlerts.filter((a) => a.category === "Report" || a.category === "Media");

  const avgAgentConfidence = Math.round(
    agents.reduce((s, a) => s + a.confidence, 0) / Math.max(1, agents.length),
  );

  return (
    <div className="min-h-screen bg-background text-foreground px-4 md:px-8 py-6 md:py-10 max-w-6xl mx-auto">
      <PageHeader
        title="Operator OS"
        description="Daily oversight surface — health, alerts, low-content clients, reschedule queue, report approvals, AI agent monitoring."
        testId="header-operator-os"
      />
      <DemoOnlyBanner
        message="Oversight view. All controls are read-only in demo mode — execution still happens from individual portal pages."
        testId="banner-operator-os"
      />

      {/* Top KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <MetricTile icon={Heart}        label="Portfolio health" value={`${portfolioHealth}%`}                     testId="tile-portfolio-health" accent="text-emerald-300" />
        <MetricTile icon={ShieldAlert}  label="At-risk clients"  value={atRisk.length}                              testId="tile-at-risk"          accent="text-rose-300" hint={`${demoOperatorMetrics.clientsRequiringAttention} need attention`} />
        <MetricTile icon={Images}       label="Low-content"      value={lowMediaClients.length}                     testId="tile-low-content"      accent="text-amber-300" hint={`${criticalMedia.length} critical`} />
        <MetricTile icon={FileBarChart} label="Reports pending"  value={ReportService.pending().length}             testId="tile-reports-pending"  accent="text-sky-300"   hint={`${monthlyReports.length} monthly`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Client health overview */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Heart className="w-4 h-4 text-emerald-400" /> Client health overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ClientRepository.lifecycle().map((c) => (
              <div key={c.clientId} className="rounded-md border border-border bg-muted/20 px-3 py-2" data-testid={`health-row-${c.clientId}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold">{ClientRepository.nameOf(c.clientId)}</p>
                  <StatusBadge
                    tone={c.riskLevel === "Critical" ? "danger" : c.riskLevel === "High" ? "warning" : c.riskLevel === "Medium" ? "info" : "success"}
                  >
                    {c.riskLevel} risk
                  </StatusBadge>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={c.healthScore} className="h-1.5 flex-1" />
                  <span className="text-[11px] tabular-nums text-muted-foreground w-10 text-right">{c.healthScore}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Active alerts */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-400" /> Active alerts ({criticalAlerts.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {criticalAlerts.length === 0 ? (
              <EmptyState title="No active alerts" message="Everything is in the green." testId="empty-alerts" />
            ) : (
              criticalAlerts.slice(0, 6).map((a) => (
                <div key={a.id} className="rounded-md border border-border bg-muted/20 px-3 py-2" data-testid={`alert-${a.id}`}>
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <p className="text-sm font-semibold leading-tight">{a.title}</p>
                    <StatusBadge tone={a.severity === "Critical" ? "danger" : "warning"}>{a.severity}</StatusBadge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{a.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{a.time}{a.clientId ? ` · ${ClientRepository.nameOf(a.clientId)}` : ""}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Low-content clients */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Images className="w-4 h-4 text-amber-400" /> Low-content clients</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowMediaClients.length === 0 ? (
              <EmptyState title="All clients well-stocked" message="No media runway concerns this week." testId="empty-low-content" />
            ) : (
              lowMediaClients.map((r) => (
                <div key={r.clientId} className="rounded-md border border-border bg-muted/20 px-3 py-2 flex items-center justify-between" data-testid={`low-content-${r.clientId}`}>
                  <div>
                    <p className="text-sm font-semibold">{ClientRepository.nameOf(r.clientId)}</p>
                    <p className="text-[11px] text-muted-foreground">{r.unusedPhotos + r.unusedVideos} unused · {r.daysRemaining}d runway</p>
                  </div>
                  <StatusBadge tone={r.health === "Critical" ? "danger" : "warning"}>{r.health}</StatusBadge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Failed / reschedule queue */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-rose-400" /> Failed / reschedule queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {failedQueue.length === 0 ? (
              <EmptyState title="No failed posts" message="Queue is clean." testId="empty-failed" />
            ) : (
              failedQueue.slice(0, 5).map((a) => (
                <div key={a.id} className="rounded-md border border-border bg-muted/20 px-3 py-2" data-testid={`failed-${a.id}`}>
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-sm font-medium leading-tight">{a.title}</p>
                    <StatusBadge tone={a.severity === "Critical" ? "danger" : a.severity === "High" ? "warning" : "info"}>{a.category}</StatusBadge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{a.description}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly report approval queue */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><FileBarChart className="w-4 h-4 text-sky-400" /> Monthly report approval queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(() => {
              const monthly = demoUpcomingReports.filter((r) => r.type === "Monthly");
              if (monthly.length === 0) {
                return <EmptyState title="No monthly reports pending" message="The monthly approval queue is clear." testId="empty-reports" />;
              }
              return monthly.map((r, idx) => (
                <div key={`${r.clientId}-${idx}`} className="rounded-md border border-border bg-muted/20 px-3 py-2 flex items-center justify-between" data-testid={`report-${r.clientId}-${idx}`}>
                  <div>
                    <p className="text-sm font-semibold">{ClientRepository.nameOf(r.clientId)}</p>
                    <p className="text-[11px] text-muted-foreground">{r.type} · due {r.due}</p>
                  </div>
                  <StatusBadge tone={r.status === "Draft" ? "warning" : "info"}>{r.status}</StatusBadge>
                </div>
              ));
            })()}
          </CardContent>
        </Card>

        {/* AI agent monitoring summary */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Bot className="w-4 h-4 text-violet-400" /> AI agent monitoring</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border bg-muted/20 p-3 mb-2 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground">Average confidence</p>
                <p className="text-2xl font-bold tabular-nums text-violet-300">{avgAgentConfidence}%</p>
              </div>
              <Activity className="w-7 h-7 text-violet-400" />
            </div>
            <div className="space-y-1.5 max-h-52 overflow-auto pr-1">
              {agents.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-xs" data-testid={`agent-${a.id}`}>
                  <span className="truncate text-foreground/85">{a.name}</span>
                  <span className={`tabular-nums ${a.confidence >= 90 ? "text-emerald-300" : a.confidence >= 85 ? "text-sky-300" : "text-amber-300"}`}>{a.confidence}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
