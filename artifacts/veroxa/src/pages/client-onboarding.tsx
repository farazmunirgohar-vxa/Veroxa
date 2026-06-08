import { Link } from "wouter";
import { ArrowRight, Camera, CheckCircle2, ClipboardList, Globe, MessageSquare, ShieldCheck } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { RealPortalReviewNotice, SafePortalEmptyCard } from "@/components/RealPortalSafeStates";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { PageHeader, StatusBadge } from "@/components/common";
import type { StatusBadgeTone } from "@/components/common";
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
  getMomoHouseAuditPrefillSections,
  getMissingBusinessInfo,
  getMissingPlatformLinks,
  getNextMediaNeeded,
  getOnboardingProgress,
  getPlatformProfileChecklist,
  getProofInputStatus,
} from "@/domain/restaurantOnboarding";
import type { AuditPrefillFieldStatus } from "@/domain/restaurantOnboarding";

function ChecklistSection({ title, items }: { title: string; items: { id: string; label: string; clientLabel: string }[] }) {
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

const expectationNotHandled = [
  "customer-service replies",
  "comments",
  "DMs",
  "inboxes",
  "refunds",
  "complaints",
  "order questions",
  "full custom website development",
  "hosting/domain/email troubleshooting",
  "Yelp/TikTok/Reels/Ads yet",
  "guaranteed orders, revenue, rankings, profit, ROI, or growth",
];

const expectationResponsibilities = [
  "providing usable media",
  "confirming business info",
  "confirming hours/menu/prices",
  "confirming existing offer/promotion details if you want Veroxa to present them",
  "providing access when needed",
  "handling customer conversations",
  "understanding that 24-hour response means review/answer/next step, not guaranteed completion",
];

function ExpectationAgreement() {
  return (
    <Card className="border-primary/20 bg-primary/5" data-testid="onboarding-expectation-acknowledgement">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Setup expectations
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm text-muted-foreground lg:grid-cols-2">
        <div className="lg:col-span-2 rounded-lg border border-border/70 bg-background/70 p-3">
          <p className="font-medium text-foreground">Complete Online Presence — $495/month</p>
          <p className="mt-1">Veroxa helps manage the online presence channel customers already use to find, call, visit, order from, and trust the restaurant: Google, Maps/local visibility, website alignment if access is provided, Facebook, Instagram, weekly updates, monthly reports, and portal request review.</p>
        </div>
        <div>
          <p className="font-medium text-foreground">I understand Veroxa does not handle:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {expectationNotHandled.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div>
          <p className="font-medium text-foreground">I agree the restaurant is responsible for:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {expectationResponsibilities.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div>
          <p className="font-medium text-foreground">What the restaurant must confirm</p>
          <ul className="mt-2 list-disc space-y-1 pl-5"><li>hours, holiday hours, address, phone, menu items, menu prices if mentioned, existing offer details, catering availability, dietary/health claims, order links, and reservation links</li><li>Please confirm the exact details before Veroxa prepares anything public.</li></ul>
        </div>
        <div>
          <p className="font-medium text-foreground">Add-ons and coming soon</p>
          <ul className="mt-2 list-disc space-y-1 pl-5"><li>New basic website +$95</li><li>Missing Facebook or Instagram profile creation +$45/profile</li><li>Yelp, TikTok, Reels/video content, ads management, daily posting, automated publishing, and live integrations are coming soon.</li></ul>
        </div>
        <p className="lg:col-span-2 rounded-lg border border-border/70 bg-background/70 p-3 text-xs">
          Manual pilot note: this does not create a legal onboarding signature, connect live platform access, or send anything automatically. Nothing goes live without Veroxa team review. I understand 24-hour response means review/answer/next step, not guaranteed completion. Weekly updates are included so Veroxa can summarize what was worked on, what was posted/prepared, what is pending, what media is needed, what you need to confirm, and what is next.
        </p>
      </CardContent>
    </Card>
  );
}

function OwnerMessageCard({ title, body }: { title: string; body: string }) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><MessageSquare className="h-4 w-4 text-primary" />{title}</CardTitle></CardHeader>
      <CardContent><p className="text-sm leading-relaxed text-muted-foreground">{body}</p><p className="mt-3 text-xs text-muted-foreground">Prepared message only. Veroxa will review before anything is sent or used publicly.</p></CardContent>
    </Card>
  );
}

function OwnerVerificationGrid({ sections }: { sections: ReturnType<typeof getMomoHouseAuditPrefillSections> }) {
  const statusLabel: Record<AuditPrefillFieldStatus, string> = {
    prefilled_by_veroxa: "Pre-filled — please review",
    needs_owner_verification: "Needs verification",
    missing: "Missing",
    owner_corrected: "Confirmed",
    completed_by_team: "Completed by Veroxa",
    blocked_needs_access: "Needs access",
  };
  const statusTone: Record<AuditPrefillFieldStatus, StatusBadgeTone> = {
    prefilled_by_veroxa: "info",
    needs_owner_verification: "warning",
    missing: "danger",
    owner_corrected: "success",
    completed_by_team: "success",
    blocked_needs_access: "danger",
  };
  return (
    <section className="mt-5 space-y-3" data-testid="audit-prefill-onboarding-fields">
      <div>
        <h3 className="text-base font-semibold text-foreground">What Veroxa already knows and what needs your review</h3>
        <p className="mt-1 text-sm text-muted-foreground">Pre-filled items came from public or audit signals and still need your review; missing items need details from you, access blockers need permission, and only completed items reflect Veroxa team work already finished.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
      {sections.map((section) => (
        <Card key={section.id}>
          <CardHeader><CardTitle className="text-sm">{section.title}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {section.fields.map((field) => (
              <div key={field.id} className="rounded-lg border border-border/70 p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-medium text-foreground">{field.label}</p><p className="mt-1 text-xs text-muted-foreground">{field.value}</p></div>
                  <StatusBadge tone={statusTone[field.status]}>{statusLabel[field.status]}</StatusBadge>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">{field.required ? "Required" : "Optional"}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      </div>
    </section>
  );
}

export default function ClientOnboarding() {
  const mode = useRealPortalDataMode();
  const profile = getClientOnboardingPreviewProfile();
  const progress = profile ? getOnboardingProgress(profile) : 0;
  const readiness = profile ? buildOnboardingReadinessSnapshot(profile) : null;
  const missingInfo = profile ? getMissingBusinessInfo(profile) : [];
  const missingLinks = profile ? getMissingPlatformLinks(profile) : [];
  const missingMedia = profile ? getNextMediaNeeded(profile) : [];
  const truthItems = profile ? getBusinessTruthItemsToConfirm(profile) : [];
  const dashboardHref = getClientPortalHref("dashboard", mode.isPublicDemoRoute);
  const prefillSections = getMomoHouseAuditPrefillSections();

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <RealPortalReviewNotice />
      <PageHeader
        title="Restaurant Onboarding"
        description="A simple Complete Online Presence setup checklist so Veroxa can organize your online presence correctly."
        actions={<Link href={dashboardHref}><Button variant="outline">Back to dashboard</Button></Link>}
        testId="header-client-onboarding"
      />


      {!profile || !readiness ? (
        <div className="space-y-4">
          <SafePortalEmptyCard
            title="Restaurant onboarding is being prepared"
            body="Your setup checklist will appear here after Veroxa setup review. Momo House San Antonio pilot workspace. Nothing goes live without Veroxa team review."
            testId="empty-client-onboarding-safe-state"
          />
          <ExpectationAgreement />
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">What happens next</p>
              <p className="mt-2">Veroxa will organize business details, platform links, media needs, and confirmation items after the account is activated. This workspace will only show information that is ready for your restaurant review.</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
      <Card className="mb-5 border-primary/25 bg-primary/5">
        <CardContent className="grid gap-4 p-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-foreground">Momo House San Antonio pilot workspace</p>
            <p className="mt-1 text-sm text-muted-foreground">Nothing goes live without Veroxa team review. This page shows your setup review, what Veroxa needs from you, and what Veroxa will organize during the first week.</p>
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

      <OwnerVerificationGrid sections={prefillSections} />

      <Card className="mt-5 border-emerald-500/25 bg-emerald-500/5" data-testid="client-onboarding-next-step">
        <CardHeader><CardTitle className="text-base">Next step</CardTitle></CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2 lg:grid-cols-4">
          {[
            "Verify business details",
            "Confirm menu/order links",
            "Upload or send usable food media",
            "Provide Google/social/ordering access if requested",
          ].map((item) => (
            <div key={item} className="rounded-lg border border-border/70 bg-background/70 p-3">
              <CheckCircle2 className="mb-2 h-4 w-4 text-emerald-400" />
              <p className="font-medium text-foreground">{item}</p>
            </div>
          ))}
          <p className="md:col-span-2 lg:col-span-4 rounded-lg border border-border/70 bg-background/70 p-3 text-xs">All setup actions are manual pilot steps. Veroxa will prepare and review work; this page does not publish, connect accounts, or change Google/social/ordering platforms automatically.</p>
        </CardContent>
      </Card>

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
            <p className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs">Short videos can help Veroxa prepare reviewed content direction, but Reels/TikTok/video content are coming soon and not included at launch. Veroxa is not requesting a real upload here; this is setup guidance only.</p>
          </CardContent>
        </Card>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-3">
        <ChecklistSection title="Business info" items={getBusinessInfoChecklist(profile)} />
        <ChecklistSection title="Platform links" items={getPlatformProfileChecklist(profile)} />
        <ChecklistSection title="Media" items={getMediaIntakeChecklist(profile)} />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <OwnerMessageCard title="Welcome message" body={buildWelcomeMessageDraft(profile)} />
        <OwnerMessageCard title="Media request" body={getMediaRequestDraft(profile)} />
        <OwnerMessageCard title="Missing info request" body={buildMissingInfoRequestDraft(profile)} />
        <OwnerMessageCard title="Details confirmation" body={buildBusinessTruthConfirmationDraft(profile)} />
      </section>

      <ExpectationAgreement />

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
