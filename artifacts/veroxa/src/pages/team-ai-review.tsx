import { ScanEye, Lightbulb, PenLine, ShieldCheck, CalendarClock, BarChart3, AlertOctagon } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { teamAgentCards } from "@/lib/demo-data";
import { teamPortalNavItems } from "@/lib/teamPortalNav";

export default function TeamAiReview() {
  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-3xl font-bold tracking-tight text-foreground" data-testid="header-ai-review">AI Agent Preview</h2>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[10px] font-semibold tracking-wide px-2 py-0.5">
            Demo Logic Only
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          A preview of how Veroxa's AI agents will assist each stage of the content workflow. All outputs below are simulated.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {teamAgentCards.map((agent) => {
          const iconMap = {
            "media-review":       ScanEye,
            "content-strategist": Lightbulb,
            "caption":            PenLine,
            "brand-voice":        ShieldCheck,
            "scheduling":         CalendarClock,
            "reporting":          BarChart3,
            "alert":              AlertOctagon,
          } as const;
          const AgentIcon = iconMap[agent.key];
          const colorMap = {
            emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-500" },
            blue:    { bg: "bg-blue-500/10",    text: "text-blue-500",    dot: "bg-blue-500",    badge: "bg-blue-500/10 text-blue-500"    },
            violet:  { bg: "bg-primary/10",     text: "text-primary",     dot: "bg-primary",     badge: "bg-primary/10 text-primary"      },
            amber:   { bg: "bg-amber-500/10",   text: "text-amber-500",   dot: "bg-amber-500",   badge: "bg-amber-500/10 text-amber-500"  },
          } as const;
          const c = colorMap[agent.statusColor];
          return (
            <Card key={agent.name} className="bg-card border-border relative overflow-hidden" data-testid={`agent-card-${agent.name.toLowerCase().replace(/\s+/g, "-")}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className={`p-2 rounded-lg ${c.bg} ${c.text}`}>
                    <AgentIcon className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest leading-tight text-right">Simulated</span>
                </div>
                <h4 className="text-sm font-semibold text-foreground mb-1 leading-snug">{agent.name}</h4>
                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.badge} mb-2`}>
                  <span className={`w-1 h-1 rounded-full ${c.dot}`} />
                  {agent.status}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{agent.purpose}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PortalLayout>
  );
}
