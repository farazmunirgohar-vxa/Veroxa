/**
 * team-audit-leads.tsx — M030
 *
 * Internal Veroxa team queue for audit leads. Behind InternalDemoGuard
 * role="team". All reads/writes are local/session — no Supabase, no API.
 */

import { useEffect, useMemo, useState } from "react";
import {
  Compass,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Users,
  PhoneCall,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import {
  RealPortalReviewNotice,
  SafePortalEmptyCard,
} from "@/components/RealPortalSafeStates";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { TeamReviewModeRouteSummary } from "@/components/team/TeamOperationalSpine";
import { PageHeader } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  createAuditLeadFromReport,
  getAuditLeads,
  saveAuditLead,
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
  type AiDraftMode,
} from "@/lib/ai/aiDraftClient";
import {
  analyzeLeadIntelligence,
  inputFromAuditLead,
} from "@/lib/leadIntelligence/leadScoringEngine";
import { buildOutreachDraftSet } from "@/lib/leadIntelligence/outreachDraftEngine";
import {
  CONTACT_PATH_LABELS,
  LEAD_FIT_TIER_LABELS,
} from "@/lib/leadIntelligence/leadIntelligenceTypes";
import {
  LEAD_OUTCOME_STAGE_LABELS,
  OUTREACH_RESPONSE_LABELS,
  type LeadOutcomeStage,
  type OutreachResponseStatus,
} from "@/lib/leadIntelligence/leadOutcomeTypes";
import {
  getOutcomesForLead,
  getLeadOutcomes,
  recordLeadOutcome,
  deleteLeadOutcome,
} from "@/lib/leadIntelligence/localLeadOutcomeStore";
import { computeLearningSignals } from "@/lib/leadIntelligence/leadLearningSignals";
import {
  prioritizeLead,
  CONVERSION_BAND_LABELS,
} from "@/lib/leadIntelligence/leadPrioritizationEngine";
import {
  OBJECTION_LABELS,
  type ObjectionType,
} from "@/lib/leadIntelligence/leadObjectionPatterns";
import { VEROXA_PLANS } from "@/data/pricing/veroxaPricing";
import {
  normalizeRestaurantSearchText,
  searchRestaurantCandidates,
} from "@/data/demo/demoRestaurantSearch";
import { evaluateBreakEvenProgress } from "@/domain/breakEvenProgress";
import {
  STARTER_INTERNAL_MINIMUM_ACTIONS_PER_DAY,
  evaluateOnlineInfluencedActionProgress,
} from "@/domain/onlineInfluencedActions";
import { evaluateVeroxaProfitValidation } from "@/domain/profitValidation";

import { TeamSaasStatePanel } from "@/components/team/TeamSaasStatePanel";
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

const initialManualLeadInput = {
  restaurantName: "",
  city: "San Antonio",
  state: "TX",
  cuisineType: "",
};

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

function draftAssistModeLabel(mode: AiDraftMode): string {
  switch (mode) {
    case "ai":
      return "Draft assist";
    case "rule_based_fallback":
      return "Rule-based draft";
    case "not_configured":
      return "Draft helper not configured";
    case "error":
      return "Rule-based draft";
  }
}

const DEMO_SEED_INPUTS = [
  {
    restaurantName: "Launch Readiness Lead 1",
    city: "Phoenix",
    state: "AZ",
    cuisineType: "Steakhouse",
    googleListingUrl: "https://maps.google.com/demo-grill",
    websiteUrl: "https://demogrillhouse.example",
    instagramUrl: "https://instagram.com/demogrill",
    menuOrderingUrl: "https://demogrillhouse.example/menu",
  },
  {
    restaurantName: "Launch Readiness Lead 2",
    city: "Austin",
    state: "TX",
    cuisineType: "Nepalese",
    instagramUrl: "https://instagram.com/demomomo",
    facebookUrl: "https://facebook.com/demomomo",
  },
  {
    restaurantName: "Launch Readiness Lead 3",
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
        stage === "walkthrough_requested"
          ? "follow_up_due"
          : "no_follow_up_needed",
      internalNotes: [],
    });
  });
  return out;
}

export default function TeamAuditLeads() {
  const portalDataMode = useRealPortalDataMode();
  const canUseFixtureData =
    portalDataMode.allowDemoFixtures || portalDataMode.isLiveDataConnected;

  const [leads, setLeads] = useState<AuditLeadRecord[]>([]);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [leadSearchQuery, setLeadSearchQuery] = useState("");
  const [manualLeadInput, setManualLeadInput] = useState(
    initialManualLeadInput,
  );
  const [manualLeadMessage, setManualLeadMessage] = useState<string | null>(
    null,
  );
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
  const [outreachOpen, setOutreachOpen] = useState(false);
  const [readyForOutreach, setReadyForOutreach] = useState(false);
  const [copiedChannel, setCopiedChannel] = useState<string | null>(null);
  const [outcomeVersion, setOutcomeVersion] = useState(0);
  const [outcomeStage, setOutcomeStage] =
    useState<LeadOutcomeStage>("contacted");
  const [outcomeResponse, setOutcomeResponse] =
    useState<OutreachResponseStatus>("no_response");
  const [outcomeObjection, setOutcomeObjection] = useState<ObjectionType | "">(
    "",
  );
  const [outcomeNote, setOutcomeNote] = useState("");

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
    setOutreachOpen(false);
    setReadyForOutreach(false);
    setCopiedChannel(null);
  }, [selectedId]);

  const summary = useMemo(() => summarizeAuditLeads(leads), [leads]);
  const profitValidation = evaluateVeroxaProfitValidation({
    daysSinceStart: 45,
    monthlyFee: VEROXA_PLANS.starter.priceMonthly,
    hasCapacityForMoreOrders: undefined,
    trackingConfidence: "unknown",
  });
  const proofProgress = evaluateOnlineInfluencedActionProgress({
    daysSinceStart: 45,
  });
  const breakEvenProgress = evaluateBreakEvenProgress({
    monthlyFee: VEROXA_PLANS.starter.priceMonthly,
  });

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

  const visibleLeads = useMemo(() => {
    const q = normalizeRestaurantSearchText(leadSearchQuery);
    if (!q) return filtered;
    return filtered.filter((lead) =>
      normalizeRestaurantSearchText(
        [
          lead.restaurantName,
          lead.city,
          lead.state,
          lead.cuisineType,
          lead.source,
          lead.publicAudit.weakSpotTitles.join(" "),
        ].join(" "),
      ).includes(q),
    );
  }, [filtered, leadSearchQuery]);

  const manualSearchMatches = useMemo(() => {
    if (!manualLeadInput.restaurantName.trim()) return [];
    return searchRestaurantCandidates(manualLeadInput).slice(0, 3);
  }, [manualLeadInput]);

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

  const leadIntel = useMemo(() => {
    if (!selected) return null;
    return analyzeLeadIntelligence(inputFromAuditLead(selected));
  }, [selected]);

  const outreachSet = useMemo(() => {
    if (!leadIntel) return null;
    return buildOutreachDraftSet(leadIntel);
  }, [leadIntel]);

  // Learning signals are derived from ALL logged outcomes (history-aware).
  // outcomeVersion forces a recompute whenever an outcome is logged/removed.
  const learningSignals = useMemo(
    () => computeLearningSignals(getLeadOutcomes()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [outcomeVersion],
  );

  const prioritization = useMemo(() => {
    if (!selected || !leadIntel) return null;
    return prioritizeLead(
      leadIntel,
      inputFromAuditLead(selected),
      learningSignals,
    );
  }, [selected, leadIntel, learningSignals]);

  const leadOutcomes = useMemo(() => {
    if (!selected) return [];
    return getOutcomesForLead(selected.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, outcomeVersion]);

  function handleLogOutcome() {
    if (!selected || !leadIntel) return;
    if (showingDemoSeed) return;
    recordLeadOutcome({
      leadId: selected.id,
      segment: leadIntel.segment,
      outreachAngleId: outreachSet?.drafts[0]?.angleId,
      responseStatus: outcomeResponse,
      stageReached: outcomeStage,
      objection: outcomeObjection || undefined,
      predictedOpportunityAtOutreach:
        leadIntel.score.overallConversionOpportunity,
      note: outcomeNote.trim() || undefined,
    });
    setOutcomeNote("");
    setOutcomeObjection("");
    setOutcomeVersion((v) => v + 1);
  }

  function handleDeleteOutcome(id: string) {
    deleteLeadOutcome(id);
    setOutcomeVersion((v) => v + 1);
  }

  async function handleCopyDraft(channel: string, text: string) {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
      setCopiedChannel(channel);
      window.setTimeout(() => setCopiedChannel(null), 1500);
    } catch {
      setCopiedChannel(null);
    }
  }

  function handleManualLeadField(
    key: keyof typeof initialManualLeadInput,
    value: string,
  ) {
    setManualLeadInput((prev) => ({ ...prev, [key]: value }));
    setManualLeadMessage(null);
  }

  function handleUseManualSearchMatch(
    match: ReturnType<typeof searchRestaurantCandidates>[number],
  ) {
    setManualLeadInput({
      restaurantName: match.restaurantName,
      city: match.city,
      state: match.state,
      cuisineType: match.cuisineType,
    });
    setManualLeadMessage(
      "Preview match copied into the manual lead form. Confirm details before saving.",
    );
  }

  function handleCreateManualLead() {
    const restaurantName = manualLeadInput.restaurantName.trim();
    const city = manualLeadInput.city.trim();
    const state = manualLeadInput.state.trim();
    if (!restaurantName || !city || !state) {
      setManualLeadMessage(
        "Add restaurant name, city, and state before creating a manual audit lead.",
      );
      return;
    }

    const cuisineType =
      manualLeadInput.cuisineType.trim() ||
      "Restaurant / Food — category not verified";
    const report = generateRestaurantAudit({
      restaurantName,
      city,
      state,
      cuisineType,
      restaurantSource: "manual",
      notes:
        "Manual audit lead created from Team Audit Leads. Weak discoverability or no confident preview match should be reviewed as a potential Veroxa opportunity.",
    });
    const lead = createAuditLeadFromReport(report, {
      source: "manual_prospect",
      initialStage: "ready_to_contact",
      selectedRestaurant: {
        selectedRestaurantId: `manual-${restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        selectedRestaurantName: restaurantName,
        selectedCity: city,
        selectedState: state,
        selectedAddress: `${city}, ${state} — address needs manual confirmation`,
        selectedCuisineType: cuisineType,
        selectedMatchConfidence: "low",
        selectedSource: "manual",
      },
    });
    lead.internalNotes.push(
      "Manual fallback lead. Treat weak discoverability as a possible Veroxa opportunity; verify details before outreach.",
    );
    saveAuditLead(lead);
    const saved = getAuditLeads();
    setLeads(saved);
    setShowingDemoSeed(false);
    setSelectedId(lead.id);
    setFilter("all");
    setLeadSearchQuery(restaurantName);
    setManualLeadInput(initialManualLeadInput);
    setManualLeadMessage(`${restaurantName} saved as a manual audit lead.`);
  }

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

  function handleToggleChecklist(
    key: (typeof ONBOARDING_CHECKLIST_ITEMS)[number]["key"],
  ) {
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
            (selected.selectedRestaurant?.discoveredSocialLinks?.length ?? 0) >
            0,
        },
      });
      if (
        res.draft &&
        (res.mode === "ai" || res.mode === "rule_based_fallback")
      ) {
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

  if (!canUseFixtureData) {
    return (
      <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
        <TeamSaasStatePanel compact={false} />
        <RealPortalReviewNotice />
        <SafePortalEmptyCard
          title="Audit Leads in review"
          body="Audit leads are not connected to external sources yet. The real route is ready for Faraz without showing seeded demo restaurants as active leads."
          testId="empty-team-audit-leads"
        />
        <TeamReviewModeRouteSummary title="Audit leads review-mode summary" />
      </PortalLayout>
    );
  }

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <PageHeader
        title="Audit Leads"
        description="Internal Veroxa queue for restaurants that ran an audit or were manually added as prospects."
      />

      <Card
        className="bg-card border-border mb-4"
        data-testid="audit-lead-search-manual-card"
      >
        <CardHeader>
          <CardTitle className="text-base inline-flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" />
            Search or create audit lead
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Search saved leads
              </p>
              <Input
                value={leadSearchQuery}
                onChange={(e) => setLeadSearchQuery(e.target.value)}
                placeholder="Search name, city, cuisine, source…"
                data-testid="audit-lead-search-input"
              />
            </div>
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Manual target
              </p>
              <Input
                value={manualLeadInput.restaurantName}
                onChange={(e) =>
                  handleManualLeadField("restaurantName", e.target.value)
                }
                placeholder="Mamadali, Selda…"
                data-testid="manual-lead-name-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  City
                </p>
                <Input
                  value={manualLeadInput.city}
                  onChange={(e) =>
                    handleManualLeadField("city", e.target.value)
                  }
                  placeholder="San Antonio"
                  data-testid="manual-lead-city-input"
                />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  State
                </p>
                <Input
                  value={manualLeadInput.state}
                  onChange={(e) =>
                    handleManualLeadField("state", e.target.value)
                  }
                  placeholder="TX"
                  data-testid="manual-lead-state-input"
                />
              </div>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <Input
              value={manualLeadInput.cuisineType}
              onChange={(e) =>
                handleManualLeadField("cuisineType", e.target.value)
              }
              placeholder="Cuisine fallback, e.g. Mediterranean, Kebab, Halal"
              data-testid="manual-lead-cuisine-input"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleCreateManualLead}
              data-testid="btn-create-manual-audit-lead"
            >
              Save manual audit lead
            </Button>
          </div>
          {manualSearchMatches.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {manualSearchMatches.map((match) => (
                <Button
                  key={match.id}
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleUseManualSearchMatch(match)}
                  data-testid={`manual-search-match-${match.id}`}
                >
                  Use {match.restaurantName}
                </Button>
              ))}
            </div>
          )}
          <p className="text-[12px] text-muted-foreground">
            If a warm target is hard to find, treat that as weak discoverability
            and save a manual lead for verification. This stays local/manual —
            no scraping, Places API, database write, or live integration.
          </p>
          {manualLeadMessage && (
            <p
              className="text-[12px] text-amber-300"
              data-testid="manual-lead-message"
            >
              {manualLeadMessage}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <SummaryCard
          label="Total Leads"
          value={summary.totalLeads}
          icon={Users}
        />
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

      <Card
        className="bg-card border-amber-500/30 bg-amber-500/5 mb-4"
        data-testid="card-profit-validation-internal"
      >
        <CardHeader>
          <CardTitle className="text-base inline-flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            Profit validation · Internal only
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-foreground/90">
            Veroxa sells online presence publicly, but team review validates
            right-fit restaurants through profitable online-influenced
            actions/orders, break-even progress, and attribution confidence.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <MetricCell
              label="Estimated actions/day"
              value={
                profitValidation.currentOnlineInfluencedActionsPerDay ??
                "Not enough data"
              }
            />
            <MetricCell
              label="Break-even target"
              value={`${breakEvenProgress.requiredOrdersPerDay}/day`}
            />
            <MetricCell
              label="2-month proof standard"
              value={`${STARTER_INTERNAL_MINIMUM_ACTIONS_PER_DAY}/day`}
            />
            <MetricCell
              label="Attribution confidence"
              value={proofProgress.confidence.replaceAll("_", " ")}
            />
          </div>
          <div className="rounded-md border border-amber-500/30 bg-background/50 p-3 text-[12px] text-muted-foreground">
            {profitValidation.nextAction}
            <br />
            Internal planning only, not public guarantee. Direction clicks,
            calls, menu/order-link clicks, and owner notes are signals, not
            perfect attribution.
          </div>
        </CardContent>
      </Card>

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
      <Card
        className="bg-card border-border mb-4"
        data-testid="audit-pipeline-strip"
      >
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
            audit or add a manual prospect to begin. Stage updates and notes are
            disabled for demo seed leads.
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
            {visibleLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground px-2">
                No leads match this filter/search. If this is a warm target,
                create a manual audit lead above.
              </p>
            ) : (
              visibleLeads.map((l) => (
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
                          {formatUsd(l.projectedMonthlyMrr)}/mo current
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
                            l.selectedRestaurant.selectedSource ===
                            "google_places"
                              ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/5 text-[10px]"
                              : "border-muted-foreground/30 text-muted-foreground bg-muted/10 text-[10px]"
                          }
                        >
                          {l.selectedRestaurant.selectedSource ===
                          "google_places"
                            ? "Google-source snapshot"
                            : l.selectedRestaurant.selectedSource === "fixture"
                              ? "Preview source"
                              : "External source"}
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
                        {(l.selectedRestaurant.discoveredSocialLinks?.length ??
                          0) > 0 && (
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
                            Draft assist available
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
                      <div
                        className="rounded-md border border-primary/20 bg-primary/5 p-2"
                        data-testid="team-audit-profit-fit"
                      >
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          Profit fit · internal only
                        </p>
                        <p className="text-[12px] mt-0.5 text-foreground/85">
                          {selectedInternal.profitFitSummary}
                        </p>
                        <p className="text-[11px] mt-1 text-muted-foreground">
                          Profit fit uses conservative defaults until average
                          ticket and margin are confirmed.
                        </p>
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
                            ? "Google-source snapshot"
                            : selected.selectedRestaurant.selectedSource ===
                                "manual"
                              ? "External source"
                              : "Preview source"}
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
                            Draft helper:{" "}
                            {selected.selectedRestaurant.aiDraftAvailable
                              ? "Available"
                              : "Not available"}
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

                  {/* BUILD 2 — Draft-helper lead summary (server-or-fallback). */}
                  <div data-testid="lead-summary-section">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Draft-helper lead summary
                      </p>
                      {aiSummary && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-primary/40 text-primary bg-primary/5"
                          data-testid="lead-summary-mode"
                        >
                          {draftAssistModeLabel(aiSummary.mode)}
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
                          Draft helper preview — team review required before
                          use.
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

                  {/* Lead Intelligence + Outreach Engine (rule-based). */}
                  {leadIntel && (
                    <div data-testid="lead-intelligence-section">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          Lead intelligence
                        </p>
                        <Badge
                          variant="outline"
                          className="text-[10px] border-primary/40 text-primary bg-primary/5"
                          data-testid="lead-intel-segment"
                        >
                          {leadIntel.segmentLabel}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-2">
                        {leadIntel.segmentDescription}
                      </p>

                      <div className="rounded-md border border-border bg-muted/20 p-2 mb-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">
                            Conversion opportunity
                          </span>
                          <span className="text-sm font-bold tabular-nums">
                            {leadIntel.score.overallConversionOpportunity}/100
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Fit: {LEAD_FIT_TIER_LABELS[leadIntel.fitTier]}
                        </p>
                      </div>

                      {prioritization && (
                        <div
                          className="rounded-md border border-primary/30 bg-primary/5 p-2 mb-2 space-y-1.5"
                          data-testid="lead-prioritization"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className="text-[10px] uppercase tracking-wider text-primary">
                              Prioritization (rule-based)
                            </p>
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className="text-[10px] border-primary/40 text-primary bg-primary/5"
                                data-testid="prioritization-band"
                              >
                                {CONVERSION_BAND_LABELS[prioritization.band]} ·{" "}
                                {prioritization.priorityScore}/100
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-[10px] border-muted text-muted-foreground bg-muted/10"
                                data-testid="prioritization-confidence"
                              >
                                {prioritization.confidenceLabel}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-[12px]">
                            <span className="font-medium">Recommended: </span>
                            {prioritization.recommendedLeadActionLabel}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            <span className="font-medium text-foreground/80">
                              Why now:{" "}
                            </span>
                            {prioritization.whyNow}
                          </p>
                          {prioritization.whyThisLead.length > 0 && (
                            <ul className="text-[11px] list-disc pl-5 space-y-0.5 text-muted-foreground">
                              {prioritization.whyThisLead.map((w, i) => (
                                <li key={i}>{w}</li>
                              ))}
                            </ul>
                          )}
                          <p className="text-[11px]">
                            <span className="font-medium">Best angle: </span>
                            {prioritization.bestOutreachAngleLabel}
                          </p>
                          {prioritization.likelyObjectionLabel && (
                            <p className="text-[11px] text-muted-foreground">
                              <span className="font-medium text-foreground/80">
                                Likely objection:{" "}
                              </span>
                              {prioritization.likelyObjectionLabel}
                              {prioritization.likelyObjectionPrep
                                ? ` — ${prioritization.likelyObjectionPrep}`
                                : ""}
                            </p>
                          )}
                          {prioritization.manualVerificationNeeded.length >
                            0 && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-amber-400">
                                Manual verification needed
                              </p>
                              <ul className="text-[11px] list-disc pl-5 space-y-0.5 text-muted-foreground">
                                {prioritization.manualVerificationNeeded.map(
                                  (m, i) => (
                                    <li key={i}>{m}</li>
                                  ),
                                )}
                              </ul>
                            </div>
                          )}
                          {prioritization.historicalAdjustment !== 0 && (
                            <p className="text-[10px] text-muted-foreground italic">
                              Adjusted{" "}
                              {prioritization.historicalAdjustment > 0
                                ? "+"
                                : ""}
                              {prioritization.historicalAdjustment} from logged
                              outcomes (small by design). Patterns are signals,
                              not rules.
                            </p>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-1.5 mb-2">
                        <IntelDim
                          label="Improvement room"
                          value={leadIntel.score.improvementRoomScore}
                        />
                        <IntelDim
                          label="Possible mktg spend"
                          value={leadIntel.score.marketingInvestmentSignalScore}
                        />
                        <IntelDim
                          label="Inconsistency"
                          value={leadIntel.score.inconsistencyScore}
                        />
                        <IntelDim
                          label="Reachability"
                          value={leadIntel.score.reachabilityScore}
                        />
                      </div>

                      {leadIntel.marketingInvestment
                        .possiblePaidServiceSignal && (
                        <p className="text-[10px] text-amber-400 italic mb-2">
                          Possible paid-service signal — needs manual
                          verification. Never treated as confirmed spend.
                        </p>
                      )}

                      <div className="mb-2">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                          Top reasons
                        </p>
                        <ul className="text-[12px] list-disc pl-5 space-y-0.5">
                          {leadIntel.topReasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-md border border-border bg-muted/20 p-2 mb-2">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Recommended sales angle
                        </p>
                        <p className="text-[12px] mt-0.5">
                          {leadIntel.recommendedSalesAngle}
                        </p>
                      </div>

                      <div className="mb-2">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                          Contact-path checklist (public only)
                        </p>
                        <ul className="space-y-1">
                          {leadIntel.contactPaths.map((p, i) => (
                            <li
                              key={i}
                              className="text-[12px] flex items-start gap-2"
                            >
                              <Badge
                                variant="outline"
                                className={
                                  p.confidence === "available"
                                    ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/5 text-[10px] shrink-0"
                                    : p.confidence === "likely"
                                      ? "border-sky-500/40 text-sky-400 bg-sky-500/5 text-[10px] shrink-0"
                                      : "border-amber-500/40 text-amber-400 bg-amber-500/5 text-[10px] shrink-0"
                                }
                              >
                                {CONTACT_PATH_LABELS[p.type]}
                              </Badge>
                              <span className="text-muted-foreground">
                                {p.instruction}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mb-2">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                          Next steps (lead → audit → onboarding)
                        </p>
                        <ol className="text-[12px] list-decimal pl-5 space-y-0.5">
                          {leadIntel.nextActions.map((a, i) => (
                            <li key={i}>
                              <span className="font-medium">{a.label}</span>
                              {a.requiresHumanReview && (
                                <span className="text-[10px] text-amber-400 ml-1">
                                  (human review)
                                </span>
                              )}
                              <span className="text-muted-foreground">
                                {" "}
                                — {a.detail}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px]"
                          onClick={() => setOutreachOpen((o) => !o)}
                          data-testid="btn-prepare-outreach"
                        >
                          {outreachOpen
                            ? "Hide outreach drafts"
                            : "Prepare outreach drafts"}
                        </Button>
                        <Button
                          size="sm"
                          variant={readyForOutreach ? "default" : "outline"}
                          className="h-7 text-[11px]"
                          onClick={() => setReadyForOutreach((r) => !r)}
                          data-testid="btn-ready-for-outreach"
                        >
                          {readyForOutreach
                            ? "Marked ready for outreach"
                            : "Mark ready for outreach"}
                        </Button>
                      </div>

                      {readyForOutreach && (
                        <p className="text-[10px] text-emerald-400 italic mt-1">
                          Flagged for a human to review and send manually.
                          Nothing is sent automatically.
                        </p>
                      )}

                      {outreachOpen && outreachSet && (
                        <div
                          className="mt-2 space-y-2"
                          data-testid="outreach-drafts"
                        >
                          {outreachSet.drafts.map((d) => {
                            const copyText = d.subject
                              ? `Subject: ${d.subject}\n\n${d.body}`
                              : d.body;
                            return (
                              <div
                                key={d.channel}
                                className="rounded-md border border-border bg-muted/20 p-2"
                              >
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <p className="text-[11px] font-semibold">
                                    {d.label}
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 text-[10px]"
                                    onClick={() =>
                                      handleCopyDraft(d.channel, copyText)
                                    }
                                    data-testid={`btn-copy-${d.channel}`}
                                  >
                                    {copiedChannel === d.channel
                                      ? "Copied"
                                      : d.channel === "call_opener"
                                        ? "Copy call opener"
                                        : d.channel === "email" ||
                                            d.channel === "follow_up_email"
                                          ? "Copy email draft"
                                          : "Copy"}
                                  </Button>
                                </div>
                                {d.subject && (
                                  <p className="text-[11px] text-muted-foreground mb-1">
                                    Subject: {d.subject}
                                  </p>
                                )}
                                <p className="text-[12px] whitespace-pre-line">
                                  {d.body}
                                </p>
                                {d.points && d.points.length > 0 && (
                                  <ul className="text-[11px] list-disc pl-5 mt-1 text-muted-foreground space-y-0.5">
                                    {d.points.map((pt, i) => (
                                      <li key={i}>{pt}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            );
                          })}
                          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2">
                            <p className="text-[10px] uppercase tracking-wider text-amber-400 mb-1">
                              Guardrails
                            </p>
                            <ul className="text-[11px] list-disc pl-5 text-muted-foreground space-y-0.5">
                              {outreachSet.guardrails.map((g, i) => (
                                <li key={i}>{g}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Outcome tracking — feeds the self-improving engine.
                          Local-only logging; NO send/call/text happens here. */}
                      <div
                        className="mt-3 rounded-md border border-border bg-muted/10 p-2"
                        data-testid="lead-outcome-tracking"
                      >
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                          Log outcome (after a human reaches out)
                        </p>
                        <p className="text-[10px] text-muted-foreground mb-2">
                          Record what actually happened so the engine can learn.
                          This only saves a result — it never contacts anyone.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <label className="text-[11px] text-muted-foreground">
                            Furthest stage reached
                            <select
                              className="mt-0.5 w-full rounded border border-border bg-background text-foreground text-[12px] p-1"
                              value={outcomeStage}
                              onChange={(e) =>
                                setOutcomeStage(
                                  e.target.value as LeadOutcomeStage,
                                )
                              }
                              data-testid="select-outcome-stage"
                            >
                              {(
                                Object.keys(
                                  LEAD_OUTCOME_STAGE_LABELS,
                                ) as LeadOutcomeStage[]
                              ).map((s) => (
                                <option key={s} value={s}>
                                  {LEAD_OUTCOME_STAGE_LABELS[s]}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="text-[11px] text-muted-foreground">
                            Response
                            <select
                              className="mt-0.5 w-full rounded border border-border bg-background text-foreground text-[12px] p-1"
                              value={outcomeResponse}
                              onChange={(e) =>
                                setOutcomeResponse(
                                  e.target.value as OutreachResponseStatus,
                                )
                              }
                              data-testid="select-outcome-response"
                            >
                              {(
                                Object.keys(
                                  OUTREACH_RESPONSE_LABELS,
                                ) as OutreachResponseStatus[]
                              ).map((r) => (
                                <option key={r} value={r}>
                                  {OUTREACH_RESPONSE_LABELS[r]}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="text-[11px] text-muted-foreground">
                            Objection (optional)
                            <select
                              className="mt-0.5 w-full rounded border border-border bg-background text-foreground text-[12px] p-1"
                              value={outcomeObjection}
                              onChange={(e) =>
                                setOutcomeObjection(
                                  e.target.value as ObjectionType | "",
                                )
                              }
                              data-testid="select-outcome-objection"
                            >
                              <option value="">None noted</option>
                              {(
                                Object.keys(OBJECTION_LABELS) as ObjectionType[]
                              ).map((o) => (
                                <option key={o} value={o}>
                                  {OBJECTION_LABELS[o]}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="text-[11px] text-muted-foreground">
                            Note (optional, internal)
                            <input
                              type="text"
                              className="mt-0.5 w-full rounded border border-border bg-background text-foreground text-[12px] p-1"
                              value={outcomeNote}
                              onChange={(e) => setOutcomeNote(e.target.value)}
                              placeholder="What happened?"
                              data-testid="input-outcome-note"
                            />
                          </label>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] mt-2"
                          onClick={handleLogOutcome}
                          disabled={showingDemoSeed}
                          data-testid="btn-log-outcome"
                        >
                          Log outcome
                        </Button>
                        {showingDemoSeed && (
                          <p className="text-[10px] text-muted-foreground italic mt-1">
                            Demo seed lead — logging is disabled.
                          </p>
                        )}

                        {leadOutcomes.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              Logged outcomes ({leadOutcomes.length})
                            </p>
                            {leadOutcomes.map((o) => (
                              <div
                                key={o.id}
                                className="flex items-start justify-between gap-2 text-[11px] rounded border border-border bg-background/40 p-1.5"
                                data-testid={`outcome-row-${o.id}`}
                              >
                                <span className="text-muted-foreground">
                                  <span className="text-foreground/90">
                                    {LEAD_OUTCOME_STAGE_LABELS[o.stageReached]}
                                  </span>{" "}
                                  · {OUTREACH_RESPONSE_LABELS[o.responseStatus]}
                                  {o.objection
                                    ? ` · ${OBJECTION_LABELS[o.objection]}`
                                    : ""}
                                  {o.note ? ` — ${o.note}` : ""}
                                </span>
                                <button
                                  type="button"
                                  className="text-[10px] text-muted-foreground hover:text-destructive shrink-0"
                                  onClick={() => handleDeleteOutcome(o.id)}
                                  data-testid={`btn-delete-outcome-${o.id}`}
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

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
                        Simulated handoff — no account is created, nothing is
                        sent. Tracks the steps before a won lead becomes an
                        active client.
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
                              <span
                                className={
                                  done
                                    ? "line-through text-muted-foreground"
                                    : ""
                                }
                              >
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
                        Stage updates are disabled while showing fictional demo
                        leads.
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

function IntelDim({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-muted/10 px-2 py-1.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}/100</p>
    </div>
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
