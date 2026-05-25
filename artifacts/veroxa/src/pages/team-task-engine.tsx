import { useMemo, useState } from "react";
import { ClipboardList, Clock, User, Building2, AlertTriangle, CheckCircle2, Pause } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { demoTasksV2, getRestaurantName, type TaskPriority, type TaskStatus } from "@/data/demoData";

const priorityMeta: Record<TaskPriority, { color: string; bar: string }> = {
  Critical: { color: "border-rose-500/40 text-rose-300 bg-rose-500/10",       bar: "border-l-rose-500" },
  High:     { color: "border-amber-500/40 text-amber-300 bg-amber-500/10",     bar: "border-l-amber-500" },
  Medium:   { color: "border-yellow-500/40 text-yellow-300 bg-yellow-500/10",  bar: "border-l-yellow-500" },
  Low:      { color: "border-muted-foreground/40 text-muted-foreground bg-muted/30", bar: "border-l-border" },
};

const statusOrder: TaskStatus[] = ["Pending", "In Progress", "Waiting", "Completed"];

const statusMeta: Record<TaskStatus, { color: string; icon: typeof Clock }> = {
  "Pending":     { color: "border-sky-500/40 text-sky-300 bg-sky-500/10",         icon: Clock },
  "In Progress": { color: "border-primary/40 text-primary bg-primary/10",         icon: ClipboardList },
  "Waiting":     { color: "border-amber-500/40 text-amber-300 bg-amber-500/10",   icon: Pause },
  "Completed":   { color: "border-emerald-500/40 text-emerald-300 bg-emerald-500/10", icon: CheckCircle2 },
};

const dueColor = (d: string) =>
  d.toLowerCase() === "overdue"   ? "text-rose-400"
  : d.toLowerCase() === "today"   ? "text-amber-400"
  : d.toLowerCase() === "tomorrow" ? "text-sky-400"
  : "text-muted-foreground";

export default function TeamTaskEngine() {
  const [filter, setFilter] = useState<"all" | TaskPriority>("all");

  const filtered = useMemo(
    () => filter === "all" ? demoTasksV2 : demoTasksV2.filter((t) => t.priority === filter),
    [filter],
  );

  const byStatus = useMemo(() => {
    const map: Record<TaskStatus, typeof demoTasksV2> = {
      "Pending": [], "In Progress": [], "Waiting": [], "Completed": [],
    };
    filtered.forEach((t) => { map[t.status].push(t); });
    return map;
  }, [filtered]);

  const overdue  = demoTasksV2.filter((t) => t.dueDate.toLowerCase() === "overdue").length;
  const critical = demoTasksV2.filter((t) => t.priority === "Critical").length;

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="header-task-engine">
          Task Engine
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Live work queue across every client — pending, in progress, waiting, completed.
        </p>
      </div>

      <DemoOnlyBanner message="Demo only — task data is sample." testId="banner-task-engine" />

      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Tile label="Total tasks" value={String(demoTasksV2.length)}                                                         />
        <Tile label="Critical"    value={String(critical)}                          accent="text-rose-400"  />
        <Tile label="Overdue"     value={String(overdue)}                           accent="text-amber-400" />
        <Tile label="Completed"   value={String(demoTasksV2.filter((t) => t.status === "Completed").length)} accent="text-emerald-400" />
      </div>

      {/* Priority filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <FilterChip label="All" active={filter === "all"} onClick={() => setFilter("all")} />
        {(Object.keys(priorityMeta) as TaskPriority[]).map((p) => (
          <FilterChip key={p} label={p} active={filter === p} onClick={() => setFilter(p)} />
        ))}
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {statusOrder.map((s) => {
          const meta  = statusMeta[s];
          const Icon  = meta.icon;
          const tasks = byStatus[s];
          return (
            <Card key={s} className="bg-card border-border" data-testid={`column-${s.replace(/\s/g, "-").toLowerCase()}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary" />
                  <span>{s}</span>
                  <span className="text-xs text-muted-foreground ml-auto tabular-nums">{tasks.length}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-4">No tasks.</p>
                ) : tasks.map((t) => {
                  const pMeta = priorityMeta[t.priority];
                  return (
                    <div key={t.id} className={`rounded-md border border-border border-l-4 ${pMeta.bar} bg-muted/20 p-2.5`} data-testid={`task-${t.id}`}>
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <Badge variant="outline" className={`text-[9px] ${pMeta.color}`}>{t.priority}</Badge>
                        <span className={`text-[10px] font-medium ${dueColor(t.dueDate)}`}>
                          {t.dueDate.toLowerCase() === "overdue" && <AlertTriangle className="w-2.5 h-2.5 inline mr-0.5" />}
                          {t.dueDate}
                        </span>
                      </div>
                      <p className="text-sm font-medium leading-snug">{t.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{t.type}</p>
                      <div className="flex items-center justify-between gap-2 mt-1.5 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{getRestaurantName(t.clientId)}</span>
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{t.assignedTo}</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PortalLayout>
  );
}

function Tile({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-3">
        <p className={`text-2xl font-bold tabular-nums ${accent ?? ""}`}>{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      data-testid={`filter-${label.toLowerCase()}`}
      className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
        active ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/20 hover:border-primary/40"
      }`}
    >
      {label}
    </button>
  );
}
