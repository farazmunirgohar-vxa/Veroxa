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

interface ReportCardModel {
  id: string;
  title: string;
  period: string;
  sections: Array<{ label: string; body: string }>;
}

export default function ClientReports() {
  const mode = useRealPortalDataMode();
  const { activeClientId } = useActiveClientPortalContext();
  const canUseFixtureData =
    Boolean(activeClientId) &&
    (mode.allowDemoFixtures || mode.isLiveDataConnected);
  const weeklyUpdate = canUseFixtureData
    ? generateClientWeeklyUpdate(activeClientId!)
    : null;
  const submissions = canUseFixtureData
    ? clientTeamWorkRepository.getClientVisibleSubmissions(activeClientId!)
    : [];
  const completedMedia = submissions.filter(
    (item) => item.submissionType === "media" && item.status === "completed",
  );
  const readyMedia = submissions.filter(
    (item) =>
      item.submissionType === "media" &&
      ["accepted", "in_progress"].includes(item.status),
  );

  const sampleLabel = mode.allowDemoFixtures ? "Sample" : null;

  const weeklyReports: ReportCardModel[] = weeklyUpdate
    ? [
        {
          id: "weekly-current",
          title: sampleLabel ? `${sampleLabel} Weekly Report` : "Weekly Report",
          period: "This week",
          sections: [
            { label: "Work completed", body: weeklyUpdate.clientSafeSummary },
            {
              label: "Media used or posted",
              body:
                completedMedia.length > 0
                  ? completedMedia.map((item) => item.title).join(", ")
                  : "No posted media is listed for this sample week yet.",
            },
            {
              label: "What is next",
              body:
                readyMedia.length > 0
                  ? "Veroxa has reviewed media ready for the next content pass."
                  : "Veroxa will continue reviewing usable client-provided media.",
            },
            {
              label: "What Veroxa needs from you",
              body: "Keep sending clear photos, short videos, specials, and any menu context that would help.",
            },
            {
              label: "Visibility note",
              body: "Local visibility work is included when Veroxa has verified updates to summarize.",
            },
          ],
        },
      ]
    : [];

  const monthlyReports: ReportCardModel[] = canUseFixtureData
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
              body:
                completedMedia.length > 0
                  ? `${completedMedia.length} media item${completedMedia.length === 1 ? "" : "s"} marked posted or already used.`
                  : "Post totals appear here after Veroxa has confirmed completed work.",
            },
            {
              label: "Top content",
              body: "Top content is shown only when reliable performance data is available.",
            },
            {
              label: "Local visibility progress",
              body: "Google Maps and local search improvements are summarized after Veroxa verifies the work.",
            },
            {
              label: "Summary of improvements",
              body: "This month focuses on steadier media use, clearer client direction, and safer local visibility updates.",
            },
            {
              label: "Next month focus",
              body: "Keep the media library fresh and confirm any specials, hours, or menu details before Veroxa uses them.",
            },
            {
              label: "Honest limitations",
              body: "No performance metrics are invented. Missing platform data stays blank until it is available.",
            },
          ],
        },
      ]
    : [];

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <RealPortalReviewNotice />
      {!canUseFixtureData && (
        <Card className="border-primary/20 bg-primary/5" data-testid="card-client-reports-real-empty">
          <CardContent className="p-4 text-sm text-muted-foreground">
            Reports will appear here after verified work is reviewed. Missing account activity stays blank instead of being guessed.
          </CardContent>
        </Card>
      )}

      <div>
        <h2
          className="text-3xl font-bold tracking-tight"
          data-testid="header-client-reports"
        >
          Reports
        </h2>
        <p className="mt-1 max-w-2xl text-sm md:text-base text-muted-foreground">
          Weekly and monthly Veroxa summaries live here when they are ready.
          Reports focus on completed work, useful media, next steps, client
          needs, and honest limits rather than invented performance numbers.
        </p>
      </div>

      <Card
        className="border-border bg-card/80"
        data-testid="card-report-boundaries"
      >
        <CardContent className="space-y-2 p-4 md:p-5">
          <p className="text-sm font-semibold text-foreground">
            How to read reports
          </p>
          <p className="text-sm text-muted-foreground">
            Veroxa reports show confirmed work and practical next steps. If
            reach, profile activity, rankings, ad results, or sales data is not
            available, the report will say so instead of guessing.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
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
  reports: ReportCardModel[];
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
                    className="rounded-md border border-border/70 bg-card/60 p-3"
                  >
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {section.label}
                    </p>
                    <p className="mt-1 text-sm text-foreground/90">
                      {section.body}
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
