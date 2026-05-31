import { useState } from "react";
import { FileText, FileBarChart } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import {
  RealPortalReviewNotice,
  SafePortalEmptyCard,
} from "@/components/RealPortalSafeStates";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { TeamReviewModeRouteSummary } from "@/components/team/TeamOperationalSpine";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { TeamWorkflowPanel } from "@/components/TeamWorkflowPanel";
import {
  demoWeeklyReports,
  demoMonthlyReports,
  getRestaurantName,
  type WeeklyReportStatus,
} from "@/data/demoData";
import {
  previewReportDraft,
  reportDraftOutput,
} from "@/lib/ai/aiAgentPreviewEngine";
import {
  TEAM_AI_DISCLOSURE,
  AI_CONFIDENCE_LABELS,
  AI_AUTOMATION_READINESS_LABELS,
} from "@/lib/ai/aiAgentTypes";
import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  generateAiDraftClient,
  aiDraftModeLabel,
  type AiDraftMode,
} from "@/lib/ai/aiDraftClient";

const weeklyStatusColor: Record<WeeklyReportStatus, string> = {
  Draft: "border-muted-foreground/40 text-muted-foreground bg-muted/30",
  "Team Review": "border-amber-500/40 text-amber-300 bg-amber-500/10",
  "Ready for Client":
    "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
  Published: "border-sky-500/40 text-sky-300 bg-sky-500/10",
};

const monthlyStatusMap: Record<string, string> = {
  Draft: "border-muted-foreground/40 text-muted-foreground bg-muted/30",
  "Team Review": "border-amber-500/40 text-amber-300 bg-amber-500/10",
  Published: "border-sky-500/40 text-sky-300 bg-sky-500/10",
};

const weeklyStages: WeeklyReportStatus[] = [
  "Draft",
  "Team Review",
  "Ready for Client",
  "Published",
];

export default function TeamReportQueue() {
  const portalDataMode = useRealPortalDataMode();
  const canUseFixtureData =
    portalDataMode.allowDemoFixtures || portalDataMode.isLiveDataConnected;

  const [tab, setTab] = useState<"weekly" | "monthly">("weekly");
  const [draftMode, setDraftMode] = useState<AiDraftMode | null>(null);
  const [generating, setGenerating] = useState(false);

  async function handleGenerateReportDraft() {
    setGenerating(true);
    try {
      const res = await generateAiDraftClient({
        draftType: "report_summary",
        context: {
          cadence: "weekly",
          hasPublishedPosts: false,
          hasMetrics: false,
        },
      });
      setDraftMode(res.mode);
    } catch {
      setDraftMode("rule_based_fallback");
    } finally {
      setGenerating(false);
    }
  }

  const weeklyByStage = weeklyStages.map((s) => ({
    stage: s,
    items: demoWeeklyReports.filter((r) => r.status === s),
  }));

  if (!canUseFixtureData) {
    return (
      <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
        <RealPortalReviewNotice />
        <SafePortalEmptyCard
          title="Report Queue in review"
          body="Live weekly and monthly reports are not connected yet. Report drafts will appear here after real account data is prepared."
          testId="empty-team-report-queue"
        />
        <TeamReviewModeRouteSummary title="Report queue review-mode summary" />
      </PortalLayout>
    );
  }

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <div className="mb-4">
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight"
          data-testid="header-report-queue"
        >
          Report Queue
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Track weekly and monthly reports through drafting, validation, and
          delivery.
        </p>
      </div>

      <DemoOnlyBanner
        message="Report sourcing persists in the workflow foundation for this browser (backend pending). Drafts require team verification before they become client-visible — nothing is delivered automatically."
        testId="banner-report-queue"
      />

      {/* Report-source items — completed work eligible for the report, plus
          report drafts awaiting verification. Inclusion is a team decision;
          nothing is delivered or made client-visible automatically. */}
      <div className="mb-4">
        <TeamWorkflowPanel
          title="Report-source items"
          icon={<FileBarChart className="w-4 h-4 text-primary" />}
          lifecycles={["completed", "report_ready", "included_in_report"]}
          emptyText="No completed items are ready for the report yet."
          testId="card-report-queue-workflow"
        />
      </div>

      {/* AI-assisted report drafts preview — Veroxa team verifies before sharing. */}
      {(() => {
        const weeklyDraft = previewReportDraft({
          reportTitle: "This week",
          cadence: "weekly",
          hasPublishedPosts: false,
          hasMetrics: false,
        });
        const monthlyDraft = previewReportDraft({
          reportTitle: "This month",
          cadence: "monthly",
          hasPublishedPosts: false,
          hasMetrics: false,
        });
        const drafts = [weeklyDraft, monthlyDraft];
        const structuredByTitle: Record<
          string,
          ReturnType<typeof reportDraftOutput>
        > = {
          [weeklyDraft.title]: reportDraftOutput({
            reportTitle: "This week",
            cadence: "weekly",
            hasPublishedPosts: false,
            hasMetrics: false,
          }),
          [monthlyDraft.title]: reportDraftOutput({
            reportTitle: "This month",
            cadence: "monthly",
            hasPublishedPosts: false,
            hasMetrics: false,
          }),
        };
        return (
          <Card
            className="bg-card border-primary/20 mb-4"
            data-testid="card-ai-report-drafts"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center justify-between gap-2 flex-wrap">
                <span className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" />
                  AI report drafts preview
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {draftMode && (
                    <Badge
                      variant="outline"
                      className="border-primary/40 bg-primary/5 text-primary text-[10px]"
                      data-testid="report-draft-mode"
                    >
                      Mode: {aiDraftModeLabel(draftMode)}
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px]"
                    onClick={handleGenerateReportDraft}
                    disabled={generating}
                    data-testid="btn-generate-report-draft"
                  >
                    {generating ? "Generating…" : "Generate report draft"}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {drafts.map((d) => (
                  <div
                    key={d.title}
                    className="rounded-md border border-border/60 bg-muted/10 p-3 text-[12px]"
                    data-testid={`ai-report-draft-${d.title.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-foreground">{d.title}</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {structuredByTitle[d.title] && (
                          <>
                            <Badge
                              variant="outline"
                              className="border-border bg-muted/30 text-[10px]"
                            >
                              {
                                AI_CONFIDENCE_LABELS[
                                  structuredByTitle[d.title].confidenceLevel
                                ]
                              }
                            </Badge>
                            <Badge
                              variant="outline"
                              className="border-border bg-muted/30 text-[10px]"
                            >
                              {
                                AI_AUTOMATION_READINESS_LABELS[
                                  structuredByTitle[d.title].automationReadiness
                                ]
                              }
                            </Badge>
                          </>
                        )}
                        <Badge
                          variant="outline"
                          className="border-amber-500/40 bg-amber-500/10 text-amber-300 text-[10px]"
                        >
                          Human verification required
                        </Badge>
                      </div>
                    </div>
                    <p className="text-foreground/85">{d.draftSummary}</p>
                    {structuredByTitle[d.title] && (
                      <p className="text-primary/80 mt-1 text-[11px]">
                        Next: {structuredByTitle[d.title].recommendedNextAction}
                      </p>
                    )}
                    {d.missingDataFlags.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5">
                        {d.missingDataFlags.map((flag, i) => (
                          <li key={i} className="text-[11px] text-amber-300/90">
                            ⚠ {flag}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground italic pt-1">
                {TEAM_AI_DISCLOSURE}
              </p>
            </CardContent>
          </Card>
        );
      })()}

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as typeof tab)}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 w-full max-w-xs mb-4">
          <TabsTrigger value="weekly">
            <FileText className="w-4 h-4 mr-2" /> Weekly
          </TabsTrigger>
          <TabsTrigger value="monthly">
            <FileBarChart className="w-4 h-4 mr-2" /> Monthly
          </TabsTrigger>
        </TabsList>

        {/* WEEKLY TAB */}
        <TabsContent value="weekly" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {weeklyByStage.map(({ stage, items }) => (
              <Card
                key={stage}
                className="bg-card border-border"
                data-testid={`weekly-col-${stage.replace(/\s/g, "-").toLowerCase()}`}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span>{stage}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {items.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {items.length === 0 && (
                    <p className="text-[11px] text-muted-foreground italic">
                      No reports at this stage.
                    </p>
                  )}
                  {items.map((r) => (
                    <div
                      key={r.clientId}
                      className="rounded-md border border-border bg-muted/20 p-2.5"
                      data-testid={`weekly-report-${r.clientId}`}
                    >
                      <p className="text-xs font-medium mb-0.5">
                        {getRestaurantName(r.clientId)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mb-1.5">
                        {r.weekRange}
                      </p>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${weeklyStatusColor[r.status]}`}
                      >
                        {r.status}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* MONTHLY TAB */}
        <TabsContent value="monthly" className="mt-0">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">
                Monthly reports — {demoMonthlyReports[0]?.monthLabel}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {demoMonthlyReports.map((r) => {
                const statusLabel = r.healthSummary
                  .toLowerCase()
                  .startsWith("critical")
                  ? "Draft"
                  : r.healthSummary.toLowerCase().startsWith("attention")
                    ? "Team Review"
                    : "Published";

                return (
                  <div
                    key={r.clientId}
                    className="rounded-md border border-border bg-muted/20 p-3"
                    data-testid={`monthly-report-${r.clientId}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {getRestaurantName(r.clientId)}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {r.monthLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded border ${monthlyStatusMap[statusLabel] ?? "border-muted-foreground/40 text-muted-foreground bg-muted/30"}`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {r.growthOverview}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[10px] text-muted-foreground mt-1.5">
                      {r.contentPerformance.map((m) => (
                        <span key={m.label}>
                          {m.label}:{" "}
                          <span className="text-foreground/70 font-medium">
                            {m.value}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PortalLayout>
  );
}
