import { useState, useMemo } from "react";
import {
  Workflow, ArrowRight, Clock, CheckCircle2, AlertTriangle, Pause, Building2, Sparkles,
} from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { operatorPortalNavItems } from "@/lib/operatorPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import {
  demoContentItems, demoWorkflowStages, progressFromStage, getRestaurantName,
  previousStageOf, nextStageOf,
  type DemoContentItem, type WorkflowStage, type ContentItemStatus,
} from "@/data/demoData";

const statusMeta: Record<ContentItemStatus, { color: string; icon: typeof Clock }> = {
  "On Track": { color: "border-emerald-500/40 text-emerald-300 bg-emerald-500/10", icon: CheckCircle2 },
  "Blocked":  { color: "border-rose-500/40 text-rose-300 bg-rose-500/10",          icon: AlertTriangle },
  "Waiting":  { color: "border-amber-500/40 text-amber-300 bg-amber-500/10",       icon: Pause },
  "Done":     { color: "border-sky-500/40 text-sky-300 bg-sky-500/10",             icon: CheckCircle2 },
};

const nowLabel = () =>
  new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export default function OperatorWorkflowEngine() {
  const [items, setItems]   = useState<DemoContentItem[]>(demoContentItems);
  const [selectedId, setId] = useState(demoContentItems[0].id);
  const selected            = items.find((i) => i.id === selectedId)!;

  const counts = useMemo(() => {
    const c: Record<WorkflowStage, number> = Object.fromEntries(
      demoWorkflowStages.map((s) => [s, 0]),
    ) as Record<WorkflowStage, number>;
    items.forEach((i) => { c[i.currentStage] += 1; });
    return c;
  }, [items]);

  const advance = (id: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const idx = demoWorkflowStages.indexOf(it.currentStage);
        if (idx >= demoWorkflowStages.length - 1) return it;
        const next = demoWorkflowStages[idx + 1];
        return {
          ...it,
          currentStage: next,
          status: next === "Posted" || next === "Reporting" ? "Done" : "On Track",
          lastUpdated: `Today, ${nowLabel()}`,
          nextAction: `Stage advanced to ${next}.`,
          history: [
            ...it.history,
            { stage: next, timestamp: `Today, ${nowLabel()}`, actor: "Operator (demo)", note: "Manual stage transition." },
          ],
        };
      }),
    );
  };

  const reset = () => setItems(demoContentItems);

  const canAdvance = demoWorkflowStages.indexOf(selected.currentStage) < demoWorkflowStages.length - 1;

  return (
    <PortalLayout items={operatorPortalNavItems} portalName="Operator Portal">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="header-workflow-engine">
            Workflow Engine
          </h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Live content lifecycle — every item, every stage, every transition.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reset} data-testid="btn-reset-workflow">Reset demo</Button>
      </div>

      <DemoOnlyBanner
        message="Demo only — transitions are simulated client-side. No real publishing happens."
        testId="banner-workflow-engine"
      />

      {/* Stage funnel */}
      <Card className="bg-card border-border mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Workflow className="w-4 h-4 text-primary" /> Pipeline stage distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
            {demoWorkflowStages.map((s) => (
              <div key={s} className="rounded-md border border-border bg-muted/20 p-2 text-center">
                <p className="text-lg font-bold tabular-nums text-primary">{counts[s]}</p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{s}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Items list */}
        <Card className="bg-card border-border lg:col-span-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Content items ({items.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.map((it) => {
              const meta = statusMeta[it.status];
              const Icon = meta.icon;
              return (
                <button
                  key={it.id}
                  onClick={() => setId(it.id)}
                  data-testid={`workflow-item-${it.id}`}
                  className={`w-full text-left rounded-md border p-3 transition-colors ${
                    it.id === selectedId
                      ? "border-primary bg-primary/10"
                      : "border-border bg-muted/20 hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium leading-snug">{it.title}</p>
                    <Badge variant="outline" className={`text-[9px] ${meta.color} flex-shrink-0`}>
                      <Icon className="w-2.5 h-2.5 mr-0.5" />{it.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1.5">
                    <Building2 className="w-3 h-3" />{getRestaurantName(it.clientId)}
                    <span>·</span>{it.contentType}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-muted-foreground">{it.currentStage}</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{progressFromStage(it.currentStage)}%</span>
                  </div>
                  <Progress value={progressFromStage(it.currentStage)} className="h-1 mt-1" />
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Selected item detail */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="bg-card border-primary/30">
            <CardHeader>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <CardTitle className="text-base">{selected.title}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getRestaurantName(selected.clientId)} · {selected.contentType} · Created {selected.createdDate}
                  </p>
                </div>
                <Badge variant="outline" className={`text-[10px] ${statusMeta[selected.status].color}`}>
                  {selected.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <Stat label="Previous stage" value={previousStageOf(selected.currentStage) ?? "—"} />
                <Stat label="Current stage"  value={selected.currentStage} />
                <Stat label="Next stage"     value={nextStageOf(selected.currentStage) ?? "Pipeline complete"} />
                <Stat label="Progress"       value={`${progressFromStage(selected.currentStage)}%`} />
                <Stat label="Last updated"   value={selected.lastUpdated} />
                <Stat label="Status"         value={selected.status} />
              </div>
              <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 flex items-start gap-2 text-xs">
                <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-primary flex-shrink-0" />
                <p><span className="font-medium">Next action:</span> {selected.nextAction}</p>
              </div>
              <div>
                <Button
                  size="sm"
                  disabled={!canAdvance}
                  onClick={() => advance(selected.id)}
                  data-testid="btn-advance-stage"
                >
                  {canAdvance ? `Advance to ${demoWorkflowStages[demoWorkflowStages.indexOf(selected.currentStage) + 1]}` : "Pipeline complete"}
                  {canAdvance && <ArrowRight className="w-3.5 h-3.5 ml-1" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Timeline (Section 3) */}
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-sm">Workflow timeline</CardTitle></CardHeader>
            <CardContent>
              <ol className="relative border-l-2 border-border/60 ml-2 space-y-3">
                {selected.history.map((ev, i) => {
                  const isLast = i === selected.history.length - 1;
                  return (
                    <li key={i} className="ml-4 relative">
                      <span className={`absolute -left-[22px] top-1 w-3 h-3 rounded-full border-2 ${
                        isLast ? "bg-primary border-primary" : "bg-card border-emerald-500"
                      }`} />
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{ev.stage}</p>
                        <span className="text-[10px] text-muted-foreground">{ev.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />{ev.actor}
                      </p>
                      {ev.note && <p className="text-xs text-foreground/80 mt-1">{ev.note}</p>}
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
