import { CheckCircle2, Circle, Clock, ChevronRight } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { tasks } from "@/lib/demo-data";
import { teamPortalNavItems } from "@/lib/teamPortalNav";

export default function TeamTasks() {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground" data-testid="header-welcome">Good morning, Jordan</h2>
          <p className="text-muted-foreground mt-1">{today} — 4 tasks pending on Mamadali Kebab House.</p>
        </div>
        <Card className="bg-card/50 border-border/50 py-2 px-5" data-testid="stat-time-logged">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded text-primary">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Logged Today</p>
              <p className="text-xl font-bold">3h 15m</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Workflow Stage Pipeline */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Content Pipeline</h3>
        <div className="flex items-center gap-0 overflow-x-auto pb-2">
          {[
            "Media Intake","AI Quality Review","Team Media Review","Concept Generation","3 Draft Variants",
            "Team Approval","Post Ready Queue","Scheduling","Published This Week","Reporting Feed",
          ].map((stage, i) => {
            const done = i < 4;
            const active = i === 4;
            return (
              <div key={stage} className="flex items-center flex-shrink-0">
                <div
                  className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg border text-center transition-colors ${
                    active ? "bg-primary/15 border-primary/50 text-primary"
                    : done ? "bg-emerald-500/8 border-emerald-500/25 text-emerald-500"
                    : "bg-card/40 border-border/40 text-muted-foreground"
                  }`}
                  data-testid={`pipeline-stage-${i}`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    active ? "bg-primary/30" : done ? "bg-emerald-500/20" : "bg-muted/50"
                  }`}>
                    {done ? <CheckCircle2 className="w-3 h-3" /> : <span className="text-[9px] font-bold">{i + 1}</span>}
                  </div>
                  <span className="text-[11px] font-semibold leading-tight whitespace-nowrap">{stage}</span>
                </div>
                {i < 9 && <ChevronRight className="w-3.5 h-3.5 text-border flex-shrink-0 mx-0.5" />}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4">My Tasks</h3>
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                task.done ? "bg-card/30 border-border/30 opacity-60" : "bg-card border-border hover:border-primary/40 shadow-sm"
              }`}
              data-testid={`task-row-${task.id}`}
            >
              <button className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors">
                {task.done ? <CheckCircle2 className="w-6 h-6 text-primary" /> : <Circle className="w-6 h-6" />}
              </button>
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-semibold ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {task.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.client}</p>
              </div>
              <Badge variant="outline" className={`border-none flex-shrink-0 ${
                task.priority === "High"   ? "bg-red-500/10 text-red-500" :
                task.priority === "Medium" ? "bg-amber-500/10 text-amber-500" :
                "bg-blue-500/10 text-blue-500"
              }`}>
                {task.priority}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </PortalLayout>
  );
}
