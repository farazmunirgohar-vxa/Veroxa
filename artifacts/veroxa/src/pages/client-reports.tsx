import { CalendarDays, CheckCircle2, FileText, ListChecks } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { RealPortalReviewNotice } from "@/components/RealPortalSafeStates";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { useActiveClientPortalContext } from "@/lib/clientPortalContext";
import { generateClientWeeklyUpdate } from "@/domain/clientPortalJourney";
import { clientTeamWorkRepository } from "@/lib/repositories";

type ReportCard = {
  id: string;
  title: string;
  period: string;
  sections: Array<{ label: string; value: string }>;
};

export default function ClientReports() {
  const mode = useRealPortalDataMode();
  const { activeClientId } = useActiveClientPortalContext();
  const canUseFixtureData =
    Boolean(activeClientId) &&
    (mode.allowDemoFixtures || mode.isLiveDataConnected);
  const weeklyUpdate = canUseFixtureData
    ? generateClientWeeklyUpdate(activeClientId!)
    : null;
  const completedItems = canUseFixtureData
    ? clientTeamWorkRepository
        .getClientCompletedItems(activeClientId!)
        .slice(0, 3)
    : [];
  const inProgressItems = canUseFixtureData
    ? clientTeamWorkRepository
        .getClientInProgressItems(activeClientId!)
        .slice(0, 3)
    : [];
  const actionItems = canUseFixtureData
    ? clientTeamWorkRepository
        .getClientActionRequiredItems(activeClientId!)
        .slice(0, 2)
    : [];

  const sampleLabel = mode.allowDemoFixtures ? "Sample" : null;

  const weeklyReports: ReportCard[] = weeklyUpdate
    ? [
        {
          id: "weekly-current",
          title: sampleLabel ? `${sampleLabel} Weekly Report` : "Weekly Report",
          period: "This week",
          sections: [
            {
              label: "Work completed",
              value:
                completedItems.map((item) => item.title).join("; ") ||
                weeklyUpdate.clientSafeSummary,
            },
            {
              label: "Media used / posted",
              value:
                completedItems
                  .filter((item) => item.workType === "media_review")
                  .map((item) => item.title)
                  .join("; ") || "No posted media is ready to summarize yet.",
            },
            {
              label: "What is next",
              value:
                inProgressItems.map((item) => item.title).join("; ") ||
                "Veroxa will keep reviewing usable media and preparing the next visibility updates.",
            },
            {
              label: "What Veroxa needs from you",
              value:
                actionItems.map((item) => item.title).join("; ") ||
                "Nothing needed right now.",
            },
            {
              label: "Visibility note",
              value:
                "Local visibility work is included when profile updates or Google Maps readiness items are available.",
            },
          ],
        },
      ]
    : [];

  const monthlyReports: ReportCard[] = canUseFixtureData
    ? [
        {
          id: "monthly-current",
          title: sampleLabel
            ? `${sampleLabel} Monthly Report`
            : "Monthly Report",
          period: "This month",
          sections: [
            {
              label: "Posts completed",
              value:
                completedItems.length > 0
                  ? `${completedItems.length} completed item${completedItems.length === 1 ? "" : "s"} are ready to summarize.`
                  : "No completed posting summary is available yet.",
            },
            {
              label: "Top content",
              value:
                completedItems[0]?.title ||
                "Top content will appear after Veroxa has enough posted work to compare honestly.",
            },
            {
              label: "Local visibility progress",
              value:
                "Profile freshness and Google Maps readiness notes will appear when available.",
            },
            {
              label: "Summary of improvements",
              value:
                "This month will summarize completed work, client input received, and meaningful visibility improvements without invented metrics.",
            },
            {
              label: "Next month focus",
              value:
                actionItems.length > 0
                  ? "More usable media and quick answers will help Veroxa keep momentum."
                  : "Keep fresh media coming so Veroxa can maintain a steady posting lane.",
            },
            {
              label: "Honest limitation",
              value:
                "Performance numbers only appear after trustworthy account data is available.",
            },
          ],
        },
      ]
    : [];

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <RealPortalReviewNotice />

      <div>
        <h2
          className="text-3xl font-bold tracking-tight"
          data-testid="header-client-reports"
        >
          Reports
        </h2>
        <p className="mt-1 max-w-2xl text-sm md:text-base text-muted-foreground">
          Weekly and monthly summaries live here. Updates stay focused on
          day-to-day progress.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReportSection
          title="Weekly Reports"
          reports={weeklyReports}
          empty="Reports will appear after enough account activity. Weekly summaries will not show invented metrics."
        />
        <ReportSection
          title="Monthly Reports"
          reports={monthlyReports}
          empty="Reports will appear after enough account activity. Monthly summaries will use trustworthy account data only."
        />
      </div>
    </PortalLayout>
  );
}

function ReportSection({
  title,
  reports,
  empty,
}: {
  title: string;
  reports: ReportCard[];
  empty: string;
}) {
  return (
    <Card
      className="border-border bg-card"
      data-testid={`section-${title.toLowerCase().replaceAll(" ", "-")}`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-primary" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {reports.length === 0 ? (
          <p className="rounded-md border border-border bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
            {empty}
          </p>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              className="rounded-md border border-border bg-muted/20 px-3 py-3"
              data-testid={`report-${report.id}`}
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{report.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {report.title.startsWith("Sample")
                      ? "Sample summary for the Client Demo."
                      : "Simple summary, not an analytics dashboard."}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="border-primary/30 bg-primary/10 text-primary"
                >
                  <CalendarDays className="mr-1 h-3 w-3" /> {report.period}
                </Badge>
              </div>
              <div className="space-y-2">
                {report.sections.map((section) => (
                  <div
                    key={section.label}
                    className="rounded-md border border-border/70 bg-card/50 p-3"
                  >
                    <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {section.label.includes("What") ? (
                        <ListChecks className="h-3 w-3" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                      {section.label}
                    </p>
                    <p className="mt-1 text-sm text-foreground/85">
                      {section.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
