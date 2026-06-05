import type { ElementType } from "react";
import { Link } from "wouter";
import { Activity, CheckCircle2, FileText, Image, ListChecks, MessageSquare, ShieldCheck, UploadCloud } from "lucide-react";
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
import { buildClientSafeWeeklyUpdate, getFirstClientOperatingSnapshots } from "@/domain/firstClientOperatingSuite";
import { getClientOnboardingPreviewProfile, getClientOnboardingStatusLabel, getOnboardingProgress } from "@/domain/restaurantOnboarding";

const previewPrinciples = [
  "This preview shows how Veroxa organizes media, requests, updates, and reports.",
  "Real client data is not connected in this preview.",
  "Nothing goes live without Veroxa team review.",
];

export default function ClientDashboard() {
  const mode = useRealPortalDataMode();
  const { loading, pageState, dashboardSummary, mediaSummary, requestSummary, reportSummaries } = useClientSaasPortalState();
  const mediaHref = getClientPortalHref("media", mode.isPublicDemoRoute);
  const requestsHref = getClientPortalHref("requests", mode.isPublicDemoRoute);
  const reportsHref = getClientPortalHref("reports", mode.isPublicDemoRoute);
  const onboardingHref = getClientPortalHref("onboarding", mode.isPublicDemoRoute);
  const onboardingProfile = mode.isPublicDemoRoute ? getClientOnboardingPreviewProfile() : null;
  const onboardingProgress = onboardingProfile ? getOnboardingProgress(onboardingProfile) : 0;
  const clientSafeOpsPreview = buildClientSafeWeeklyUpdate(getFirstClientOperatingSnapshots()[0]);

  const dashboardTitle = mode.isPublicDemoRoute
    ? "Demo Preview — example restaurant workspace"
    : pageState.restaurant?.name ?? "Your restaurant";
  const dashboardDescription = mode.isPublicDemoRoute
    ? "This preview shows how Veroxa organizes media, requests, updates, and reports. Real client data is not connected in this preview."
    : "A calm workspace for Veroxa media, requests, updates, and reports. Nothing goes live without Veroxa team review.";

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <RealPortalReviewNotice />
      <PageHeader
        title={dashboardTitle}
        description={dashboardDescription}
        actions={<Link href={mediaHref}><Button><UploadCloud className="mr-2 h-4 w-4" />Media</Button></Link>}
        testId="header-client-dashboard"
      />

      {mode.isPublicDemoRoute ? (
        <Card className="mb-4 border-primary/25 bg-primary/5" data-testid="client-demo-preview-marker">
          <CardContent className="p-5 grid gap-4 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-foreground">Demo Preview — example restaurant workspace</p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Nothing goes live without Veroxa team review. Use this public
                preview to understand the client workflow, not as a live client
                account.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {previewPrinciples.map((principle) => (
                <div key={principle} className="rounded-lg border border-border/40 bg-background/50 p-3 text-xs text-muted-foreground leading-relaxed">
                  <CheckCircle2 className="mb-2 h-3.5 w-3.5 text-primary" />
                  {principle}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mb-4 border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold">{pageState.clientSafeMessage}</p>
            <p className="text-xs text-muted-foreground">{getClientPortalDataModeNotice(pageState)}</p>
          </div>
          <StatusBadge tone={getAccountActivationBadgeTone(pageState.accountActivation)}>{pageState.accountActivation.clientVisibleStatus}</StatusBadge>
        </CardContent>
      </Card>


      <Card className="mb-4 border-primary/20 bg-background/70">
        <CardContent className="grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-sm font-semibold text-foreground">Restaurant onboarding</p>
            {onboardingProfile ? (
              <p className="mt-1 text-xs text-muted-foreground">{getClientOnboardingStatusLabel(onboardingProfile)} · {onboardingProgress}% setup progress · {onboardingProfile.nextClientAction}</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">Restaurant onboarding is being prepared. Your setup checklist, expectation acknowledgement, weekly update status, and monthly report setup will appear here once Veroxa activates your account.</p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">Nothing goes live without Veroxa team review.</p>
          </div>
          <Link href={onboardingHref}><Button variant="outline" size="sm">View onboarding</Button></Link>
        </CardContent>
      </Card>

      {!pageState.isDemoData && !pageState.canShowRealData ? (
        <SafePortalEmptyCard title="Account setup in review" body="Your account setup will appear here once your restaurant portal is active. Reports appear after Veroxa reviews and publishes verified updates. Upload and review features are not live yet." />
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] mb-4" data-testid="client-demo-first-screen">
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" />What Veroxa is doing</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{dashboardSummary.onlinePresenceProgress}</p>
            <p>
              Veroxa keeps online-presence work organized around reviewed media,
              clear requests, updates, and reports. Public actions stay in
              review until the Veroxa team is ready.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ListChecks className="h-4 w-4 text-primary" />What Veroxa needs from you</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p><strong className="text-foreground">Next thing Veroxa needs:</strong> {dashboardSummary.nextClientAction}</p>
            <div className="grid gap-2 sm:grid-cols-3">
              <Link href={mediaHref} className="rounded-lg border border-border p-3 hover:bg-muted/30">Send or review media</Link>
              <Link href={requestsHref} className="rounded-lg border border-border p-3 hover:bg-muted/30">Share a request</Link>
              <Link href={reportsHref} className="rounded-lg border border-border p-3 hover:bg-muted/30">View reports</Link>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3 mb-4">
        <SnapshotCard icon={Image} label="Media needed" value={mediaSummary.total} helper={`${mediaSummary.usable} useful · ${mediaSummary.needsBetterMedia} needs clearer media`} />
        <SnapshotCard icon={MessageSquare} label="Request status" value={requestSummary.total} helper={`${requestSummary.open} in review · ${requestSummary.needsClientConfirmation} need input`} />
        <SnapshotCard icon={FileText} label="Reports and updates" value={reportSummaries.length} helper="Weekly update status and monthly report status appear after Veroxa review" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <SnapshotCard icon={ListChecks} label="Workspace status" value={loading ? "Loading" : dashboardSummary.accountStatus} helper={getClientPortalReadinessSummary(pageState)} />
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-primary" />Activity preview</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {pageState.activityPreview.length > 0 ? pageState.activityPreview.map((log) => (
              <div key={log.id} className="rounded-lg border border-border p-3 text-xs">
                <p className="font-medium text-foreground">{log.summary}</p>
                <p className="mt-1 text-muted-foreground">Preview item only — real client activity is not connected.</p>
              </div>
            )) : <p className="text-sm text-muted-foreground">Client-safe activity appears only when Veroxa has a preview item or reviewed account updates.</p>}
          </CardContent>
        </Card>
      </section>
    </PortalLayout>
  );
}

function SnapshotCard({ icon: Icon, label, value, helper }: { icon: ElementType; label: string; value: string | number; helper: string }) {
  return <Card><CardContent className="p-4"><Icon className="mb-3 h-4 w-4 text-primary" /><p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{helper}</p></CardContent></Card>;
}
