import {
  Zap, AlertTriangle, ClipboardList, Workflow, FileText, Images,
  ClipboardCheck, Activity, ArrowRight,
} from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { operatorPortalNavItems } from "@/lib/operatorPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import {
  demoTasksV2, demoClientLifecycle, demoContentItems, demoReportingOps,
  demoMediaRunway, demoBottlenecks, demoActivityLog, getRestaurantName,
  lifecycleStageColor, riskLevelColor, reportOpStatusColor,
} from "@/data/demoData";

export default function OperatorCommandBoard() {
  const todays      = demoTasksV2.filter((t) => t.dueDate.toLowerCase() === "today"   && t.status !== "Completed");
  const overdues    = demoTasksV2.filter((t) => t.dueDate.toLowerCase() === "overdue" && t.status !== "Completed");
  const atRisk      = demoClientLifecycle.filter((c) => c.riskLevel === "High" || c.riskLevel === "Critical" || c.lifecycleStage === "At Risk" || c.lifecycleStage === "Needs Attention");
  const stuck       = demoContentItems.filter((c) => c.status === "Blocked" || c.status === "Waiting");
  const reportsWait = demoReportingOps.filter((r) => r.status === "Validation Needed" || r.status === "Needs Revision");
  const lowMedia    = demoMediaRunway.filter((m) => m.health === "Low" || m.health === "Critical");
  const recent      = [...demoActivityLog].slice(0, 5);

  const suggestions = [
    "Approve Crescent olive-oil reel for Sunday slot.",
    "Reassign Urban Tacos caption rewrite to Ava (4h SLA).",
    "Trigger Al Noor reshoot brief — supply critical.",
    "Validate Urban Tacos weekly report — overdue 36h.",
  ];

  return (
    <PortalLayout items={operatorPortalNavItems} portalName="Operator Portal">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="header-command-board">
          Operations Command Board
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Your daily mission control — priorities, overdues, risks, stuck items, and recommended actions.
        </p>
      </div>

      <DemoOnlyBanner message="Demo only — sample command board." testId="banner-command-board" />

      {/* Top tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <Tile icon={Zap}            label="Today's priorities" value={String(todays.length)}     accent="text-primary"     />
        <Tile icon={AlertTriangle}  label="Overdue tasks"      value={String(overdues.length)}   accent="text-rose-400"    />
        <Tile icon={ClipboardList}  label="Clients at risk"    value={String(atRisk.length)}     accent="text-amber-400"   />
        <Tile icon={Workflow}       label="Stuck content"      value={String(stuck.length)}      accent="text-amber-400"   />
        <Tile icon={FileText}       label="Reports waiting"    value={String(reportsWait.length)} accent="text-violet-400" />
        <Tile icon={Images}         label="Low media clients"  value={String(lowMedia.length)}   accent="text-amber-400"   />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Today's priorities */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> Today's priorities ({todays.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {todays.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No items due today.</p>
            ) : todays.map((t) => (
              <div key={t.id} className="rounded-md border border-border bg-muted/20 px-3 py-2">
                <p className="text-sm font-medium">{t.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {getRestaurantName(t.clientId)} · {t.assignedTo} · {t.priority}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card className="bg-card border-rose-500/30">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-400" /> Overdue ({overdues.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {overdues.length === 0 ? (
              <p className="text-xs text-emerald-400">No overdues. Nice.</p>
            ) : overdues.map((t) => (
              <div key={t.id} className="rounded-md border border-rose-500/30 bg-rose-500/5 px-3 py-2">
                <p className="text-sm font-medium">{t.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {getRestaurantName(t.clientId)} · {t.assignedTo}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* At-risk clients */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Clients needing attention</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {atRisk.map((c) => (
              <div key={c.clientId} className="rounded-md border border-border bg-muted/20 px-3 py-2">
                <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                  <p className="text-sm font-medium">{getRestaurantName(c.clientId)}</p>
                  <div className="flex gap-1">
                    <Badge variant="outline" className={`text-[9px] ${lifecycleStageColor[c.lifecycleStage]}`}>{c.lifecycleStage}</Badge>
                    <Badge variant="outline" className={`text-[9px] ${riskLevelColor[c.riskLevel]}`}>{c.riskLevel}</Badge>
                  </div>
                </div>
                <p className="text-xs text-foreground/80">{c.nextAction}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Stuck content + reports */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Stuck items & reports waiting</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stuck.map((c) => (
              <div key={c.id} className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2">
                <p className="text-sm font-medium">{c.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {getRestaurantName(c.clientId)} · {c.currentStage} · {c.status}
                </p>
              </div>
            ))}
            {reportsWait.map((r) => (
              <div key={r.id} className="rounded-md border border-violet-500/30 bg-violet-500/5 px-3 py-2">
                <p className="text-sm font-medium">{r.type} · {r.period}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className={`text-[9px] ${reportOpStatusColor[r.status]}`}>{r.status}</Badge>
                  <span className="text-[11px] text-muted-foreground">{getRestaurantName(r.clientId)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bottlenecks */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-primary" /> Bottlenecks & onboarding blockers</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {demoBottlenecks.map((b) => (
              <div key={b.id} className="rounded-md border border-border bg-muted/20 px-3 py-2">
                <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                  <p className="text-sm font-medium">{b.type}</p>
                  <Badge variant="outline" className="text-[9px] border-rose-500/40 text-rose-300 bg-rose-500/10">{b.severity}</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">{getRestaurantName(b.clientId)} · {b.detail}</p>
                <p className="text-[11px] text-primary mt-1 flex items-center gap-1"><ArrowRight className="w-3 h-3" />{b.recommendedAction}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent + suggested actions */}
        <div className="space-y-4">
          <Card className="bg-card border-primary/30">
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><ArrowRight className="w-4 h-4 text-primary" /> Suggested operator actions</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-sm">
                {suggestions.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-foreground/85">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />{s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Recent activity</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {recent.map((a) => (
                <div key={a.id} className="rounded-md border border-border bg-muted/20 px-3 py-2">
                  <p className="text-sm font-medium leading-snug">{a.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{getRestaurantName(a.clientId)} · {a.timestamp}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
}

function Tile({ icon: Icon, label, value, accent }: { icon: typeof Zap; label: string; value: string; accent?: string }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-3">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
          <Icon className="w-3.5 h-3.5" />{label}
        </div>
        <p className={`text-2xl font-bold tabular-nums ${accent ?? ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
