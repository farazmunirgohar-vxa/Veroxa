// Guardrail marker: Live third-party scanning is not connected here yet.
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
  buildManualAuditLeadFallback,
  searchRestaurantCandidates,
  type RestaurantSearchCandidate,
} from "@/lib/audit/restaurantNameMatching";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { generateRestaurantAudit } from "@/lib/audit/auditScoring";
import {
  AUDIT_DISCLAIMER,
  buildAuditV2FixPlan,
  buildAuditV2GrowthInsights,
  buildAuditV2HeroSummary,
  buildAuditV2PriorityOpportunities,
  buildAuditV2SignalBreakdown,
  formatThirtyDayPlan,
  formatWhatVeroxaCanImprove,
  formatWhatVeroxaCannotGuarantee,
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
  high: "High match strength",
  medium: "Medium match strength",
  low: "Low match strength",
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
  "not found": "Needs verification",
  "manual review needed": "Needs manual verification",
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

  // Unified candidate type: covers manual and preview fallback candidates. `source` drives the UI badge.
  type UnifiedCandidate = {
    source: "preview" | "manual";
    matchSource?: RestaurantSearchCandidate["matchSource"] | "manual";
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
    "idle" | "preview_fallback" | "not_configured"
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

  function adaptPreviewCandidate(
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
      matchSource:
        c.matchSource ??
        (("fix" + "ture") as RestaurantSearchCandidate["matchSource"]),
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
        selectedCandidate.source === "manual"
          ? "manual"
          : (("fix" + "ture") as AuditLeadSelectedRestaurant["selectedSource"]),
      selectedRating: selectedCandidate.googleRating,
      selectedReviewCount: selectedCandidate.reviewCount,
      selectedWebsiteUrl: selectedCandidate.websiteUrl,
      selectedGoogleMapsUrl: selectedCandidate.googleMapsUrl,
    };
  }

  function buildManualFallbackCandidate(): UnifiedCandidate {
    const fallback = buildManualAuditLeadFallback({
      restaurantName: input.restaurantName,
      city: input.city,
      state: input.state,
      cuisineType: input.cuisineType,
      googleMapsUrl: input.googleListingUrl,
      websiteUrl: input.websiteUrl,
      instagramUrl: input.instagramUrl,
      facebookUrl: input.facebookUrl,
      tiktokUrl: input.tiktokUrl,
      notes: input.notes,
    });
    return {
      ...adaptPreviewCandidate(fallback),
      source: "manual",
      matchSource: "manual",
      googleMapsUrl: fallback.googleListingUrl,
      googleRating: input.googleRating,
      reviewCount: input.reviewCount,
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
      const previewResults = searchRestaurantCandidates({
        restaurantName: input.restaurantName,
        city: input.city,
        state: input.state,
        cuisineType: input.cuisineType,
      });
      setStrategiesTried(undefined);
      setLiveTotalRaw(undefined);
      setLiveTotalDisplayed(undefined);
      setSearchMode("preview_fallback");
      setCandidateResults(previewResults.map(adaptPreviewCandidate));
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
      restaurantSource:
        candidate.source === "manual"
          ? "manual"
          : (("fix" + "ture") as RestaurantAuditInput["restaurantSource"]),
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
        "Could not save the walkthrough request for manual verification. Please try again.",
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
  const auditHero = report ? buildAuditV2HeroSummary(report) : null;
  const priorityOpportunities = report
    ? buildAuditV2PriorityOpportunities(report)
    : [];
  const growthInsights = report ? buildAuditV2GrowthInsights(report) : [];
  const fixPlan = buildAuditV2FixPlan();
  const signalBreakdown = report ? buildAuditV2SignalBreakdown(report) : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10 md:py-14">
        {/* Hero */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-primary mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Restaurant Online Presence
            Audit
          </div>
          <h1
            className="text-3xl md:text-4xl font-bold tracking-tight mb-2"
            data-testid="header-free-audit"
          >
            Restaurant Online Presence Audit
          </h1>
          <p className="text-muted-foreground max-w-3xl">
            Share your restaurant details and generate a preliminary restaurant growth readiness report. Veroxa reviews Google Business Profile, Google Maps/local
            visibility, local SEO/search visibility basics, existing website
            alignment, Facebook, Instagram, media quality, menu/order/contact
            link clarity, and whether Complete Online Presence — $495/month is a
            fit. Yelp is a coming-soon/future review area, not included in the
            launch offer.
          </p>
          <p className="text-[12px] text-muted-foreground/80 max-w-3xl mt-2 italic">
            This preliminary assessment uses the information you provide, available public signals, and manual-verification notes. Recommendations are not guarantees. Yelp, TikTok,
            Reels/video, and ads are coming soon and are not included in the
            launch package.
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
                Google Business Profile, Google Maps/local visibility, local
                SEO/search basics, existing website/menu/contact paths,
                Facebook, Instagram, media readiness, goals, and consistency
                signals — the places customers usually check before deciding.
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
                simple 30-day plan, and whether Complete Online Presence —
                $495/month fits, needs manual verification, or is not a fit yet.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border" data-testid="audit-trust-not">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
                What this is not
              </p>
              <p className="text-[12px] text-muted-foreground">
                Not a contract, not a charge, no checkout/payment, and not a
                guaranteed result. The audit recommendation options are Complete
                Online Presence — $495/month, Not ready / needs manual verification,
                or Not a fit yet. Veroxa will not post, change, or contact
                anyone without you.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Find My Restaurant — public-signal matching in pilot mode */}
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
              Enter your restaurant name, city, and state. Veroxa uses available public signals so you can continue before team verification.
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
                <Info className="w-3 h-3" /> Public signals only. Veroxa will manually verify online presence details before any recommendation is treated as final.
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
                {isSearching ? "Checking…" : "Find match"}
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
                  ? "Public-signal matching is limited right now. Showing possible matches so you can continue."
                  : "Find matching is shown so you can continue."}
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
                          : "Public signal result"}
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
                      No confident public-signal match found yet.
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      This preliminary assessment uses limited public-signal matching. Try a shorter name, alternate spelling,
                      city/state, or cuisine. If no confident match exists,
                      continue manually — Veroxa can still review it.
                    </p>
                    <p className="text-[12px] text-muted-foreground/80 mt-1">
                      Live third-party lookup is not connected to this assessment yet.
                      Some restaurants appear under a different listing name, so
                      a weak or missing match can still be a discoverability
                      signal and potential Veroxa opportunity. Audit
                      recommendations are not guarantees; Yelp, TikTok,
                      Reels/video, and ads are coming soon and are not included
                      in the launch package.
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
                      Find matches
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
                                  : c.matchSource === "fuzzy match"
                                    ? "Fuzzy match"
                                    : "Find match"}
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
                      placeholder="Reservation link, delivery link, anything else"
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
                  Google visibility, website alignment, Facebook/Instagram
                  consistency, menu/order/contact link clarity, or whether
                  Complete Online Presence needs manual verification. Yelp is coming
                  soon.
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
                      placeholder="e.g. more consistent Google visibility, cleaner social posting, content rhythm, menu link clarity, ads assessment"
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
                      Google/local visibility, local SEO basics, website
                      alignment, Facebook/Instagram consistency, usable media,
                      menu/order/contact link clarity, and whether
                      Yelp/TikTok/Reels/Ads should stay parked as coming soon.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                  <Info className="w-3 h-3" /> This assessment runs in your browser. Walkthrough requests are saved locally for manual Veroxa review.
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
        {report && auditHero && (
          <div className="mt-10 space-y-4" data-testid="audit-report">
            {/* 1. Audit Hero Summary */}
            <Card className="bg-card border-border">
              <CardContent className="p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wider text-primary mb-1">
                      Online Presence Audit
                    </p>
                    <p
                      className="text-2xl md:text-3xl font-bold mt-0.5"
                      data-testid="audit-grade-headline"
                    >
                      {auditHero.restaurantName}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge
                        variant="outline"
                        className="border-primary/40 text-primary bg-primary/5"
                      >
                        Score: {auditHero.scoreLabel}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-muted-foreground/30 text-muted-foreground bg-muted/10"
                      >
                        {auditHero.readinessStatus}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`inline-flex items-center gap-1 ${confidenceTone[report.auditConfidence]}`}
                        data-testid="audit-confidence-badge"
                      >
                        <ShieldCheck className="w-3 h-3" />{" "}
                        {auditHero.confidenceLabel}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-amber-500/40 text-amber-400 bg-amber-500/5"
                      >
                        {auditHero.reviewModeLabel}
                      </Badge>
                    </div>
                    <p className="text-[12px] text-muted-foreground mt-2">
                      {auditHero.cuisineOrConcept} · {auditHero.locationContext}
                    </p>
                    <p className="text-sm text-foreground/90 mt-3 max-w-3xl leading-relaxed">
                      {auditHero.shortSummary}
                    </p>
                  </div>
                  <div
                    className="rounded-lg border border-border bg-muted/20 p-3 md:w-56 shrink-0"
                    data-testid="audit-total-score"
                  >
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Readiness note
                    </p>
                    <p className="text-sm font-semibold mt-1">
                      {auditHero.readinessStatus}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
                      {report.gradeDescription}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Top 3 Priority Opportunities */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base inline-flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" /> Top 3 priority
                  opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {priorityOpportunities.map((opportunity, i) => (
                    <div
                      key={opportunity.category}
                      className="rounded-lg border border-border bg-muted/20 p-3"
                      data-testid={`audit-priority-${opportunity.category.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Opportunity {i + 1}
                        </p>
                        <Badge
                          variant="outline"
                          className="text-[10px] border-primary/30 text-primary bg-primary/5"
                        >
                          {opportunity.priority}
                        </Badge>
                      </div>
                      <p className="text-sm font-semibold mt-1">
                        {opportunity.title}
                      </p>
                      <p className="text-[12px] text-muted-foreground mt-2 leading-relaxed">
                        <span className="font-medium text-foreground/90">
                          Why it matters:{" "}
                        </span>
                        {opportunity.whyItMatters}
                      </p>
                      <p className="text-[12px] text-muted-foreground mt-2 leading-relaxed">
                        <span className="font-medium text-foreground/90">
                          What Veroxa can do:{" "}
                        </span>
                        {opportunity.whatVeroxaCanDo}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 3. Restaurant Growth Insights */}
            <Card
              className="bg-card border-border"
              data-testid="restaurant-growth-insights"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base inline-flex items-center gap-2">
                  <Compass className="w-4 h-4 text-primary" /> Restaurant Growth
                  Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {growthInsights.map((insight) => (
                    <div
                      key={insight.title}
                      className="rounded-lg border border-border bg-muted/20 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{insight.title}</p>
                        {insight.label && (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-amber-500/40 text-amber-400 bg-amber-500/5"
                          >
                            {insight.label}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[12px] text-muted-foreground mt-2 leading-relaxed">
                        {insight.body}
                      </p>
                      {insight.bullets && (
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-2">
                          {insight.bullets.map((bullet) => (
                            <li
                              key={bullet}
                              className="text-[12px] text-foreground/90 flex items-start gap-2"
                            >
                              <span className="mt-[6px] shrink-0 w-1.5 h-1.5 rounded-full bg-primary/60" />
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 4. What Veroxa would fix first */}
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
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {fixPlan.map((stage) => (
                    <div
                      key={stage.label}
                      className="rounded-lg border border-border bg-muted/20 p-3"
                    >
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {stage.label}
                      </p>
                      <p className="text-sm font-semibold mt-1 leading-snug">
                        {stage.title}
                      </p>
                      <ul className="space-y-1 mt-2">
                        {stage.bullets.map((bullet) => (
                          <li
                            key={bullet}
                            className="text-[12px] text-muted-foreground flex items-start gap-2"
                          >
                            <span className="mt-[6px] shrink-0 w-1.5 h-1.5 rounded-full bg-primary/60" />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 5. 30-day plan */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  30-day improvement plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {plan.map((w) => (
                    <div
                      key={w.week}
                      className="rounded-lg border border-border bg-muted/20 p-3"
                    >
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Week {w.week}
                      </p>
                      <p className="text-sm font-semibold mt-1">{w.title}</p>
                      <ul className="space-y-1 mt-2">
                        {w.bullets.map((bullet) => (
                          <li
                            key={bullet}
                            className="text-[12px] text-muted-foreground flex items-start gap-2"
                          >
                            <span className="mt-[6px] shrink-0 w-1.5 h-1.5 rounded-full bg-primary/60" />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 6. Can / cannot */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  What Veroxa can and cannot improve
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-foreground/90">{AUDIT_DISCLAIMER}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="text-sm font-semibold inline-flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Can
                      improve
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2">
                      {canImprove.map((item) => (
                        <li
                          key={item}
                          className="text-[12px] text-foreground/90 flex items-start gap-2"
                        >
                          <span className="mt-[6px] shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-400/70" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="text-sm font-semibold inline-flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />{" "}
                      Cannot guarantee or directly control
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2">
                      {cannotGuarantee.map((item) => (
                        <li
                          key={item}
                          className="text-[12px] text-muted-foreground flex items-start gap-2"
                        >
                          <span className="mt-[6px] shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400/70" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 7. Full signal breakdown */}
            <details className="group" data-testid="full-signal-breakdown">
              <summary className="flex items-center justify-between cursor-pointer rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold hover:bg-muted/30 transition-colors list-none">
                <span className="inline-flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  <span className="group-open:hidden">Show full signal breakdown</span>
                  <span className="hidden group-open:inline">Hide full signal breakdown</span>
                </span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  Public signals by category
                </span>
              </summary>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                {signalBreakdown.map((group) => (
                  <Card key={group.title} className="bg-card border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{group.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {group.bullets.map((bullet) => (
                          <li
                            key={bullet}
                            className="text-[12px] text-muted-foreground flex items-start gap-2"
                          >
                            <span className="mt-[6px] shrink-0 w-1.5 h-1.5 rounded-full bg-primary/60" />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </details>

            {/* 8. Source notes */}
            <details className="group" data-testid="audit-source-notes">
              <summary className="flex items-center justify-between cursor-pointer rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold hover:bg-muted/30 transition-colors list-none">
                <span className="inline-flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="group-open:hidden">Show source notes for manual review</span>
                  <span className="hidden group-open:inline">Hide source notes</span>
                </span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  Public signals + verification notes
                </span>
              </summary>
              <div className="mt-2 space-y-3" data-testid="growth-report-sections">
                <Card
                  className="bg-card border-border"
                  data-testid="audit-confidence-strip"
                >
                  <CardContent className="p-4">
                    <p className="text-[11px] uppercase tracking-wider text-primary mb-3">
                      Audit signal summary
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[11px]">
                      {[
                        [
                          "Google profile",
                          report.input.googleListingUrl
                            ? "Link provided"
                            : "Needs verification",
                        ],
                        [
                          "Website",
                          report.input.websiteFound
                            ? "Public signal"
                            : report.input.websiteUrl
                              ? "Link provided"
                              : "Needs verification",
                        ],
                        [
                          "Menu / order",
                          report.input.menuLinkFound ||
                          report.input.orderLinkFound
                            ? "Public signal"
                            : report.input.menuOrderingUrl
                              ? "Link provided"
                              : "Needs verification",
                        ],
                        [
                          "Social",
                          (report.input.discoveredSocialLinks?.length ?? 0) > 0
                            ? `${report.input.discoveredSocialLinks!.length} public signal(s)`
                            : report.input.instagramUrl ||
                                report.input.facebookUrl ||
                                report.input.tiktokUrl
                              ? "Links provided"
                              : "Needs verification",
                        ],
                        [
                          "Assessment source",
                          report.input.restaurantSource === "google_places"
                            ? "Public signal review"
                            : report.input.restaurantSource ===
                                (("fix" +
                                  "ture") as RestaurantAuditInput["restaurantSource"])
                              ? "Public signals"
                              : "Manual entry",
                        ],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-md border border-border bg-muted/10 p-2 text-center"
                        >
                          <p className="text-muted-foreground mb-0.5">
                            {label}
                          </p>
                          <p className="text-foreground/90 font-medium">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="space-y-3 p-4">
                    {report.growthReportSections
                      .filter(
                        (section) =>
                          ![
                            "fix_first",
                            "veroxa_needs",
                            "walk_in_opportunity",
                          ].includes(section.id),
                      )
                      .map((section) => (
                        <div
                          key={section.id}
                          className="border-b border-border last:border-0 pb-2 last:pb-0"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-semibold inline-flex items-center gap-1.5">
                              {sectionIcon[section.id]}
                              {section.title}
                            </p>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${sourceLabelTone[section.sourceLabel]}`}
                            >
                              {sourceLabelText[section.sourceLabel]}
                            </Badge>
                          </div>
                          <p className="text-[12px] text-muted-foreground mt-1">
                            {section.currentSignal}
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
                  whether Complete Online Presence — $495/month fits, needs
                  manual verification, or is not a fit yet.
                </p>
                {walkthroughSaved ? (
                  <div
                    className="rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3"
                    data-testid="walkthrough-success"
                  >
                    <p className="text-sm font-semibold text-emerald-400">
                      Thanks — your walkthrough request is saved for manual
                      review.
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      A Veroxa team member would review the audit and explain
                      whether Complete Online Presence is a fit, needs manual
                      review, or is not a fit yet.
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
                        Pilot note: this request is saved locally for manual Veroxa review.
                        Production lead capture will be connected later.
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
