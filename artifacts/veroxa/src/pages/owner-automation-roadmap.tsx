import { Rocket, Wrench, Clock } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ownerPortalNavItems } from "@/lib/ownerPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { demoAutomationRoadmap, type AutomationStatus } from "@/data/demoData";

const statusOrder: AutomationStatus[] = ["Prototype", "Planned", "Future Build"];

const statusMeta: Record<AutomationStatus, { color: string; icon: typeof Wrench; description: string }> = {
  "Prototype":    { color: "border-emerald-500/40 text-emerald-300 bg-emerald-500/10", icon: Wrench,  description: "In active development — early simulation working." },
  "Planned":      { color: "border-amber-500/40 text-amber-300 bg-amber-500/10",       icon: Clock,   description: "Designed, scoped, and on the near-term roadmap." },
  "Future Build": { color: "border-sky-500/40 text-sky-300 bg-sky-500/10",             icon: Rocket,  description: "Strategic direction — deeper build required." },
};

export default function OwnerAutomationRoadmap() {
  return (
    <PortalLayout items={ownerPortalNavItems} portalName="Owner Portal">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="header-automation-roadmap">
          Future Automation Roadmap
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          The automations that will close the loop — from media review through to the owner's daily briefing.
        </p>
      </div>

      <DemoOnlyBanner message="Demo only — roadmap is illustrative. No automations are running yet." testId="banner-automation-roadmap" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statusOrder.map((status) => {
          const items = demoAutomationRoadmap.filter((a) => a.status === status);
          const meta  = statusMeta[status];
          const Icon  = meta.icon;
          return (
            <Card key={status} className="bg-card border-border" data-testid={`roadmap-col-${status.replace(/\s/g, "-").toLowerCase()}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary" />
                  <span className={`text-xs font-medium px-2 py-0.5 rounded border ${meta.color}`}>{status}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{items.length}</span>
                </CardTitle>
                <p className="text-[11px] text-muted-foreground mt-1">{meta.description}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {items.map((a) => (
                  <div key={a.id} className="rounded-md border border-border bg-muted/20 p-3" data-testid={`roadmap-item-${a.id}`}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-medium">{a.name}</p>
                      <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">{a.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">{a.description}</p>
                    <p className="text-[10px] text-muted-foreground">Target: <span className="font-semibold text-foreground/80">{a.targetEta}</span></p>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PortalLayout>
  );
}
