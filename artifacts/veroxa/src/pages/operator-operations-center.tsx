import {
  Gauge, Workflow, ClipboardList, Building2, Images, FileText, AlertTriangle, Activity,
} from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { operatorPortalNavItems } from "@/lib/operatorPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import {
  demoHealthScores, demoContentItems, demoTasksV2, demoActivityLog, demoWorkflowStages,
  demoMediaAnalytics, demoOpsIntelligence, demoReportingAnalytics, getRestaurantName,
  progressFromStage,
} from "@/data/demoData";

const scoreColor = (status: string) =>
  status === "Excellent" ? "text-emerald-400"
  : status === "Healthy" ? "text-sky-400"
  : status === "Warning" ? "text-amber-400"
  : "text-rose-400";

const scoreBar = (status: string) =>
  status === "Excellent" ? "bg-emerald-500"
  : status === "Healthy" ? "bg-sky-500"
  : status === "Warning" ? "bg-amber-500"
  : "bg-rose-500";

const kindColor: Record<string, string> = {
  upload:    "border-sky-500/40 text-sky-300 bg-sky-500/10",
  report:    "border-violet-500/40 text-violet-300 bg-violet-500/10",
  google:    "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
  schedule:  "border-primary/40 text-primary bg-primary/10",
  warning:   "border-rose-500/40 text-rose-300 bg-rose-500/10",
  milestone: "border-amber-500/40 text-amber-300 bg-amber-500/10",
};

export default function OperatorOperationsCenter() {
  const totalItems     = demoContentItems.length;
  const doneItems      = demoContentItems.filter((i) => i.status === "Done").length;
  const blockedItems   = demoContentItems.filter((i) => i.status === "Blocked").length;
  const completion     = Math.round((doneItems / totalItems) * 100);

  const tasksTotal     = demoTasksV2.length;
  const tasksDone      = demoTasksV2.filter((t) => t.status === "Completed").length;
  const tasksOverdue   = demoTasksV2.filter((t) => t.dueDate.toLowerCase() === "overdue").length;
  const taskCompletion = Math.round((tasksDone / tasksTotal) * 100);

  const recentActivity = [...demoActivityLog].slice(0, 6);

  const stageCounts = demoWorkflowStages.map((s) => ({
    stage: s, n: demoContentItems.filter((i) => i.currentStage === s).length,
  }));
  const maxStage = Math.max(...stageCounts.map((c) => c.n), 1);

  return (
    <PortalLayout items={operatorPortalNavItems} portalName="Operator Portal">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="header-operations-center">
          Operations Center
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          The heart of Veroxa — workflow, tasks, clients, inventory, reporting, and risk in one view.
        </p>
      </div>

      <DemoOnlyBanner message="Demo only — all operational metrics are sample data." testId="banner-operations-center" />

      {/* Health scores (Section 14) */}
      <Card className="bg-card border-border mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Gauge className="w-4 h-4 text-primary" /> Operational health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {demoHealthScores.map((h) => (
              <div key={h.label} className="rounded-md border border-border bg-muted/20 p-3" data-testid={`health-${h.label.replace(/\s/g, "-").toLowerCase()}`}>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{h.label}</p>
                <p className={`text-2xl font-bold tabular-nums ${scoreColor(h.status)}`}>{h.score}</p>
                <div className="w-full h-1.5 rounded-full bg-muted/40 mt-1.5">
                  <div className={`h-1.5 rounded-full ${scoreBar(h.status)}`} style={{ width: `${h.score}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5 leading-tight">{h.detail}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Metric tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <Metric icon={Workflow}       label="Workflow done"     value={`${completion}%`}                accent="text-emerald-400" />
        <Metric icon={ClipboardList}  label="Task completion"   value={`${taskCompletion}%`}            accent="text-sky-400" />
        <Metric icon={AlertTriangle}  label="Tasks overdue"     value={String(tasksOverdue)}            accent="text-rose-400" />
        <Metric icon={Building2}      label="Blocked items"     value={String(blockedItems)}            accent="text-amber-400" />
        <Metric icon={Images}         label="Low-supply clients" value={String(demoMediaAnalytics.inventoryByClient.filter((c) => c.low).length)} accent="text-amber-400" />
        <Metric icon={FileText}       label="Weekly validation" value={`${demoReportingAnalytics.weeklyValidationRate}%`} accent="text-emerald-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Workflow distribution */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Workflow className="w-4 h-4 text-primary" /> Pipeline distribution</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stageCounts.map((c) => (
              <div key={c.stage}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>{c.stage}</span>
                  <span className="text-muted-foreground tabular-nums">{c.n}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted/40">
                  <div className="h-1.5 rounded-full bg-primary/80" style={{ width: `${(c.n / maxStage) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Queues snapshot */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="w-4 h-4 text-primary" /> Queues</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Tile label="Review"      v={demoOpsIntelligence.reviewQueue.current}      />
            <Tile label="Approval"    v={demoOpsIntelligence.approvalQueue.current}    />
            <Tile label="Content B."  v={demoOpsIntelligence.contentBacklog.current}   />
            <Tile label="Reporting B." v={demoOpsIntelligence.reportingBacklog.current} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Top blocked items */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" /> Blocked & waiting items</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {demoContentItems
              .filter((i) => i.status === "Blocked" || i.status === "Waiting")
              .map((i) => (
                <div key={i.id} className="rounded-md border border-border bg-muted/20 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium leading-snug">{i.title}</p>
                    <Badge variant="outline" className="text-[9px] border-rose-500/40 text-rose-300 bg-rose-500/10">
                      {i.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {getRestaurantName(i.clientId)} · {i.currentStage} · {progressFromStage(i.currentStage)}%
                  </p>
                  <p className="text-xs mt-1 text-foreground/80">{i.nextAction}</p>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Recent activity</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recentActivity.map((a) => (
              <div key={a.id} className="rounded-md border border-border bg-muted/20 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium leading-snug">{a.title}</p>
                  <Badge variant="outline" className={`text-[9px] ${kindColor[a.kind]}`}>{a.kind}</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {getRestaurantName(a.clientId)} · {a.timestamp}
                </p>
                {a.detail && <p className="text-xs text-foreground/80 mt-1">{a.detail}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Task + workflow completion progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Workflow completion</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end justify-between mb-2">
              <p className="text-3xl font-bold tabular-nums text-emerald-400">{completion}%</p>
              <p className="text-xs text-muted-foreground">{doneItems} of {totalItems} items at Posted+</p>
            </div>
            <Progress value={completion} className="h-1.5" />
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Task completion</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end justify-between mb-2">
              <p className="text-3xl font-bold tabular-nums text-sky-400">{taskCompletion}%</p>
              <p className="text-xs text-muted-foreground">{tasksDone} of {tasksTotal} closed</p>
            </div>
            <Progress value={taskCompletion} className="h-1.5" />
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}

function Metric({ icon: Icon, label, value, accent }: { icon: typeof Gauge; label: string; value: string; accent?: string }) {
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

function Tile({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-2 text-center">
      <p className="text-xl font-bold tabular-nums text-primary">{v}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
