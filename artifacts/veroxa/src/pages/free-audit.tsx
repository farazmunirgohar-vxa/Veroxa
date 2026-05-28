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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { generateRestaurantAudit } from "@/lib/audit/auditScoring";
import {
  AUDIT_ADAPTIVE_LEARNING_EXPLANATION,
  AUDIT_DISCLAIMER,
  AUDIT_EXPECTED_IMPACT_TIMELINE,
  formatThirtyDayPlan,
  formatWhatVeroxaCanImprove,
  formatWhatVeroxaCannotGuarantee,
} from "@/lib/audit/auditReportFormatter";
import { CUSTOMER_FLOW_STAGES } from "@/lib/audit/customerFlowImpact";
import { demoAuditExamples } from "@/data/audit/demoAuditExamples";
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
  const [contact, setContact] = useState<AuditLeadContact>(emptyContact);
  const [walkthroughSaved, setWalkthroughSaved] = useState(false);
  const [walkthroughError, setWalkthroughError] = useState<string | null>(null);

  // Restaurant candidate search (fixture-backed; no network).
  const [candidateResults, setCandidateResults] = useState<
    RestaurantSearchCandidate[]
  >([]);
  const [selectedCandidate, setSelectedCandidate] =
    useState<RestaurantSearchCandidate | null>(null);
  const [candidateSearchRan, setCandidateSearchRan] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

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
    };
  }

  function handleFindRestaurant(e: FormEvent) {
    e.preventDefault();
    setSearchError(null);
    if (!input.restaurantName.trim()) {
      setSearchError(
        "Add a restaurant name first so the demo search can look for sample matches.",
      );
      setCandidateResults([]);
      setCandidateSearchRan(false);
      return;
    }
    const results = searchRestaurantCandidates({
      restaurantName: input.restaurantName,
      city: input.city,
      state: input.state,
    });
    setCandidateResults(results);
    setCandidateSearchRan(true);
    setSelectedCandidate(null);
    setReport(null);
  }

  function handleSelectCandidate(candidate: RestaurantSearchCandidate) {
    setSelectedCandidate(candidate);
    setInput((prev) => ({
      ...prev,
      restaurantName: candidate.restaurantName,
      city: candidate.city,
      state: candidate.state,
      cuisineType: candidate.cuisineType || prev.cuisineType,
      googleListingUrl: candidate.googleListingUrl ?? prev.googleListingUrl,
      websiteUrl: candidate.websiteUrl ?? prev.websiteUrl,
      instagramUrl: candidate.instagramUrl ?? prev.instagramUrl,
      facebookUrl: candidate.facebookUrl ?? prev.facebookUrl,
      menuOrderingUrl: candidate.menuOrderingUrl ?? prev.menuOrderingUrl,
      googleRating: candidate.googleRating ?? prev.googleRating,
      reviewCount: candidate.reviewCount ?? prev.reviewCount,
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
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // The 4 core fields gate audit generation. Cuisine no longer blocks
    // the initial restaurant search step (handled separately).
    if (
      !input.restaurantName ||
      !input.city ||
      !input.state ||
      !input.cuisineType
    ) {
      return;
    }
    const result = generateRestaurantAudit(input);
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

  function handleLoadExample(id: string) {
    const ex = demoAuditExamples.find((e) => e.id === id);
    if (ex) {
      setInput({ ...initialInput, ...ex.input });
      setReport(null);
      setSelectedCandidate(null);
      setCandidateResults([]);
      setCandidateSearchRan(false);
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

        {/* Demo example loader */}
        <div className="mb-6 flex flex-wrap gap-2">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground self-center mr-1">
            Load a demo example:
          </span>
          {demoAuditExamples.map((ex) => (
            <Button
              key={ex.id}
              size="sm"
              variant="outline"
              className="h-7 text-[11px]"
              onClick={() => handleLoadExample(ex.id)}
              data-testid={`btn-load-example-${ex.id}`}
            >
              {ex.label}
            </Button>
          ))}
        </div>

        {/* Find My Restaurant — fixture-backed candidate search */}
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
              Enter your restaurant name (and city/state if you know them) to
              look for sample matches. This step helps Veroxa anchor the audit
              to a specific place before scoring online consistency.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <Field
                label="Restaurant name"
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
              <Field label="City (optional)" testId="restaurant-search-city">
                <Input
                  value={input.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="e.g. San Antonio"
                />
              </Field>
              <Field
                label="State (optional)"
                testId="restaurant-search-state"
              >
                <Input
                  value={input.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  placeholder="e.g. TX"
                />
              </Field>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] text-muted-foreground italic inline-flex items-center gap-1">
                <Info className="w-3 h-3" /> Search preview only — live
                Google/Maps lookup is not connected yet.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleFindRestaurant}
                data-testid="btn-find-restaurant"
              >
                <Search className="w-3.5 h-3.5 mr-1" /> Find my restaurant
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
            {selectedCandidate && (
              <div
                className="mt-4 rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3"
                data-testid="restaurant-search-selected"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-emerald-400">
                      Selected restaurant
                    </p>
                    <p className="text-sm font-semibold mt-0.5">
                      {selectedCandidate.restaurantName}
                    </p>
                    <p className="text-[12px] text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {selectedCandidate.addressLine} · {selectedCandidate.city},{" "}
                      {selectedCandidate.state}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      {selectedCandidate.cuisineType}
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
                  Confirm the cuisine and any links below are accurate, then
                  generate your audit.
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
                      No sample matches in the demo dataset.
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      You can still continue manually — fill in cuisine and any
                      links below to generate the audit.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Sample matches
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
                            <Badge
                              variant="outline"
                              className={`shrink-0 ${matchConfidenceTone[c.matchConfidence]}`}
                            >
                              {matchConfidenceLabel[c.matchConfidence]}
                            </Badge>
                          </div>
                          <p className="text-[12px] text-muted-foreground inline-flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {c.addressLine} · {c.city}, {c.state}
                          </p>
                          <p className="text-[12px] text-muted-foreground mt-0.5">
                            {c.cuisineType}
                          </p>
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
                          <p className="text-[12px] text-muted-foreground/90 mt-1">
                            {c.note}
                          </p>
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
                  <Field label="Cuisine type *" testId="audit-cuisine">
                    <Input
                      value={input.cuisineType}
                      onChange={(e) =>
                        handleChange("cuisineType", e.target.value)
                      }
                      required
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
