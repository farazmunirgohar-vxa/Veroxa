/**
 * team-prospect-scanner.tsx — M031
 *
 * Manual prospect scanner. Veroxa team manually enters prospect info and
 * generates BOTH a restaurant-facing audit summary and an internal lead
 * audit. No live scraping, no APIs, no Google Places.
 */

import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { ShieldCheck, Sparkles, AlertTriangle, ArrowRight } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { PageHeader } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { generateRestaurantAudit } from "@/lib/audit/auditScoring";
import { generateInternalLeadAudit } from "@/lib/leads/internalLeadScoring";
import {
  createAuditLeadFromReport,
  saveAuditLead,
} from "@/lib/leads/localAuditLeadStore";
import {
  LEAD_PRIORITY_LABELS,
  type AuditLeadInternalFlags,
  type LeadSource,
} from "@/lib/leads/leadTypes";
import type {
  RestaurantAuditInput,
  RestaurantAuditReport,
} from "@/lib/audit/auditTypes";
import type { InternalLeadAudit } from "@/lib/leads/internalLeadScoring";

const emptyInput: RestaurantAuditInput = {
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

interface InternalForm {
  source: LeadSource;
  warmRelationship: boolean;
  strategicValueNote: string;
  contactAvailable: boolean;
  ownerReachability: "low" | "medium" | "high" | "";
  internalNote: string;
}

const emptyInternal: InternalForm = {
  source: "manual_prospect",
  warmRelationship: false,
  strategicValueNote: "",
  contactAvailable: false,
  ownerReachability: "",
  internalNote: "",
};

export default function TeamProspectScanner() {
  const [input, setInput] = useState<RestaurantAuditInput>(emptyInput);
  const [internalForm, setInternalForm] = useState<InternalForm>(emptyInternal);
  const [report, setReport] = useState<RestaurantAuditReport | null>(null);
  const [internalAudit, setInternalAudit] = useState<InternalLeadAudit | null>(
    null,
  );
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function setField<K extends keyof RestaurantAuditInput>(
    key: K,
    value: RestaurantAuditInput[K],
  ) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  function setInternalField<K extends keyof InternalForm>(
    key: K,
    value: InternalForm[K],
  ) {
    setInternalForm((prev) => ({ ...prev, [key]: value }));
  }

  function buildInternalFlags(): AuditLeadInternalFlags {
    return {
      warmRelationship: internalForm.warmRelationship,
      strategicValueNote:
        internalForm.strategicValueNote.trim() || undefined,
      contactAvailable: internalForm.contactAvailable,
      ownerReachability: internalForm.ownerReachability || undefined,
    };
  }

  function handleGenerate(e: FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSavedMessage(null);
    if (
      !input.restaurantName ||
      !input.city ||
      !input.state ||
      !input.cuisineType
    ) {
      setErrorMessage(
        "Restaurant name, city, state, and cuisine type are required.",
      );
      return;
    }
    const generated = generateRestaurantAudit(input);
    const flags = buildInternalFlags();
    const internal = generateInternalLeadAudit({
      report: generated,
      links: {
        googleListingUrl: input.googleListingUrl,
        websiteUrl: input.websiteUrl,
        instagramUrl: input.instagramUrl,
        facebookUrl: input.facebookUrl,
        tiktokUrl: input.tiktokUrl,
        menuOrderingUrl: input.menuOrderingUrl,
        otherUrl: input.otherUrl,
      },
      internalFlags: flags,
      source: internalForm.source,
      walkthroughRequested: false,
    });
    setReport(generated);
    setInternalAudit(internal);
  }

  function handleSaveLead() {
    if (!report) return;
    try {
      const lead = createAuditLeadFromReport(report, {
        source: internalForm.source,
        internalFlags: buildInternalFlags(),
        initialStage: "needs_manual_review",
      });
      if (internalForm.internalNote.trim()) {
        lead.internalNotes.push(internalForm.internalNote.trim());
      }
      saveAuditLead(lead);
      setSavedMessage(
        "Lead saved locally. Open the Audit Leads queue to review it.",
      );
    } catch {
      setErrorMessage("Could not save the lead in this preview.");
    }
  }

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <PageHeader
        title="Manual Prospect Scanner"
        description="Enter restaurants manually and generate both a public audit and an internal Veroxa lead audit."
      />

      <Card className="bg-card border-border mb-4">
        <CardContent className="p-4 space-y-1.5">
          <p className="text-sm text-foreground/90">
            Manual Prospect Scanner is the safe first version of area scanning.
            Add restaurants from your own research. Live area scanning through
            approved APIs can be added later.
          </p>
          <p className="text-[12px] text-muted-foreground italic">
            No scraping or live platform checks are performed in this version.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border mb-4">
        <CardHeader>
          <CardTitle className="text-base">Prospect details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                Required
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ScannerField label="Restaurant name *">
                  <Input
                    value={input.restaurantName}
                    onChange={(e) =>
                      setField("restaurantName", e.target.value)
                    }
                    required
                  />
                </ScannerField>
                <ScannerField label="Cuisine type *">
                  <Input
                    value={input.cuisineType}
                    onChange={(e) => setField("cuisineType", e.target.value)}
                    required
                  />
                </ScannerField>
                <ScannerField label="City *">
                  <Input
                    value={input.city}
                    onChange={(e) => setField("city", e.target.value)}
                    required
                  />
                </ScannerField>
                <ScannerField label="State *">
                  <Input
                    value={input.state}
                    onChange={(e) => setField("state", e.target.value)}
                    required
                  />
                </ScannerField>
              </div>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                Optional links
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ScannerField label="Google Business Profile">
                  <Input
                    value={input.googleListingUrl ?? ""}
                    onChange={(e) =>
                      setField("googleListingUrl", e.target.value)
                    }
                  />
                </ScannerField>
                <ScannerField label="Website">
                  <Input
                    value={input.websiteUrl ?? ""}
                    onChange={(e) => setField("websiteUrl", e.target.value)}
                  />
                </ScannerField>
                <ScannerField label="Instagram">
                  <Input
                    value={input.instagramUrl ?? ""}
                    onChange={(e) => setField("instagramUrl", e.target.value)}
                  />
                </ScannerField>
                <ScannerField label="Facebook">
                  <Input
                    value={input.facebookUrl ?? ""}
                    onChange={(e) => setField("facebookUrl", e.target.value)}
                  />
                </ScannerField>
                <ScannerField label="TikTok">
                  <Input
                    value={input.tiktokUrl ?? ""}
                    onChange={(e) => setField("tiktokUrl", e.target.value)}
                  />
                </ScannerField>
                <ScannerField label="Menu / Ordering">
                  <Input
                    value={input.menuOrderingUrl ?? ""}
                    onChange={(e) =>
                      setField("menuOrderingUrl", e.target.value)
                    }
                  />
                </ScannerField>
                <ScannerField label="Other">
                  <Input
                    value={input.otherUrl ?? ""}
                    onChange={(e) => setField("otherUrl", e.target.value)}
                  />
                </ScannerField>
              </div>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                Internal-only optional fields
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ScannerField label="Source">
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={internalForm.source}
                    onChange={(e) =>
                      setInternalField("source", e.target.value as LeadSource)
                    }
                  >
                    <option value="manual_prospect">Manual prospect</option>
                    <option value="referral">Referral</option>
                    <option value="walk_in">Walk-in</option>
                    <option value="other">Other</option>
                  </select>
                </ScannerField>
                <ScannerField label="Owner likely reachable">
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={internalForm.ownerReachability}
                    onChange={(e) =>
                      setInternalField(
                        "ownerReachability",
                        e.target.value as InternalForm["ownerReachability"],
                      )
                    }
                  >
                    <option value="">Unknown</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </ScannerField>
                <ScannerField label="Warm relationship?">
                  <label className="inline-flex items-center gap-2 text-sm h-9">
                    <input
                      type="checkbox"
                      checked={internalForm.warmRelationship}
                      onChange={(e) =>
                        setInternalField(
                          "warmRelationship",
                          e.target.checked,
                        )
                      }
                    />
                    Yes — there is an existing connection
                  </label>
                </ScannerField>
                <ScannerField label="Contact available?">
                  <label className="inline-flex items-center gap-2 text-sm h-9">
                    <input
                      type="checkbox"
                      checked={internalForm.contactAvailable}
                      onChange={(e) =>
                        setInternalField(
                          "contactAvailable",
                          e.target.checked,
                        )
                      }
                    />
                    Yes — Veroxa has direct contact info
                  </label>
                </ScannerField>
                <ScannerField label="Strategic value note">
                  <Input
                    value={internalForm.strategicValueNote}
                    onChange={(e) =>
                      setInternalField("strategicValueNote", e.target.value)
                    }
                    placeholder="e.g. anchor for new neighborhood"
                  />
                </ScannerField>
                <ScannerField label="Internal note">
                  <Input
                    value={internalForm.internalNote}
                    onChange={(e) =>
                      setInternalField("internalNote", e.target.value)
                    }
                    placeholder="Anything Veroxa should remember"
                  />
                </ScannerField>
              </div>
            </div>

            {errorMessage && (
              <p className="text-[12px] text-amber-400">{errorMessage}</p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] text-muted-foreground italic">
                Generates a public audit + internal lead audit. Saving stores
                locally — no Supabase, no API calls.
              </p>
              <Button
                type="submit"
                className="font-semibold"
                data-testid="prospect-generate"
              >
                Generate audits <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {report && internalAudit && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Public-facing summary */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base inline-flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Public audit summary (shown to restaurant)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-bold tabular-nums">
                  {report.totalScore}
                  <span className="text-sm text-muted-foreground font-normal">
                    {" "}
                    / 100
                  </span>
                </p>
                <Badge
                  variant="outline"
                  className="border-amber-500/40 text-amber-400 bg-amber-500/5"
                >
                  Preliminary
                </Badge>
              </div>
              <p className="text-sm font-semibold">{report.gradeLabel}</p>
              <p className="text-[12px] text-muted-foreground">
                {report.input.restaurantName} · {report.input.cuisineType} ·{" "}
                {report.input.city}, {report.input.state}
              </p>
              <Separator />
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Recommended package
                </p>
                <p className="text-sm font-semibold">
                  {report.recommendation.packageLabel}
                </p>
                <p className="text-[12px] text-muted-foreground">
                  {report.recommendation.standardPriceDisplay} ·{" "}
                  {report.recommendation.foundingPriceDisplay}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                  Top weak spots
                </p>
                <ul className="text-[12px] list-disc pl-5 space-y-0.5">
                  {report.weakSpots.slice(0, 3).map((w, i) => (
                    <li key={i}>{w.title}</li>
                  ))}
                </ul>
              </div>
              <p className="text-[11px] text-muted-foreground italic">
                This preview never includes the internal lead score, projected
                MRR, or outreach guidance.
              </p>
            </CardContent>
          </Card>

          {/* Internal lead audit */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base inline-flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Internal Veroxa lead audit (private)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-bold tabular-nums">
                  {internalAudit.score}
                  <span className="text-sm text-muted-foreground font-normal">
                    {" "}
                    / 100
                  </span>
                </p>
                <Badge variant="outline">
                  {LEAD_PRIORITY_LABELS[internalAudit.priority]}
                </Badge>
              </div>
              <p className="text-[12px] text-muted-foreground">
                Projected: $
                {internalAudit.projectedFoundingMonthlyMrr.toLocaleString()}/mo
                founding · $
                {internalAudit.projectedStandardMonthlyMrr.toLocaleString()}/mo
                standard
              </p>
              <Separator />
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                  Outreach angle
                </p>
                <p className="text-[12px]">
                  {internalAudit.recommendedOutreachAngle}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                  Suggested opener
                </p>
                <p className="text-[12px]">{internalAudit.suggestedOpener}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                  Likely objection
                </p>
                <p className="text-[12px] text-muted-foreground">
                  {internalAudit.likelyObjection}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                  Next action
                </p>
                <p className="text-[12px]">{internalAudit.nextAction}</p>
              </div>
              <Separator />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] text-muted-foreground italic">
                  Saved leads appear in the Audit Leads queue.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveLead}
                    data-testid="prospect-save"
                  >
                    Save as lead
                  </Button>
                  <Link href="/demo/team/audit-leads">
                    <Button size="sm" variant="outline">
                      Open Audit Leads
                    </Button>
                  </Link>
                </div>
              </div>
              {savedMessage && (
                <p
                  className="text-[12px] text-emerald-400 inline-flex items-center gap-1"
                  data-testid="prospect-saved"
                >
                  <Sparkles className="w-3 h-3" /> {savedMessage}
                </p>
              )}
              {errorMessage && (
                <p className="text-[12px] text-amber-400 inline-flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {errorMessage}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PortalLayout>
  );
}

function ScannerField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1 block">
        {label}
      </span>
      {children}
    </label>
  );
}
