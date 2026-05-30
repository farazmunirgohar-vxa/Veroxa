import { useState } from "react";
import {
  HeartPulse, ShieldAlert, DollarSign, TrendingUp, Users,
  Images, Layers, Calendar, FileBarChart,
  CheckCircle2, AlertTriangle, XCircle, AlertOctagon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { PageHeader, MetricTile, StatusBadge, EmptyState } from "@/components/common";
import { CommandCard } from "@/components/clientHealth/CommandCard";
import { ClientHealthEngine } from "@/domain/clientHealth/engine";

// ── Tab bar ─────────────────────────────────────────────────────────────────

type ViewTab = "team" | "team" | "team";

const tabs: { id: ViewTab; label: string }[] = [
  { id: "team", label: "Team" },
  { id: "team",    label: "Team"    },
  { id: "team",     label: "Team"     },
];

function TabBar({ active, onChange }: { active: ViewTab; onChange: (t: ViewTab) => void }) {
  return (
    <div className="flex gap-1 mb-5 bg-muted/20 border border-border rounded-lg p-1 w-fit">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={[
            "px-4 py-1.5 rounded-md text-sm font-semibold transition-colors",
            active === t.id
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
          data-testid={`tab-${t.id}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Team/Internal Admin view ────────────────────────────────────────────────────────────

function TeamInternalAdminView() {
  const profiles = ClientHealthEngine.profiles();
  const summary  = ClientHealthEngine.portfolioSummary();
  const risks    = ClientHealthEngine.teamRisks();
  const reportsNeeded = profiles.filter((p) =>
    p.monthlyReportStatus === "Pending" || p.monthlyReportStatus === "Overdue",
  );
  const totalAlerts = profiles.reduce((s, p) => s + p.openAlertsCount, 0);

  return (
    <div className="space-y-5">
      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricTile icon={HeartPulse}  label="Healthy"         value={summary.healthy}         testId="op-tile-healthy"  accent="text-emerald-300" />
        <MetricTile icon={AlertTriangle} label="Caution"       value={summary.caution}         testId="op-tile-caution"  accent="text-amber-300" />
        <MetricTile icon={AlertOctagon}  label="Urgent"        value={summary.urgent}          testId="op-tile-urgent"   accent="text-orange-300" />
        <MetricTile icon={XCircle}       label="Broken"        value={summary.broken}          testId="op-tile-broken"   accent="text-red-300" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-1">
        <MetricTile icon={ShieldAlert}   label="Active alerts"  value={totalAlerts}             testId="op-tile-alerts"   accent="text-rose-300" />
        <MetricTile icon={FileBarChart}  label="Reports needed" value={reportsNeeded.length}    testId="op-tile-reports"  accent="text-sky-300" />
        <MetricTile icon={XCircle}       label="At risk"        value={summary.atRisk}          testId="op-tile-at-risk"  accent="text-red-300" />
      </div>

      {/* Client cards — sorted risk-first */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {profiles.map((p) => <CommandCard key={p.clientId} profile={p} />)}
      </div>

      {/* Active risks panel */}
      {risks.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" /> Escalations for team
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {risks.slice(0, 5).map((r) => (
              <div key={r.id} className="rounded-md border border-border bg-muted/20 px-3 py-2" data-testid={`op-risk-${r.id}`}>
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <p className="text-sm font-semibold leading-tight">{r.title}</p>
                  <StatusBadge tone={r.severity === "Critical" ? "danger" : "warning"}>{r.severity}</StatusBadge>
                </div>
                <p className="text-[11px] text-muted-foreground">{r.recommendedAction}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Portfolio view ───────────────────────────────────────────────────────────────

function PortfolioView() {
  const summary  = ClientHealthEngine.portfolioSummary();
  const profiles = ClientHealthEngine.profiles();
  const risks    = ClientHealthEngine.teamRisks();

  const atRiskProfiles = profiles.filter(
    (p) => p.healthCategory === "Urgent" || p.healthCategory === "Broken",
  );
  const healthyProfiles = profiles.filter((p) => p.healthCategory === "Healthy");

  return (
    <div className="space-y-5">
      {/* Executive KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricTile icon={CheckCircle2}  label="Healthy clients"  value={summary.healthy}                        testId="ow-tile-healthy"  accent="text-emerald-300" />
        <MetricTile icon={ShieldAlert}   label="At-risk clients"  value={summary.atRisk}                         testId="ow-tile-at-risk"  accent="text-red-300" />
        <MetricTile icon={DollarSign}    label="Revenue at risk"  value={`$${summary.revenueAtRisk.toLocaleString()}`} testId="ow-tile-rev-risk" accent="text-rose-300" />
        <MetricTile icon={TrendingUp}    label="Growth opps"      value={summary.growthOpportunities}            testId="ow-tile-growth"   accent="text-emerald-300" />
      </div>

      {/* Health distribution row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["Healthy","Caution","Urgent","Broken"] as const).map((cat) => {
          const count = profiles.filter((p) => p.healthCategory === cat).length;
          const tone = cat === "Healthy" ? "text-emerald-400" : cat === "Caution" ? "text-amber-400" : cat === "Urgent" ? "text-orange-400" : "text-red-400";
          return (
            <div key={cat} className="rounded-md border border-border bg-muted/20 px-3 py-2 text-center" data-testid={`ow-dist-${cat.toLowerCase()}`}>
              <p className="text-[10px] text-muted-foreground mb-0.5">{cat}</p>
              <p className={["text-2xl font-bold tabular-nums", tone].join(" ")}>{count}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Retention risk */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" /> Retention risk ({atRiskProfiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {atRiskProfiles.length === 0 ? (
              <EmptyState title="No retention risks" message="All clients are stable." testId="ow-empty-retention" />
            ) : (
              atRiskProfiles.map((p) => (
                <div key={p.clientId} className="rounded-md border border-border bg-muted/20 px-3 py-2 flex items-center justify-between" data-testid={`ow-retention-${p.clientId}`}>
                  <div>
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">{p.planType} · {p.daysOfContentLeft}d runway</p>
                  </div>
                  <StatusBadge tone={p.healthCategory === "Broken" ? "danger" : "warning"}>{p.healthCategory}</StatusBadge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Growth opportunities */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Growth opportunities ({healthyProfiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {healthyProfiles.length === 0 ? (
              <EmptyState title="No healthy clients" message="Portfolio needs attention." testId="ow-empty-growth" />
            ) : (
              healthyProfiles.map((p) => (
                <div key={p.clientId} className="rounded-md border border-border bg-muted/20 px-3 py-2 flex items-center justify-between" data-testid={`ow-growth-${p.clientId}`}>
                  <div>
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">{p.planType} · {p.weeksOfContentLeft}w runway · score {p.healthScore}</p>
                  </div>
                  <StatusBadge tone="success">Healthy</StatusBadge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Critical alerts only */}
      {risks.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" /> Business-level risks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {risks.slice(0, 4).map((r) => (
              <div key={r.id} className="rounded-md border border-border bg-muted/20 px-3 py-2" data-testid={`ow-risk-${r.id}`}>
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <p className="text-sm font-semibold leading-tight">{r.title}</p>
                  <StatusBadge tone={r.severity === "Critical" ? "danger" : "warning"}>{r.severity}</StatusBadge>
                </div>
                <p className="text-[11px] text-muted-foreground">{r.description}</p>
                <p className="text-[10px] text-foreground/70 mt-1"><span className="text-muted-foreground">Action:</span> {r.recommendedAction}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Team view ────────────────────────────────────────────────────────────────

function TeamView() {
  const needingMedia       = ClientHealthEngine.needingMedia();
  const awaitingDrafts     = ClientHealthEngine.awaitingDrafts();
  const awaitingScheduling = ClientHealthEngine.awaitingScheduling();
  const awaitingReports    = ClientHealthEngine.awaitingReports();

  const sections = [
    { id: "media",      icon: Images,      accent: "text-rose-400",   label: "Clients needing media upload",   items: needingMedia       },
    { id: "drafts",     icon: Layers,      accent: "text-amber-400",  label: "Clients waiting on drafts",      items: awaitingDrafts     },
    { id: "scheduling", icon: Calendar,    accent: "text-sky-400",    label: "Clients waiting scheduling",     items: awaitingScheduling },
    { id: "reports",    icon: FileBarChart,accent: "text-violet-400", label: "Clients waiting report approval",items: awaitingReports    },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricTile icon={Images}       label="Need media"     value={needingMedia.length}       testId="tm-tile-media"     accent="text-rose-300" />
        <MetricTile icon={Layers}       label="Await drafts"   value={awaitingDrafts.length}     testId="tm-tile-drafts"    accent="text-amber-300" />
        <MetricTile icon={Calendar}     label="Await sched."   value={awaitingScheduling.length} testId="tm-tile-sched"     accent="text-sky-300" />
        <MetricTile icon={FileBarChart} label="Await reports"  value={awaitingReports.length}    testId="tm-tile-reports"   accent="text-violet-300" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sections.map(({ id, icon: Icon, accent, label, items }) => (
          <Card key={id} className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Icon className={["w-4 h-4", accent].join(" ")} /> {label} ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="All clear"
                  message="No clients need attention here right now."
                  testId={`tm-empty-${id}`}
                />
              ) : (
                items.map((p) => (
                  <div
                    key={p.clientId}
                    className="rounded-md border border-border bg-muted/20 px-3 py-2 flex items-center justify-between"
                    data-testid={`tm-${id}-${p.clientId}`}
                  >
                    <div>
                      <p className="text-sm font-semibold">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {p.unusedMediaCount} unused · {p.daysOfContentLeft}d runway
                      </p>
                    </div>
                    <StatusBadge
                      tone={
                        p.healthCategory === "Broken"  ? "danger"  :
                        p.healthCategory === "Urgent"  ? "warning" :
                        p.healthCategory === "Caution" ? "info"    : "success"
                      }
                    >
                      {p.healthCategory}
                    </StatusBadge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ClientHealthCommand() {
  const [view, setView] = useState<ViewTab>("team");
  const summary = ClientHealthEngine.portfolioSummary();

  return (
    <div className="min-h-screen bg-background text-foreground px-4 md:px-8 py-6 md:py-10 max-w-6xl mx-auto">
      <PageHeader
        title="Client Health Command Center"
        description={`Portfolio health across ${summary.totalClients} clients — ${summary.healthy} healthy · ${summary.atRisk} at risk. Switch tabs to see role-specific views.`}
        testId="header-chc"
      />
      <DemoOnlyBanner
        message="Health scores and content runway are calculated from demo data. No real monitoring or alerts are active."
        testId="banner-chc"
      />

      <TabBar active={view} onChange={setView} />

      {view === "team" && <TeamView />}
      {view === "team"    && <TeamView    />}
      {view === "team"     && <TeamView     />}
    </div>
  );
}
