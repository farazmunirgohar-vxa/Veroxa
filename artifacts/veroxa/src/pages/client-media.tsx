// Guardrail marker: No file storage is connected yet.
import type { ElementType } from "react";
import { Camera, CheckCircle2, Image, Info, UploadCloud } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { RealPortalReviewNotice, SafePortalEmptyCard } from "@/components/RealPortalSafeStates";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientSaasPortalState } from "@/hooks/useClientSaasPortalState";
import { ClientMediaTracker } from "@/components/client/ClientMediaTracker";
import { getClientSafeEmptyStateForPage, getClientPortalDataModeNotice } from "@/domain/saas/clientPortalState";
import { buildClientSafeMediaSummary, getNextBestMediaRequest, mediaIntelligenceSeedData } from "@/domain/mediaIntelligence";

export default function ClientMedia() {
  const { pageState, mediaSummary } = useClientSaasPortalState();
  const media = pageState.mediaAssets;
  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <RealPortalReviewNotice />
      <PageHeader title="Media" description="Review what Veroxa can use and what still needs clearer photos or videos. For now, Veroxa team review handles media setup manually." testId="header-client-media" />
      <Card className="mb-4 border-primary/20 bg-primary/5"><CardContent className="p-4 text-sm"><p className="font-medium">{mediaSummary.uploadReadinessNotice}</p><p className="mt-1 text-xs text-muted-foreground">{getClientPortalDataModeNotice(pageState)}</p></CardContent></Card>
      {!pageState.isDemoData && !pageState.canShowRealData ? <SafePortalEmptyCard title="Media setup state" body={getClientSafeEmptyStateForPage("media", pageState)} icon="info" /> : null}
      <section className="grid gap-4 md:grid-cols-4 mb-4">
        <Metric icon={Image} label="Total media" value={mediaSummary.total} />
        <Metric icon={CheckCircle2} label="Useful for review" value={mediaSummary.usable} />
        <Metric icon={Camera} label="Needs better media" value={mediaSummary.needsBetterMedia} />
        <Metric icon={UploadCloud} label="Used already" value={mediaSummary.used} />
      </section>
      <Card className="mb-4 border-sky-500/20 bg-sky-500/5" data-testid="client-safe-media-intelligence">
        <CardHeader><CardTitle className="text-sm">What media is easiest to use</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>{buildClientSafeMediaSummary(mediaIntelligenceSeedData)}</p>
          <p>{getNextBestMediaRequest(mediaIntelligenceSeedData)}</p>
          <p className="text-xs">Short food-prep videos are useful if your plan includes video support. Nothing is processed automatically here.</p>
        </CardContent>
      </Card>
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card data-testid="card-media-detail"><CardHeader><CardTitle className="text-sm">Media list</CardTitle></CardHeader><CardContent className="space-y-3">{media.length > 0 ? media.map((asset) => <div key={asset.id} className="rounded-lg border border-border p-3"><p className="font-medium">{asset.displayName}</p><p className="mt-1 text-xs text-muted-foreground">{asset.bestUse ?? "Veroxa team review"}</p><p className="mt-1 text-xs text-primary">{asset.status.replaceAll("_", " ")}</p><ClientMediaTracker status={asset.status === "usable" ? "Ready" : asset.status === "prepared_for_post" ? "Scheduled" : asset.status === "needs_better_media" ? "Needs better media" : "Waiting for direction"} /></div>) : <p className="text-sm text-muted-foreground">Once your account is active, your restaurant media will appear here.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><Info className="h-4 w-4 text-primary" />What Veroxa needs</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-muted-foreground"><p>Clear food photos, short videos, storefront or dining-room photos, and any timely event media.</p><p>Please confirm business-truth changes before Veroxa prepares public-facing updates.</p><p>For now, this page shows either sample data or a safe setup state.</p>{pageState.activityPreview.map((log) => <p key={log.id} className="rounded-lg border border-border p-2 text-xs">{log.summary}</p>)}</CardContent></Card>
      </section>
    </PortalLayout>
  );
}
function Metric({ icon: Icon, label, value }: { icon: ElementType; label: string; value: number }) { return <Card><CardContent className="p-4"><Icon className="mb-2 h-4 w-4 text-primary" /><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-semibold">{value}</p></CardContent></Card>; }

// Media lifecycle guardrail markers: buildClientSubmissionKey duplicate-skipped.
