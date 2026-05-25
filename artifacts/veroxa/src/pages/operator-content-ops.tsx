import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { operatorPortalNavItems } from "@/lib/operatorPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { demoPipelineMetrics } from "@/data/demoData";

const stageColor = [
  "bg-sky-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-emerald-500",
];

export default function OperatorContentOps() {
  const total = demoPipelineMetrics.reduce((s, m) => s + m.count, 0);

  return (
    <PortalLayout items={operatorPortalNavItems} portalName="Operator Portal">
      <div className="mb-4">
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight"
          data-testid="header-content-ops"
        >
          Content Operations Center
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Monitor the content pipeline across all clients — from media received
          through to published posts.
        </p>
      </div>

      <DemoOnlyBanner
        message="Demo only — pipeline counts are sample data. No social or CMS integrations are connected."
        testId="banner-content-ops"
      />

      {/* Pipeline bar */}
      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Pipeline overview — {total} items in flight</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Stacked proportional bar */}
          <div className="flex w-full h-5 rounded-full overflow-hidden mb-4">
            {demoPipelineMetrics.map((stage, i) => (
              <div
                key={stage.stage}
                className={`${stageColor[i]} flex-shrink-0`}
                style={{ width: `${(stage.count / total) * 100}%` }}
                title={`${stage.stage}: ${stage.count}`}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {demoPipelineMetrics.map((stage, i) => (
              <div key={stage.stage} className="flex items-center gap-1.5 text-xs">
                <div className={`w-2.5 h-2.5 rounded-sm ${stageColor[i]} flex-shrink-0`} />
                <span className="text-muted-foreground">{stage.stage}</span>
                <span className="font-semibold">{stage.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stage cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {demoPipelineMetrics.map((stage, i) => {
          const pct = Math.round((stage.count / total) * 100);
          const isPositive = stage.positive;
          const TrendIcon =
            stage.change.startsWith("+") ? TrendingUp :
            stage.change.startsWith("–") ? TrendingDown : Minus;
          return (
            <Card
              key={stage.stage}
              className="bg-card border-border"
              data-testid={`pipeline-card-${stage.stage.replace(/\s/g, "-").toLowerCase()}`}
            >
              <CardContent className="p-5">
                {/* Colour bar top */}
                <div className={`h-1 w-full rounded-full ${stageColor[i]} mb-4 opacity-80`} />

                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {stage.stage}
                </p>
                <p className="text-3xl font-bold tabular-nums mb-3">{stage.count}</p>

                {/* Mini bar relative to total */}
                <div className="w-full h-1.5 rounded-full bg-muted/40 mb-3">
                  <div
                    className={`h-1.5 rounded-full ${stageColor[i]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div
                  className={`flex items-center gap-1 text-xs font-medium ${
                    isPositive ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  <TrendIcon className="w-3.5 h-3.5" />
                  {stage.change}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PortalLayout>
  );
}
