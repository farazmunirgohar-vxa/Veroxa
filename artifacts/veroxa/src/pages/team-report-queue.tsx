import { useState } from "react";
import { FileText, FileBarChart, ClipboardCheck } from "lucide-react";
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
import { buildRuleBasedReportDraft } from "@/domain/ruleBasedAutomation";

import { TeamSaasStatePanel } from "@/components/team/TeamSaasStatePanel";
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
  const weeklyByStage = weeklyStages.map((s) => ({
    stage: s,
    items: demoWeeklyReports.filter((r) => r.status === s),
  }));

  if (!canUseFixtureData) {
    return (
      <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <TeamSaasStatePanel compact={true} />
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

      {/* Rule-based report draft builder — deterministic, no live AI or analytics. */}
      {(() => {
        const weeklyReport = demoWeeklyReports[0];
        const monthlyReport = demoMonthlyReports[0];
        const weeklyDraft = buildRuleBasedReportDraft({
          reportType: "weekly",
          restaurantName: getRestaurantName(weeklyReport.clientId),
          weekly: weeklyReport,
          workCompleted: [
            "Reviewed approved work eligible for the weekly update",
          ],
          mediaUsed: [weeklyReport.mediaStatus],
        });
        const monthlyDraft = buildRuleBasedReportDraft({
          reportType: "monthly",
          restaurantName: getRestaurantName(monthlyReport.clientId),
          monthly: monthlyReport,
          workCompleted: monthlyReport.nextMonthFocus.slice(0, 2),
          mediaUsed: ["Use only manually verified media/activity notes"],
        });
        const drafts = [weeklyDraft, monthlyDraft];
        return (
          <Card
            className="bg-card border-primary/20 mb-4"
            data-testid="card-rule-report-drafts"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center justify-between gap-2 flex-wrap">
                <span className="flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-primary" />
                  Rule-based report draft builder
                </span>
                <Badge
                  variant="outline"
                  className="border-amber-500/40 bg-amber-500/10 text-amber-300 text-[10px]"
                >
                  Human verification required
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {drafts.map((draft) => (
                  <div
                    key={draft.reportType}
                    className="rounded-md border border-border/60 bg-muted/10 p-3 text-[12px]"
                    data-testid={`rule-report-draft-${draft.reportType}`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                      <p className="font-semibold text-foreground capitalize">
                        {draft.reportType} draft
                      </p>
                      <Badge
                        variant="outline"
                        className="border-border bg-muted/30 text-[10px]"
                      >
                        {draft.reviewStatus}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {draft.sections.slice(0, 3).map((section) => (
                        <div key={section.title}>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                            {section.title}
                          </p>
                          <p className="text-foreground/85 leading-snug">
                            {section.items[0]}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="text-primary/80 mt-2 text-[11px]">
                      Next: {draft.nextAction}
                    </p>
                  </div>
                ))}
              </div>
              <div className="rounded-md border border-border/60 bg-muted/10 p-3 text-[11px] text-muted-foreground">
                Honest limitation: no fake ROI, rankings, calls, directions,
                clicks, or social results are added without connected data.
                Report drafts stay manual and review-mode until Faraz verifies
                them.
              </div>
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
