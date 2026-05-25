import { Zap, Bot, ArrowRight } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { operatorPortalNavItems } from "@/lib/operatorPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import {
  demoOperatorActions,
  demoOperatorAssistant,
  getRestaurantName,
  type ActionUrgency,
  type AssistantSeverity,
} from "@/data/demoData";

const urgencyColor: Record<ActionUrgency, string> = {
  "Immediate": "border-rose-500/40 text-rose-300 bg-rose-500/10",
  "Today":     "border-amber-500/40 text-amber-300 bg-amber-500/10",
  "This Week": "border-sky-500/40 text-sky-300 bg-sky-500/10",
};

const urgencyBorder: Record<ActionUrgency, string> = {
  "Immediate": "border-l-rose-500",
  "Today":     "border-l-amber-500",
  "This Week": "border-l-sky-500",
};

const insightColor: Record<AssistantSeverity, string> = {
  critical: "border-rose-500/40 text-rose-300 bg-rose-500/10",
  warning:  "border-amber-500/40 text-amber-300 bg-amber-500/10",
  info:     "border-sky-500/40 text-sky-300 bg-sky-500/10",
};

const insightBorder: Record<AssistantSeverity, string> = {
  critical: "border-l-rose-500",
  warning:  "border-l-amber-500",
  info:     "border-l-sky-500",
};

const agentColor: Record<string, string> = {
  "Risk Monitoring Agent":    "bg-rose-500/10 text-rose-300 border-rose-500/30",
  "Reporting Agent":          "bg-violet-500/10 text-violet-300 border-violet-500/30",
  "Content Strategist Agent": "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
  "Media Review Agent":       "bg-sky-500/10 text-sky-300 border-sky-500/30",
  "Scheduling Agent":         "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
};

export default function OperatorActionCenter() {
  return (
    <PortalLayout items={operatorPortalNavItems} portalName="Operator Portal">
      <div className="mb-4">
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight"
          data-testid="header-action-center"
        >
          Action Center
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Recommended operator actions and AI-generated intelligence — everything
          you need to act on today.
        </p>
      </div>

      <DemoOnlyBanner
        message="Demo only — all actions and AI suggestions are static sample data. No real agents are running."
        testId="banner-action-center"
      />

      <Tabs defaultValue="actions">
        <TabsList className="grid grid-cols-2 w-full max-w-xs mb-4">
          <TabsTrigger value="actions">
            <Zap className="w-4 h-4 mr-2" /> Actions
          </TabsTrigger>
          <TabsTrigger value="assistant">
            <Bot className="w-4 h-4 mr-2" /> AI Assistant
          </TabsTrigger>
        </TabsList>

        {/* ACTIONS TAB */}
        <TabsContent value="actions" className="mt-0">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Recommended actions ({demoOperatorActions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {demoOperatorActions.map((action) => (
                <div
                  key={action.id}
                  className={`rounded-md border border-border border-l-4 ${urgencyBorder[action.urgency]} bg-muted/20 p-3`}
                  data-testid={`action-${action.id}`}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded border ${urgencyColor[action.urgency]}`}
                    >
                      {action.urgency}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-border text-muted-foreground"
                    >
                      {action.category}
                    </Badge>
                    <p className="text-sm font-medium">{action.title}</p>
                  </div>
                  <div className="flex items-start gap-1.5 text-xs text-muted-foreground leading-relaxed">
                    <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-primary flex-shrink-0" />
                    <p>{action.description}</p>
                  </div>
                  {action.clientId && (
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      Client: {getRestaurantName(action.clientId)}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI ASSISTANT TAB */}
        <TabsContent value="assistant" className="mt-0">
          <Card className="bg-card border-primary/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">AI Operator Assistant</CardTitle>
                <Badge
                  variant="outline"
                  className="text-[10px] border-primary/30 bg-primary/10 text-primary"
                >
                  Static demo — no API calls
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Simulated intelligence from the Media Review, Content Strategist,
                Scheduling, Reporting, and Risk Monitoring agents.
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {demoOperatorAssistant.map((insight) => (
                <div
                  key={insight.id}
                  className={`rounded-md border border-border border-l-4 ${insightBorder[insight.severity]} bg-muted/20 p-3`}
                  data-testid={`insight-${insight.id}`}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded border ${agentColor[insight.agent] ?? "border-border text-muted-foreground bg-muted/30"}`}
                    >
                      {insight.agent}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded border ${insightColor[insight.severity]}`}
                    >
                      {insight.severity}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{insight.insight}</p>
                  {insight.clientId && (
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      Client: {getRestaurantName(insight.clientId)}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PortalLayout>
  );
}
