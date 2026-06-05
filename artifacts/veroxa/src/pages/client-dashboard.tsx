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
import { getClientPortalDataModeNotice, getClientPortalReadinessSummary } from "@/domain/saas/clientPortalState";
import { buildClientReadinessSnapshot, getClientReadinessSummaryCards } from "@/domain/clientReadiness";
import { buildClientWeeklyUpdatePreview } from "@/domain/weeklyUpdates";
import { buildClientMonthlyReportPreview } from "@/domain/monthlyReports";

const icons: Record<string, ElementType> = {
  onboarding: ListChecks,
  media_supply: Image,
  request_channel: MessageSquare,
  weekly_updates: CalendarCheck,
  monthly_reports: FileText,
  website_alignment: ShieldCheck,
  google_maps_local_visibility: ShieldCheck,
  facebook_instagram_content: Image,
  add_ons: ListChecks,
  missing_confirmations: ShieldCheck,
  account_activation_state: ShieldCheck,
};

export default function ClientDashboard() {
  const mode = useRealPortalDataMode();
  const { pageState, mediaSummary, requestSummary, reportSummaries } = useClientSaasPortalState();
  const mediaHref = getClientPortalHref("media", mode.isPublicDemoRoute);
  const requestsHref = getClientPortalHref("requests", mode.isPublicDemoRoute);
  const reportsHref = getClientPortalHref("reports", mode.isPublicDemoRoute);
  const updatesHref = getClientPortalHref("updates", mode.isPublicDemoRoute);
  const onboardingHref = getClientPortalHref("onboarding", mode.isPublicDemoRoute);
  const readiness = buildClientReadinessSnapshot({ restaurantName: pageState.restaurant?.name ?? "Your restaurant" });
  const readinessCards = getClientReadinessSummaryCards(readiness);
  const weekly = buildClientWeeklyUpdatePreview();
  const monthly = buildClientMonthlyReportPreview();

  const dashboardTitle = mode.isPublicDemoRoute ? "Demo Preview — example restaurant workspace" : pageState.restaurant?.name ?? "Your restaurant";
  const dashboardDescription = mode.isPublicDemoRoute
    ? "This preview shows how Veroxa organizes media, requests, weekly updates, and monthly reports. It is not a live client account."
    : "A calm workspace for setup, media, requests, weekly updates, and monthly reports. Nothing goes live without Veroxa team review.";

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <RealPortalReviewNotice />
      <PageHeader
        title={dashboardTitle}
        description={dashboardDescription}
        actions={<Link href={mediaHref}><Button><UploadCloud className="mr-2 h-4 w-4" />Media</Button></Link>}
        testId="header-client-dashboard"
      />

      <Card className="mb-4 border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold">{readiness.clientSafeMessage}</p>
            <p className="text-xs text-muted-foreground">{getClientPortalDataModeNotice(pageState)}</p>
          </div>
          <StatusBadge tone={getAccountActivationBadgeTone(pageState.accountActivation)}>{pageState.accountActivation.clientVisibleStatus}</StatusBadge>
        </CardContent>
      </Card>

      {!pageState.isDemoData && !pageState.canShowRealData ? (
        <SafePortalEmptyCard title="Client portal setup state" body="Veroxa is preparing your workspace. Real restaurant data is not connected here yet, so this page only shows safe setup guidance and next steps." icon="info" />
      ) : null}

      <section className="mb-4 grid gap-4 md:grid-cols-4">
        <Metric icon={ListChecks} label="Setup readiness" value={readiness.scoreLabel} />
        <Metric icon={Image} label="Media status" value={mediaSummary.needsBetterMedia > 0 ? "Needs clearer photos" : "Ready for review"} />
        <Metric icon={MessageSquare} label="Requests" value={`${requestSummary.open} open`} />
        <Metric icon={FileText} label="Reports" value={reportSummaries.length > 0 ? "Preview ready" : "Baseline setup"} />
      </section>

      <section className="mb-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card data-testid="client-readiness-next-action">
          <CardHeader><CardTitle className="text-sm">Next thing Veroxa needs</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p className="text-base font-semibold text-foreground">{readiness.nextAction}</p>
            <p>{readiness.reviewNotice}</p>
            <div className="flex flex-wrap gap-2">
              <Link href={onboardingHref}><Button variant="outline" size="sm">Onboarding</Button></Link>
              <Link href={requestsHref}><Button variant="outline" size="sm">Requests</Button></Link>
              <Link href={updatesHref}><Button variant="outline" size="sm">Weekly update</Button></Link>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="client-dashboard-weekly-monthly">
          <CardHeader><CardTitle className="text-sm">Weekly update + monthly report</CardTitle></CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <div className="rounded-lg border border-border p-3">
              <p className="font-medium text-foreground">{weekly.readiness.label}</p>
              <p className="mt-1">{weekly.readiness.nextAction}</p>
              <Link href={updatesHref} className="mt-2 inline-block text-xs text-primary">View updates</Link>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="font-medium text-foreground">{monthly.readiness.label}</p>
              <p className="mt-1">{monthly.readiness.nextAction}</p>
              <Link href={reportsHref} className="mt-2 inline-block text-xs text-primary">View reports</Link>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {readinessCards.map((card) => {
          const Icon = icons[card.id] ?? ShieldCheck;
          return (
            <Card key={card.id} className="border-border/60">
              <CardContent className="p-4">
                <Icon className="mb-3 h-4 w-4 text-primary" />
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{card.title}</p>
                  <StatusBadge tone={card.tone === "needs_input" || card.tone === "waiting" ? "warning" : card.tone === "ready" ? "success" : "neutral"}>{card.status}</StatusBadge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{card.body}</p>
                <p className="mt-2 text-xs text-primary">Next: {card.nextAction}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card className="mt-4 border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="p-4 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Review promise</p>
          <p className="mt-1">Nothing goes live without Veroxa team review. Portal response within 24 hours means review, answer, or next step — not guaranteed completion.</p>
          <p className="mt-1">{getClientPortalReadinessSummary(pageState)}</p>
        </CardContent>
      </Card>
    </PortalLayout>
  );
}

function Metric({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
  return <Card><CardContent className="p-4"><Icon className="mb-2 h-4 w-4 text-primary" /><p className="text-xs text-muted-foreground">{label}</p><p className="text-lg font-semibold">{value}</p></CardContent></Card>;
}
