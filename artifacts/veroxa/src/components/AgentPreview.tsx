import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bot,
  BrainCircuit,
  CalendarClock,
  FileBarChart2,
  MessageSquareQuote,
  Mic2,
  Newspaper,
  Radio,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

type AgentStatus = "Active" | "Waiting" | "Reviewing" | "Monitoring";

interface Agent {
  name: string;
  status: AgentStatus;
  description: string;
  icon: React.ElementType;
}

const agents: Agent[] = [
  {
    name: "Media Review Agent",
    status: "Reviewing",
    description: "Audits incoming media assets for quality, resolution, and brand fit before content is created.",
    icon: Newspaper,
  },
  {
    name: "Content Strategist Agent",
    status: "Active",
    description: "Generates content briefs and pillar plans based on client goals, past performance, and trends.",
    icon: BrainCircuit,
  },
  {
    name: "Caption Agent",
    status: "Active",
    description: "Produces platform-native captions aligned to brief, format, and character limits.",
    icon: MessageSquareQuote,
  },
  {
    name: "Brand Voice Agent",
    status: "Active",
    description: "Scores and refines captions to ensure consistent tone, style, and vocabulary for each client.",
    icon: Mic2,
  },
  {
    name: "Scheduling Agent",
    status: "Waiting",
    description: "Selects optimal publish windows based on audience analytics and platform peak-time data.",
    icon: CalendarClock,
  },
  {
    name: "Publishing Agent",
    status: "Waiting",
    description: "Handles final post dispatch across Instagram, Facebook, TikTok, and Google Business Profile.",
    icon: Radio,
  },
  {
    name: "Reporting Agent",
    status: "Monitoring",
    description: "Compiles weekly updates and monthly performance reports with reach, engagement, and trends.",
    icon: FileBarChart2,
  },
  {
    name: "Alert Agent",
    status: "Monitoring",
    description: "Monitors for failed posts, low content, and health score drops — surfaces issues to the Team/Internal Admin portal.",
    icon: ShieldAlert,
  },
  {
    name: "Team Assistant",
    status: "Active",
    description: "Surfaces prioritised client risk signals and flags report approvals for Team review.",
    icon: Sparkles,
  },
  {
    name: "Team Briefing Assistant",
    status: "Active",
    description: "Synthesises agency-wide health, MRR trends, and retention risk for Team/Internal Admin decision-making.",
    icon: Bot,
  },
];

const workflowSteps = [
  "Client Upload",
  "Media Review Agent",
  "Content Strategist Agent",
  "Caption Agent",
  "Brand Voice Agent",
  "Scheduling Agent",
  "Publishing Agent",
  "Reporting Agent",
];

const statusConfig: Record<AgentStatus, { dot: string; badge: string; label: string }> = {
  Active:     { dot: "bg-emerald-500",  badge: "bg-emerald-500/10 text-emerald-500",  label: "Active"     },
  Waiting:    { dot: "bg-amber-500",    badge: "bg-amber-500/10 text-amber-500",      label: "Waiting"    },
  Reviewing:  { dot: "bg-blue-500",     badge: "bg-blue-500/10 text-blue-500",        label: "Reviewing"  },
  Monitoring: { dot: "bg-primary",      badge: "bg-primary/10 text-primary",          label: "Monitoring" },
};

const iconColorMap: Record<AgentStatus, string> = {
  Active:     "bg-emerald-500/10 text-emerald-500",
  Waiting:    "bg-amber-500/10 text-amber-500",
  Reviewing:  "bg-blue-500/10 text-blue-500",
  Monitoring: "bg-primary/10 text-primary",
};

export function AgentPreview() {
  return (
    <div className="space-y-8" data-testid="agent-preview">

      {/* Section header */}
      <div>
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h3 className="text-xl font-bold">AI Agents</h3>
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/10 text-primary text-[10px] font-semibold tracking-wide px-2 py-0.5"
          >
            Demo Preview
          </Badge>
        </div>

        {/* Disclaimer */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-400 text-[11px] font-medium mt-1">
          <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
          AI Agent Preview — demonstration only. No real AI processing is currently running.
        </div>
      </div>

      {/* Agent cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {agents.map((agent) => {
          const sc = statusConfig[agent.status];
          const ic = iconColorMap[agent.status];
          const Icon = agent.icon;
          return (
            <Card
              key={agent.name}
              className="bg-card border-border hover:border-border/80 transition-colors"
              data-testid={`agent-card-${agent.name.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${ic}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
                    Demo
                  </span>
                </div>
                <h4 className="text-[13px] font-semibold text-foreground mb-1.5 leading-snug">
                  {agent.name}
                </h4>
                <div
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.badge} mb-2`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} animate-pulse`} />
                  {sc.label}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {agent.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Workflow visualization */}
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
          Agent Workflow
        </h4>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-0">
              {workflowSteps.map((step, i) => {
                const isFirst = i === 0;
                const isLast = i === workflowSteps.length - 1;
                const isClientUpload = i === 0;
                return (
                  <div key={step} className="flex sm:flex-row flex-col items-center">
                    {/* Node */}
                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold
                        ${isClientUpload
                          ? "bg-muted/60 text-foreground border border-border"
                          : isLast
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-card border border-border text-foreground/80 hover:text-foreground transition-colors"
                        }`}
                      data-testid={`workflow-step-${i}`}
                    >
                      {isClientUpload ? (
                        <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                      ) : (
                        <Bot className="w-3.5 h-3.5 opacity-60" />
                      )}
                      {step}
                    </div>

                    {/* Arrow (not after last) */}
                    {!isLast && (
                      <div className="flex sm:flex-row flex-col items-center">
                        {/* Mobile: vertical arrow */}
                        <div className="sm:hidden flex flex-col items-center py-1">
                          <div className="w-px h-4 bg-border" />
                          <svg width="8" height="5" viewBox="0 0 8 5" className="text-muted-foreground/40 fill-current">
                            <path d="M4 5L0 0h8z" />
                          </svg>
                        </div>
                        {/* Desktop: horizontal arrow */}
                        <div className="hidden sm:flex items-center px-1.5 gap-0.5">
                          <div className="w-4 h-px bg-border" />
                          <svg width="5" height="8" viewBox="0 0 5 8" className="text-muted-foreground/40 fill-current">
                            <path d="M5 4L0 0v8z" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
