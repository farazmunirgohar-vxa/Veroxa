/**
 * team-audit-leads.tsx — M030
 *
 * Internal Veroxa team queue for audit leads. Behind InternalDemoGuard
 * role="team". All reads/writes are local/session — no Supabase, no API.
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Compass,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Users,
  PhoneCall,
  ArrowRight,
} from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { PageHeader } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  getAuditLeads,
  summarizeAuditLeads,
  updateAuditLeadStage,
  updateAuditLeadNotes,
} from "@/lib/leads/localAuditLeadStore";
import {
  LEAD_PRIORITY_LABELS,
  LEAD_STAGE_LABELS,
  type AuditLeadRecord,
  type LeadPriority,
  type LeadStage,
} from "@/lib/leads/leadTypes";
import { generateInternalLeadAudit } from "@/lib/leads/internalLeadScoring";
import { generateRestaurantAudit } from "@/lib/audit/auditScoring";
import {
  HANDOFF_STATUS_LABELS,
  ONBOARDING_CHECKLIST_ITEMS,
  type OnboardingHandoffState,
} from "@/lib/leads/onboardingHandoffTypes";
import {
  advanceHandoffStatus,
  getOnboardingHandoff,
  toggleChecklistItem,
} from "@/lib/leads/localOnboardingStore";
import { buildRuleBasedLeadSummary } from "@/lib/leads/leadSummary";
import {
  generateAiDraftClient,
  aiDraftModeLabel,
  type AiDraftMode,
} from "@/lib/ai/aiDraftClient";

type FilterTab =
  | "all"
  | "priority_a"
  | "walkthrough_requested"
  | "ready_to_contact"
  | "nurture";

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "priority_a", label: "Priority A" },
  { id: "walkthrough_requested", label: "Walkthrough Requested" },
  { id: "ready_to_contact", label: "Ready to Contact" },
  { id: "nurture", label: "Nurture" },
];

const STAGE_BUTTONS: { stage: LeadStage; label: string }[] = [
  { stage: "ready_to_contact", label: "Mark Ready to Contact" },
  { stage: "contacted", label: "Mark Contacted" },
  { stage: "walkthrough_booked", label: "Mark Walkthrough Booked" },
  { stage: "proposal_sent", label: "Mark Proposal Sent" },
  { stage: "won", label: "Mark Won" },
  { stage: "lost", label: "Mark Lost" },
  { stage: "nurture_later", label: "Mark Nurture Later" },
];

const priorityTone: Record<LeadPriority, string> = {
  priority_a: "border-emerald-500/40 text-emerald-400 bg-emerald-500/5",
  priority_b: "border-sky-500/40 text-sky-400 bg-sky-500/5",
  nurture: "border-amber-500/40 text-amber-400 bg-amber-500/5",
  low_priority: "border-muted text-muted-foreground bg-muted/10",
  not_current_target: "border-muted text-muted-foreground bg-muted/10",
};

function formatUsd(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}

const DEMO_SEED_INPUTS = [
  {
    restaurantName: "Demo Grill House",
    city: "Phoenix",
    state: "AZ",
    cuisineType: "Steakhouse",
    googleListingUrl: "https://maps.google.com/demo-grill",
    websiteUrl: "https://demogrillhouse.example",
    instagramUrl: "https://instagram.com/demogrill",
    menuOrderingUrl: "https://demogrillhouse.example/menu",
  },
  {
    restaurantName: "Demo Momo Kitchen",
    city: "Austin",
    state: "TX",
    cuisineType: "Nepalese",
    instagramUrl: "https://instagram.com/demomomo",
    facebookUrl: "https://facebook.com/demomomo",
  },
  {
    restaurantName: "Demo Mediterranean Table",
    city: "Chicago",
    state: "IL",
    cuisineType: "Mediterranean",
    googleListingUrl: "https://maps.google.com/demo-med",
    websiteUrl: "https://demomed.example",
    instagramUrl: "https://instagram.com/demomed",
    facebookUrl: "https://facebook.com/demomed",
    tiktokUrl: "https://tiktok.com/@demomed",
    menuOrderingUrl: "https://demomed.example/order",
  },
];

function buildDemoSeedLeads(): AuditLeadRecord[] {
  const out: AuditLeadRecord[] = [];
  const baseTime = Date.now();
  DEMO_SEED_INPUTS.forEach((input, idx) => {
    const report = generateRestaurantAudit({
      restaurantName: input.restaurantName,
      city: input.city,
      state: input.state,
      cuisineType: input.cuisineType,
      googleListingUrl: input.googleListingUrl,
      websiteUrl: input.websiteUrl,
      instagramUrl: input.instagramUrl,
      facebookUrl: input.facebookUrl,
      tiktokUrl: input.tiktokUrl,
      menuOrderingUrl: input.menuOrderingUrl,
    });
    const links = {
      googleListingUrl: input.googleListingUrl,
      websiteUrl: input.websiteUrl,
      instagramUrl: input.instagramUrl,
      facebookUrl: input.facebookUrl,
      tiktokUrl: input.tiktokUrl,
      menuOrderingUrl: input.menuOrderingUrl,
    };
    const internal = generateInternalLeadAudit({
      report,
      links,
      source: "manual_prospect",
      walkthroughRequested: false,
    });
    const stage: LeadStage = idx === 0 ? "walkthrough_requested" : "new_audit";
    const createdAt = new Date(baseTime - idx * 86_400_000).toISOString();
    out.push({
      id: `lead_demo_seed_${idx + 1}`,
      source: idx === 0 ? "free_audit" : "manual_prospect",
      createdAt,
      updatedAt: createdAt,
      restaurantName: input.restaurantName,
      city: input.city,
      state: input.state,
      cuisineType: input.cuisineType,
      links,
      publicAudit: {
        totalScore: report.totalScore,
        gradeLabel: report.gradeLabel,
        auditConfidence: report.auditConfidence,
        confidenceLabel: report.confidenceLabel,
        recommendedPackageId: report.recommendation.packageId,
        recommendedPackageLabel: report.recommendation.packageLabel,
        standardPriceDisplay: report.recommendation.standardPriceDisplay,
        foundingPriceDisplay: report.recommendation.foundingPriceDisplay,
        weakSpotTitles: report.weakSpots.slice(0, 3).map((w) => w.title),
      },
      leadStage: stage,
      leadPriority: internal.priority,
      internalLeadScore: internal.score,
      projectedMonthlyMrr: internal.projectedFoundingMonthlyMrr,
      projectedStandardMonthlyMrr: internal.projectedStandardMonthlyMrr,
      nextAction: internal.nextAction,
      followUpStatus:
        stage === "walkthrough_requested" ? "follow_up_due" : "no_follow_up_needed",
      internalNotes: [],
    });
  });
  return out;
}

export default function TeamAuditLeads() {
  const [leads, setLeads] = useState<AuditLeadRecord[]>([]);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [showingDemoSeed, setShowingDemoSeed] = useState(false);
  const [handoff, setHandoff] = useState<OnboardingHandoffState | null>(null);
  const [aiSummary, setAiSummary] = useState<{
    mode: AiDraftMode;
    text: string;
    bullets: string[];
  } | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);

  useEffect(() => {
    const saved = getAuditLeads();
    if (saved.length === 0) {
      const seed = buildDemoSeedLeads();
      setLeads(seed);
      setShowingDemoSeed(true);
    } else {
      setLeads(saved);
      setShowingDemoSeed(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setHandoff(null);
      setAiSummary(null);
      return;
    }
    setHandoff(getOnboardingHandoff(selectedId));
    setAiSummary(null);
  }, [selectedId]);

  const summary = useMemo(() => summarizeAuditLeads(leads), [leads]);

  const filtered = useMemo(() => {
    if (filter === "all") return leads;
    if (filter === "priority_a") {
      return leads.filter((l) => l.leadPriority === "priority_a");
    }
    if (filter === "nurture") {
      return leads.filter((l) => l.leadPriority === "nurture");
    }
    return leads.filter((l) => l.leadStage === filter);
  }, [leads, filter]);

  const selected = useMemo(
    () => leads.find((l) => l.id === selectedId) ?? null,
    [leads, selectedId],
  );

  const selectedInternal = useMemo(() => {
    if (!selected) return null;
    const report = generateRestaurantAudit({
      restaurantName: selected.restaurantName,
      city: selected.city,
      state: selected.state,
      cuisineType: selected.cuisineType,
      ...selected.links,
    });
    return generateInternalLeadAudit({
      report,
      links: selected.links,
      contact: selected.contact,
      internalFlags: selected.internalFlags,
      source: selected.source,
      walkthroughRequested:
        selected.leadStage === "walkthrough_requested" || !!selected.contact,
    });
  }, [selected]);

  function handleStageUpdate(stage: LeadStage) {
    if (!selected) return;
    if (showingDemoSeed) return;
    const updated = updateAuditLeadStage(selected.id, stage);
    if (updated) {
      setLeads(getAuditLeads());
    }
  }

  function handleAddNote() {
    if (!selected || !noteDraft.trim()) return;
    if (showingDemoSeed) return;
    updateAuditLeadNotes(selected.id, noteDraft.trim());
    setLeads(getAuditLeads());
    setNoteDraft("");
  }

  function handleAdvanceHandoff() {
    if (!selected) return;
    setHandoff(advanceHandoffStatus(selected.id));
  }

  function handleToggleChecklist(key: (typeof ONBOARDING_CHECKLIST_ITEMS)[number]["key"]) {
    if (!selected) return;
    setHandoff(toggleChecklistItem(selected.id, key));
  }

  async function handleGenerateLeadSummary() {
    if (!selected) return;
    const fallback = buildRuleBasedLeadSummary(selected);
    setAiSummaryLoading(true);
    try {
      const res = await generateAiDraftClient({
        draftType: "lead_summary",
        context: {
          restaurantName: selected.restaurantName,
          location: `${selected.city}, ${selected.state}`,
          opportunityLabel: selected.publicAudit.gradeLabel,
          recommendedPackage: selected.publicAudit.recommendedPackageLabel,
          signals: selected.publicAudit.weakSpotTitles,
          websiteFound: selected.selectedRestaurant?.websiteFound,
          menuLinkFound: selected.selectedRestaurant?.menuLinkFound,
          socialFound:
            (selected.selectedRestaurant?.discoveredSocialLinks?.length ?? 0) > 0,
        },
      });
      if (res.draft && (res.mode === "ai" || res.mode === "rule_based_fallback")) {
        setAiSummary({
          mode: res.mode,
          text: res.draft.text || fallback.headline,
          bullets:
            res.draft.items && res.draft.items.length > 0
              ? res.draft.items
              : fallback.bullets,
        });
      } else {
        setAiSummary({
          mode: res.mode,
          text: fallback.headline,
          bullets: fallback.bullets,
        });
      }
    } catch {
      setAiSummary({
        mode: "rule_based_fallback",
        text: fallback.headline,
        bullets: fallback.bullets,
      });
    } finally {
      setAiSummaryLoading(false);
    }
  }

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <PageHeader
        title="Audit Leads"
        description="Internal Veroxa queue for restaurants that ran an audit or were manually added as prospects."
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <SummaryCard label="Total Leads" value={summary.totalLeads} icon={Users} />
        <SummaryCard
          label="Walkthrough Requested"
          value={summary.walkthroughRequested}
          icon={PhoneCall}
        />
        <SummaryCard
          label="Priority A"
          value={summary.priorityACount}
          icon={Sparkles}
        />
        <SummaryCard
          label="Projected Founding MRR"
          value={formatUsd(summary.projectedFoundingMrr)}
          icon={TrendingUp}
        />
        <SummaryCard
          label="Follow-up Needed"
          value={summary.followUpNeeded}
          icon={AlertTriangle}
        />
      </div>

      {/* Veroxa Financial Health (M032) */}
      <Card className="bg-card border-border mb-4">
        <CardHeader>
          <CardTitle className="text-base inline-flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Veroxa Financial Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground/90 mb-3">
            Veroxa must also track its own lead flow, projected MRR, follow-up
            status, and close progress. Healthy lead flow protects the company
            and helps Veroxa keep serving restaurants.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
            <MetricCell
              label="Projected Founding MRR"
              value={formatUsd(summary.projectedFoundingMrr)}
            />
            <MetricCell
              label="Projected Standard MRR"
              value={formatUsd(summary.projectedStandardMrr)}
            />
            <MetricCell label="Priority A" value={summary.priorityACount} />
            <MetricCell
              label="Walkthrough Requests"
              value={summary.walkthroughRequested}
            />
            <MetricCell label="Won" value={summary.wonCount} />
            <MetricCell label="Lost" value={summary.lostCount} />
          </div>
        </CardContent>
      </Card>

      {/* Lead pipeline strip */}
      <Card className="bg-card border-border mb-4" data-testid="audit-pipeline-strip">
        <CardHeader>
          <CardTitle className="text-base">Audit Lead Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[12px] text-muted-foreground mb-3">
            Stages a prospect moves through. Counts reflect current leads.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                "new_audit",
                "ready_to_contact",
                "walkthrough_booked",
                "proposal_sent",
                "won",
                "lost",
              ] as LeadStage[]
            ).map((stage, i, arr) => {
              const count = leads.filter((l) => l.leadStage === stage).length;
              const tone =
                stage === "won"
                  ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
                  : stage === "lost"
                    ? "border-muted text-muted-foreground bg-muted/10"
                    : "border-primary/30 text-foreground bg-primary/5";
              return (
                <div key={stage} className="flex items-center gap-2">
                  <div
                    className={`px-3 py-1.5 rounded-md border text-xs font-medium ${tone}`}
                    data-testid={`pipeline-stage-${stage}`}
                  >
                    <span>{LEAD_STAGE_LABELS[stage]}</span>
                    <span className="ml-2 tabular-nums text-muted-foreground">
                      {count}
                    </span>
                  </div>
                  {i < arr.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                  )}
                </div>
              );
            })}
          </div>
          {summary.wonCount > 0 && (
            <div
              className="mt-3 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3"
              data-testid="pipeline-won-callout"
            >
              <p className="text-xs font-semibold text-emerald-300 mb-1">
                Convert to Client Preview
              </p>
              <p className="text-[12px] text-muted-foreground">
                When a lead is marked Won, the next step is to provision a
                client account, share portal access, and start the upload +
                direction loop. (Demo only — provisioning is not wired in this
                preview.)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Demo seed banner */}
      {showingDemoSeed && leads.length > 0 && (
        <div className="mb-3 rounded-md border border-amber-500/40 bg-amber-500/5 p-3">
          <p className="text-[12px] text-amber-400">
            Showing fictional demo leads. No saved leads exist yet — run a free
            audit or add a manual prospect to begin. Stage updates and notes
            are disabled for demo seed leads.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {FILTER_TABS.map((t) => (
          <Button
            key={t.id}
            size="sm"
            variant={filter === t.id ? "default" : "outline"}
            onClick={() => setFilter(t.id)}
            data-testid={`filter-${t.id}`}
          >
            {t.label}
          </Button>
        ))}
        <div className="ml-auto flex gap-2">
          <Link href="/demo/team/prospect-scanner">
            <Button size="sm" variant="outline">
              Manual Prospect Scanner{" "}
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      {leads.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No audit leads yet. Run a free audit or add a manual prospect.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* List */}
          <div className="lg:col-span-2 space-y-2">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground px-2">
                No leads match this filter.
              </p>
            ) : (
              filtered.map((l) => (
                <Card
                  key={l.id}
                  className={`bg-card border-border cursor-pointer transition ${selectedId === l.id ? "ring-1 ring-primary" : ""}`}
                  onClick={() => setSelectedId(l.id)}
                  data-testid={`lead-row-${l.id}`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold">
                          {l.restaurantName}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {l.cuisineType} · {l.city}, {l.state}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={priorityTone[l.leadPriority]}
                      >
                        {LEAD_PRIORITY_LABELS[l.leadPriority]} ·{" "}
                        {l.internalLeadScore}/100
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-[11px] text-muted-foreground">
                      <span>
                        Audit:{" "}
                        <span className="text-foreground/90">
                          {l.publicAudit.totalScore}/100
                        </span>
                      </span>
                      <span>
                        Confidence:{" "}
                        <span className="text-foreground/90">
                          {l.publicAudit.confidenceLabel}
                        </span>
                      </span>
                      <span>
                        Package:{" "}
                        <span className="text-foreground/90">
                          {l.publicAudit.recommendedPackageLabel}
                        </span>
                      </span>
                      <span>
                        Projected:{" "}
                        <span className="text-foreground/90">
                          {formatUsd(l.projectedMonthlyMrr)}/mo founding
                        </span>
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Stage:{" "}
                      <span className="text-foreground/90">
                        {LEAD_STAGE_LABELS[l.leadStage]}
                      </span>{" "}
                      · Next: {l.nextAction}
                    </p>
                    {l.selectedRestaurant && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge
                          variant="outline"
                          className={
                            l.selectedRestaurant.selectedSource === "google_places"
                              ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/5 text-[10px]"
                              : "border-muted-foreground/30 text-muted-foreground bg-muted/10 text-[10px]"
                          }
                        >
                          {l.selectedRestaurant.selectedSource === "google_places"
                            ? "Live"
                            : l.selectedRestaurant.selectedSource === "fixture"
                              ? "Preview"
                              : "Manual"}
                        </Badge>
                        {l.selectedRestaurant.websiteFound && (
                          <Badge
                            variant="outline"
                            className="border-sky-500/40 text-sky-400 bg-sky-500/5 text-[10px]"
                          >
                            Website found
                          </Badge>
                        )}
                        {(l.selectedRestaurant.menuLinkFound ||
                          l.selectedRestaurant.orderLinkFound) && (
                          <Badge
                            variant="outline"
                            className="border-sky-500/40 text-sky-400 bg-sky-500/5 text-[10px]"
                          >
                            Menu/order found
                          </Badge>
                        )}
                        {(l.selectedRestaurant.discoveredSocialLinks?.length ?? 0) >
                          0 && (
                          <Badge
                            variant="outline"
                            className="border-sky-500/40 text-sky-400 bg-sky-500/5 text-[10px]"
                          >
                            Social links found
                          </Badge>
                        )}
                        {l.selectedRestaurant.aiDraftAvailable && (
                          <Badge
                            variant="outline"
                            className="border-primary/40 text-primary bg-primary/5 text-[10px]"
                          >
                            AI draft available
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Detail */}
          <div>
            {selected ? (
              <Card className="bg-card border-border sticky top-4">
                <CardHeader>
                  <CardTitle className="text-base">
                    {selected.restaurantName}
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground">
                    {selected.cuisineType} · {selected.city}, {selected.state}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                      Top weak spots
                    </p>
                    <ul className="text-[12px] list-disc pl-5 space-y-0.5">
                      {selected.publicAudit.weakSpotTitles.length === 0 ? (
                        <li className="text-muted-foreground">None on file</li>
                      ) : (
                        selected.publicAudit.weakSpotTitles.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))
                      )}
                    </ul>
                  </div>

                  {selectedInternal && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                          Why this lead is strong
                        </p>
                        <ul className="text-[12px] list-disc pl-5 space-y-0.5">
                          {selectedInternal.whyThisLeadIsStrong.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                          Risks
                        </p>
                        <ul className="text-[12px] list-disc pl-5 space-y-0.5 text-muted-foreground">
                          {selectedInternal.risks.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-md border border-border bg-muted/20 p-2">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          Suggested opener
                        </p>
                        <p className="text-[12px] mt-0.5">
                          {selectedInternal.suggestedOpener}
                        </p>
                      </div>
                      <div className="rounded-md border border-border bg-muted/20 p-2">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          Suggested follow-up
                        </p>
                        <p className="text-[12px] mt-0.5">
                          {selectedInternal.suggestedFollowUp}
                        </p>
                      </div>
                      <div className="rounded-md border border-border bg-muted/20 p-2">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          Likely objection
                        </p>
                        <p className="text-[12px] mt-0.5 text-muted-foreground">
                          {selectedInternal.likelyObjection}
                        </p>
                      </div>
                    </>
                  )}

                  {selected.selectedRestaurant && (
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                        Audit lead context
                      </p>
                      <div className="flex flex-wrap gap-1 mb-1">
                        <Badge
                          variant="outline"
                          className={
                            selected.selectedRestaurant.selectedSource ===
                            "google_places"
                              ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/5 text-[10px]"
                              : selected.selectedRestaurant.selectedSource ===
                                  "manual"
                                ? "border-sky-500/40 text-sky-400 bg-sky-500/5 text-[10px]"
                                : "border-muted-foreground/30 text-muted-foreground bg-muted/10 text-[10px]"
                          }
                        >
                          Source:{" "}
                          {selected.selectedRestaurant.selectedSource ===
                          "google_places"
                            ? "Live"
                            : selected.selectedRestaurant.selectedSource ===
                                "manual"
                              ? "Manual"
                              : "Preview"}
                        </Badge>
                        {selected.selectedRestaurant.aiDraftAvailable !==
                          undefined && (
                          <Badge
                            variant="outline"
                            className={
                              selected.selectedRestaurant.aiDraftAvailable
                                ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/5 text-[10px]"
                                : "border-muted-foreground/30 text-muted-foreground bg-muted/10 text-[10px]"
                            }
                          >
                            AI draft:{" "}
                            {selected.selectedRestaurant.aiDraftAvailable
                              ? "Yes"
                              : "No"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Audit opportunity: {selected.publicAudit.gradeLabel}
                      </p>
                      {selected.selectedRestaurant.selectedAddress && (
                        <p className="text-[11px] text-muted-foreground">
                          {selected.selectedRestaurant.selectedAddress}
                        </p>
                      )}
                      {(selected.selectedRestaurant.selectedPhone ||
                        typeof selected.selectedRestaurant.selectedRating ===
                          "number") && (
                        <p className="text-[11px] text-muted-foreground">
                          {selected.selectedRestaurant.selectedPhone && (
                            <>
                              Phone: {selected.selectedRestaurant.selectedPhone}
                              {typeof selected.selectedRestaurant
                                .selectedRating === "number"
                                ? " · "
                                : ""}
                            </>
                          )}
                          {typeof selected.selectedRestaurant.selectedRating ===
                            "number" && (
                            <>
                              Rating:{" "}
                              {selected.selectedRestaurant.selectedRating.toFixed(
                                1,
                              )}
                              {typeof selected.selectedRestaurant
                                .selectedReviewCount === "number"
                                ? ` (${selected.selectedRestaurant.selectedReviewCount} reviews)`
                                : ""}
                            </>
                          )}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selected.selectedRestaurant.websiteFound && (
                          <Badge variant="outline" className="text-[10px]">
                            Website found
                          </Badge>
                        )}
                        {selected.selectedRestaurant.menuLinkFound && (
                          <Badge variant="outline" className="text-[10px]">
                            Menu link found
                          </Badge>
                        )}
                        {selected.selectedRestaurant.orderLinkFound && (
                          <Badge variant="outline" className="text-[10px]">
                            Order link found
                          </Badge>
                        )}
                        {selected.selectedRestaurant.contactPathFound && (
                          <Badge variant="outline" className="text-[10px]">
                            Contact path found
                          </Badge>
                        )}
                        {(selected.selectedRestaurant.discoveredSocialLinks
                          ?.length ?? 0) > 0 && (
                          <Badge variant="outline" className="text-[10px]">
                            Social links found
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {selected.contact && (
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                        Contact
                      </p>
                      <p className="text-[12px]">
                        {selected.contact.contactName ?? "—"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {selected.contact.phone && (
                          <>Phone: {selected.contact.phone} · </>
                        )}
                        {selected.contact.email && (
                          <>Email: {selected.contact.email}</>
                        )}
                      </p>
                      {selected.contact.bestTimeToContact && (
                        <p className="text-[11px] text-muted-foreground">
                          Best time: {selected.contact.bestTimeToContact}
                        </p>
                      )}
                      {selected.contact.note && (
                        <p className="text-[11px] text-muted-foreground italic">
                          “{selected.contact.note}”
                        </p>
                      )}
                    </div>
                  )}

                  <Separator />

                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                      Internal notes
                    </p>
                    {selected.internalNotes.length === 0 ? (
                      <p className="text-[12px] text-muted-foreground">
                        No notes yet.
                      </p>
                    ) : (
                      <ul className="text-[12px] list-disc pl-5 space-y-0.5">
                        {selected.internalNotes.map((n, i) => (
                          <li key={i}>{n}</li>
                        ))}
                      </ul>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="Add internal note…"
                        className="h-8 text-[12px]"
                        disabled={showingDemoSeed}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleAddNote}
                        disabled={showingDemoSeed || !noteDraft.trim()}
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* BUILD 2 — AI-assisted lead summary (server-or-fallback). */}
                  <div data-testid="lead-summary-section">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        AI-assisted lead summary
                      </p>
                      {aiSummary && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-primary/40 text-primary bg-primary/5"
                          data-testid="lead-summary-mode"
                        >
                          {aiDraftModeLabel(aiSummary.mode)}
                        </Badge>
                      )}
                    </div>
                    {aiSummary ? (
                      <div className="rounded-md border border-border bg-muted/20 p-2">
                        <p className="text-[12px] mb-1">{aiSummary.text}</p>
                        <ul className="text-[12px] list-disc pl-5 space-y-0.5 text-muted-foreground">
                          {aiSummary.bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                        <p className="text-[10px] text-muted-foreground italic mt-1">
                          AI-assisted draft — team review required before use.
                        </p>
                      </div>
                    ) : (
                      <p className="text-[12px] text-muted-foreground">
                        Generate a quick internal summary of this lead.
                      </p>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] mt-2"
                      onClick={handleGenerateLeadSummary}
                      disabled={aiSummaryLoading}
                      data-testid="btn-generate-lead-summary"
                    >
                      {aiSummaryLoading
                        ? "Generating…"
                        : aiSummary
                          ? "Regenerate summary"
                          : "Generate lead summary"}
                    </Button>
                  </div>

                  <Separator />

                  {/* BUILD 2 — Onboarding handoff (local/session only). */}
                  {handoff && (
                    <div data-testid="onboarding-handoff-section">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          Onboarding handoff
                        </p>
                        <Badge
                          variant="outline"
                          className="text-[10px] border-sky-500/40 text-sky-300 bg-sky-500/10"
                          data-testid="handoff-status"
                        >
                          {HANDOFF_STATUS_LABELS[handoff.status]}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-2">
                        Simulated handoff — no account is created, nothing is sent.
                        Tracks the steps before a won lead becomes an active client.
                      </p>
                      <div className="space-y-1">
                        {ONBOARDING_CHECKLIST_ITEMS.map((item) => {
                          const done = !!handoff.checklist[item.key];
                          return (
                            <label
                              key={item.key}
                              className="flex items-start gap-2 text-[12px] cursor-pointer"
                              data-testid={`handoff-check-${item.key}`}
                            >
                              <input
                                type="checkbox"
                                checked={done}
                                onChange={() => handleToggleChecklist(item.key)}
                                className="mt-0.5"
                              />
                              <span className={done ? "line-through text-muted-foreground" : ""}>
                                {item.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px] mt-2"
                        onClick={handleAdvanceHandoff}
                        disabled={handoff.status === "client_active"}
                        data-testid="btn-advance-handoff"
                      >
                        {handoff.status === "client_active"
                          ? "Handoff complete"
                          : "Advance handoff stage"}
                      </Button>
                    </div>
                  )}

                  <Separator />

                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                      Stage updates
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {STAGE_BUTTONS.map((b) => (
                        <Button
                          key={b.stage}
                          size="sm"
                          variant={
                            selected.leadStage === b.stage
                              ? "default"
                              : "outline"
                          }
                          onClick={() => handleStageUpdate(b.stage)}
                          disabled={showingDemoSeed}
                          className="h-7 text-[11px]"
                          data-testid={`stage-${b.stage}`}
                        >
                          {b.label}
                        </Button>
                      ))}
                    </div>
                    {showingDemoSeed && (
                      <p className="text-[11px] text-muted-foreground mt-2 italic">
                        Stage updates are disabled while showing fictional
                        demo leads.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
                    <Compass className="w-4 h-4" /> Select a lead to see the
                    internal audit.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </PortalLayout>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="text-xl font-bold tabular-nums">{value}</p>
          </div>
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCell({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
