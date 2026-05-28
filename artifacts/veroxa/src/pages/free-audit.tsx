import { useState, type FormEvent } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Info,
  ArrowRight,
  ShieldCheck,
  PhoneCall,
  MapPin,
  Search,
  Star,
  X,
  Target,
  Globe,
  Link2,
  Share2,
  FileText,
  Megaphone,
  Users,
  Wrench,
} from "lucide-react";
import {
  createAuditLeadFromReport,
  saveAuditLead,
} from "@/lib/leads/localAuditLeadStore";
import type {
  AuditLeadContact,
  AuditLeadSelectedRestaurant,
  PreferredContactMethod,
} from "@/lib/leads/leadTypes";
import {
  searchRestaurantCandidates,
  type RestaurantSearchCandidate,
} from "@/data/demo/demoRestaurantSearch";
import {
  getLiveRestaurantDetails,
  searchLiveRestaurantCandidates,
  type LiveAuditMode,
  type LiveRestaurantProfile,
  type LiveWebPresenceScan,
} from "@/lib/audit/liveAuditClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { generateRestaurantAudit } from "@/lib/audit/auditScoring";
import {
  buildAiAuditDraftPayload,
  generateAiAuditDraftClient,
  type AiAuditDraft,
  type AiAuditDraftMode,
} from "@/lib/audit/aiAuditClient";
import {
  AUDIT_ADAPTIVE_LEARNING_EXPLANATION,
  AUDIT_DISCLAIMER,
  AUDIT_EXPECTED_IMPACT_TIMELINE,
  formatThirtyDayPlan,
  formatWhatVeroxaCanImprove,
  formatWhatVeroxaCannotGuarantee,
} from "@/lib/audit/auditReportFormatter";
import { CUSTOMER_FLOW_STAGES } from "@/lib/audit/customerFlowImpact";
import type {
  AuditConfidence,
  GrowthReportSourceLabel,
  RestaurantAuditInput,
  RestaurantAuditReport,
} from "@/lib/audit/auditTypes";

const initialInput: RestaurantAuditInput = {
  restaurantName: "",
  city: "",
  state: "",
  cuisineType: "",
  googleListingUrl: "",
  websiteUrl: "",
  instagramUrl: "",
  facebookUrl: "",
  tiktokUrl: "",
  menuOrderingUrl: "",
  otherUrl: "",
};

function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = Math.round((score / max) * 100);
  return (
    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
      <div
        className="h-full bg-primary"
        style={{ width: `${pct}%` }}
        aria-label={`${score} of ${max}`}
      />
    </div>
  );
}

const confidenceTone: Record<AuditConfidence, string> = {
  basic: "border-amber-500/40 text-amber-400 bg-amber-500/5",
  good: "border-sky-500/40 text-sky-400 bg-sky-500/5",
  strong: "border-emerald-500/40 text-emerald-400 bg-emerald-500/5",
};

const matchConfidenceTone: Record<
  RestaurantSearchCandidate["matchConfidence"],
  string
> = {
  high: "border-emerald-500/40 text-emerald-400 bg-emerald-500/5",
  medium: "border-sky-500/40 text-sky-400 bg-sky-500/5",
  low: "border-amber-500/40 text-amber-400 bg-amber-500/5",
};

const matchConfidenceLabel: Record<
  RestaurantSearchCandidate["matchConfidence"],
  string
> = {
  high: "High match confidence",
  medium: "Medium match confidence",
  low: "Low match confidence",
};

const sourceLabelTone: Record<GrowthReportSourceLabel, string> = {
  verified: "border-emerald-500/40 text-emerald-400 bg-emerald-500/5",
  found: "border-sky-500/40 text-sky-400 bg-sky-500/5",
  "not found": "border-amber-500/40 text-amber-400 bg-amber-500/5",
  "manual review needed":
    "border-muted-foreground/30 text-muted-foreground bg-muted/10",
};

const sourceLabelText: Record<GrowthReportSourceLabel, string> = {
  verified: "Verified",
  found: "Found",
  "not found": "Not found",
  "manual review needed": "Manual review needed",
};

const sectionIcon: Record<string, React.ReactNode> = {
  identity: <MapPin className="w-4 h-4 text-primary" />,
  google_search_seo: <Search className="w-4 h-4 text-primary" />,
  google_maps_seo: <MapPin className="w-4 h-4 text-primary" />,
  gbp_strength: <Globe className="w-4 h-4 text-primary" />,
  website_menu_path: <Link2 className="w-4 h-4 text-primary" />,
  social_standing: <Share2 className="w-4 h-4 text-primary" />,
  content_consistency: <FileText className="w-4 h-4 text-primary" />,
  reviews_trust: <Star className="w-4 h-4 text-primary" />,
  ads_readiness: <Megaphone className="w-4 h-4 text-primary" />,
  walk_in_opportunity: <Users className="w-4 h-4 text-primary" />,
  fix_first: <Wrench className="w-4 h-4 text-primary" />,
};

/**
 * "Where Veroxa fits" — concrete first-focus actions. Static reference panel;
 * never claims a guaranteed outcome — see the audit refinement spec.
 */
const VEROXA_FIRST_FOCUS_ACTIONS: string[] = [
  "Google profile and photo freshness — ensuring the listing is complete, active, and accurate.",
  "Weekly food-content rhythm — consistent posting built around the restaurant's strongest dishes and moments.",
  "Lunch / dinner / weekend posting windows — content published when nearby customers are actually deciding.",
  "Media review and food-first captions — photos and Reels that make the food look its best.",
  "Menu / order / contact path clarity — making sure customers can act easily once they decide.",
  "Weekly update and monthly strategy report — keeping the restaurant informed and the plan improving.",
];

const emptyContact: AuditLeadContact = {
  contactName: "",
  phone: "",
  email: "",
  preferredContactMethod: "any",
  bestTimeToContact: "",
  note: "",
};

export default function FreeAudit() {
  const [input, setInput] = useState<RestaurantAuditInput>(initialInput);
  const [report, setReport] = useState<RestaurantAuditReport | null>(null);
  const [aiDraft, setAiDraft] = useState<AiAuditDraft | null>(null);
  const [aiDraftMode, setAiDraftMode] = useState<AiAuditDraftMode | null>(null);
  const [aiDraftMessage, setAiDraftMessage] = useState<string>("");
  const [aiDraftLoading, setAiDraftLoading] = useState(false);

  function resetAiDraftState() {
    setAiDraft(null);
    setAiDraftMode(null);
    setAiDraftMessage("");
    setAiDraftLoading(false);
  }

  async function handleGenerateAiDraft() {
    if (!report || aiDraftLoading) return;
    setAiDraftLoading(true);
    setAiDraftMessage("");
    try {
      const payload = buildAiAuditDraftPayload(report);
      const result = await generateAiAuditDraftClient(payload);
      setAiDraftMode(result.mode);
      setAiDraft(result.aiDraft);
      setAiDraftMessage(result.message ?? "");
    } finally {
      setAiDraftLoading(false);
    }
  }
  const [contact, setContact] = useState<AuditLeadContact>(emptyContact);
  const [walkthroughSaved, setWalkthroughSaved] = useState(false);
  const [walkthroughError, setWalkthroughError] = useState<string | null>(null);

  // Unified candidate type: covers both live Google Places candidates and
  // fixture/preview fallback candidates. `source` drives the UI badge.
  type UnifiedCandidate = {
    source: "live" | "preview";
    id: string;
    placeId?: string;
    restaurantName: string;
    addressLine: string;
    city: string;
    state: string;
    cuisineType?: string;
    googleRating?: number;
    reviewCount?: number;
    googleMapsUrl?: string;
    websiteUrl?: string;
    instagramUrl?: string;
    facebookUrl?: string;
    menuOrderingUrl?: string;
    matchConfidence: "high" | "medium" | "low";
    note?: string;
  };

  const [candidateResults, setCandidateResults] = useState<UnifiedCandidate[]>(
    [],
  );
  const [selectedCandidate, setSelectedCandidate] =
    useState<UnifiedCandidate | null>(null);
  const [candidateSearchRan, setCandidateSearchRan] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<
    "idle" | "live" | "fixture_fallback" | "not_configured"
  >("idle");
  const [strategiesTried, setStrategiesTried] = useState<string[] | undefined>(
    undefined,
  );
  const [liveTotalRaw, setLiveTotalRaw] = useState<number | undefined>(
    undefined,
  );
  const [liveTotalDisplayed, setLiveTotalDisplayed] = useState<
    number | undefined
  >(undefined);
  const [isSearching, setIsSearching] = useState(false);
  const [liveProfile, setLiveProfile] = useState<LiveRestaurantProfile | null>(
    null,
  );
  const [liveWebPresence, setLiveWebPresence] =
    useState<LiveWebPresenceScan | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsMessage, setDetailsMessage] = useState<string>("");

  function adaptFixtureCandidate(c: RestaurantSearchCandidate): UnifiedCandidate {
    return {
      source: "preview",
      id: c.id,
      restaurantName: c.restaurantName,
      addressLine: c.addressLine,
      city: c.city,
      state: c.state,
      cuisineType: c.cuisineType,
      googleRating: c.googleRating,
      reviewCount: c.reviewCount,
      websiteUrl: c.websiteUrl,
      instagramUrl: c.instagramUrl,
      facebookUrl: c.facebookUrl,
      menuOrderingUrl: c.menuOrderingUrl,
      matchConfidence: c.matchConfidence,
      note: c.note,
    };
  }

  function buildSelectedRestaurantSnapshot():
    | AuditLeadSelectedRestaurant
    | undefined {
    if (!selectedCandidate) return undefined;
    const isLive = selectedCandidate.source === "live";
    const liveOk = isLive && liveProfile !== null;
    return {
      selectedRestaurantId: selectedCandidate.id,
      selectedRestaurantName: selectedCandidate.restaurantName,
      selectedCity: selectedCandidate.city,
      selectedState: selectedCandidate.state,
      selectedAddress: selectedCandidate.addressLine,
      selectedCuisineType: selectedCandidate.cuisineType,
      selectedMatchConfidence: selectedCandidate.matchConfidence,
      selectedPlaceId: selectedCandidate.placeId,
      selectedSource: isLive ? "google_places" : "fixture",
      selectedPhone: liveOk ? liveProfile?.phone : undefined,
      selectedRating: liveOk
        ? liveProfile?.rating
        : selectedCandidate.googleRating,
      selectedReviewCount: liveOk
        ? liveProfile?.reviewCount
        : selectedCandidate.reviewCount,
      selectedWebsiteUrl: liveOk
        ? liveProfile?.websiteUrl
        : selectedCandidate.websiteUrl,
      selectedGoogleMapsUrl: liveOk
        ? liveProfile?.googleMapsUrl
        : selectedCandidate.googleMapsUrl,
      selectedBusinessStatus: liveOk ? liveProfile?.businessStatus : undefined,
      discoveredMenuLinks: liveWebPresence?.discoveredMenuLinks,
      discoveredSocialLinks: liveWebPresence?.discoveredSocialLinks,
      websiteFound: liveWebPresence?.websiteFound,
      menuLinkFound: liveWebPresence?.menuLinkFound,
      orderLinkFound: liveWebPresence?.orderLinkFound,
      contactPathFound: liveWebPresence?.contactPathFound,
      scanConfidence: liveWebPresence?.scanConfidence,
      aiDraftAvailable: aiDraft !== null,
    };
  }

  async function handleFindRestaurant(e: FormEvent) {
    e.preventDefault();
    setSearchError(null);
    if (!input.restaurantName.trim()) {
      setSearchError(
        "Add your restaurant name to start the lookup.",
      );
      setCandidateResults([]);
      setCandidateSearchRan(false);
      return;
    }
    setIsSearching(true);
    setSelectedCandidate(null);
    setLiveProfile(null);
    setLiveWebPresence(null);
    setReport(null);
    resetAiDraftState();
    try {
      const live = await searchLiveRestaurantCandidates({
        restaurantName: input.restaurantName.trim(),
        city: input.city.trim(),
        state: input.state.trim(),
      });
      if (live.mode === "live" && live.candidates.length > 0) {
        setSearchMode("live");
        setStrategiesTried(live.strategiesTried);
        setLiveTotalRaw(live.totalRawCandidates);
        setLiveTotalDisplayed(live.totalDisplayedCandidates);
        setCandidateResults(
          live.candidates.map((c) => ({
            source: "live" as const,
            id: c.placeId,
            placeId: c.placeId,
            restaurantName: c.displayName,
            addressLine: c.formattedAddress,
            city: input.city.trim(),
            state: input.state.trim(),
            cuisineType: c.primaryType?.replace(/_/g, " "),
            googleRating: c.rating,
            reviewCount: c.userRatingCount,
            googleMapsUrl: c.googleMapsUri,
            matchConfidence: c.matchConfidence,
          })),
        );
      } else {
        const fixtureResults = searchRestaurantCandidates({
          restaurantName: input.restaurantName,
          city: input.city,
          state: input.state,
        });
        setStrategiesTried(undefined);
        setLiveTotalRaw(undefined);
        setLiveTotalDisplayed(undefined);
        setSearchMode(
          live.mode === "not_configured" ? "not_configured" : "fixture_fallback",
        );
        setCandidateResults(fixtureResults.map(adaptFixtureCandidate));
      }
      setCandidateSearchRan(true);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSelectCandidate(candidate: UnifiedCandidate) {
    setSelectedCandidate(candidate);
    setLiveProfile(null);
    setLiveWebPresence(null);
    setDetailsMessage("");
    setInput((prev) => ({
      ...prev,
      restaurantName: candidate.restaurantName,
      city: candidate.city || prev.city,
      state: candidate.state || prev.state,
      cuisineType: candidate.cuisineType || prev.cuisineType,
      googleListingUrl: candidate.googleMapsUrl ?? prev.googleListingUrl,
      websiteUrl: candidate.websiteUrl ?? prev.websiteUrl,
      instagramUrl: candidate.instagramUrl ?? prev.instagramUrl,
      facebookUrl: candidate.facebookUrl ?? prev.facebookUrl,
      menuOrderingUrl: candidate.menuOrderingUrl ?? prev.menuOrderingUrl,
      googleRating: candidate.googleRating ?? prev.googleRating,
      reviewCount: candidate.reviewCount ?? prev.reviewCount,
      selectedPlaceId: candidate.placeId,
      restaurantSource: candidate.source === "live" ? "google_places" : "fixture",
    }));
    setReport(null);
    resetAiDraftState();
    setWalkthroughSaved(false);

    if (candidate.source === "live" && candidate.placeId) {
      setDetailsLoading(true);
      try {
        const details = await getLiveRestaurantDetails(candidate.placeId);
        if (details.mode === "live" && details.profile) {
          setLiveProfile(details.profile);
          setLiveWebPresence(details.webPresence);
          const scan = details.webPresence;
          setInput((prev) => ({
            ...prev,
            restaurantName: details.profile?.name ?? prev.restaurantName,
            websiteUrl: details.profile?.websiteUrl ?? prev.websiteUrl,
            googleListingUrl:
              details.profile?.googleMapsUrl ?? prev.googleListingUrl,
            googleRating: details.profile?.rating ?? prev.googleRating,
            reviewCount: details.profile?.reviewCount ?? prev.reviewCount,
            liveProfileConfidence: details.profile?.sourceConfidence,
            businessStatus: details.profile?.businessStatus,
            websiteFound: scan?.websiteFound,
            menuLinkFound: scan?.menuLinkFound,
            orderLinkFound: scan?.orderLinkFound,
            reservationLinkFound: scan?.reservationLinkFound,
            contactPathFound: scan?.contactPathFound,
            discoveredMenuLinks: scan?.discoveredMenuLinks,
            discoveredSocialLinks: scan?.discoveredSocialLinks,
          }));
        } else {
          setDetailsMessage(
            details.message ??
              "Live details are temporarily unavailable. You can still continue manually below.",
          );
        }
      } finally {
        setDetailsLoading(false);
      }
    }
  }

  function handleClearSelectedCandidate() {
    setSelectedCandidate(null);
    setLiveProfile(null);
    setLiveWebPresence(null);
    setDetailsMessage("");
    setReport(null);
    resetAiDraftState();
  }

  function handleContactChange<K extends keyof AuditLeadContact>(
    key: K,
    value: AuditLeadContact[K],
  ) {
    setContact((prev) => ({ ...prev, [key]: value }));
  }

  function handleWalkthroughSubmit(e: FormEvent) {
    e.preventDefault();
    setWalkthroughError(null);
    if (!report) return;
    const hasPhone = (contact.phone ?? "").trim().length > 0;
    const hasEmail = (contact.email ?? "").trim().length > 0;
    if (!hasPhone && !hasEmail) {
      setWalkthroughError("Please share either a phone number or email so Veroxa can follow up.");
      return;
    }
    try {
      const lead = createAuditLeadFromReport(report, {
        source: "free_audit",
        contact: {
          contactName: contact.contactName?.trim() || undefined,
          phone: contact.phone?.trim() || undefined,
          email: contact.email?.trim() || undefined,
          preferredContactMethod: contact.preferredContactMethod,
          bestTimeToContact: contact.bestTimeToContact?.trim() || undefined,
          note: contact.note?.trim() || undefined,
        },
        initialStage: "walkthrough_requested",
        selectedRestaurant: buildSelectedRestaurantSnapshot(),
      });
      saveAuditLead(lead);
      setWalkthroughSaved(true);
    } catch {
      setWalkthroughError("Could not save the walkthrough request in this preview. Please try again.");
    }
  }

  function handleChange<K extends keyof RestaurantAuditInput>(
    key: K,
    value: RestaurantAuditInput[K],
  ) {
    setInput((prev) => ({ ...prev, [key]: value }));
    // Editing the identity fields invalidates a previously selected
    // candidate (and the prior report) — the user should re-search or
    // continue manually.
    if (
      (key === "restaurantName" || key === "city" || key === "state") &&
      selectedCandidate
    ) {
      setSelectedCandidate(null);
      setReport(null);
      resetAiDraftState();
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.restaurantName || !input.city || !input.state) {
      return;
    }
    const cuisineForAudit =
      input.cuisineType.trim() ||
      "Restaurant / Food — category not verified";
    const result = generateRestaurantAudit({
      ...input,
      cuisineType: cuisineForAudit,
    });
    setReport(result);
    resetAiDraftState();
    setWalkthroughSaved(false);
    setWalkthroughError(null);
    setContact(emptyContact);
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        document
          .getElementById("audit-report-anchor")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }

  const plan = report ? formatThirtyDayPlan(report) : [];
  const canImprove = formatWhatVeroxaCanImprove();
  const cannotGuarantee = formatWhatVeroxaCannotGuarantee();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10 md:py-14">
        {/* Hero */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-primary mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Free customer-flow tool
          </div>
          <h1
            className="text-3xl md:text-4xl font-bold tracking-tight mb-2"
            data-testid="header-free-audit"
          >
            Get a Free Restaurant Online Presence Audit
          </h1>
          <p className="text-muted-foreground max-w-3xl">
            Find your restaurant in the demo search, then add cuisine and any
            links you have. Veroxa will generate a preliminary audit showing
            your biggest daily customer opportunities online and which Veroxa
            service area is the best fit.
          </p>
          <p className="text-[12px] text-muted-foreground/80 max-w-3xl mt-2 italic">
            This audit does not scrape or verify live platform data yet. It
            uses the information provided to produce a preliminary
            customer-flow readiness report.
          </p>
        </div>

        {/* Trust strip — what Veroxa reviews / what you receive / what this is not */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8"
          data-testid="audit-trust-strip"
        >
          <Card className="bg-card border-border" data-testid="audit-trust-reviews">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                What Veroxa reviews
              </p>
              <p className="text-[12px] text-muted-foreground">
                Your Google profile signals, website presence, social
                consistency, and ordering links — the places customers actually
                check before deciding.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border" data-testid="audit-trust-receive">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                What you receive
              </p>
              <p className="text-[12px] text-muted-foreground">
                A readiness report, your top daily customer opportunities, a
                simple 30-day plan, and the Veroxa service area most likely to
                fit.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border" data-testid="audit-trust-not">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
                What this is not
              </p>
              <p className="text-[12px] text-muted-foreground">
                Not a contract, not a charge, and not a guaranteed result. The
                audit is a preliminary read — Veroxa will not post, change, or
                contact anyone without you.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Find My Restaurant — live Google Places with preview fallback */}
        <Card
          className="bg-card border-border mb-4"
          data-testid="restaurant-search-card"
        >
          <CardHeader>
            <CardTitle className="text-base inline-flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              Find your restaurant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[12px] text-muted-foreground mb-3">
              Enter your restaurant name, city, and state. Veroxa will look up
              your restaurant on Google when live lookup is configured, or fall
              back to a preview match so you can continue.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <Field
                label="Restaurant name *"
                testId="restaurant-search-name"
              >
                <Input
                  value={input.restaurantName}
                  onChange={(e) =>
                    handleChange("restaurantName", e.target.value)
                  }
                  placeholder="e.g. El Sol Tacos"
                />
              </Field>
              <Field label="City" testId="restaurant-search-city">
                <Input
                  value={input.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="e.g. San Antonio"
                />
              </Field>
              <Field label="State" testId="restaurant-search-state">
                <Input
                  value={input.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  placeholder="e.g. TX"
                />
              </Field>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] text-muted-foreground italic inline-flex items-center gap-1">
                <Info className="w-3 h-3" /> Live lookup depends on
                configuration. Some signals may require manual review.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleFindRestaurant}
                disabled={isSearching}
                data-testid="btn-find-restaurant"
              >
                <Search className="w-3.5 h-3.5 mr-1" />
                {isSearching ? "Searching…" : "Find my restaurant"}
              </Button>
            </div>
            {searchError && (
              <p
                className="text-[12px] text-amber-400 mt-3"
                data-testid="restaurant-search-error"
              >
                {searchError}
              </p>
            )}
            {candidateSearchRan && !isSearching && searchMode === "live" && (
              <div className="mt-3 space-y-1">
                <p
                  className="text-[12px] text-muted-foreground"
                  data-testid="restaurant-search-mode-note"
                >
                  {candidateResults.length > 0 &&
                  candidateResults.every(
                    (c) => c.source === "live" && c.matchConfidence === "low",
                  )
                    ? "We found possible matches. Please select the correct restaurant or continue manually."
                    : strategiesTried &&
                        strategiesTried.some(
                          (s) =>
                            s !== "autocomplete" &&
                            s !== "broad_name_city_state",
                        )
                      ? "We broadened the search to find more possible matches."
                      : "Live Google lookup found possible matches."}
                </p>
                {(strategiesTried || liveTotalRaw !== undefined) && (
                  <p className="text-[11px] text-muted-foreground/50">
                    {[
                      strategiesTried
                        ? `Search strategies tried: ${strategiesTried.length}`
                        : null,
                      liveTotalRaw !== undefined
                        ? `Candidates checked: ${liveTotalRaw}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>
            )}
            {candidateSearchRan && !isSearching && searchMode !== "live" && (
              <p
                className="text-[12px] text-muted-foreground italic mt-3"
                data-testid="restaurant-search-mode-note"
              >
                {searchMode === "not_configured"
                  ? "Live Google lookup is not configured here yet. Showing preview fallback results so you can continue."
                  : "Live lookup did not return matches. Showing preview fallback results so you can continue."}
              </p>
            )}
            {selectedCandidate && (
              <div
                className="mt-4 rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3"
                data-testid="restaurant-search-selected"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[11px] uppercase tracking-wider text-emerald-400">
                        Selected restaurant
                      </p>
                      <Badge
                        variant="outline"
                        className={
                          selectedCandidate.source === "live"
                            ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/5"
                            : "border-muted-foreground/30 text-muted-foreground bg-muted/10"
                        }
                      >
                        {selectedCandidate.source === "live"
                          ? selectedCandidate.matchConfidence === "high"
                            ? "Live Google match"
                            : "Possible live match"
                          : "Preview fallback result"}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold mt-1">
                      {liveProfile?.name ?? selectedCandidate.restaurantName}
                    </p>
                    <p className="text-[12px] text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {liveProfile?.address ?? selectedCandidate.addressLine}
                      {!liveProfile && selectedCandidate.city
                        ? ` · ${selectedCandidate.city}, ${selectedCandidate.state}`
                        : ""}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      {selectedCandidate.cuisineType ??
                        "Restaurant / Food — category not verified"}
                    </p>
                    {detailsLoading && (
                      <p className="text-[12px] text-muted-foreground italic mt-2">
                        Loading live profile and scanning website…
                      </p>
                    )}
                    {detailsMessage && !detailsLoading && (
                      <p className="text-[12px] text-amber-400 mt-2">
                        {detailsMessage}
                      </p>
                    )}
                    {liveProfile && !detailsLoading && (
                      <div className="mt-3 space-y-1 text-[12px] text-muted-foreground">
                        {liveProfile.phone && (
                          <p>
                            <span className="text-foreground/80">Phone:</span>{" "}
                            {liveProfile.phone}
                          </p>
                        )}
                        {typeof liveProfile.rating === "number" && (
                          <p className="inline-flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-400" />
                            {liveProfile.rating.toFixed(1)}
                            {typeof liveProfile.reviewCount === "number" && (
                              <span>· {liveProfile.reviewCount} reviews</span>
                            )}
                          </p>
                        )}
                        {liveProfile.websiteUrl && (
                          <p className="truncate">
                            <span className="text-foreground/80">Website:</span>{" "}
                            <a
                              href={liveProfile.websiteUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="underline"
                            >
                              {liveProfile.websiteUrl}
                            </a>
                          </p>
                        )}
                        {liveProfile.googleMapsUrl && (
                          <p className="truncate">
                            <span className="text-foreground/80">
                              Google Maps:
                            </span>{" "}
                            <a
                              href={liveProfile.googleMapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="underline"
                            >
                              View listing
                            </a>
                          </p>
                        )}
                        {liveWebPresence?.websiteFound && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {liveWebPresence.menuLinkFound && (
                              <Badge variant="outline" className="text-[10px]">
                                Menu link found
                              </Badge>
                            )}
                            {liveWebPresence.orderLinkFound && (
                              <Badge variant="outline" className="text-[10px]">
                                Order link found
                              </Badge>
                            )}
                            {liveWebPresence.contactPathFound && (
                              <Badge variant="outline" className="text-[10px]">
                                Contact path found
                              </Badge>
                            )}
                            {liveWebPresence.instagramLinkFound && (
                              <Badge variant="outline" className="text-[10px]">
                                Instagram link found
                              </Badge>
                            )}
                            {liveWebPresence.facebookLinkFound && (
                              <Badge variant="outline" className="text-[10px]">
                                Facebook link found
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleClearSelectedCandidate}
                    data-testid="btn-clear-selected-restaurant"
                  >
                    <X className="w-3.5 h-3.5 mr-1" /> Clear
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground italic mt-2">
                  Confirm the details and any links below, then generate your
                  audit.
                </p>
              </div>
            )}
            {candidateSearchRan && !selectedCandidate && (
              <div className="mt-4 space-y-2">
                {candidateResults.length === 0 ? (
                  <div
                    className="rounded-md border border-border bg-muted/20 p-3"
                    data-testid="restaurant-search-empty"
                  >
                    <p className="text-sm font-semibold">
                      No live match found yet.
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      Try a shorter name, alternate spelling, or continue
                      manually — Veroxa can still review it.
                    </p>
                    <p className="text-[12px] text-muted-foreground/80 mt-1">
                      Tip: Some restaurants appear under a different Google
                      listing name. Try the main word only — for example
                      "Selda" instead of the full name.
                    </p>
                    {(strategiesTried || liveTotalRaw !== undefined) && (
                      <p className="text-[11px] text-muted-foreground/40 mt-2">
                        {[
                          strategiesTried
                            ? `Strategies tried: ${strategiesTried.length}`
                            : null,
                          liveTotalRaw !== undefined
                            ? `Candidates checked: ${liveTotalRaw}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {searchMode === "live"
                        ? "Possible matches — select the one that looks right"
                        : "Preview matches"}
                    </p>
                    {searchMode === "live" && (
                      <p className="text-[11px] text-muted-foreground/80">
                        Tip: If you do not see your restaurant, try a shorter
                        name or spelling variation, then search again.
                      </p>
                    )}
                    <div
                      className="grid grid-cols-1 md:grid-cols-2 gap-2"
                      data-testid="restaurant-search-results"
                    >
                      {candidateResults.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="text-left rounded-md border border-border bg-muted/20 hover:bg-muted/40 transition-colors p-3"
                          onClick={() => handleSelectCandidate(c)}
                          data-testid={`restaurant-candidate-${c.id}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold">
                              {c.restaurantName}
                            </p>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <Badge
                                variant="outline"
                                className={
                                  c.source === "live"
                                    ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/5"
                                    : "border-muted-foreground/30 text-muted-foreground bg-muted/10"
                                }
                              >
                                {c.source === "live"
                                  ? c.matchConfidence === "high"
                                    ? "Live Google match"
                                    : "Possible live match"
                                  : "Preview fallback result"}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={matchConfidenceTone[c.matchConfidence]}
                              >
                                {matchConfidenceLabel[c.matchConfidence]}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-[12px] text-muted-foreground inline-flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {c.addressLine}
                            {c.source === "preview" && c.city
                              ? ` · ${c.city}, ${c.state}`
                              : ""}
                          </p>
                          {c.cuisineType && (
                            <p className="text-[12px] text-muted-foreground mt-0.5">
                              {c.cuisineType}
                            </p>
                          )}
                          {typeof c.googleRating === "number" && (
                            <p className="text-[12px] text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                              <Star className="w-3 h-3 text-amber-400" />
                              {c.googleRating.toFixed(1)}
                              {typeof c.reviewCount === "number" && (
                                <span className="text-muted-foreground/70">
                                  · {c.reviewCount} reviews
                                </span>
                              )}
                            </p>
                          )}
                          {c.note && (
                            <p className="text-[12px] text-muted-foreground/90 mt-1">
                              {c.note}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">
              Tell us about your restaurant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
              data-testid="audit-form"
            >
              {/* Required */}
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                  Required
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Restaurant name *" testId="audit-name">
                    <Input
                      value={input.restaurantName}
                      onChange={(e) =>
                        handleChange("restaurantName", e.target.value)
                      }
                      required
                    />
                  </Field>
                  <Field
                    label="Cuisine type (optional)"
                    testId="audit-cuisine"
                  >
                    <Input
                      value={input.cuisineType}
                      onChange={(e) =>
                        handleChange("cuisineType", e.target.value)
                      }
                      placeholder="Leave blank if unsure — Veroxa will note it as unverified."
                    />
                  </Field>
                  <Field label="City *" testId="audit-city">
                    <Input
                      value={input.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="State *" testId="audit-state">
                    <Input
                      value={input.state}
                      onChange={(e) => handleChange("state", e.target.value)}
                      required
                    />
                  </Field>
                </div>
              </div>

              {/* Optional links */}
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                  Optional links
                </p>
                <p className="text-[11px] text-muted-foreground/80 mb-2">
                  Links are optional, but they help Veroxa make the
                  preliminary audit more useful. If you do not have a link,
                  leave it blank — missing links may reveal a growth
                  opportunity.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field
                    label="Google Business Profile link"
                    testId="audit-google"
                  >
                    <Input
                      value={input.googleListingUrl ?? ""}
                      onChange={(e) =>
                        handleChange("googleListingUrl", e.target.value)
                      }
                      placeholder="https://maps.google.com/..."
                    />
                  </Field>
                  <Field label="Website link" testId="audit-website">
                    <Input
                      value={input.websiteUrl ?? ""}
                      onChange={(e) =>
                        handleChange("websiteUrl", e.target.value)
                      }
                      placeholder="https://..."
                    />
                  </Field>
                  <Field label="Instagram link" testId="audit-instagram">
                    <Input
                      value={input.instagramUrl ?? ""}
                      onChange={(e) =>
                        handleChange("instagramUrl", e.target.value)
                      }
                    />
                  </Field>
                  <Field label="Facebook link" testId="audit-facebook">
                    <Input
                      value={input.facebookUrl ?? ""}
                      onChange={(e) =>
                        handleChange("facebookUrl", e.target.value)
                      }
                    />
                  </Field>
                  <Field label="TikTok link" testId="audit-tiktok">
                    <Input
                      value={input.tiktokUrl ?? ""}
                      onChange={(e) =>
                        handleChange("tiktokUrl", e.target.value)
                      }
                    />
                  </Field>
                  <Field
                    label="Menu / Ordering link"
                    testId="audit-menu"
                  >
                    <Input
                      value={input.menuOrderingUrl ?? ""}
                      onChange={(e) =>
                        handleChange("menuOrderingUrl", e.target.value)
                      }
                      placeholder="https://..."
                    />
                  </Field>
                  <Field label="Other link" testId="audit-other">
                    <Input
                      value={input.otherUrl ?? ""}
                      onChange={(e) =>
                        handleChange("otherUrl", e.target.value)
                      }
                      placeholder="Reservation, catering, anything else"
                    />
                  </Field>
                </div>
                <p className="text-[11px] text-muted-foreground/80 mt-2">
                  Do not worry if you do not have every link. Missing links
                  can reveal where your online system may need help.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                  <Info className="w-3 h-3" /> No data is sent anywhere. The
                  audit runs in your browser.
                </p>
                <Button
                  type="submit"
                  className="font-semibold"
                  data-testid="audit-submit"
                >
                  Generate audit <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Report */}
        <div id="audit-report-anchor" />
        {report && (
          <div className="mt-10 space-y-6" data-testid="audit-report">
            {/* Overall */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-primary mb-1">
                      Veroxa Restaurant Growth Report
                    </p>
                    <p
                      className="text-2xl md:text-3xl font-bold mt-0.5"
                      data-testid="audit-grade-headline"
                    >
                      {report.input.restaurantName}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                      A preliminary look at how this restaurant appears across
                      Google, Maps, website, social media, trust signals, and
                      customer decision paths.
                    </p>
                    <p
                      className="text-[11px] text-muted-foreground mt-2 tabular-nums"
                      data-testid="audit-total-score"
                    >
                      Readiness: {report.gradeLabel} · Internal reference:{" "}
                      {report.totalScore} / 100
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {report.input.cuisineType} · {report.input.city},{" "}
                      {report.input.state}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant="outline"
                      className="border-amber-500/40 text-amber-400 bg-amber-500/5"
                    >
                      Preliminary
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`inline-flex items-center gap-1 ${confidenceTone[report.auditConfidence]}`}
                      data-testid="audit-confidence-badge"
                    >
                      <ShieldCheck className="w-3 h-3" /> Confidence:{" "}
                      {report.confidenceLabel}
                    </Badge>
                  </div>
                </div>
                <Separator className="my-4" />
                <p className="text-sm text-foreground/90">
                  This does not judge the food or quality of the restaurant. It
                  shows how consistently the restaurant appears online when
                  nearby customers are deciding where to eat. More consistent
                  visibility can create more customer reminder moments, but
                  results vary by location, offer, food quality, competition,
                  and execution.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {report.gradeDescription}
                </p>
                <p
                  className="text-[12px] text-muted-foreground/80 italic mt-2"
                  data-testid="audit-confidence-explanation"
                >
                  Preliminary audit confidence: {report.confidenceLabel}.{" "}
                  {report.confidenceExplanation}
                </p>
              </CardContent>
            </Card>

            {/* Growth Report Sections — 11 structured areas */}
            <Card className="bg-card border-border" data-testid="growth-report-sections">
              <CardHeader>
                <CardTitle className="text-base inline-flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" /> Growth Report
                  Sections
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {report.growthReportSections.map((sec) => (
                  <div
                    key={sec.id}
                    className="border-b border-border last:border-0 pb-4 last:pb-0"
                    data-testid={`growth-section-${sec.id}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <p className="text-sm font-semibold inline-flex items-center gap-1.5">
                        {sectionIcon[sec.id]}
                        {sec.title}
                      </p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${sourceLabelTone[sec.sourceLabel]}`}
                      >
                        {sourceLabelText[sec.sourceLabel]}
                      </Badge>
                    </div>
                    <p className="text-[12px] text-muted-foreground mb-1">
                      <span className="font-medium text-foreground/90">
                        Current signal:{" "}
                      </span>
                      {sec.currentSignal}
                    </p>
                    <p className="text-[12px] text-muted-foreground mb-1">
                      <span className="font-medium text-foreground/90">
                        Why it matters:{" "}
                      </span>
                      {sec.whyItMatters}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      <span className="font-medium text-foreground/90">
                        Veroxa recommendation:{" "}
                      </span>
                      {sec.veroxaRecommendation}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* AI-assisted draft — V1 */}
            <Card
              className="bg-card border-border"
              data-testid="ai-audit-draft-card"
            >
              <CardHeader>
                <CardTitle className="text-base inline-flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  AI-assisted summary (draft)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-[12px] text-muted-foreground">
                  Optional: turn the rule-based report above into an
                  owner-friendly draft. The rule-based report stays the source
                  of truth.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleGenerateAiDraft}
                    disabled={aiDraftLoading}
                    data-testid="generate-ai-audit-draft-button"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    {aiDraftLoading
                      ? "Generating…"
                      : aiDraft
                        ? "Regenerate AI-assisted summary"
                        : "Generate AI-assisted summary"}
                  </Button>
                  {aiDraftMode === "ai" ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-emerald-500/40 text-emerald-400 bg-emerald-500/5"
                    >
                      AI-assisted draft
                    </Badge>
                  ) : null}
                </div>

                {aiDraftMode === "not_configured" ? (
                  <div
                    className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-[12px] text-amber-300"
                    data-testid="ai-audit-not-configured"
                  >
                    AI summary is not configured yet. The rule-based report is
                    still available.
                  </div>
                ) : null}

                {aiDraftMode === "error" ? (
                  <div
                    className="rounded-md border border-rose-500/40 bg-rose-500/5 p-3 text-[12px] text-rose-300"
                    data-testid="ai-audit-error"
                  >
                    {aiDraftMessage ||
                      "AI draft is temporarily unavailable. The rule-based report is still available below."}
                  </div>
                ) : null}

                {aiDraftMode === "ai" && aiDraft ? (
                  <div
                    className="space-y-4 rounded-md border border-border bg-muted/20 p-3"
                    data-testid="ai-audit-draft-panel"
                  >
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                      <p className="text-[11px] text-muted-foreground">
                        AI-assisted draft — review before sharing. This draft
                        is generated from the audit signals shown above. It
                        may need human review before being shared with a
                        restaurant owner.
                      </p>
                    </div>

                    {aiDraft.executiveSummary ? (
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                          Executive summary
                        </p>
                        <p className="text-sm">{aiDraft.executiveSummary}</p>
                      </div>
                    ) : null}

                    {aiDraft.topOpportunities.length > 0 ? (
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                          Top opportunities
                        </p>
                        <ul className="text-sm list-disc pl-5 space-y-1">
                          {aiDraft.topOpportunities.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {aiDraft.veroxaFixPlan ? (
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                          What Veroxa would fix first
                        </p>
                        <p className="text-sm">{aiDraft.veroxaFixPlan}</p>
                      </div>
                    ) : null}

                    {aiDraft.manualReviewNeeded.length > 0 ? (
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                          Manual review needed
                        </p>
                        <ul className="text-sm list-disc pl-5 space-y-1 text-muted-foreground">
                          {aiDraft.manualReviewNeeded.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {aiDraft.ownerFriendlyClosing ? (
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                          Owner-friendly closing
                        </p>
                        <p className="text-sm">
                          {aiDraft.ownerFriendlyClosing}
                        </p>
                      </div>
                    ) : null}

                    <p className="text-[10px] text-muted-foreground italic">
                      Not auto-sent, not saved, not published. The Veroxa
                      team must review and approve before any client sees
                      this.
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Customer-flow explanation */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base inline-flex items-center gap-2">
                  <Compass className="w-4 h-4 text-primary" /> What this means
                  for customer flow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">{report.customerFlowExplanation}</p>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  {CUSTOMER_FLOW_STAGES.map((s) => (
                    <div
                      key={s.stage}
                      className="rounded-md border border-border bg-muted/20 p-2"
                    >
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {s.stageLabel}
                      </p>
                      <p className="text-[11px] mt-0.5">{s.stageDescription}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Category breakdown */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">
                  Category breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.categories.map((c) => (
                  <div
                    key={c.id}
                    className="border-b border-border last:border-0 pb-3 last:pb-0"
                    data-testid={`audit-category-${c.id}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold">{c.label}</p>
                      <span className="text-xs tabular-nums">
                        {c.score} / {c.maxScore}
                      </span>
                    </div>
                    <ScoreBar score={c.score} max={c.maxScore} />
                    <p className="text-[12px] text-muted-foreground mt-2">
                      <span className="font-medium text-foreground/90">
                        What it means:
                      </span>{" "}
                      {c.whatItMeans}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      <span className="font-medium text-foreground/90">
                        Customer flow impact:
                      </span>{" "}
                      {c.customerFlowImpact}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      <span className="font-medium text-foreground/90">
                        How Veroxa helps:
                      </span>{" "}
                      {c.howVeroxaHelps}
                    </p>
                    <p className="text-[11px] text-muted-foreground/80 mt-1 italic">
                      {c.explanation}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Top daily customer opportunities */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base inline-flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" /> Top 3 daily
                  customer opportunities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.weakSpots.map((w, i) => (
                  <div
                    key={`${w.categoryId}-${i}`}
                    className="rounded-md border border-border bg-muted/20 p-3"
                    data-testid={`audit-weak-${w.categoryId}`}
                  >
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Opportunity {i + 1}
                    </p>
                    <p className="text-sm font-semibold mt-0.5">{w.title}</p>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      <span className="font-medium text-foreground/90">
                        Why this matters for walk-ins:
                      </span>{" "}
                      {w.whyItMatters}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      <span className="font-medium text-foreground/90">
                        What Veroxa can do:
                      </span>{" "}
                      {w.howVeroxaHelps}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Where Veroxa fits — static service alignment panel */}
            <Card
              className="bg-card border-border"
              data-testid="where-veroxa-fits"
            >
              <CardHeader>
                <CardTitle className="text-base inline-flex items-center gap-2">
                  <Compass className="w-4 h-4 text-primary" /> Where Veroxa
                  fits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/90 mb-3">
                  If this restaurant became a Veroxa client, the first focus
                  would likely be:
                </p>
                <ul className="space-y-1.5 mb-3">
                  {VEROXA_FIRST_FOCUS_ACTIONS.map((action) => (
                    <li
                      key={action}
                      className="text-[12px] text-foreground/90 flex items-start gap-2"
                    >
                      <span className="mt-[3px] shrink-0 w-1.5 h-1.5 rounded-full bg-primary/60" />
                      {action}
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-muted-foreground italic">
                  Veroxa does not guarantee walk-ins, revenue, rankings,
                  reviews, viral posts, or sales. Results vary by location,
                  offer, food quality, competition, and execution.
                </p>
              </CardContent>
            </Card>

            {/* Opportunities */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">
                  Top growth opportunities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.opportunities.map((o) => (
                  <div
                    key={o.id}
                    className="rounded-md border border-border bg-muted/20 p-3"
                  >
                    <p className="text-sm font-semibold">{o.title}</p>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      {o.whyItMatters}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      <span className="font-medium text-foreground/90">
                        Veroxa approach:
                      </span>{" "}
                      {o.veroxaApproach}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recommended package */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">
                  Recommended Veroxa package
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                  <p
                    className="text-lg font-semibold"
                    data-testid="audit-package-label"
                  >
                    {report.recommendation.packageLabel}
                  </p>
                  <div className="text-right">
                    <p className="text-sm">
                      {report.recommendation.standardPriceDisplay}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {report.recommendation.foundingPriceDisplay}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-foreground/90">
                  {report.recommendation.reason}
                </p>
                {report.recommendation.whyNotAdsYet && (
                  <p className="text-[12px] text-amber-400/90 mt-2">
                    {report.recommendation.whyNotAdsYet}
                  </p>
                )}
                {report.recommendation.expectedDirection && (
                  <p
                    className="text-[12px] text-muted-foreground italic mt-2"
                    data-testid="audit-expected-direction"
                  >
                    Expected direction (not a guarantee):{" "}
                    {report.recommendation.expectedDirection}
                  </p>
                )}
                <Separator className="my-3" />
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                  What Veroxa would focus on first
                </p>
                <ul className="text-[12px] text-foreground/90 space-y-1 list-disc pl-5">
                  {report.recommendation.firstSteps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* 30-day plan */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">
                  30-day improvement plan
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {plan.map((w) => (
                  <div
                    key={w.week}
                    className="rounded-md border border-border bg-muted/20 p-3"
                  >
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Week {w.week}
                    </p>
                    <p className="text-sm font-semibold mt-0.5">{w.title}</p>
                    <ul className="text-[12px] text-muted-foreground mt-1 space-y-1 list-disc pl-5">
                      {w.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Can / cannot */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm inline-flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> What
                    Veroxa can improve
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-[12px] text-foreground/90 space-y-1 list-disc pl-5">
                    {canImprove.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm inline-flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" /> What
                    Veroxa cannot guarantee or control
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-[12px] text-muted-foreground space-y-1 list-disc pl-5">
                    {cannotGuarantee.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Timeline */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">
                  Expected timeline of impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {AUDIT_EXPECTED_IMPACT_TIMELINE.map((t) => (
                  <div
                    key={t.period}
                    className="flex flex-col sm:flex-row sm:gap-3 border-b border-border last:border-0 pb-2 last:pb-0"
                  >
                    <p className="text-[12px] font-semibold text-foreground/90 sm:w-32 shrink-0">
                      {t.period}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      {t.summary}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Adaptive learning */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base inline-flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> Adaptive
                  learning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/90">
                  {AUDIT_ADAPTIVE_LEARNING_EXPLANATION}
                </p>
              </CardContent>
            </Card>

            {/* Self-improving system positioning (M032) */}
            <Card className="bg-card border-border">
              <CardContent className="p-4 space-y-2">
                <p className="text-sm text-foreground/90">
                  Veroxa is designed to be a self-improving restaurant growth
                  system. The audit is the starting point. If you choose to
                  work with Veroxa, the system keeps learning from uploads,
                  direction, content decisions, Google/social activity, and
                  results to recommend better actions over time.
                </p>
                <p className="text-[12px] text-muted-foreground">
                  For founding clients, Veroxa is intentionally priced to make
                  a serious online growth system accessible to independent
                  restaurants.
                </p>
              </CardContent>
            </Card>

            {/* Walkthrough request form (M028) */}
            <Card
              className="bg-card border-border"
              data-testid="walkthrough-request-card"
            >
              <CardHeader>
                <CardTitle className="text-base inline-flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-primary" />
                  Request a manual audit walkthrough
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/90 mb-3">
                  Veroxa can manually review this audit with you and explain
                  which service area best fits the priority opportunities
                  above.
                </p>
                {walkthroughSaved ? (
                  <div
                    className="rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3"
                    data-testid="walkthrough-success"
                  >
                    <p className="text-sm font-semibold text-emerald-400">
                      Thanks — your walkthrough request is saved for this demo.
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      In production, a Veroxa team member would reach out using
                      your preferred contact method to walk through this audit
                      and recommend the best fit. No charge until you decide to
                      move forward.
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={handleWalkthroughSubmit}
                    className="space-y-3"
                    data-testid="walkthrough-form"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Field label="Contact name" testId="walkthrough-name">
                        <Input
                          value={contact.contactName ?? ""}
                          onChange={(e) =>
                            handleContactChange("contactName", e.target.value)
                          }
                        />
                      </Field>
                      <Field
                        label="Best time to contact"
                        testId="walkthrough-best-time"
                      >
                        <Input
                          value={contact.bestTimeToContact ?? ""}
                          onChange={(e) =>
                            handleContactChange(
                              "bestTimeToContact",
                              e.target.value,
                            )
                          }
                          placeholder="Weekday afternoons, after 3pm…"
                        />
                      </Field>
                      <Field label="Phone" testId="walkthrough-phone">
                        <Input
                          type="tel"
                          value={contact.phone ?? ""}
                          onChange={(e) =>
                            handleContactChange("phone", e.target.value)
                          }
                        />
                      </Field>
                      <Field label="Email" testId="walkthrough-email">
                        <Input
                          type="email"
                          value={contact.email ?? ""}
                          onChange={(e) =>
                            handleContactChange("email", e.target.value)
                          }
                        />
                      </Field>
                      <Field
                        label="Preferred contact method"
                        testId="walkthrough-preferred"
                      >
                        <select
                          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                          value={contact.preferredContactMethod ?? "any"}
                          onChange={(e) =>
                            handleContactChange(
                              "preferredContactMethod",
                              e.target.value as PreferredContactMethod,
                            )
                          }
                        >
                          <option value="any">No preference</option>
                          <option value="phone">Phone call</option>
                          <option value="text">Text message</option>
                          <option value="email">Email</option>
                        </select>
                      </Field>
                      <Field label="Optional note" testId="walkthrough-note">
                        <Input
                          value={contact.note ?? ""}
                          onChange={(e) =>
                            handleContactChange("note", e.target.value)
                          }
                          placeholder="Anything Veroxa should know first"
                        />
                      </Field>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Required: at least a phone number or email so Veroxa can
                      follow up.
                    </p>
                    {walkthroughError && (
                      <p
                        className="text-[12px] text-amber-400"
                        data-testid="walkthrough-error"
                      >
                        {walkthroughError}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-[11px] text-muted-foreground italic">
                        Demo note: this request is saved locally in this
                        preview. Production lead capture will be connected
                        later.
                      </p>
                      <Button
                        type="submit"
                        data-testid="walkthrough-submit"
                        className="font-semibold"
                      >
                        Request walkthrough{" "}
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <p className="text-[11px] text-muted-foreground italic">
                  {AUDIT_DISCLAIMER}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  testId,
  children,
}: {
  label: string;
  testId: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block" data-testid={`field-${testId}`}>
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1 block">
        {label}
      </span>
      {children}
    </label>
  );
}
