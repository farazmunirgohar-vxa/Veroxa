import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardList, FileText, ShieldCheck } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { RealPortalReviewNotice } from "@/components/RealPortalSafeStates";
import { PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import {
  buildBusinessTruthConfirmationDraft,
  buildMissingInfoRequestDraft,
  buildOnboardingReadinessSnapshot,
  buildTeamOnboardingQueue,
  buildWelcomeMessageDraft,
  getBusinessInfoChecklist,
  getBusinessTruthChecklist,
  getFirstWeekClientTasks,
  getFirstWeekSetupChecklist,
  getFirstWeekSetupStatus,
  getFirstWeekTeamTasks,
  getMediaIntakeChecklist,
  getMediaRequestDraft,
  getOnboardingQueueSummary,
  getOnboardingRiskTone,
  getOnboardingStatus,
  getOnboardingStatusLabel,
  getPlatformProfileChecklist,
  getProofInputChecklist,
  getRestaurantOnboardingSeedProfiles,
  getTeamNextOnboardingAction,
  getTeamOnboardingPriority,
  getTeamProofInputNotes,
} from "@/domain/restaurantOnboarding";

function SummaryCard({ label, value }: { label: string; value: number }) {
  return <Card><CardContent className="p-4"><p className="text-2xl font-semibold text-foreground">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></CardContent></Card>;
}

function CompactChecklist({ title, items }: { title: string; items: { id: string; label: string; status: string; teamLabel: string }[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/70 p-2 text-xs">
            <span className="text-foreground">{item.label}</span>
            <span className="text-muted-foreground">{item.teamLabel}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DraftPanel({ title, body }: { title: string; body: string }) {
  return <div className="rounded-lg border border-border/70 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p></div>;
}

export default function TeamOnboarding() {
  const profiles = useMemo(() => getRestaurantOnboardingSeedProfiles(), []);
  const [selectedId, setSelectedId] = useState(profiles[0]?.clientId ?? "");
  const selected = profiles.find((profile) => profile.clientId === selectedId) ?? profiles[0];
  const queue = buildTeamOnboardingQueue(profiles);
  const summary = getOnboardingQueueSummary(profiles);
  const readiness = buildOnboardingReadinessSnapshot(selected);
  const tone = getOnboardingRiskTone(selected);

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <RealPortalReviewNotice />
      <PageHeader
        title="Restaurant Onboarding Queue"
        description="Manual setup queue for moving restaurants into first-week Veroxa service."
        actions={<Link href="/team/dashboard"><Button variant="outline">Team dashboard</Button></Link>}
        testId="header-team-onboarding"
      />

      <Card className="mb-5 border-primary/25 bg-primary/5">
        <CardContent className="grid gap-3 p-4 md:grid-cols-5">
          {["Pre-live onboarding", "No live data writes", "No storage uploads", "No live platform connections", "No payments", "Team review required"].map((item) => (
            <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" />{item}</div>
          ))}
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <SummaryCard label="Needs business info" value={summary.needsBusinessInfo} />
        <SummaryCard label="Needs media" value={summary.needsMedia} />
        <SummaryCard label="Needs platform links" value={summary.needsPlatformLinks} />
        <SummaryCard label="Needs confirmation" value={summary.needsConfirmation} />
        <SummaryCard label="Ready for first-week setup" value={summary.needsFirstWeekSetup} />
        <SummaryCard label="Ready for manual service" value={summary.readyForManualService} />
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ClipboardList className="h-4 w-4 text-primary" />Queue board</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {queue.map((group) => (
              <div key={group.id}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</p>
                <div className="space-y-2">
                  {group.profiles.map((profile) => (
                    <button key={profile.clientId} type="button" onClick={() => setSelectedId(profile.clientId)} className={`w-full rounded-xl border p-3 text-left transition ${selected.clientId === profile.clientId ? "border-primary bg-primary/10" : "border-border/70 hover:border-primary/40"}`}>
                      <div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-foreground">{profile.restaurantName}</p><StatusBadge tone={getOnboardingRiskTone(profile) === "blocked" ? "danger" : getOnboardingRiskTone(profile) === "watch" ? "warning" : "success"}>{profile.packageId}</StatusBadge></div>
                      <p className="mt-1 text-xs text-muted-foreground">{getTeamNextOnboardingAction(profile)}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle className="flex items-center justify-between gap-3 text-base"><span>{selected.restaurantName}</span><StatusBadge tone={tone === "blocked" ? "danger" : tone === "watch" ? "warning" : "success"}>{getOnboardingStatusLabel(getOnboardingStatus(selected))}</StatusBadge></CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-border/70 p-3"><p className="text-xs text-muted-foreground">Package</p><p className="text-sm font-medium capitalize">{selected.packageId}</p></div>
                <div className="rounded-lg border border-border/70 p-3"><p className="text-xs text-muted-foreground">Priority</p><p className="text-sm font-medium">{getTeamOnboardingPriority(selected)}</p></div>
                <div className="rounded-lg border border-border/70 p-3"><p className="text-xs text-muted-foreground">Progress</p><p className="text-sm font-medium">{readiness.progress}%</p></div>
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm"><p className="font-medium text-foreground">Next team action</p><p className="mt-1 text-muted-foreground">{getTeamNextOnboardingAction(selected)}</p></div>
              <div className="grid gap-3 md:grid-cols-3">
                <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Blockers</p>{(selected.blockers.length ? selected.blockers : ["No hard blocker recorded"]).map((item) => <p key={item} className="mt-2 rounded-lg border border-border/70 p-2 text-xs text-muted-foreground">{item}</p>)}</div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Warnings</p>{(selected.warnings.length ? selected.warnings : ["No warnings recorded"]).map((item) => <p key={item} className="mt-2 rounded-lg border border-border/70 p-2 text-xs text-muted-foreground">{item}</p>)}</div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ready signals</p>{selected.readySignals.map((item) => <p key={item} className="mt-2 rounded-lg border border-border/70 p-2 text-xs text-muted-foreground">{item}</p>)}</div>
              </div>
            </CardContent>
          </Card>

          <section className="grid gap-4 xl:grid-cols-2">
            <CompactChecklist title="Business info checklist" items={getBusinessInfoChecklist(selected)} />
            <CompactChecklist title="Platform checklist" items={getPlatformProfileChecklist(selected)} />
            <CompactChecklist title="Media checklist" items={getMediaIntakeChecklist(selected)} />
            <CompactChecklist title="Business-truth checklist" items={getBusinessTruthChecklist(selected)} />
            <CompactChecklist title="Proof input checklist" items={getProofInputChecklist(selected)} />
            <CompactChecklist title="First-week setup checklist" items={getFirstWeekSetupChecklist(selected)} />
          </section>
        </div>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4 text-primary" />Drafts for manual copy</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <DraftPanel title="Welcome message draft" body={buildWelcomeMessageDraft(selected)} />
            <DraftPanel title="Media request draft" body={getMediaRequestDraft(selected)} />
            <DraftPanel title="Missing info request draft" body={buildMissingInfoRequestDraft(selected)} />
            <DraftPanel title="Business-truth confirmation draft" body={buildBusinessTruthConfirmationDraft(selected)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CheckCircle2 className="h-4 w-4 text-primary" />First-week setup and value/proof setup</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p className="rounded-lg border border-primary/20 bg-primary/5 p-3">{getFirstWeekSetupStatus(selected)}</p>
            <div className="grid gap-3 md:grid-cols-2"><div><p className="font-medium text-foreground">Team tasks</p><ul className="mt-2 list-disc space-y-1 pl-5">{getFirstWeekTeamTasks(selected).map((task) => <li key={task}>{task}</li>)}</ul></div><div><p className="font-medium text-foreground">Client tasks</p><ul className="mt-2 list-disc space-y-1 pl-5">{getFirstWeekClientTasks(selected).slice(0, 6).map((task) => <li key={task}>{task}</li>)}</ul></div></div>
            <div><p className="font-medium text-foreground">Team-only proof notes</p><ul className="mt-2 list-disc space-y-1 pl-5">{getTeamProofInputNotes(selected).map((note) => <li key={note}>{note}</li>)}</ul></div>
            <div className="flex flex-wrap gap-2"><Link href="/team/manual-execution"><Button variant="outline" size="sm">Manual execution center <ArrowRight className="ml-2 h-4 w-4" /></Button></Link><Link href="/team/first-client-ops"><Button variant="outline" size="sm">First-client ops <ArrowRight className="ml-2 h-4 w-4" /></Button></Link></div>
          </CardContent>
        </Card>
      </section>

      <Card className="mt-5 border-amber-500/30 bg-amber-500/5"><CardContent className="flex gap-3 p-4 text-sm text-muted-foreground"><AlertTriangle className="h-4 w-4 text-amber-400" />Value/proof setup is internal review context only. Do not expose internal math, do not promise outcomes, and do not recommend restaurant offers.</CardContent></Card>
    </PortalLayout>
  );
}
