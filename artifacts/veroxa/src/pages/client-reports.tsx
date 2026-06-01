import { CalendarDays, CheckCircle2, FileText, TrendingUp } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientPortalData } from "@/hooks/useClientPortalData";
import {
  generateClientMonthlyReport,
  generateClientWeeklyUpdate,
} from "@/domain/clientPortalJourney";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { RealPortalReviewNotice } from "@/components/RealPortalSafeStates";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { ClientOperationalCard } from "@/components/client/ClientOperationalSpine";
import {
  getCurrentClientAccount,
  getClientReportWorkflow,
} from "@/lib/operations";

const SHOWCASE_ID = "demo-a";

function ReportList({ items }: { items: string[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item}
          className="flex items-start gap-2 text-sm text-muted-foreground"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

export default function ClientReports() {
  const { source, dataSourceMessage } = useClientPortalData();
  const portalDataMode = useRealPortalDataMode();
  const canUseFixtureData =
    portalDataMode.allowDemoFixtures || portalDataMode.isLiveDataConnected;
  const reviewAccount = getCurrentClientAccount();
  const reviewReport = getClientReportWorkflow(reviewAccount.id);
  const weeklyReport = generateClientWeeklyUpdate(SHOWCASE_ID);
  const monthlyReport = generateClientMonthlyReport(SHOWCASE_ID);

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <RealPortalReviewNotice className="mb-4" />
      {!canUseFixtureData && (
        <ClientOperationalCard title="Report status">
          <p>{reviewReport.clientVisibleMessage}</p>
          <p>
            Weekly update:{" "}
            <span className="text-foreground">
              {reviewReport.weeklyUpdateStatus.replaceAll("_", " ")}
            </span>
          </p>
          <p>
            Monthly report:{" "}
            <span className="text-foreground">
              {reviewReport.monthlyReportStatus.replaceAll("_", " ")}
            </span>
          </p>
        </ClientOperationalCard>
      )}

      <div className="mb-4">
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight"
          data-testid="header-reports"
        >
          Reports
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Weekly and monthly summaries. No live performance metrics are shown
          until they are available.
        </p>
        <DataSourceBadge source={source} message={dataSourceMessage} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          className="bg-card border-border"
          data-testid="weekly-reports-section"
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" /> Weekly Reports
              </CardTitle>
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/10 text-primary text-[10px]"
              >
                {weeklyReport.weekLabel}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Work completed
              </h3>
              <ReportList items={weeklyReport.completedWork.slice(0, 4)} />
            </section>
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Media used or posted
              </h3>
              <ReportList items={weeklyReport.contentProgress.slice(0, 3)} />
            </section>
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Scheduled or next
              </h3>
              <ReportList items={weeklyReport.nextWeekFocus.slice(0, 3)} />
            </section>
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                What Veroxa needs from you
              </h3>
              <ReportList items={weeklyReport.needsClientInput.slice(0, 3)} />
            </section>
            <section className="rounded-md border border-border bg-muted/20 p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Local visibility note
              </h3>
              <p className="text-sm text-muted-foreground">
                {weeklyReport.visibilityProgress[0]}
              </p>
            </section>
          </CardContent>
        </Card>

        <Card
          className="bg-card border-primary/20"
          data-testid="monthly-reports-section"
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Monthly Reports
              </CardTitle>
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/10 text-primary text-[10px]"
              >
                {monthlyReport.monthLabel}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Summary of improvements
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {monthlyReport.executiveSummary}
              </p>
            </section>
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Posts completed
              </h3>
              <ReportList items={monthlyReport.completedWork.slice(0, 4)} />
            </section>
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Top content
              </h3>
              <ReportList
                items={monthlyReport.mediaAndContentSummary.slice(0, 3)}
              />
            </section>
            <section className="rounded-md border border-border bg-muted/20 p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Google/local visibility progress
              </h3>
              <p className="text-sm text-muted-foreground">
                {monthlyReport.visibilityProgress.nextVisibilityAction}
              </p>
            </section>
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Next month focus
              </h3>
              <ReportList items={monthlyReport.nextMonthFocus.slice(0, 4)} />
            </section>
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Limitations / what still needs work
              </h3>
              <ReportList
                items={monthlyReport.pendingClientInput.slice(0, 3)}
              />
            </section>
          </CardContent>
        </Card>
      </div>

      <p className="mt-4 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1">
        <FileText className="w-3 h-3" /> Reports stay plain-language and only
        include available work.
      </p>
    </PortalLayout>
  );
}
