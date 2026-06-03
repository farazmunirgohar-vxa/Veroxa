import type { ElementType } from "react";
import { Link } from "wouter";
import { Activity, FileText, Image, ListChecks, MessageSquare, UploadCloud } from "lucide-react";
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

export default function ClientDashboard() {
  const mode = useRealPortalDataMode();
  const { loading, pageState, dashboardSummary, mediaSummary, requestSummary, reportSummaries } = useClientSaasPortalState();
  const mediaHref = getClientPortalHref("media", mode.isPublicDemoRoute);
  const requestsHref = getClientPortalHref("requests", mode.isPublicDemoRoute);
  const reportsHref = getClientPortalHref("reports", mode.isPublicDemoRoute);

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <RealPortalReviewNotice />
      <PageHeader
        title={pageState.restaurant?.name ?? "Your restaurant"}
        description="A calm workspace for Veroxa media, requests, updates, and reports. Nothing goes live without Veroxa team review."
        actions={<Link href={mediaHref}><Button><UploadCloud className="mr-2 h-4 w-4" />Media</Button></Link>}
        testId="header-client-dashboard"
      />

      <Card className="mb-4 border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold">{pageState.clientSafeMessage}</p>
            <p className="text-xs text-muted-foreground">{getClientPortalDataModeNotice(pageState)}</p>
          </div>
          <StatusBadge tone={getAccountActivationBadgeTone(pageState.accountActivation)}>{pageState.accountActivation.clientVisibleStatus}</StatusBadge>
        </CardContent>
      </Card>

      {!pageState.isDemoData && !pageState.canShowRealData ? (
        <SafePortalEmptyCard title="Account setup in review" body="Your account setup will appear here once your restaurant portal is active. Reports appear after Veroxa reviews and publishes verified updates. Upload and review features are not live yet." />
      ) : null}

      <section className="grid gap-4 md:grid-cols-4 mb-4">
        <SnapshotCard icon={ListChecks} label="Account" value={loading ? "Loading" : dashboardSummary.accountStatus} helper={getClientPortalReadinessSummary(pageState)} />
        <SnapshotCard icon={Image} label="Media supply" value={mediaSummary.total} helper={`${mediaSummary.usable} useful · ${mediaSummary.needsBetterMedia} needs better media`} />
        <SnapshotCard icon={MessageSquare} label="Requests" value={requestSummary.total} helper={`${requestSummary.open} in review · ${requestSummary.needsClientConfirmation} need input`} />
        <SnapshotCard icon={FileText} label="Reports" value={reportSummaries.length} helper="Published or prepared by Veroxa review" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader><CardTitle className="text-sm">Online presence progress</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{dashboardSummary.onlinePresenceProgress}</p>
            <p><strong className="text-foreground">Next thing Veroxa needs:</strong> {dashboardSummary.nextClientAction}</p>
            <div className="grid gap-2 md:grid-cols-3">
              <Link href={mediaHref} className="rounded-lg border border-border p-3 hover:bg-muted/30">Send or review media</Link>
              <Link href={requestsHref} className="rounded-lg border border-border p-3 hover:bg-muted/30">Share a request</Link>
              <Link href={reportsHref} className="rounded-lg border border-border p-3 hover:bg-muted/30">View reports</Link>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-primary" />Activity preview</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {pageState.activityPreview.length > 0 ? pageState.activityPreview.map((log) => (
              <div key={log.id} className="rounded-lg border border-border p-3 text-xs">
                <p className="font-medium text-foreground">{log.summary}</p>
                <p className="mt-1 text-muted-foreground">This preview uses sample data.</p>
              </div>
            )) : <p className="text-sm text-muted-foreground">Client-safe activity appears only when Veroxa has a sample preview or reviewed account updates.</p>}
          </CardContent>
        </Card>
      </section>
    </PortalLayout>
  );
}

function SnapshotCard({ icon: Icon, label, value, helper }: { icon: ElementType; label: string; value: string | number; helper: string }) {
  return <Card><CardContent className="p-4"><Icon className="mb-3 h-4 w-4 text-primary" /><p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{helper}</p></CardContent></Card>;
}
