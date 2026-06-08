import { BarChart3, CheckCircle2, FileText, Image, Info, ShieldCheck } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { RealPortalReviewNotice, SafePortalEmptyCard } from "@/components/RealPortalSafeStates";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientSaasPortalState } from "@/hooks/useClientSaasPortalState";
import { buildClientMonthlyReportPreview, buildMonthlyReportFromClientSummary, buildMonthlyReportFromReportRecord, getClientNoGuaranteeReportLanguage, getClientSafeValueProofReportLanguage, monthlyReportSections } from "@/domain/monthlyReports";

export default function ClientReports() {
  const { pageState, reportSummaries } = useClientSaasPortalState();
  const restaurantName = pageState.restaurant?.name ?? "Your restaurant";
  const monthlySummary = reportSummaries.find((summary) => summary.reportType === "monthly");
  const monthlyRecord = pageState.reports.find((item) => item.reportType === "monthly");
  const loadedReport = monthlySummary
    ? buildMonthlyReportFromClientSummary(monthlySummary, restaurantName)
    : monthlyRecord
      ? buildMonthlyReportFromReportRecord(monthlyRecord, restaurantName)
      : null;
  const { report, readiness } = buildClientMonthlyReportPreview(loadedReport ?? undefined);
  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <RealPortalReviewNotice />
      <PageHeader title="Monthly Reports" description="A clear monthly online presence report: what Veroxa handled, what appears to be working, what needs improvement, and what is needed next." testId="header-client-reports" />
      {!pageState.isDemoData && !pageState.canShowRealData ? <SafePortalEmptyCard title="Monthly report status" body="Your first monthly report will appear after Veroxa has enough manual review context. This page shows the safe report structure without live analytics or unverified metrics." icon="info" /> : null}

      <Card className="mb-4 border-primary/20 bg-primary/5" data-testid="monthly-report-status">
        <CardContent className="p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold">{report.monthLabel} — {report.restaurantName}</p>
            <p className="text-xs text-muted-foreground">{report.clientSafeSummary}</p>
          </div>
          <StatusBadge tone={readiness.status === "not_enough_data_yet" || readiness.status === "needs_media" || readiness.status === "needs_confirmations" ? "warning" : "info"}>{readiness.label}</StatusBadge>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <ReportSection icon={CheckCircle2} title="What Veroxa handled" items={report.whatVeroxaHandled} />
        <ReportSection icon={ShieldCheck} title="Google/Maps/local search progress" items={report.googleMapsLocalProgress} />
        <ReportSection icon={FileText} title="Website alignment progress" items={report.websiteAlignmentProgress} />
        <ReportSection icon={Image} title="Facebook/Instagram content progress" items={report.facebookInstagramProgress} />
        <ReportSection icon={Image} title="Media used" items={report.mediaUsed} />
        <ReportSection icon={CheckCircle2} title="What media worked" items={report.whatMediaWorked} />
        <ReportSection icon={Info} title="What media did not work" items={report.whatMediaDidNotWork} />
        <ReportSection icon={Image} title="Media needed next" items={report.mediaNeededNext} />
        <ReportSection icon={BarChart3} title="Reach/action signals" items={report.reachActionSignals} />
        <ReportSection icon={Info} title="Honest limitations" items={report.limitations} />
        <ReportSection icon={ShieldCheck} title="Next month focus" items={report.nextMonthFocus} />
      </section>

      <Card className="mt-4 border-sky-500/20 bg-sky-500/5" data-testid="client-safe-value-proof-summary">
        <CardHeader><CardTitle className="text-sm">How Veroxa reads online presence signals</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>{getClientSafeValueProofReportLanguage()}</p>
          <p>{getClientNoGuaranteeReportLanguage()}</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{monthlyReportSections.map((section) => <p key={section} className="rounded-lg border border-border/50 p-2 text-xs">{section}</p>)}</div>
        </CardContent>
      </Card>
    </PortalLayout>
  );
}

function ReportSection({ icon: Icon, title, items }: { icon: typeof FileText; title: string; items: string[] }) {
  return <Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><Icon className="h-4 w-4 text-primary" />{title}</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-muted-foreground">{items.map((item) => <p key={item} className="rounded-lg border border-border/50 p-2">{item}</p>)}</CardContent></Card>;
}
