import {
  Sparkles,
  ImageIcon,
  Lightbulb,
  MessageSquareQuote,
  Mic,
  CalendarClock,
  Radio,
  FileBarChart,
  AlertOctagon,
  Users,
  Crown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  demoAgents,
  getRestaurantName,
  type DemoAgent,
} from "@/data/demoData";

interface AIAgentsViewProps {
  viewerRole: "owner" | "operator";
}

const agentIcon: Record<string, React.ElementType> = {
  "media-review":       ImageIcon,
  "content-strategist": Lightbulb,
  "caption":            MessageSquareQuote,
  "brand-voice":        Mic,
  "scheduling":         CalendarClock,
  "publishing":         Radio,
  "reporting":          FileBarChart,
  "alert-risk":         AlertOctagon,
  "operator-assistant": Users,
  "owner-assistant":    Crown,
};

function AgentCard({ agent }: { agent: DemoAgent }) {
  const Icon = agentIcon[agent.id] ?? Sparkles;
  return (
    <Card
      className="bg-card border-border/60 hover:border-primary/30 transition-colors"
      data-testid={`agent-card-${agent.id}`}
    >
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm md:text-base font-semibold text-foreground leading-snug">
                {agent.name}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {agent.workflowStage}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] font-semibold bg-amber-500/10 text-amber-400 border-amber-500/30 flex-shrink-0"
          >
            Demo Mode
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {agent.purpose}
        </p>

        <div className="px-3 py-2.5 rounded-md bg-muted/40 border border-border/40">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/80 mb-1">
            Example output
          </div>
          <p className="text-xs text-foreground leading-relaxed">
            {agent.exampleOutput}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-muted-foreground">Confidence (simulated)</span>
            <span className="font-semibold text-foreground">
              {agent.confidence}%
            </span>
          </div>
          <Progress value={agent.confidence} className="h-1.5" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/40 text-[11px] text-muted-foreground">
          <span>{agent.lastActivity}</span>
          {agent.relatedClientId && (
            <span className="text-foreground/70">
              {getRestaurantName(agent.relatedClientId)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function AIAgentsView({ viewerRole }: AIAgentsViewProps) {
  const recentOutputs = demoAgents.filter((a) =>
    a.lastActivity.toLowerCase().startsWith("today"),
  ).length;

  return (
    <div className="space-y-6">
      <Card className="bg-primary/5 border-primary/30">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
            <p className="text-xs md:text-sm text-foreground">
              <span className="font-semibold">AI Preview</span> — Demonstration
              only. No live AI actions are being executed.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className="text-[10px] font-semibold bg-card/40 border-border/60"
            >
              {demoAgents.length} agents
            </Badge>
            <Badge
              variant="outline"
              className="text-[10px] font-semibold bg-card/40 border-border/60"
            >
              {recentOutputs} active today
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {demoAgents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground/60">
        Viewing as: <span className="text-foreground/70">{viewerRole}</span> ·
        Confidence scores and example outputs are illustrative only. No OpenAI,
        Anthropic, Gemini, social APIs, or automation tools are connected.
      </p>
    </div>
  );
}
