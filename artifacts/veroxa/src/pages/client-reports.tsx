import { BarChart3, FileText, ShieldCheck } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import {
  RealPortalReviewNotice,
  SafePortalEmptyCard,
} from "@/components/RealPortalSafeStates";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientSaasPortalState } from "@/hooks/useClientSaasPortalState";
import { getClientSafeEmptyStateForPage } from "@/domain/saas/clientPortalState";
import {
  buildClientSafeMediaSummary,
  mediaIntelligenceSeedData,
} from "@/domain/mediaIntelligence";
import {
  buildClientSafeValueSummary,
  valueProofSeedSummaries,
} from "@/domain/valueProof";

const safeSignals = [
  "Phone calls",
  "direction requests",
  "website/menu clicks",
  "Profile actions",
  "Facebook/Instagram reach",
  "Customer mentions",
  "media usage",
  "completed work",
];

export default function ClientReports() {
  const { pageState, reportSummaries } = useClientSaasPortalState();
  const weekly = reportSummaries.filter(
    (report) => report.reportType === "weekly",
  );
  const monthly = reportSummaries.filter(
    (report) => report.reportType === "monthly",
  );
  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <RealPortalReviewNotice />
      <PageHeader
        title="Reports"
        description="Weekly updates and monthly reports appear after Veroxa reviews verified work and safe next steps."
        testId="header-client-reports"
      />
      {!pageState.isDemoData && !pageState.canShowRealData ? (
        <SafePortalEmptyCard
          title="Reports in setup"
          body={getClientSafeEmptyStateForPage("reports", pageState)}
        />
      ) : null}
      <Card
        className="mb-4 border-primary/20 bg-primary/5"
        data-testid="client-safe-value-media-reporting"
      >
        <CardContent className="space-y-2 p-4 text-sm text-muted-foreground">
          <p>{buildClientSafeValueSummary(valueProofSeedSummaries[0])}</p>
          <p>{buildClientSafeMediaSummary(mediaIntelligenceSeedData)}</p>
          <p className="text-xs">
            Client reports show what Veroxa handled, what worked, what did not work, what media is needed next, what needs confirmation, visible signals, and limitations without private team calculations. Yelp is coming soon and not current included tracking.
          </p>
        </CardContent>
      </Card>
      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <ReportGroup title="Weekly Reports" reports={weekly} />
          <ReportGroup title="Monthly Reports" reports={monthly} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              What appears when verified
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Weekly updates summarize what Veroxa worked on, what was posted/prepared, what is pending, what media is needed, what client details need confirmation, and what is next. Monthly reports go deeper into completed work, media usage, client needs, honest limitations, and available online presence signals.
            </p>
            <div>
              <p className="font-medium text-foreground">
                Signals we may track
              </p>
              <ul className="mt-2 grid grid-cols-2 gap-2 text-xs">
                {safeSignals.map((signal) => (
                  <li
                    key={signal}
                    className="rounded-lg border border-border p-2"
                  >
                    {signal}
                  </li>
                ))}
              </ul>
            </div>
            <p className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs">
              Client pages do not show private team proof targets, private scoring, outcome promises, or fake visibility claims.
            </p>
          </CardContent>
        </Card>
      </section>
    </PortalLayout>
  );
}
function ReportGroup({
  title,
  reports,
}: {
  title: string;
  reports: {
    id: string;
    title: string;
    status: string;
    summary: string;
    sourceLabel: string;
  }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {reports.length > 0 ? (
          reports.map((report) => (
            <div
              key={report.id}
              className="rounded-lg border border-border p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{report.title}</p>
                <StatusBadge
                  tone={
                    report.status === "published_to_client" ? "success" : "info"
                  }
                >
                  {report.status.replaceAll("_", " ")}
                </StatusBadge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {report.summary}
              </p>
              <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <BarChart3 className="h-3.5 w-3.5" />
                {report.sourceLabel === "demo"
                  ? "Sample report preview"
                  : "Setup state"}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No {title.toLowerCase()} are ready yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
