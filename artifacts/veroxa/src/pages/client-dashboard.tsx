import type { ElementType } from "react";
import { Link } from "wouter";
import { CalendarCheck, FileText, Image, ListChecks, MessageSquare, ShieldCheck, UploadCloud } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { RealPortalReviewNotice, SafePortalEmptyCard } from "@/components/RealPortalSafeStates";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { getClientPortalHref } from "@/lib/clientPortalRoutes";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { useClientSaasPortalState } from "@/hooks/useClientSaasPortalState";
import { getAccountActivationBadgeTone } from "@/domain/saas/accountActivation";
import { getClientPortalDataModeNotice } from "@/domain/saas/clientPortalState";

const reviewPromise = "Nothing goes live without Veroxa team review.";

export default function ClientDashboard() {
  const mode = useRealPortalDataMode();
  const { pageState, dashboardSummary, mediaSummary, requestSummary, updateSummaries, reportSummaries } = useClientSaasPortalState();
  const mediaHref = getClientPortalHref("media", mode.isPublicDemoRoute);
  const requestsHref = getClientPortalHref("requests", mode.isPublicDemoRoute);
  const reportsHref = getClientPortalHref("reports", mode.isPublicDemoRoute);
  const updatesHref = getClientPortalHref("updates", mode.isPublicDemoRoute);
  const onboardingHref = getClientPortalHref("onboarding", mode.isPublicDemoRoute);
  const isSetupState = !pageState.isDemoData && !pageState.canShowRealData;

  const dashboardTitle = pageState.isDemoData
    ? "Demo Preview — example restaurant workspace"
    : pageState.restaurant?.name ?? "Your Veroxa workspace";
  const dashboardDescription = pageState.isDemoData
    ? "Sample data shows how Veroxa organizes setup, media, requests, weekly updates, and monthly reports. It is not a live client account."
    : "A calm workspace for setup, media, requests, weekly updates, and monthly reports. Nothing goes live without Veroxa team review.";

  const setupStatus = pageState.isDemoData
    ? "Sample account for review"
    : pageState.canShowRealData
      ? dashboardSummary.accountStatus
      : "Account setup is being prepared";
  const nextThing = pageState.isDemoData
    ? dashboardSummary.nextClientAction
    : pageState.canShowRealData
      ? dashboardSummary.nextClientAction
      : "Veroxa is preparing your portal. No action is needed until Veroxa asks for media, access, or a confirmed business detail.";
  const weeklyStatus = updateSummaries.length > 0
    ? "Update ready for review"
    : isSetupState
      ? "Preparing first update"
      : "No update ready yet";
  const monthlyStatus = reportSummaries.some((report) => report.reportType === "monthly")
    ? "Report ready for review"
    : isSetupState
      ? "Preparing first report"
      : "No report ready yet";

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <RealPortalReviewNotice />
      <PageHeader
        title={dashboardTitle}
        description={dashboardDescription}
        actions={<Link href={mediaHref}><Button><UploadCloud className="mr-2 h-4 w-4" />Media</Button></Link>}
        testId="header-client-dashboard"
      />

      <Card className="mb-4 border-primary/20 bg-primary/5" data-testid="client-dashboard-account-state">
        <CardContent className="p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold">{setupStatus}</p>
            <p className="text-xs text-muted-foreground">{getClientPortalDataModeNotice(pageState)} {reviewPromise}</p>
          </div>
          <StatusBadge tone={getAccountActivationBadgeTone(pageState.accountActivation)}>{pageState.accountActivation.clientVisibleStatus}</StatusBadge>
        </CardContent>
      </Card>

      {isSetupState ? (
        <SafePortalEmptyCard title="Veroxa is preparing your restaurant workspace" body="Veroxa is preparing your restaurant workspace. This preview is waiting for Veroxa setup review, so no sample progress is presented as your restaurant work." icon="info" />
      ) : null}

      <section className="mb-4 grid gap-4 md:grid-cols-4">
        <Metric icon={ListChecks} label="Setup review" value={setupStatus} />
        <Metric icon={Image} label="Media guidance" value={mediaSummary.total > 0 ? `${mediaSummary.usable} ready for review` : "Waiting for media — Veroxa will guide what to send next"} />
        <Metric icon={MessageSquare} label="Portal requests" value={requestSummary.total > 0 ? `${requestSummary.open} open` : "No requests yet"} />
        <Metric icon={FileText} label="Monthly report status" value={monthlyStatus} />
      </section>

      <section className="mb-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card data-testid="client-dashboard-next-action">
          <CardHeader><CardTitle className="text-sm">Next thing Veroxa needs</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p className="text-base font-semibold text-foreground">{nextThing}</p>
            <p>{reviewPromise}</p>
            <div className="flex flex-wrap gap-2">
              <Link href={onboardingHref}><Button variant="outline" size="sm">Onboarding</Button></Link>
              <Link href={requestsHref}><Button variant="outline" size="sm">Requests</Button></Link>
              <Link href={updatesHref}><Button variant="outline" size="sm">Weekly update</Button></Link>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="client-dashboard-weekly-monthly">
          <CardHeader><CardTitle className="text-sm">Weekly update + monthly report readiness</CardTitle></CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <StatusCard icon={CalendarCheck} title="Weekly update readiness" body={weeklyStatus} />
            <StatusCard icon={FileText} title="Monthly report readiness" body={monthlyStatus} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatusCard icon={ListChecks} title="Onboarding review" body={pageState.accountActivation.clientVisibleStatus} />
        <StatusCard icon={Image} title="Media guidance" body={mediaSummary.uploadReadinessNotice} />
        <StatusCard icon={MessageSquare} title="Portal requests" body={requestSummary.nextAction} />
        <StatusCard icon={ShieldCheck} title="Review promise" body={reviewPromise} />
      </section>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={reportsHref}><Button variant="outline" size="sm">Monthly reports</Button></Link>
        <Link href={requestsHref}><Button variant="outline" size="sm">Portal requests</Button></Link>
      </div>
    </PortalLayout>
  );
}

function Metric({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
  return <Card><CardContent className="p-4"><Icon className="mb-2 h-4 w-4 text-primary" /><p className="text-xs text-muted-foreground">{label}</p><p className="text-lg font-semibold leading-tight">{value}</p></CardContent></Card>;
}

function StatusCard({ icon: Icon, title, body }: { icon: ElementType; title: string; body: string }) {
  return <div className="rounded-lg border border-border/70 p-3"><Icon className="mb-2 h-4 w-4 text-primary" /><p className="text-sm font-medium text-foreground">{title}</p><p className="mt-1 text-xs text-muted-foreground">{body}</p></div>;
}
