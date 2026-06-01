import { CalendarDays, FileText } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { RealPortalReviewNotice } from "@/components/RealPortalSafeStates";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { useActiveClientPortalContext } from "@/lib/clientPortalContext";
import { generateClientWeeklyUpdate } from "@/domain/clientPortalJourney";


export default function ClientReports() {
  const mode = useRealPortalDataMode();
  const { activeClientId } = useActiveClientPortalContext();
  const canUseFixtureData = Boolean(activeClientId) && (mode.allowDemoFixtures || mode.isLiveDataConnected);
  const weeklyUpdate = canUseFixtureData ? generateClientWeeklyUpdate(activeClientId!) : null;

  const weeklyReports = weeklyUpdate
    ? [
        {
          id: "weekly-current",
          title: "Weekly Report",
          period: "This week",
          summary: weeklyUpdate.clientSafeSummary,
        },
      ]
    : [];
  const monthlyReports = canUseFixtureData
    ? [
        {
          id: "monthly-current",
          title: "Monthly Report",
          period: "This month",
          summary: "Your monthly report will summarize posted media, key visibility work, and any next items Veroxa needs from you.",
        },
      ]
    : [];

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <RealPortalReviewNotice />

      <div>
        <h2 className="text-3xl font-bold tracking-tight" data-testid="header-client-reports">Reports</h2>
        <p className="mt-1 max-w-2xl text-sm md:text-base text-muted-foreground">
          Weekly and monthly Veroxa reports live here when they are ready.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReportSection title="Weekly Reports" reports={weeklyReports} empty="Weekly reports will appear here after Veroxa prepares them." />
        <ReportSection title="Monthly Reports" reports={monthlyReports} empty="Monthly reports will appear here after the month is summarized." />
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
  reports: Array<{ id: string; title: string; period: string; summary: string }>;
  empty: string;
}) {
  return (
    <Card className="border-border bg-card" data-testid={`section-${title.toLowerCase().replaceAll(" ", "-")}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-primary" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {reports.length === 0 ? (
          <p className="rounded-md border border-border bg-muted/20 px-3 py-3 text-sm text-muted-foreground">{empty}</p>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="rounded-md border border-border bg-muted/20 px-3 py-3" data-testid={`report-${report.id}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{report.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{report.summary}</p>
                </div>
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                  <CalendarDays className="mr-1 h-3 w-3" /> {report.period}
                </Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
