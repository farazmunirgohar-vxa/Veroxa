import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, ClipboardCheck, FileText, Handshake, ListChecks, ShieldCheck, Sparkles } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader, StatusBadge } from "@/components/common";
import { RealPortalReviewNotice } from "@/components/RealPortalSafeStates";
import { TeamSaasStatePanel } from "@/components/team/TeamSaasStatePanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import {
  buildClientHandoffPack,
  buildClientSafeMonthlyReportDraft,
  buildClientSafeWeeklyUpdate,
  buildTeamMonthlyReportDraft,
  buildTeamWeeklyUpdateDraft,
  getFirstClientOperatingSnapshots,
  getLifecycleStageLabel,
  getServiceHealthLabel,
  type FirstClientLifecycleStage,
  type FirstClientOperatingSnapshot,
  type ServiceHealthStatus,
} from "@/domain/firstClientOperatingSuite";
import { getOnboardingStatusLabel, getRestaurantOnboardingSeedProfiles } from "@/domain/restaurantOnboarding";

const safetyItems = [
  "Pre-live mode",
  "Manual service only",
  "No production auth",
  "No storage uploads",
  "No live platform connections",
  "No payments",
  "No auto-posting",
  "Team review required",
];

const boardColumns: { title: string; stages: FirstClientLifecycleStage[] }[] = [
  { title: "Onboarding needed", stages: ["onboarding_needed", "onboarding_in_progress", "prospect_review"] },
  { title: "Media needed", stages: ["media_collection_needed"] },
  { title: "Preparing content", stages: ["content_preparation", "review_complete"] },
  { title: "Needs confirmation", stages: ["client_confirmation_needed"] },
  { title: "Ready for manual execution", stages: ["ready_for_manual_execution", "manually_executed"] },
  { title: "Weekly update due", stages: ["weekly_update_due"] },
  { title: "Monthly report due", stages: ["monthly_report_due"] },
  { title: "At risk / blocked", stages: ["at_risk", "paused"] },
];

const healthTone: Record<ServiceHealthStatus, "success" | "warning" | "danger" | "info" | "neutral"> = {
  healthy: "success",
  caution: "warning",
  urgent: "danger",
  blocked: "danger",
  paused: "neutral",
  review_needed: "warning",
};

function statusText(value: string) {
  return value.replaceAll("_", " ");
}

function MiniList({ items, empty = "None in this snapshot." }: { items: readonly string[]; empty?: string }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return <ul className="space-y-2 text-sm text-muted-foreground">{items.map((item) => <li key={item} className="rounded-lg border border-border bg-background/30 p-2">{item}</li>)}</ul>;
}

function SnapshotPill({ snapshot, selected, onClick }: { snapshot: FirstClientOperatingSnapshot; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full rounded-lg border p-3 text-left transition ${selected ? "border-primary bg-primary/10" : "border-border bg-background/35 hover:border-primary/40"}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{snapshot.restaurantName}</p>
          <p className="mt-1 text-xs text-muted-foreground">{snapshot.packageFit}</p>
        </div>
        <StatusBadge tone={healthTone[snapshot.serviceHealthStatus]}>{getServiceHealthLabel(snapshot.serviceHealthStatus)}</StatusBadge>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{snapshot.nextBestAction}</p>
    </button>
  );
}

export default function TeamFirstClientOps() {
  const snapshots = useMemo(() => getFirstClientOperatingSnapshots(), []);
  const [selectedId, setSelectedId] = useState(snapshots[0]?.clientId ?? "");
  const selected = snapshots.find((snapshot) => snapshot.clientId === selectedId) ?? snapshots[0];
  const teamWeekly = buildTeamWeeklyUpdateDraft(selected);
  const clientWeekly = buildClientSafeWeeklyUpdate(selected);
  const teamMonthly = buildTeamMonthlyReportDraft(selected);
  const clientMonthly = buildClientSafeMonthlyReportDraft(selected);
  const handoff = buildClientHandoffPack(selected);
  const onboardingProfiles = getRestaurantOnboardingSeedProfiles();
  const onboardingCompletion = Math.round((selected.onboardingStatus.completedItems.length / Math.max(1, selected.onboardingStatus.completedItems.length + selected.onboardingStatus.missingItems.length)) * 100);

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <TeamSaasStatePanel compact={true} />
      <RealPortalReviewNotice />
      <PageHeader title="First-Client Operating Suite" description="Pre-live operating view for running the first 1–5 restaurant clients manually." testId="header-first-client-ops" />

      <Card className="mb-4 border-primary/20 bg-primary/5" data-testid="first-client-ops-safety-strip">
        <CardContent className="flex flex-wrap gap-2 p-3">
          {safetyItems.map((item) => <StatusBadge key={item} tone={item === "Team review required" ? "warning" : "info"}>{item}</StatusBadge>)}
        </CardContent>
      </Card>


      <Card className="mb-4 border-primary/20 bg-primary/5" data-testid="first-client-ops-onboarding-readiness">
        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><ClipboardCheck className="h-4 w-4 text-primary" />Restaurant onboarding readiness</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <div className="grid gap-2 md:grid-cols-5">
            {onboardingProfiles.map((profile) => (
              <div key={profile.clientId} className="rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">{profile.restaurantName}</p>
                <p className="mt-1">{getOnboardingStatusLabel(profile.overallStatus)}</p>
                <p className="mt-1">{profile.blockers[0] ?? "No onboarding blocker recorded"}</p>
              </div>
            ))}
          </div>
          <Link href="/team/onboarding" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">Open onboarding queue <ArrowRight className="h-3 w-3" /></Link>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="border-border bg-card" data-testid="first-client-lifecycle-board">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><ListChecks className="h-4 w-4 text-primary" />Client lifecycle board</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {boardColumns.map((column) => {
              const columnSnapshots = snapshots.filter((snapshot) => column.stages.includes(snapshot.lifecycleStage));
              return <div key={column.title} className="rounded-xl border border-border bg-background/30 p-3">
                <div className="mb-3 flex items-center justify-between gap-2"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{column.title}</p><StatusBadge tone="neutral">{columnSnapshots.length}</StatusBadge></div>
                <div className="space-y-2">{columnSnapshots.length > 0 ? columnSnapshots.map((snapshot) => <SnapshotPill key={snapshot.clientId} snapshot={snapshot} selected={snapshot.clientId === selected.clientId} onClick={() => setSelectedId(snapshot.clientId)} />) : <p className="text-xs text-muted-foreground">No benchmark in this lane.</p>}</div>
              </div>;
            })}
          </CardContent>
        </Card>

        <Card className="border-border bg-card" data-testid="first-client-selected-detail">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><ShieldCheck className="h-4 w-4 text-primary" />Selected client detail</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><p className="text-xl font-semibold">{selected.restaurantName}</p><p className="text-xs text-muted-foreground">{selected.packageFit} · {getLifecycleStageLabel(selected.lifecycleStage)}</p></div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <StatusBadge tone="info">Onboarding: {selected.onboardingStatus.status}</StatusBadge>
              <StatusBadge tone="info">Media: {selected.mediaRhythmStatus.contentSupplyStatus}</StatusBadge>
              <StatusBadge tone="info">Manual: {statusText(selected.manualExecutionStatus)}</StatusBadge>
              <StatusBadge tone="info">Weekly: {statusText(selected.weeklyUpdateStatus.status)}</StatusBadge>
              <StatusBadge tone="info">Monthly: {statusText(selected.monthlyReportStatus.status)}</StatusBadge>
              <StatusBadge tone={healthTone[selected.serviceHealthStatus]}>Health: {getServiceHealthLabel(selected.serviceHealthStatus)}</StatusBadge>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3"><p className="text-xs uppercase tracking-wide text-muted-foreground">Next best action</p><p className="mt-1">{selected.nextBestAction}</p></div>
            <div className="grid gap-3 md:grid-cols-3"><div><p className="mb-2 text-xs font-semibold">Blockers</p><MiniList items={selected.blockers} /></div><div><p className="mb-2 text-xs font-semibold">Warnings</p><MiniList items={selected.warnings} /></div><div><p className="mb-2 text-xs font-semibold">Ready signals</p><MiniList items={selected.readySignals} /></div></div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="text-sm">Onboarding readiness</CardTitle></CardHeader><CardContent className="space-y-3"><Progress value={onboardingCompletion} className="h-2" /><p className="text-xs text-muted-foreground">{onboardingCompletion}% checklist coverage in this review snapshot.</p><div className="grid gap-3 md:grid-cols-3"><div><p className="mb-2 text-xs font-semibold">Completed</p><MiniList items={selected.onboardingStatus.completedItems.slice(0, 8)} /></div><div><p className="mb-2 text-xs font-semibold">Missing</p><MiniList items={selected.onboardingStatus.missingItems} /></div><div><p className="mb-2 text-xs font-semibold">Needs confirmation</p><MiniList items={selected.onboardingStatus.itemsRequiringConfirmation} /></div></div><p className="rounded-lg border border-border p-3 text-sm text-muted-foreground">Next setup action: {selected.onboardingStatus.nextSetupAction}</p></CardContent></Card>

        <Card><CardHeader><CardTitle className="text-sm">Media rhythm</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground"><div className="grid grid-cols-3 gap-3 text-center"><div className="rounded-lg border border-border p-3"><p className="text-2xl font-semibold text-foreground">{selected.mediaRhythmStatus.usableMediaCount}</p><p className="text-xs">Usable</p></div><div className="rounded-lg border border-border p-3"><p className="text-2xl font-semibold text-foreground">{selected.mediaRhythmStatus.lowQualityMediaCount}</p><p className="text-xs">Low media</p></div><div className="rounded-lg border border-border p-3"><p className="text-2xl font-semibold text-foreground">{selected.mediaRhythmStatus.missingMediaCount}</p><p className="text-xs">Missing</p></div></div><p>Last upload: {selected.mediaRhythmStatus.lastMediaUploadLabel}</p><p className="rounded-lg border border-primary/20 bg-primary/5 p-3">{selected.mediaRhythmStatus.nextMediaRequest}</p><StatusBadge tone={selected.mediaRhythmStatus.shouldSlowPostingDueToMedia ? "warning" : "success"}>{selected.mediaRhythmStatus.shouldSlowPostingDueToMedia ? "Posting should slow due to media supply" : "Media supply can support the current rhythm"}</StatusBadge></CardContent></Card>

        <Card data-testid="weekly-update-draft-card"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><ClipboardCheck className="h-4 w-4 text-primary" />Weekly update draft <StatusBadge tone="warning">{teamWeekly.draftOnlyLabel}</StatusBadge></CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><div><p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Team draft</p><MiniList items={[...teamWeekly.preparedThisWeek, ...teamWeekly.readyForManualExecution, ...teamWeekly.needsClientConfirmation, ...teamWeekly.mediaNeeded, ...teamWeekly.heldForLater, ...teamWeekly.reviewedNext, ...teamWeekly.internalBlockersAndWarnings]} /></div><div><p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Client-safe draft</p><MiniList items={[...clientWeekly.workingOn, ...clientWeekly.needFromClient, ...clientWeekly.nextPlannedFocus, clientWeekly.closingNote]} /></div></CardContent></Card>

        <Card data-testid="monthly-report-draft-card"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><FileText className="h-4 w-4 text-primary" />Monthly report draft <StatusBadge tone="warning">{teamMonthly.draftOnlyLabel}</StatusBadge></CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><div><p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Team report notes</p><MiniList items={[...teamMonthly.workCompleted, ...teamMonthly.preparedManualExecutionPacks, ...teamMonthly.mediaSupplyNotes, ...teamMonthly.visibilityProfileCleanupNotes, ...teamMonthly.clientConfirmationDelays, ...teamMonthly.reportDataLimitations, teamMonthly.nextMonthRecommendation, teamMonthly.internalServiceHealth]} /></div><div><p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Client-safe report draft</p><MiniList items={[clientMonthly.progressSummary, ...clientMonthly.workCompleted, ...clientMonthly.needsClientInput, ...clientMonthly.recommendedNext, clientMonthly.mediaGuidance]} /></div></CardContent></Card>

        <Card data-testid="client-handoff-card"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Handshake className="h-4 w-4 text-primary" />Client handoff <StatusBadge tone="warning">Copy manually if approved</StatusBadge></CardTitle></CardHeader><CardContent className="space-y-4"><p className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">{handoff.clientSafeWelcomeNoteDraft}</p><div className="grid gap-4 md:grid-cols-2"><div><p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Media request draft</p><p className="text-sm text-muted-foreground">{handoff.mediaRequestDraft}</p></div><div><p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">First-week checklist</p><MiniList items={handoff.firstWeekSetupChecklist} /></div></div></CardContent></Card>

        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Sparkles className="h-4 w-4 text-primary" />Linkage</CardTitle></CardHeader><CardContent className="grid gap-2 sm:grid-cols-2"><Button asChild variant="outline"><Link href="/team/manual-execution">Manual Execution <ArrowRight className="ml-2 h-4 w-4" /></Link></Button><Button asChild variant="outline"><Link href="/team/work-queue">Work Queue <ArrowRight className="ml-2 h-4 w-4" /></Link></Button><Button asChild variant="outline"><Link href="/team/report-queue">Report Queue <ArrowRight className="ml-2 h-4 w-4" /></Link></Button><Button asChild variant="outline"><Link href="/team/first-client-readiness">First-Client Readiness <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></CardContent></Card>
      </div>
    </PortalLayout>
  );
}
