import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  FileCheck2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { Link } from "wouter";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader, StatusBadge } from "@/components/common";
import type { StatusBadgeTone } from "@/components/common";
import { RealPortalReviewNotice } from "@/components/RealPortalSafeStates";
import { TeamSaasStatePanel } from "@/components/team/TeamSaasStatePanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import {
  buildClientConfirmationRequestDraft,
  buildCopyPasteExecutionBlock,
  buildManualExecutionPacks,
  buildTeamConfirmationInstruction,
  evaluateManualExecutionLaunchGate,
  getBusinessTruthItemsToConfirm,
  getClientSafeConfirmationLabel,
  getExecutionPackNextAction,
  getExecutionPackPriority,
  getExecutionPackReadinessLabel,
  getExecutionPackRiskTone,
  getManualPublishingBlockers,
  getManualPublishingChecklist,
  getManualPublishingCompletionLabel,
  getManualPublishingTimelinePreview,
  groupExecutionPacksByStatus,
  isClientConfirmationPending,
  requiresClientConfirmation,
  type ManualExecutionPack,
} from "@/domain/manualExecution";

const statusToneMap: Record<
  ReturnType<typeof getExecutionPackRiskTone>,
  StatusBadgeTone
> = {
  success: "success",
  info: "info",
  warning: "warning",
  danger: "danger",
  neutral: "neutral",
};

const safetyItems = [
  "Pre-live manual mode",
  "No auto-posting",
  "No live AI",
  "No storage uploads",
  "No platform connectors",
  "Human review required",
] as const;

const riskLabel: Record<string, string> = {
  needs_business_truth_confirmation: "Business detail needs confirmation",
  missing_media: "More media needed",
  low_media_quality: "Media quality caution",
  possible_unverified_claim: "Possible unverified claim",
  sensitive_offer_or_discount: "Offer/discount needs care",
  platform_access_needed: "Manual platform access needed",
  premium_ads_requires_approval: "Premium approval required",
  insufficient_context: "More context needed",
  no_usable_action: "No usable action yet",
};

function PackQueueCard({
  pack,
  selected,
  onSelect,
}: {
  pack: ManualExecutionPack;
  selected: boolean;
  onSelect: () => void;
}) {
  const blockers = getManualPublishingBlockers(pack);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-lg border p-3 text-left transition ${selected ? "border-primary bg-primary/10" : "border-border bg-muted/10 hover:bg-muted/20"}`}
      data-testid={`manual-pack-${pack.id}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{pack.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {pack.restaurantName} · {pack.platform.replaceAll("_", " ")}
          </p>
        </div>
        <StatusBadge tone={statusToneMap[getExecutionPackRiskTone(pack)]}>
          {getExecutionPackReadinessLabel(pack)}
        </StatusBadge>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Next action: {getExecutionPackNextAction(pack)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Confirmation: {getClientSafeConfirmationLabel(pack.confirmationStatus)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Suggested window: {pack.suggestedPublishWindow}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        {pack.riskFlags.length === 0 ? (
          <StatusBadge tone="success">No added risk flags</StatusBadge>
        ) : (
          pack.riskFlags.map((flag) => (
            <StatusBadge
              key={flag}
              tone={
                flag.includes("missing") ||
                flag.includes("confirmation") ||
                flag.includes("approval")
                  ? "warning"
                  : "info"
              }
            >
              {riskLabel[flag] ?? flag.replaceAll("_", " ")}
            </StatusBadge>
          ))
        )}
      </div>
      {blockers.length > 0 && (
        <p className="mt-2 text-[11px] text-amber-300">
          Blocker: {blockers[0]}
        </p>
      )}
      <div className="mt-3 inline-flex items-center gap-1 rounded-md border border-border bg-background/40 px-2 py-1 text-[11px] text-primary">
        View copy pack <ArrowRight className="h-3 w-3" />
      </div>
    </button>
  );
}

export default function TeamManualExecution() {
  const packs = useMemo(
    () =>
      [...buildManualExecutionPacks()].sort(
        (a, b) => getExecutionPackPriority(b) - getExecutionPackPriority(a),
      ),
    [],
  );
  const grouped = groupExecutionPacksByStatus(packs);
  const launchGate = evaluateManualExecutionLaunchGate(packs);
  const [selectedPackId, setSelectedPackId] = useState(packs[0]?.id ?? "");
  const selectedPack =
    packs.find((pack) => pack.id === selectedPackId) ?? packs[0];
  const confirmationPack = packs.find(
    (pack) =>
      isClientConfirmationPending(pack) && requiresClientConfirmation(pack),
  );

  const summaryCards = [
    {
      label: "Ready to copy",
      value: grouped.readyToCopy.length,
      tone: "success" as const,
    },
    {
      label: "Needs client confirmation",
      value: grouped.needsClientConfirmation.length,
      tone: "warning" as const,
    },
    {
      label: "Blocked / missing media",
      value: grouped.needsMediaOrContext.length,
      tone: "warning" as const,
    },
    {
      label: "Manually completed preview",
      value: grouped.completedPreview.length,
      tone: "info" as const,
    },
    {
      label: "Held for later",
      value: grouped.heldForLater.length,
      tone: "neutral" as const,
    },
  ];

  const queueGroups = [
    { title: "Ready to copy", packs: grouped.readyToCopy },
    {
      title: "Needs client confirmation",
      packs: grouped.needsClientConfirmation,
    },
    { title: "Needs media/context", packs: grouped.needsMediaOrContext },
    { title: "Held for later", packs: grouped.heldForLater },
    { title: "Completed/manual log preview", packs: grouped.completedPreview },
  ];

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <TeamSaasStatePanel compact={true} />
      <RealPortalReviewNotice />
      <PageHeader
        title="Manual Execution Center"
        description="Prepared work for Faraz to review, copy, confirm, and manually complete before live integrations exist."
        testId="header-manual-execution"
      />

      <Card
        className="mb-4 border-primary/20 bg-primary/5"
        data-testid="manual-execution-safety-strip"
      >
        <CardContent className="flex flex-wrap gap-2 p-3">
          {safetyItems.map((item) => (
            <StatusBadge
              key={item}
              tone={item === "Human review required" ? "warning" : "info"}
            >
              {item}
            </StatusBadge>
          ))}
        </CardContent>
      </Card>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        {summaryCards.map((card) => (
          <Card
            key={card.label}
            className="border-border bg-card"
            data-testid={`manual-summary-${card.label.toLowerCase().replaceAll(" ", "-")}`}
          >
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold tabular-nums">{card.value}</p>
              <div className="mt-1">
                <StatusBadge tone={card.tone}>{card.label}</StatusBadge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <Card
            className="border-border bg-card"
            data-testid="manual-execution-priority-queue"
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <ClipboardCheck className="h-4 w-4 text-primary" /> Priority
                execution queue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {queueGroups.map((group) => (
                <div key={group.title}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.title}
                    </p>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {group.packs.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {group.packs.length === 0 ? (
                      <p className="rounded-lg border border-border bg-muted/10 p-3 text-xs text-muted-foreground">
                        Nothing in this group.
                      </p>
                    ) : (
                      group.packs.map((pack) => (
                        <PackQueueCard
                          key={pack.id}
                          pack={pack}
                          selected={pack.id === selectedPack.id}
                          onSelect={() => setSelectedPackId(pack.id)}
                        />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card
            className="border-primary/20 bg-card"
            data-testid="manual-copy-pack-panel"
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Copy className="h-4 w-4 text-primary" /> Copy/paste execution
                pack
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-sm font-semibold">{selectedPack.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  This does not publish anything automatically.
                </p>
              </div>
              <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-background/80 p-3 text-xs leading-relaxed text-muted-foreground">
                {buildCopyPasteExecutionBlock(selectedPack)}
              </pre>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">
                  Verification checklist
                </p>
                {getManualPublishingChecklist(selectedPack)
                  .slice(0, 5)
                  .map((item) => (
                    <p key={item}>• {item}</p>
                  ))}
              </div>
              <Button variant="outline" className="w-full" type="button">
                Copy button preview only — Faraz can select text manually
              </Button>
            </CardContent>
          </Card>

          <Card
            className="border-amber-500/30 bg-card"
            data-testid="manual-confirmation-draft"
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Lock className="h-4 w-4 text-amber-300" /> Client confirmation
                draft
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {confirmationPack ? (
                <>
                  <p className="text-muted-foreground">
                    What needs confirmation:
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                    {getBusinessTruthItemsToConfirm(confirmationPack).map(
                      (item) => (
                        <li key={item}>{item}</li>
                      ),
                    )}
                  </ul>
                  <p className="text-xs text-muted-foreground">
                    Why this matters: Veroxa should not prepare public-facing
                    restaurant details until the exact business detail is
                    confirmed.
                  </p>
                  <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs whitespace-pre-wrap text-muted-foreground">
                    {buildClientConfirmationRequestDraft(confirmationPack)}
                  </div>
                  <p className="text-xs text-amber-300">
                    {buildTeamConfirmationInstruction(confirmationPack)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No confirmation-required pack in this preview.
                </p>
              )}
            </CardContent>
          </Card>

          <Card
            className="border-border bg-card"
            data-testid="manual-publishing-tracker-preview"
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileCheck2 className="h-4 w-4 text-primary" /> Manual
                publishing tracker preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatusBadge tone="info">
                {getManualPublishingCompletionLabel(selectedPack)}
              </StatusBadge>
              <ol className="space-y-2 text-xs text-muted-foreground">
                {getManualPublishingTimelinePreview(selectedPack).map(
                  (step, index) => (
                    <li key={step} className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-[10px]">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ),
                )}
              </ol>
              <p className="rounded-md border border-border bg-muted/10 p-2 text-xs text-muted-foreground">
                Tracker preview only — not a live execution log, no proof
                upload, no external platform action.
              </p>
            </CardContent>
          </Card>

          <Card
            className="border-primary/20 bg-card"
            data-testid="manual-launch-readiness-impact"
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-primary" /> Launch
                readiness impact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>{launchGate.summary}</p>
              <div className="grid gap-2 text-xs">
                <p>Ready to copy: {launchGate.readyToCopyCount}</p>
                <p>
                  Client confirmation needed:{" "}
                  {launchGate.needsClientConfirmationCount}
                </p>
                <p>
                  Blocked by media/context:{" "}
                  {launchGate.blockedByMediaOrContextCount}
                </p>
                <p>
                  Demo-walkthrough ready:{" "}
                  {launchGate.demoWalkthroughReady ? "Yes" : "No"}
                </p>
                <p>
                  Feedback-conversation ready:{" "}
                  {launchGate.feedbackConversationReady ? "Yes" : "No"}
                </p>
                <p>
                  First-paid-client ready later:{" "}
                  {launchGate.firstPaidClientReadyLater
                    ? "Yes"
                    : "No — production SaaS foundation still required"}
                </p>
              </div>
              <p className="text-primary/80">
                {launchGate.recommendedNextAction}
              </p>
              <Link
                href="/team/first-client-readiness"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                View launch gate <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-4 border-border bg-card">
        <CardContent className="flex items-start gap-2 p-3 text-xs text-muted-foreground">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          Manual Execution Center is prepared work only: no production auth,
          storage upload, live AI, platform connector, payment, or automatic
          customer-visible execution was added.
        </CardContent>
      </Card>
    </PortalLayout>
  );
}
