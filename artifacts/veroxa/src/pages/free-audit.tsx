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
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import type {
  AuditLeadContact,
  AuditLeadSelectedRestaurant,
  PreferredContactMethod,
} from "@/lib/leads/leadTypes";
import {
  searchRestaurantCandidates,
  type RestaurantSearchCandidate,
} from "@/data/demo/demoRestaurantSearch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { generateRestaurantAudit } from "@/lib/audit/auditScoring";
import {
  AUDIT_DISCLAIMER,
  AUDIT_EXPECTED_IMPACT_TIMELINE,
  formatThirtyDayPlan,
  formatWhatVeroxaCanImprove,
  formatWhatVeroxaCannotGuarantee,
  WHAT_VEROXA_NEEDS_FROM_RESTAURANT,
} from "@/lib/audit/auditReportFormatter";
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
  currentGoal: "",
  biggestProblem: "",
  notes: "",
};

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
  veroxa_needs: <CheckCircle2 className="w-4 h-4 text-primary" />,
};

const GROWTH_SECTION_GROUPS: { groupTitle: string; sectionIds: string[] }[] = [
  {
    groupTitle: "Google Visibility",
    sectionIds: ["google_search_seo", "google_maps_seo", "gbp_strength"],
  },
  { groupTitle: "Customer Action Path", sectionIds: ["website_menu_path"] },
  {
    groupTitle: "Social Reminder Rhythm",
    sectionIds: ["social_standing", "content_consistency"],
  },
  { groupTitle: "Trust Signals", sectionIds: ["reviews_trust"] },
  { groupTitle: "Ads Readiness", sectionIds: ["ads_readiness"] },
  {
    groupTitle: "Identity & Location",
    sectionIds: ["identity", "walk_in_opportunity"],
  },
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
  useDocumentMeta({
    title: "Free Restaurant Audit — Veroxa",
    description: "Request a free restaurant online presence audit from Veroxa.",
  });

  const [input, setInput] = useState<RestaurantAuditInput>(initialInput);
  const [report, setReport] = useState<RestaurantAuditReport | null>(null);
  const [contact, setContact] = useState<AuditLeadContact>(emptyContact);
  const [walkthroughSaved, setWalkthroughSaved] = useState(false);
  const [walkthroughError, setWalkthroughError] = useState<string | null>(null);

  // Unified candidate type: covers both live Google Places candidates and
  // fixture/preview fallback candidates. `source` drives the UI badge.
  type UnifiedCandidate = {
    source: "preview" | "manual";
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
    "idle" | "fixture_fallback" | "not_configured"
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

  function adaptFixtureCandidate(
    c: RestaurantSearchCandidate,
  ): UnifiedCandidate {
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
    return {
      selectedRestaurantId: selectedCandidate.id,
      selectedRestaurantName: selectedCandidate.restaurantName,
      selectedCity: selectedCandidate.city,
      selectedState: selectedCandidate.state,
      selectedAddress: selectedCandidate.addressLine,
      selectedCuisineType: selectedCandidate.cuisineType,
      selectedMatchConfidence: selectedCandidate.matchConfidence,
      selectedSource:
        selectedCandidate.source === "manual" ? "manual" : "fixture",
      selectedRating: selectedCandidate.googleRating,
      selectedReviewCount: selectedCandidate.reviewCount,
      selectedWebsiteUrl: selectedCandidate.websiteUrl,
      selectedGoogleMapsUrl: selectedCandidate.googleMapsUrl,
    };
  }

  function buildManualFallbackCandidate(): UnifiedCandidate {
    const restaurantName =
      input.restaurantName.trim() || "Manual restaurant lead";
    const city = input.city.trim();
    const state = input.state.trim();
    return {
      source: "manual",
      id: `manual-${restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "restaurant"}`,
      restaurantName,
      city,
      state,
      addressLine:
        city || state
          ? `${[city, state].filter(Boolean).join(", ")} — address needs manual confirmation`
          : "Address needs manual confirmation",
      cuisineType:
        input.cuisineType.trim() || "Restaurant / Food — category not verified",
      googleMapsUrl: input.googleListingUrl || undefined,
      websiteUrl: input.websiteUrl || undefined,
      instagramUrl: input.instagramUrl || undefined,
      facebookUrl: input.facebookUrl || undefined,
      menuOrderingUrl: input.menuOrderingUrl || undefined,
      googleRating: input.googleRating,
      reviewCount: input.reviewCount,
      matchConfidence: "low",
      note: "Manual fallback: weak preview discoverability is a potential Veroxa opportunity, not a system failure.",
    };
  }

  function handleUseManualFallback() {
    handleSelectCandidate(buildManualFallbackCandidate());
  }

  async function handleFindRestaurant(e: FormEvent) {
    e.preventDefault();
    setSearchError(null);
    if (!input.restaurantName.trim()) {
      setSearchError("Add your restaurant name to start the lookup.");
      setCandidateResults([]);
      setCandidateSearchRan(false);
      return;
    }
    setIsSearching(true);
    setSelectedCandidate(null);
    setReport(null);
    try {
      const fixtureResults = searchRestaurantCandidates({
        restaurantName: input.restaurantName,
        city: input.city,
        state: input.state,
        cuisineType: input.cuisineType,
      });
      setStrategiesTried(undefined);
      setLiveTotalRaw(undefined);
      setLiveTotalDisplayed(undefined);
      setSearchMode("fixture_fallback");
      setCandidateResults(fixtureResults.map(adaptFixtureCandidate));
      setCandidateSearchRan(true);
    } finally {
      setIsSearching(false);
    }
  }

  function handleSelectCandidate(candidate: UnifiedCandidate) {
    setSelectedCandidate(candidate);
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
      restaurantSource: candidate.source === "manual" ? "manual" : "fixture",
    }));
    setReport(null);
    setWalkthroughSaved(false);
  }

  function handleClearSelectedCandidate() {
    setSelectedCandidate(null);
    setReport(null);
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
      setWalkthroughError(
        "Please share either a phone number or email so Veroxa can follow up.",
      );
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
      setWalkthroughError(
        "Could not save the walkthrough request in this preview. Please try again.",
      );
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
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.restaurantName || !input.city || !input.state) {
      return;
    }
    const cuisineForAudit =
      input.cuisineType.trim() || "Restaurant / Food — category not verified";
    const result = generateRestaurantAudit({
      ...input,
      cuisineType: cuisineForAudit,
    });
    setReport(result);
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
  const fixFirstSection =
    report?.growthReportSections.find((s) => s.id === "fix_first") ?? null;
  const veroxaNeedsSection =
    report?.growthReportSections.find((s) => s.id === "veroxa_needs") ?? null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10 md:py-14">
        {/* Hero */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-primary mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Free review-mode audit
          </div>
          <h1
            className="text-3xl md:text-4xl font-bold tracking-tight mb-2"
            data-testid="header-free-audit"
          >
            Get a Free Restaurant Online Presence Audit
          </h1>
          <p className="text-muted-foreground max-w-3xl">
            Share your restaurant details and generate a review-mode audit
            preview. Veroxa will review your online presence, identify
            visibility and consistency opportunities, and recommend a current
            plan fit for a manual first conversation.
          </p>
          <p className="text-[12px] text-muted-foreground/80 max-w-3xl mt-2 italic">
            This pre-live Free Audit uses the information you provide and
            preview matching only. Live Google/API scanning is not connected
            here yet, and recommendations are not guarantees. A full Veroxa plan
            requires Veroxa Team review.
          </p>
        </div>

        {/* Trust strip — what Veroxa reviews / what you receive / what this is not */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8"
          data-testid="audit-trust-strip"
        >
          <Card
            className="bg-card border-border"
            data-testid="audit-trust-reviews"
          >
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                What Veroxa reviews
              </p>
              <p className="text-[12px] text-muted-foreground">
                Google Business Profile links, website/menu paths, social
                profiles, media readiness, goals, and consistency signals — the
                places customers usually check before deciding.
              </p>
            </CardContent>
          </Card>
          <Card
            className="bg-card border-border"
            data-testid="audit-trust-receive"
          >
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

        {/* Find My Restaurant — preview matching only in pre-live mode */}
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
              Enter your restaurant name, city, and state. This pre-live page
              uses preview matching so you can continue without live Google/API
              scanning.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <Field label="Restaurant name *" testId="restaurant-search-name">
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
                <Info className="w-3 h-3" /> Preview matching only. Veroxa will
                manually review real online presence details before any
                recommendation is treated as final.
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
                {isSearching ? "Checking…" : "Preview match"}
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
            {candidateSearchRan && !isSearching && searchMode !== "idle" && (
              <p
                className="text-[12px] text-muted-foreground italic mt-3"
                data-testid="restaurant-search-mode-note"
              >
                {searchMode === "not_configured"
                  ? "Live Google/API scanning is not connected here yet. Showing preview results so you can continue."
                  : "Preview matching is shown so you can continue."}
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
                          "border-muted-foreground/30 text-muted-foreground bg-muted/10"
                        }
                      >
                        {selectedCandidate.source === "manual"
                          ? "Manual fallback"
                          : "Preview fallback result"}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold mt-1">
                      {selectedCandidate.restaurantName}
                    </p>
                    <p className="text-[12px] text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {selectedCandidate.addressLine}
                      {selectedCandidate.city
                        ? ` · ${selectedCandidate.city}, ${selectedCandidate.state}`
                        : ""}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      {selectedCandidate.cuisineType ??
                        "Restaurant / Food — category not verified"}
                    </p>
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
                      No preview match found yet.
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      Try a shorter name, alternate spelling, city/state, or
                      cuisine. If no confident match exists, continue manually —
                      Veroxa can still review it.
                    </p>
                    <p className="text-[12px] text-muted-foreground/80 mt-1">
                      Tip: Some restaurants appear under a different listing
                      name. A weak or missing match is a discoverability signal
                      and potential Veroxa opportunity, not a system failure.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={handleUseManualFallback}
                      data-testid="btn-use-manual-audit-fallback"
                    >
                      Continue as manual audit lead
                    </Button>
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
                      Preview matches
                    </p>
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
                                  "border-muted-foreground/30 text-muted-foreground bg-muted/10"
                                }
                              >
                                {c.source === "manual"
                                  ? "Manual fallback"
                                  : "Preview fallback result"}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={
                                  matchConfidenceTone[c.matchConfidence]
                                }
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
                  <Field label="Cuisine type (optional)" testId="audit-cuisine">
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
                  Links are optional, but they help Veroxa make the preliminary
                  audit more useful. If you do not have a link, leave it blank —
                  missing links may reveal a growth opportunity.
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
                  <Field label="Menu / Ordering link" testId="audit-menu">
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
                      onChange={(e) => handleChange("otherUrl", e.target.value)}
                      placeholder="Reservation, catering, anything else"
                    />
                  </Field>
                </div>
                <p className="text-[11px] text-muted-foreground/80 mt-2">
                  Do not worry if you do not have every link. Missing links can
                  reveal where your online system may need help.
                </p>
              </div>

              {/* Goals and readiness */}
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                  Goals and readiness
                </p>
                <p className="text-[11px] text-muted-foreground/80 mb-2">
                  A little context helps Veroxa understand whether you need
                  Google visibility, social consistency, Reels support, or a
                  Premium ads readiness assessment.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field
                    label="Main concern or goal"
                    testId="audit-current-goal"
                  >
                    <Textarea
                      value={input.currentGoal ?? ""}
                      onChange={(e) =>
                        handleChange("currentGoal", e.target.value)
                      }
                      placeholder="e.g. more consistent Google visibility, cleaner social posting, reels, catering inquiries, ads assessment"
                      rows={3}
                    />
                  </Field>
                  <Field
                    label="Biggest problem you notice"
                    testId="audit-biggest-problem"
                  >
                    <Textarea
                      value={input.biggestProblem ?? ""}
                      onChange={(e) =>
                        handleChange("biggestProblem", e.target.value)
                      }
                      placeholder="e.g. old photos, low media supply, inconsistent posting, menu links hard to find"
                      rows={3}
                    />
                  </Field>
                  <Field
                    label="Photo/video media supply"
                    testId="audit-media-readiness"
                  >
                    <Textarea
                      value={input.notes ?? ""}
                      onChange={(e) => handleChange("notes", e.target.value)}
                      placeholder="Tell us if you have usable photos/videos now, can send weekly media, or need guidance on what to capture."
                      rows={3}
                    />
                  </Field>
                  <div className="rounded-md border border-border bg-muted/20 p-3 text-[12px] text-muted-foreground leading-relaxed">
                    <p className="font-semibold text-foreground/90 mb-1">
                      What Veroxa reviews next
                    </p>
                    <p>
                      Google/local visibility, social consistency, usable media,
                      Reels readiness, and whether ads should stay parked until
                      Premium assessment, approval, and agreed ad budget.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                  <Info className="w-3 h-3" /> This preview runs in your
                  browser. Walkthrough requests are saved only for this pre-live
                  review/demo.
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
          <div className="mt-10 space-y-4" data-testid="audit-report">
            {/* 1. Overall header */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-primary mb-1">
                      Veroxa Review-Mode Restaurant Audit Preview
                    </p>
                    <p
                      className="text-2xl md:text-3xl font-bold mt-0.5"
                      data-testid="audit-grade-headline"
                    >
                      {report.input.restaurantName}
                    </p>
                    <p
                      className="text-[11px] text-muted-foreground mt-1 tabular-nums"
                      data-testid="audit-total-score"
                    >
                      Readiness: {report.gradeLabel} · Score:{" "}
                      {report.totalScore} / 100
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {report.input.cuisineType} · {report.input.city},{" "}
                      {report.input.state}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                      {report.gradeDescription}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant="outline"
                      className="border-amber-500/40 text-amber-400 bg-amber-500/5"
                    >
                      Review-mode preview
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
              </CardContent>
            </Card>

            {/* 2. What Veroxa would fix first */}
            <Card
              className="bg-card border-border"
              data-testid="fix-plan-summary"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base inline-flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-primary" /> What Veroxa would
                  fix first
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {fixFirstSection && (
                  <p className="text-sm text-foreground/90">
                    {fixFirstSection.veroxaRecommendation}
                  </p>
                )}
                {veroxaNeedsSection && (
                  <p className="text-[12px] text-muted-foreground">
                    {veroxaNeedsSection.currentSignal}
                  </p>
                )}
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
                    What Veroxa needs from the restaurant
                  </p>
                  <ul className="space-y-1">
                    {WHAT_VEROXA_NEEDS_FROM_RESTAURANT.map((item) => (
                      <li
                        key={item}
                        className="text-[12px] text-foreground/90 flex items-start gap-2"
                      >
                        <span className="mt-[3px] shrink-0 w-1.5 h-1.5 rounded-full bg-primary/60" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* 3. Top 3 daily customer opportunities */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
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
                        Why this matters:{" "}
                      </span>
                      {w.whyItMatters}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      <span className="font-medium text-foreground/90">
                        What Veroxa can do:{" "}
                      </span>
                      {w.howVeroxaHelps}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 4. Recommended package */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Plan-fit recommendation preview
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
              </CardContent>
            </Card>

            {/* 5. 30-day plan — compact phase strip */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  30-day improvement plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {plan.map((w) => (
                    <div
                      key={w.week}
                      className="rounded-md border border-border bg-muted/20 p-3"
                    >
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Week {w.week}
                      </p>
                      <p className="text-xs font-semibold mt-0.5 leading-snug">
                        {w.title}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 6. Full signal breakdown — collapsible */}
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold hover:bg-muted/30 transition-colors list-none">
                <span className="inline-flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" /> Full signal
                  breakdown
                </span>
                <span className="text-[11px] font-normal text-muted-foreground group-open:hidden">
                  Show
                </span>
                <span className="text-[11px] font-normal text-muted-foreground hidden group-open:inline">
                  Hide
                </span>
              </summary>
              <div
                className="mt-2 space-y-3"
                data-testid="growth-report-sections"
              >
                {/* Audit signal summary */}
                <Card
                  className="bg-card border-border"
                  data-testid="audit-confidence-strip"
                >
                  <CardContent className="p-4">
                    <p className="text-[11px] uppercase tracking-wider text-primary mb-3">
                      Audit signal summary
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[11px]">
                      <div className="rounded-md border border-border bg-muted/10 p-2 text-center">
                        <p className="text-muted-foreground mb-0.5">
                          Google profile
                        </p>
                        <p
                          className={
                            report.input.googleListingUrl
                              ? "text-emerald-400 font-medium"
                              : "text-muted-foreground/60"
                          }
                        >
                          {report.input.googleListingUrl
                            ? "Link provided"
                            : "Not confirmed"}
                        </p>
                      </div>
                      <div className="rounded-md border border-border bg-muted/10 p-2 text-center">
                        <p className="text-muted-foreground mb-0.5">Website</p>
                        <p
                          className={
                            report.input.websiteFound || report.input.websiteUrl
                              ? "text-emerald-400 font-medium"
                              : "text-muted-foreground/60"
                          }
                        >
                          {report.input.websiteFound
                            ? "Preview signal"
                            : report.input.websiteUrl
                              ? "Link provided"
                              : "Not confirmed"}
                        </p>
                      </div>
                      <div className="rounded-md border border-border bg-muted/10 p-2 text-center">
                        <p className="text-muted-foreground mb-0.5">
                          Menu / order
                        </p>
                        <p
                          className={
                            report.input.menuLinkFound ||
                            report.input.orderLinkFound ||
                            report.input.menuOrderingUrl
                              ? "text-emerald-400 font-medium"
                              : "text-muted-foreground/60"
                          }
                        >
                          {report.input.menuLinkFound ||
                          report.input.orderLinkFound
                            ? "Preview signal"
                            : report.input.menuOrderingUrl
                              ? "Link provided"
                              : "Not confirmed"}
                        </p>
                      </div>
                      <div className="rounded-md border border-border bg-muted/10 p-2 text-center">
                        <p className="text-muted-foreground mb-0.5">Social</p>
                        <p
                          className={
                            (report.input.discoveredSocialLinks?.length ?? 0) >
                              0 ||
                            report.input.instagramUrl ||
                            report.input.facebookUrl ||
                            report.input.tiktokUrl
                              ? "text-emerald-400 font-medium"
                              : "text-muted-foreground/60"
                          }
                        >
                          {(report.input.discoveredSocialLinks?.length ?? 0) > 0
                            ? `${report.input.discoveredSocialLinks!.length} preview signal(s)`
                            : report.input.instagramUrl ||
                                report.input.facebookUrl ||
                                report.input.tiktokUrl
                              ? "Links provided"
                              : "Not confirmed"}
                        </p>
                      </div>
                      <div className="rounded-md border border-border bg-muted/10 p-2 text-center">
                        <p className="text-muted-foreground mb-0.5">
                          Audit mode
                        </p>
                        <p
                          className={
                            report.input.restaurantSource === "google_places"
                              ? "text-emerald-400 font-medium"
                              : "text-muted-foreground/60"
                          }
                        >
                          {report.input.restaurantSource === "google_places"
                            ? "Review mode"
                            : report.input.restaurantSource === "fixture"
                              ? "Preview match"
                              : "Manual entry"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Grouped sections */}
                {GROWTH_SECTION_GROUPS.map((group) => {
                  const sections = report.growthReportSections.filter((s) =>
                    group.sectionIds.includes(s.id),
                  );
                  if (sections.length === 0) return null;
                  return (
                    <Card
                      key={group.groupTitle}
                      className="bg-card border-border"
                      data-testid={`growth-group-${group.groupTitle.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">
                          {group.groupTitle}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {sections.map((sec) => (
                          <div
                            key={sec.id}
                            className="border-b border-border last:border-0 pb-3 last:pb-0"
                            data-testid={`growth-section-${sec.id}`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                              <p className="text-xs font-semibold inline-flex items-center gap-1.5">
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
                                Signal:{" "}
                              </span>
                              {sec.currentSignal}
                            </p>
                            <p className="text-[12px] text-muted-foreground">
                              <span className="font-medium text-foreground/90">
                                Recommendation:{" "}
                              </span>
                              {sec.veroxaRecommendation}
                            </p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </details>

            {/* 7. Can / cannot + timeline — collapsible */}
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold hover:bg-muted/30 transition-colors list-none">
                <span className="inline-flex items-center gap-2">
                  <Compass className="w-4 h-4 text-primary" /> What Veroxa can
                  and cannot do
                </span>
                <span className="text-[11px] font-normal text-muted-foreground group-open:hidden">
                  Show
                </span>
                <span className="text-[11px] font-normal text-muted-foreground hidden group-open:inline">
                  Hide
                </span>
              </summary>
              <div className="mt-2 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Card className="bg-card border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm inline-flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />{" "}
                        What Veroxa can improve
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
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm inline-flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />{" "}
                        What Veroxa cannot guarantee
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
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
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
              </div>
            </details>

            {/* 8. Walkthrough form */}
            <Card
              className="bg-card border-border"
              data-testid="walkthrough-request-card"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base inline-flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-primary" />
                  Request a manual audit walkthrough
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/90 mb-3">
                  Veroxa can manually review this audit with you and explain
                  which service area best fits the priority opportunities above.
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

            {/* 10. Disclaimer */}
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
