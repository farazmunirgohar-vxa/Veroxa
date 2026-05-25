import { useState } from "react";
import { FileText, FileBarChart } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { operatorPortalNavItems } from "@/lib/operatorPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import {
  demoWeeklyReports,
  demoMonthlyReports,
  getRestaurantName,
  type WeeklyReportStatus,
} from "@/data/demoData";

// Map internal status labels → command-center labels
const weeklyStageMap: Record<WeeklyReportStatus, string> = {
  "Draft":             "Drafting",
  "Operator Review":   "Validation Needed",
  "Ready for Client":  "Ready",
  "Published":         "Published",
};

const commandStages = ["Drafting", "Validation Needed", "Ready", "Published"] as const;

const stageColor: Record<string, string> = {
  "Drafting":           "border-muted-foreground/40 text-muted-foreground bg-muted/30",
  "Validation Needed":  "border-amber-500/40 text-amber-300 bg-amber-500/10",
  "Ready":              "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
  "Published":          "border-sky-500/40 text-sky-300 bg-sky-500/10",
};

const bottleneckNote: Record<string, string> = {
  "Validation Needed": "⚠ Bottleneck — these reports need operator review now.",
  "Drafting":          "In progress — no action required yet.",
  "Ready":             "Ready to deliver to clients.",
  "Published":         "Complete.",
};

export default function OperatorReportingCommand() {
  const [tab, setTab] = useState<"weekly" | "monthly">("weekly");

  const weeklyByStage = commandStages.map((stage) => ({
    stage,
    items: demoWeeklyReports.filter(
      (r) => weeklyStageMap[r.status] === stage,
    ),
  }));

  // For monthly we simulate statuses
  const monthlyStages = commandStages.map((stage) => ({
    stage,
    items: demoMonthlyReports.filter((_, i) => {
      if (stage === "Validation Needed") return i === 1;
      if (stage === "Drafting")          return i === 0;
      if (stage === "Ready")             return i === 2;
      if (stage === "Published")         return i >= 3;
      return false;
    }),
  }));

  return (
    <PortalLayout items={operatorPortalNavItems} portalName="Operator Portal">
      <div className="mb-4">
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight"
          data-testid="header-reporting-command"
        >
          Reporting Command Center
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Identify reporting bottlenecks at a glance — validate, approve, and
          track every weekly and monthly report.
        </p>
      </div>

      <DemoOnlyBanner
        message="Demo only — report statuses are sample data."
        testId="banner-reporting-command"
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="grid grid-cols-2 w-full max-w-xs mb-4">
          <TabsTrigger value="weekly">
            <FileText className="w-4 h-4 mr-2" /> Weekly
          </TabsTrigger>
          <TabsTrigger value="monthly">
            <FileBarChart className="w-4 h-4 mr-2" /> Monthly
          </TabsTrigger>
        </TabsList>

        {[
          { key: "weekly",  stages: weeklyByStage  },
          { key: "monthly", stages: monthlyStages  },
        ].map(({ key, stages }) => (
          <TabsContent key={key} value={key} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {stages.map(({ stage, items }) => (
                <Card
                  key={stage}
                  className="bg-card border-border"
                  data-testid={`${key}-stage-${stage.replace(/\s/g, "-").toLowerCase()}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-sm font-semibold">{stage}</CardTitle>
                      <Badge variant="outline" className="text-[10px]">
                        {items.length}
                      </Badge>
                    </div>
                    {stage === "Validation Needed" && items.length > 0 && (
                      <p className="text-[10px] text-amber-400 mt-1">
                        ⚠ Needs operator review
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {items.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground italic">
                        No reports at this stage.
                      </p>
                    ) : (
                      items.map((r) => (
                        <div
                          key={r.clientId}
                          className="rounded-md border border-border bg-muted/20 p-2.5"
                          data-testid={`report-${key}-${r.clientId}`}
                        >
                          <p className="text-xs font-medium mb-0.5">
                            {getRestaurantName(r.clientId)}
                          </p>
                          {"weekRange" in r && (
                            <p className="text-[10px] text-muted-foreground mb-1.5">
                              {(r as { weekRange: string }).weekRange}
                            </p>
                          )}
                          {"monthLabel" in r && (
                            <p className="text-[10px] text-muted-foreground mb-1.5">
                              {(r as { monthLabel: string }).monthLabel}
                            </p>
                          )}
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${stageColor[stage]}`}
                          >
                            {stage}
                          </span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Bottleneck notes */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
              {stages.map(({ stage, items }) =>
                items.length > 0 ? (
                  <p
                    key={stage}
                    className="text-[11px] text-muted-foreground leading-relaxed"
                  >
                    {bottleneckNote[stage]}
                  </p>
                ) : null,
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </PortalLayout>
  );
}
