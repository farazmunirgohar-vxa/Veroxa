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
      <PageHeader title="Media" description="Review what Veroxa can use, what needs clearer photos, and what to send next. Picture-based content is active; video/TikTok/Reels are coming soon." testId="header-client-media" />
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
          <p className="text-xs">Picture-based content is active for Facebook, Instagram, and Google updates. Video/TikTok/Reels readiness is coming soon and saved for later review. For now, Veroxa will tell you how to send media for review.</p>
        </CardContent>
      </Card>
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card data-testid="card-media-detail"><CardHeader><CardTitle className="text-sm">Media list</CardTitle></CardHeader><CardContent className="space-y-3">{media.length > 0 ? media.map((asset) => <div key={asset.id} className="rounded-lg border border-border p-3"><p className="font-medium">{asset.displayName}</p><p className="mt-1 text-xs text-muted-foreground">{asset.bestUse ?? "Veroxa team review"}</p><p className="mt-1 text-xs text-primary">{formatClientMediaReviewLabel(asset.status)}</p><ClientMediaTracker status={asset.status === "usable" ? "Ready" : asset.status === "prepared_for_post" ? "Saved for later" : asset.status === "needs_better_media" ? "Needs better media" : "Waiting for direction"} /></div>) : <p className="text-sm text-muted-foreground">Once your account is active, reviewed restaurant media guidance will appear here.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><Info className="h-4 w-4 text-primary" />What Veroxa needs</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-muted-foreground"><p>Clear food photos, best-seller photos, storefront or dining-room photos, and timely event media. More best-seller photos are usually the most useful next step.</p><p>Please confirm business-truth changes before Veroxa prepares public-facing updates.</p><p>Media sending instructions will appear after setup review, and Veroxa will confirm what to send next.</p>{pageState.activityPreview.map((log) => <p key={log.id} className="rounded-lg border border-border p-2 text-xs">{log.summary}</p>)}</CardContent></Card>
      </section>
    </PortalLayout>
  );
}
function Metric({ icon: Icon, label, value }: { icon: ElementType; label: string; value: number }) { return <Card><CardContent className="p-4"><Icon className="mb-2 h-4 w-4 text-primary" /><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-semibold">{value}</p></CardContent></Card>; }

// Media lifecycle guardrail markers: buildClientSubmissionKey duplicate-skipped.

function formatClientMediaReviewLabel(status: string): string {
  if (status === "usable") return "Ready for Veroxa review";
  if (status === "prepared_for_post") return "Saved for later";
  if (status === "needs_better_media") return "Needs clearer photo";
  return "Needs business confirmation";
}
