import {
  Heart, AlertTriangle, Images, FileBarChart, Bot, Activity, Calendar, ShieldAlert,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { PortalLayout } from "@/components/PortalLayout";
import { operatorPortalNavItems } from "@/lib/operatorPortalNav";
import {
  PageHeader, MetricTile, StatusBadge, EmptyState,
  SectionCard, AlertRow, StatRow,
} from "@/components/common";
import { ClientRepository } from "@/domain/clients/repository";
import { HealthService, RiskService } from "@/domain/clients/service";
import { MediaService } from "@/domain/media/service";
import { ReportService } from "@/domain/reports/service";
import { AIRepository } from "@/domain/ai/repository";
import { demoTeamAlerts, demoUpcomingReports, demoOperatorMetrics } from "@/data/demoData";

export default function OperatorOS() {
  const portfolioHealth = HealthService.portfolioAverage();
  const atRisk          = RiskService.atRisk();
  const lowMedia        = MediaService.needsUpload();
  const criticalMedia   = MediaService.critical();
  const monthlyReports  = ReportService.pending().filter((r) => r.type === "Monthly");
  const agents          = AIRepository.agents();
  const criticalAlerts  = demoTeamAlerts.filter((a) => a.severity === "Critical" || a.severity === "High");
  const failedQueue     = demoTeamAlerts.filter((a) => a.category === "Report" || a.category === "Media");

  const avgAgentConfidence = Math.round(
    agents.reduce((s, a) => s + a.confidence, 0) / Math.max(1, agents.length),
  );

  return (
    <PortalLayout items={operatorPortalNavItems} portalName="Operator Portal">
    <div>
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
        <MetricTile icon={Heart}        label="Portfolio health" value={`${portfolioHealth}%`}            accent="text-emerald-300" testId="tile-portfolio-health" />
        <MetricTile icon={ShieldAlert}  label="At-risk clients"  value={atRisk.length}                    accent="text-rose-300"   hint={`${demoOperatorMetrics.clientsRequiringAttention} need attention`} testId="tile-at-risk" />
        <MetricTile icon={Images}       label="Low-content"      value={lowMedia.length}                  accent="text-amber-300"  hint={`${criticalMedia.length} critical`} testId="tile-low-content" />
        <MetricTile icon={FileBarChart} label="Reports pending"  value={ReportService.pending().length}   accent="text-sky-300"    hint={`${monthlyReports.length} monthly`} testId="tile-reports-pending" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Client health overview */}
        <SectionCard title="Client health overview" icon={Heart} iconClass="text-emerald-400">
          {ClientRepository.lifecycle().map((c) => (
            <div key={c.clientId} className="rounded-md border border-border bg-muted/20 px-3 py-2" data-testid={`health-row-${c.clientId}`}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold">{ClientRepository.nameOf(c.clientId)}</p>
                <StatusBadge tone={c.riskLevel === "Critical" ? "danger" : c.riskLevel === "High" ? "warning" : c.riskLevel === "Medium" ? "info" : "success"}>
                  {c.riskLevel} risk
                </StatusBadge>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={c.healthScore} className="h-1.5 flex-1" />
                <span className="text-[11px] tabular-nums text-muted-foreground w-10 text-right">{c.healthScore}%</span>
              </div>
            </div>
          ))}
        </SectionCard>

        {/* Active alerts */}
        <SectionCard title={`Active alerts (${criticalAlerts.length})`} icon={AlertTriangle} iconClass="text-rose-400">
          {criticalAlerts.length === 0 ? (
            <EmptyState title="No active alerts" message="Everything is in the green." testId="empty-alerts" />
          ) : (
            criticalAlerts.slice(0, 6).map((a) => (
              <AlertRow
                key={a.id}
                title={a.title}
                badge={<StatusBadge tone={a.severity === "Critical" ? "danger" : "warning"}>{a.severity}</StatusBadge>}
                description={a.description}
                meta={`${a.time}${a.clientId ? ` · ${ClientRepository.nameOf(a.clientId)}` : ""}`}
                testId={`alert-${a.id}`}
              />
            ))
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Low-content clients */}
        <SectionCard title="Low-content clients" icon={Images} iconClass="text-amber-400">
          {lowMedia.length === 0 ? (
            <EmptyState title="All clients well-stocked" message="No media runway concerns this week." testId="empty-low-content" />
          ) : (
            lowMedia.map((r) => (
              <StatRow
                key={r.clientId}
                primary={ClientRepository.nameOf(r.clientId)}
                secondary={`${r.unusedPhotos + r.unusedVideos} unused · ${r.daysRemaining}d runway`}
                badge={<StatusBadge tone={r.health === "Critical" ? "danger" : "warning"}>{r.health}</StatusBadge>}
                testId={`low-content-${r.clientId}`}
              />
            ))
          )}
        </SectionCard>

        {/* Failed / reschedule queue */}
        <SectionCard title="Failed / reschedule queue" icon={Calendar} iconClass="text-rose-400">
          {failedQueue.length === 0 ? (
            <EmptyState title="No failed posts" message="Queue is clean." testId="empty-failed" />
          ) : (
            failedQueue.slice(0, 5).map((a) => (
              <AlertRow
                key={a.id}
                title={a.title}
                badge={<StatusBadge tone={a.severity === "Critical" ? "danger" : a.severity === "High" ? "warning" : "info"}>{a.category}</StatusBadge>}
                description={a.description}
                testId={`failed-${a.id}`}
              />
            ))
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly report approval queue */}
        <SectionCard title="Monthly report approval queue" icon={FileBarChart} iconClass="text-sky-400">
          {(() => {
            const monthly = demoUpcomingReports.filter((r) => r.type === "Monthly");
            if (monthly.length === 0) {
              return <EmptyState title="No monthly reports pending" message="The monthly approval queue is clear." testId="empty-reports" />;
            }
            return monthly.map((r, idx) => (
              <StatRow
                key={`${r.clientId}-${idx}`}
                primary={ClientRepository.nameOf(r.clientId)}
                secondary={`${r.type} · due ${r.due}`}
                badge={<StatusBadge tone={r.status === "Draft" ? "warning" : "info"}>{r.status}</StatusBadge>}
                testId={`report-${r.clientId}-${idx}`}
              />
            ));
          })()}
        </SectionCard>

        {/* AI agent monitoring */}
        <SectionCard title="AI agent monitoring" icon={Bot} iconClass="text-violet-400" contentClass="">
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
        </SectionCard>
      </div>
    </div>
    </PortalLayout>
  );
}
