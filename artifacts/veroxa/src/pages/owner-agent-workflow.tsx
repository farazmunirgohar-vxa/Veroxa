import { Upload, Sparkles, Users, Send, ArrowDown } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ownerPortalNavItems } from "@/lib/ownerPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { demoAgentWorkflow } from "@/data/demoData";

const typeMeta: Record<string, { icon: typeof Upload; color: string; label: string }> = {
  client: { icon: Upload,    color: "border-sky-500/40 bg-sky-500/10 text-sky-300",         label: "Client"        },
  agent:  { icon: Sparkles,  color: "border-primary/40 bg-primary/10 text-primary",         label: "AI Agent"      },
  team:   { icon: Users,     color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300", label: "Team / Human" },
  stage:  { icon: Send,      color: "border-amber-500/40 bg-amber-500/10 text-amber-300",   label: "Publishing"    },
};

export default function OwnerAgentWorkflow() {
  return (
    <PortalLayout items={ownerPortalNavItems} portalName="Owner Portal">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="header-agent-workflow">
          Agent Workflow
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          End-to-end content pipeline — every step from client upload to the owner's daily briefing.
        </p>
      </div>

      <DemoOnlyBanner message="Demo only — visualises the planned simulation workflow." testId="banner-agent-workflow" />

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(typeMeta).map(([k, m]) => {
          const Icon = m.icon;
          return (
            <Badge key={k} variant="outline" className={`text-[10px] ${m.color}`}>
              <Icon className="w-3 h-3 mr-1" />{m.label}
            </Badge>
          );
        })}
      </div>

      {/* Workflow chain */}
      <div className="flex flex-col items-center gap-0">
        {demoAgentWorkflow.map((step, i) => {
          const meta = typeMeta[step.type];
          const Icon = meta.icon;
          const isLast = i === demoAgentWorkflow.length - 1;
          return (
            <div key={step.step} className="w-full max-w-2xl flex flex-col items-center">
              <Card className={`w-full bg-card border ${meta.color.split(" ")[0]}`} data-testid={`workflow-step-${step.step}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.color.split(" ").slice(0, 2).join(" ")}`}>
                      <Icon className={`w-4 h-4 ${meta.color.split(" ")[2]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-muted-foreground tabular-nums">STEP {step.step}</span>
                        <Badge variant="outline" className={`text-[9px] ${meta.color}`}>{meta.label}</Badge>
                      </div>
                      <CardTitle className="text-sm mt-0.5">{step.label}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground leading-relaxed pl-12">{step.description}</p>
                </CardContent>
              </Card>
              {!isLast && (
                <div className="py-1.5 text-muted-foreground/60">
                  <ArrowDown className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PortalLayout>
  );
}
