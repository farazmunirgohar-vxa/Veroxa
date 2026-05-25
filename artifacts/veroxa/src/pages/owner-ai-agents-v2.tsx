import { useState } from "react";
import { Sparkles, ArrowRight, Clock, CheckCircle2, ArrowDown, ArrowUp } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ownerPortalNavItems } from "@/lib/ownerPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { demoAiAgentsV2 } from "@/data/demoData";

const catColor: Record<string, string> = {
  Content:      "border-sky-500/40 text-sky-300 bg-sky-500/10",
  Operations:   "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
  Intelligence: "border-amber-500/40 text-amber-300 bg-amber-500/10",
  Executive:    "border-violet-500/40 text-violet-300 bg-violet-500/10",
};

export default function OwnerAiAgentsV2() {
  const [selectedId, setSelectedId] = useState(demoAiAgentsV2[0].id);
  const agent = demoAiAgentsV2.find((a) => a.id === selectedId)!;

  return (
    <PortalLayout items={ownerPortalNavItems} portalName="Owner Portal">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="header-ai-agents-v2">
          AI Agent Library
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          A preview of how Veroxa's AI layer handles content, operations, and growth across your client portfolio.
        </p>
      </div>

      <DemoOnlyBanner message="Demo only — agents are static simulations. No AI APIs are connected." testId="banner-ai-agents-v2" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Agent selector */}
        <Card className="bg-card border-border lg:col-span-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Agents ({demoAiAgentsV2.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {demoAiAgentsV2.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedId(a.id)}
                data-testid={`agent-select-${a.id}`}
                className={`w-full text-left rounded-md border px-3 py-2 transition-colors ${
                  a.id === selectedId
                    ? "border-primary bg-primary/10"
                    : "border-border bg-muted/20 hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{a.name}</p>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${catColor[a.category]}`}>
                    {a.category}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{a.purpose}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Agent detail */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="bg-card border-primary/30">
            <CardHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" /> {agent.name}
                </CardTitle>
                <Badge variant="outline" className={`text-[10px] ${catColor[agent.category]}`}>{agent.category}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{agent.purpose}</p>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ArrowDown className="w-4 h-4 text-sky-400" /> What this agent reads</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-xs text-foreground/85">
                  {agent.inputs.map((i) => (
                    <li key={i} className="flex items-start gap-2"><span className="mt-1.5 w-1 h-1 rounded-full bg-sky-400 flex-shrink-0" />{i}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ArrowUp className="w-4 h-4 text-emerald-400" /> What this agent does</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-xs text-foreground/85">
                  {agent.outputs.map((o) => (
                    <li key={o} className="flex items-start gap-2"><span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0" />{o}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="recs">
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="recs">Recommendations</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="decisions">Decisions</TabsTrigger>
            </TabsList>

            <TabsContent value="recs" className="mt-3">
              <Card className="bg-card border-border">
                <CardContent className="p-4 space-y-2">
                  {agent.sampleRecommendations.map((r, i) => (
                    <div key={i} className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 flex items-start gap-2 text-xs">
                      <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-primary flex-shrink-0" />{r}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-3">
              <Card className="bg-card border-border">
                <CardContent className="p-4 space-y-2">
                  {agent.recentActivity.map((a, i) => (
                    <div key={i} className="rounded-md border border-border bg-muted/20 px-3 py-2 flex items-start gap-2 text-xs">
                      <Clock className="w-3.5 h-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">{a.time}</p>
                        <p>{a.event}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="decisions" className="mt-3">
              <Card className="bg-card border-border">
                <CardContent className="p-4 space-y-2">
                  {agent.sampleDecisions.map((d, i) => (
                    <div key={i} className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 flex items-start gap-2 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-400 flex-shrink-0" />{d}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PortalLayout>
  );
}
