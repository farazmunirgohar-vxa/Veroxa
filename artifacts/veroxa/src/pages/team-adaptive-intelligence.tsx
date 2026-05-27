import { useEffect, useMemo, useState } from "react";
import { Brain, AlertTriangle, Sparkles } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import {
  buildAdaptiveRecommendations,
  rankRecommendations,
} from "@/lib/intelligence/adaptiveRules";
import { AdaptiveRecommendationCard } from "@/components/intelligence/AdaptiveRecommendationCard";
import { WeeklyStrategySnapshot } from "@/components/intelligence/WeeklyStrategySnapshot";
import { demoClientDirection } from "@/data/direction/demoClientDirection";
import { demoUploadSubmissions } from "@/data/uploadKeys/demoUploadSubmissions";
import { demoClientTeamWorkflow } from "@/data/workflows/clientTeamWorkflow";
import { getAdaptiveMemory } from "@/data/intelligence/demoAdaptiveMemory";
import {
  getLocalDirectionRequests,
  subscribeToLocalDirectionRequests,
} from "@/lib/direction/localDirectionStore";
import {
  getLocalUploadSubmissions,
  subscribeToLocalUploadSubmissions,
} from "@/lib/uploadKeys/localUploadStore";

const CLIENT_ID = "demo-a" as const;

export default function TeamAdaptiveIntelligence() {
  const memory = getAdaptiveMemory(CLIENT_ID);
  const [localDirection, setLocalDirection] = useState(() =>
    getLocalDirectionRequests().filter((d) => d.clientId === CLIENT_ID),
  );
  const [localUploads, setLocalUploads] = useState(() =>
    getLocalUploadSubmissions().filter((u) => u.restaurantId === CLIENT_ID),
  );
  useEffect(() => {
    const u1 = subscribeToLocalDirectionRequests(() =>
      setLocalDirection(
        getLocalDirectionRequests().filter((d) => d.clientId === CLIENT_ID),
      ),
    );
    const u2 = subscribeToLocalUploadSubmissions(() =>
      setLocalUploads(
        getLocalUploadSubmissions().filter((u) => u.restaurantId === CLIENT_ID),
      ),
    );
    return () => {
      u1();
      u2();
    };
  }, []);
  const recommendations = useMemo(
    () =>
      rankRecommendations(
        buildAdaptiveRecommendations({
          clientId: CLIENT_ID,
          direction: [
            ...localDirection,
            ...demoClientDirection.filter((d) => d.clientId === CLIENT_ID),
          ],
          uploads: [
            ...localUploads,
            ...demoUploadSubmissions.filter((u) => u.restaurantId === CLIENT_ID),
          ],
          workflow: demoClientTeamWorkflow.filter((w) => w.clientId === CLIENT_ID),
          memory,
        }),
      ),
    [memory, localDirection, localUploads],
  );

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <div className="mb-4">
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2"
          data-testid="header-adaptive-intelligence"
        >
          <Brain className="w-6 h-6 text-primary" /> Adaptive Intelligence Preview
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base max-w-3xl">
          Rule-based preview of how Veroxa learns from restaurant direction, uploads, workflow
          status, and performance memory to recommend better next actions.
        </p>
      </div>

      <DemoOnlyBanner
        message="Rule-based demo only — no external AI provider, no model API calls, no real performance data, no database writes."
        testId="banner-adaptive-intelligence"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2">
          <WeeklyStrategySnapshot
            recommendations={recommendations}
            audience="team"
          />
        </div>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
              Memory snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <MemorySection label="Strong content types" items={memory.strongContentTypes} />
            <MemorySection label="Weak days" items={memory.weakDays} />
            <MemorySection label="Best platforms" items={memory.bestPlatforms} />
            <MemorySection label="Google gaps" items={memory.googleVisibilityGaps} />
            <MemorySection label="Client consistency" items={memory.clientConsistencyNotes} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {recommendations.map((r) => (
          <AdaptiveRecommendationCard key={r.id} recommendation={r} audience="team" />
        ))}
      </div>

      <Card className="bg-amber-500/5 border-amber-500/30">
        <CardContent className="p-4 text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-amber-200/90">
            <strong>Rule-based demo only.</strong> No OpenAI, Anthropic, or Gemini calls. No
            real performance data. Recommendations are deterministic and derived from in-memory
            fixtures + local component state. Future real implementation will plug in a
            <code className="mx-1 px-1 py-0.5 rounded bg-amber-500/10">performance_metrics</code>
            table, content history, and an AI provider behind a human-approval workflow.
          </p>
        </CardContent>
      </Card>

      {memory.recentLearning.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Recent learning notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {memory.recentLearning.map((n, i) => (
                <li key={`learn-${i}`} className="flex items-start gap-2 text-sm">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      n.tone === "positive"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : n.tone === "gap"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {n.topic}
                  </Badge>
                  <span className="text-foreground/90 flex-1">{n.insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </PortalLayout>
  );
}

function MemorySection({ label, items }: { label: string; items: string[] }) {
  if (!items.length) {
    return (
      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-xs text-muted-foreground italic">None yet.</p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
      <ul className="list-disc list-inside text-foreground/90 text-xs space-y-0.5">
        {items.map((i, idx) => (
          <li key={`${label}-${idx}`}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
