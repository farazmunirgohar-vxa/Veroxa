import { Link } from "wouter";
import { ArrowRight, Camera, CheckCircle2, ClipboardList, Globe, MessageSquare, ShieldCheck } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { RealPortalReviewNotice, SafePortalEmptyCard } from "@/components/RealPortalSafeStates";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { getClientPortalHref } from "@/lib/clientPortalRoutes";
import {
  buildBusinessTruthConfirmationDraft,
  buildFirstWeekExpectationDraft,
  buildMissingInfoRequestDraft,
  buildOnboardingReadinessSnapshot,
  buildWelcomeMessageDraft,
  getBusinessInfoChecklist,
  getBusinessTruthItemsToConfirm,
  getClientOnboardingPreviewProfile,
  getClientOnboardingStatusLabel,
  getMediaIntakeChecklist,
  getMediaQualityGuidance,
  getMediaRequestDraft,
  getMissingBusinessInfo,
  getMissingPlatformLinks,
  getNextMediaNeeded,
  getOnboardingProgress,
  getPlatformProfileChecklist,
  getProofInputStatus,
} from "@/domain/restaurantOnboarding";

function ChecklistPreview({ title, items }: { title: string; items: { id: string; label: string; clientLabel: string }[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.slice(0, 6).map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/70 p-3 text-sm">
            <span>{item.label}</span>
            <span className="text-xs text-muted-foreground">{item.clientLabel}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DraftCard({ title, body }: { title: string; body: string }) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><MessageSquare className="h-4 w-4 text-primary" />{title}</CardTitle></CardHeader>
      <CardContent><p className="text-sm leading-relaxed text-muted-foreground">{body}</p><p className="mt-3 text-xs text-muted-foreground">Draft preview only. Copy manually if useful; this page does not send messages.</p></CardContent>
    </Card>
  );
}

export default function ClientOnboarding() {
  const mode = useRealPortalDataMode();
  const profile = mode.isPublicDemoRoute ? getClientOnboardingPreviewProfile() : null;
  const progress = profile ? getOnboardingProgress(profile) : 0;
  const readiness = profile ? buildOnboardingReadinessSnapshot(profile) : null;
  const missingInfo = profile ? getMissingBusinessInfo(profile) : [];
  const missingLinks = profile ? getMissingPlatformLinks(profile) : [];
  const missingMedia = profile ? getNextMediaNeeded(profile) : [];
  const truthItems = profile ? getBusinessTruthItemsToConfirm(profile) : [];
  const dashboardHref = getClientPortalHref("dashboard", mode.isPublicDemoRoute);

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <RealPortalReviewNotice />
      <PageHeader
        title="Restaurant Onboarding"
        description="A simple setup checklist so Veroxa can organize your online presence correctly."
        actions={<Link href={dashboardHref}><Button variant="outline">Back to dashboard</Button></Link>}
        testId="header-client-onboarding"
      />


      {!profile || !readiness ? (
        <div className="space-y-4">
          <SafePortalEmptyCard
            title="Restaurant onboarding is being prepared"
            body="Your setup checklist will appear here once Veroxa activates your account. Real client onboarding data is not connected in this preview. Nothing goes live without Veroxa team review."
            testId="empty-client-onboarding-safe-state"
          />
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">What happens next</p>
              <p className="mt-2">Veroxa will organize business details, platform links, media needs, and confirmation items after the account is activated. This real route stays useful without showing benchmark onboarding data as your restaurant.</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
      <Card className="mb-5 border-primary/25 bg-primary/5">
        <CardContent className="grid gap-4 p-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-foreground">{mode.isPublicDemoRoute ? "Demo Preview — example restaurant workspace" : "Real client data is not connected in this preview"}</p>
            <p className="mt-1 text-sm text-muted-foreground">Nothing goes live without Veroxa team review. This page shows setup status, what Veroxa needs from you, and what Veroxa will organize during the first week.</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 p-4">
            <div className="flex items-center justify-between text-sm"><span className="font-medium">Setup progress</span><StatusBadge tone={progress >= 80 ? "success" : "warning"}>{getClientOnboardingStatusLabel(profile)}</StatusBadge></div>
            <Progress value={progress} className="mt-3" />
            <p className="mt-2 text-xs text-muted-foreground">{readiness.statusLabel}</p>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-5">
        {[
          ["Business info", readiness.businessInfo.level],
          ["Platform links", readiness.platforms.level],
          ["Media", readiness.media.level],
          ["Details to confirm", readiness.businessTruth.level],
          ["First-week setup", readiness.firstWeek.level],
        ].map(([label, level]) => (
          <Card key={label}><CardContent className="p-4"><CheckCircle2 className={`mb-3 h-5 w-5 ${level === "ready" ? "text-emerald-400" : "text-amber-400"}`} /><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{level === "ready" ? "Ready" : "Needs attention"}</p></CardContent></Card>
        ))}
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ClipboardList className="h-4 w-4 text-primary" />What Veroxa needs from you</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              ["Missing info", missingInfo],
              ["Missing media", missingMedia],
              ["Missing links", missingLinks],
              ["Details to confirm", truthItems],
            ].map(([label, values]) => (
              <div key={label as string} className="rounded-lg border border-border/70 p-3">
                <p className="font-medium text-foreground">{label as string}</p>
                <p className="mt-1 text-muted-foreground">{(values as string[]).length ? (values as string[]).join(", ") : "Nothing urgent right now."}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Camera className="h-4 w-4 text-primary" />Media guidance</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Please send 5–10 clear food photos of your best-selling items. Natural light and close-up angles usually work best.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {getMediaQualityGuidance(profile).map((item) => <div key={item} className="rounded-lg border border-border/70 p-3">{item}</div>)}
            </div>
            <p className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs">Short videos are helpful for Growth/Premium preview paths. Veroxa is not requesting a real upload here; this is setup guidance only.</p>
          </CardContent>
        </Card>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-3">
        <ChecklistPreview title="Business info" items={getBusinessInfoChecklist(profile)} />
        <ChecklistPreview title="Platform links" items={getPlatformProfileChecklist(profile)} />
        <ChecklistPreview title="Media" items={getMediaIntakeChecklist(profile)} />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <DraftCard title="Welcome draft" body={buildWelcomeMessageDraft(profile)} />
        <DraftCard title="Media request draft" body={getMediaRequestDraft(profile)} />
        <DraftCard title="Missing info draft" body={buildMissingInfoRequestDraft(profile)} />
        <DraftCard title="Details confirmation draft" body={buildBusinessTruthConfirmationDraft(profile)} />
      </section>

      <Card className="mt-5">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4 text-primary" />First-week expectation</CardTitle></CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <p className="text-sm leading-relaxed text-muted-foreground">{buildFirstWeekExpectationDraft(profile)}</p>
          <div className="rounded-xl border border-border/70 p-4 text-sm text-muted-foreground"><Globe className="mb-2 h-4 w-4 text-primary" />{getProofInputStatus(profile)} Veroxa uses these details to understand what online actions matter most to your restaurant.</div>
        </CardContent>
      </Card>

      <div className="mt-5 flex justify-end"><Link href={dashboardHref}><Button>Return to dashboard <ArrowRight className="ml-2 h-4 w-4" /></Button></Link></div>
        </>
      )}
    </PortalLayout>
  );
}
