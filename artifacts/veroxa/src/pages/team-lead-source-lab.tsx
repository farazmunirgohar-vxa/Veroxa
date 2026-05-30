/**
 * team-lead-source-lab.tsx — M035 / M036
 *
 * Internal Team Lead Source Lab. Compare lead sources by quality score,
 * plan experiments, and track which sources produce the healthiest leads.
 *
 * INTERNAL ONLY — protected by InternalDemoGuard role="team".
 * Never show source quality scores to restaurants.
 */

import { useState, type FormEvent } from "react";
import { FlaskConical, TrendingUp, Lightbulb, Beaker, BookOpen, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { PageHeader } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getAuditLeads } from "@/lib/leads/localAuditLeadStore";
import { rankLeadSources, getLeadSourceRecs } from "@/lib/leads/leadSourceScoring";
import { getTopLeadSources, getWeakLeadSources, getLeadSourceMix } from "@/lib/leads/leadAnalytics";
import {
  createLeadSourceExperiment,
  getLeadSourceExperiments,
  updateLeadSourceExperiment,
  deleteLeadSourceExperiment,
  type CreateLeadSourceExperimentInput,
} from "@/lib/leads/localLeadSourceExperimentStore";
import {
  LEAD_SOURCE_LABELS,
  LEAD_SOURCE_CATEGORY_LABELS,
  type LeadSource,
} from "@/lib/leads/leadTypes";
import {
  LEAD_SOURCE_QUALITY_GRADE_LABELS,
  LEAD_SOURCE_QUALITY_GRADE_COLORS,
  LEAD_SOURCE_EXPERIMENT_STATUS_LABELS,
  type LeadSourcePerformanceSnapshot,
  type LeadSourceExperiment,
  type LeadSourceExperimentStatus,
} from "@/lib/leads/leadSourceTypes";

// ── Grouped source options for select ──────────────────────────────────────

const SOURCE_GROUPS: { label: string; sources: LeadSource[] }[] = [
  {
    label: "Direct Outreach",
    sources: ["walk_in", "phone_call", "cold_email", "instagram_dm", "facebook_dm", "google_maps_manual_search", "manual_prospect", "area_scan"],
  },
  {
    label: "Website / Self-Selling",
    sources: ["free_audit", "guided_demo", "pricing_page", "contact_page", "qr_code", "flyer", "niche_landing_page", "seasonal_landing_page", "google_profile_health_check", "slow_day_visibility_check", "content_readiness_check"],
  },
  {
    label: "Relationship",
    sources: ["founder_network", "family_friend_referral", "client_referral", "restaurant_owner_referral", "community_referral", "mosque_community_center", "halal_network", "pakistani_community_network", "turkish_mediterranean_network", "vendor_partner", "pos_partner", "menu_printer", "food_supplier", "commercial_realtor", "accountant_bookkeeper", "referral"],
  },
  {
    label: "Proof / Case Study",
    sources: ["case_study", "before_after_report", "monthly_result_snapshot", "client_testimonial", "referral_from_success", "restaurant_seen_on_social"],
  },
  {
    label: "Campaign / Event",
    sources: ["ramadan_campaign", "eid_campaign", "holiday_catering_campaign", "lunch_traffic_campaign", "slow_day_campaign", "new_restaurant_opening", "grand_opening", "food_festival", "local_event", "seasonal_offer"],
  },
  { label: "Other", sources: ["other"] },
];

function fmt(n: number) {
  return `$${n.toLocaleString()}`;
}

// ── Summary cards ──────────────────────────────────────────────────────────

function SummaryCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ── Grade badge ────────────────────────────────────────────────────────────

function GradeBadge({ grade }: { grade: LeadSourcePerformanceSnapshot["qualityGrade"] }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${LEAD_SOURCE_QUALITY_GRADE_COLORS[grade]}`}>
      {LEAD_SOURCE_QUALITY_GRADE_LABELS[grade]}
    </span>
  );
}

// ── Experiment status badge ────────────────────────────────────────────────

function StatusBadge({ status }: { status: LeadSourceExperimentStatus }) {
  const colors: Record<LeadSourceExperimentStatus, string> = {
    planned: "bg-blue-100 text-blue-800",
    active: "bg-emerald-100 text-emerald-800",
    paused: "bg-yellow-100 text-yellow-800",
    completed: "bg-slate-100 text-slate-700",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors[status]}`}>
      {LEAD_SOURCE_EXPERIMENT_STATUS_LABELS[status]}
    </span>
  );
}

// ── Experiment row ─────────────────────────────────────────────────────────

function ExperimentRow({
  exp,
  onStatusChange,
  onDelete,
}: {
  exp: LeadSourceExperiment;
  onStatusChange: (id: string, s: LeadSourceExperimentStatus) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const sourceLabel = (LEAD_SOURCE_LABELS as Record<string, string>)[exp.source] ?? exp.source;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/40 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <StatusBadge status={exp.status} />
          <span className="font-medium text-sm truncate">{exp.title}</span>
          <span className="text-xs text-muted-foreground hidden sm:block">— {sourceLabel}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">{exp.startDate}</span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>
      {expanded && (
        <div className="border-t px-4 py-3 space-y-3 bg-muted/20">
          <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Hypothesis:</span> {exp.hypothesis}</p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>Target leads: <strong>{exp.targetLeadCount}</strong></span>
            <span>Target walkthroughs: <strong>{exp.targetWalkthroughs}</strong></span>
          </div>
          {exp.notes && <p className="text-xs text-muted-foreground">{exp.notes}</p>}
          {exp.resultSummary && (
            <div className="bg-background border rounded p-2 text-xs">
              <p className="font-medium mb-1">Result:</p>
              <p className="text-muted-foreground">{exp.resultSummary}</p>
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            {(["planned", "active", "paused", "completed"] as LeadSourceExperimentStatus[])
              .filter((s) => s !== exp.status)
              .map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onStatusChange(exp.id, s); }}
                >
                  Mark {LEAD_SOURCE_EXPERIMENT_STATUS_LABELS[s]}
                </Button>
              ))}
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(exp.id); }}
            >
              <X className="h-3 w-3 mr-1" /> Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Create experiment form ─────────────────────────────────────────────────

const emptyExpForm: CreateLeadSourceExperimentInput = {
  source: "free_audit",
  title: "",
  hypothesis: "",
  startDate: new Date().toISOString().slice(0, 10),
  status: "planned",
  targetLeadCount: 5,
  targetWalkthroughs: 2,
  notes: "",
};

function CreateExperimentForm({ onSave }: { onSave: (exp: LeadSourceExperiment) => void }) {
  const [form, setForm] = useState<CreateLeadSourceExperimentInput>(emptyExpForm);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.hypothesis.trim()) { setError("Hypothesis is required."); return; }
    setError(null);
    const exp = createLeadSourceExperiment(form);
    onSave(exp);
    setForm(emptyExpForm);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium">Source *</label>
          <select
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            value={form.source}
            onChange={(e) => setForm((f) => ({ ...f, source: e.target.value as LeadSource }))}
          >
            {SOURCE_GROUPS.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.sources.map((s) => (
                  <option key={s} value={s}>{(LEAD_SOURCE_LABELS as Record<string, string>)[s] ?? s}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Status</label>
          <select
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as LeadSourceExperimentStatus }))}
          >
            {(["planned", "active", "paused", "completed"] as LeadSourceExperimentStatus[]).map((s) => (
              <option key={s} value={s}>{LEAD_SOURCE_EXPERIMENT_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">Title *</label>
        <Input
          placeholder='e.g. "Test 10 halal restaurant walk-ins this week"'
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">Hypothesis *</label>
        <Input
          placeholder='e.g. "Halal walk-ins will convert to Priority A at a higher rate than cold emails"'
          value={form.hypothesis}
          onChange={(e) => setForm((f) => ({ ...f, hypothesis: e.target.value }))}
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium">Start date</label>
          <Input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Target leads</label>
          <Input
            type="number"
            min={1}
            value={form.targetLeadCount}
            onChange={(e) => setForm((f) => ({ ...f, targetLeadCount: Number(e.target.value) }))}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Target walkthroughs</label>
          <Input
            type="number"
            min={0}
            value={form.targetWalkthroughs}
            onChange={(e) => setForm((f) => ({ ...f, targetWalkthroughs: Number(e.target.value) }))}
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">Notes</label>
        <Input
          placeholder="Any context, constraints, or next steps"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="sm">
        <Plus className="h-4 w-4 mr-1" /> Add Experiment
      </Button>
    </form>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function TeamLeadSourceLab() {
  const leads = getAuditLeads();
  const snapshots = rankLeadSources(leads);
  const recommendations = getLeadSourceRecs(leads);
  const mix = getLeadSourceMix(leads);
  const [experiments, setExperiments] = useState<LeadSourceExperiment[]>(() =>
    getLeadSourceExperiments(),
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<LeadSourcePerformanceSnapshot | null>(null);

  const topSources = getTopLeadSources(leads, 3);
  const weakSources = getWeakLeadSources(leads);

  const totalProjectedMrr = snapshots.reduce((s, x) => s + x.projectedFoundingMrr, 0);
  const sourcesToScale = snapshots.filter((s) => s.qualityGrade === "scale").length;
  const sourcesToImprove = snapshots.filter((s) => s.qualityGrade === "improve" || s.qualityGrade === "selective").length;

  function handleExperimentSave(exp: LeadSourceExperiment) {
    setExperiments(getLeadSourceExperiments());
    setShowCreateForm(false);
  }

  function handleStatusChange(id: string, status: LeadSourceExperimentStatus) {
    updateLeadSourceExperiment(id, { status });
    setExperiments(getLeadSourceExperiments());
  }

  function handleDelete(id: string) {
    deleteLeadSourceExperiment(id);
    setExperiments(getLeadSourceExperiments());
  }

  const hasLeads = leads.length > 0;

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <div className="space-y-8">
        <PageHeader
          title="Lead Source Lab"
          description="Track how Veroxa finds restaurant opportunities and which sources produce the healthiest leads."
        />

        {/* Internal disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-900">
          <strong>Internal only.</strong> Source quality scores, close probabilities, and yield estimates are internal working tools. They must never be shown to restaurants or on public pages. Scores are preliminary estimates until real close and yield data exists.
        </div>

        {/* ── 1. Source Health Summary ── */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Source Health Summary
          </h2>
          {!hasLeads ? (
            <div className="border-2 border-dashed border-border rounded-xl p-10 text-center">
              <FlaskConical className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium text-foreground mb-1">No lead source data yet</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Add leads through the Free Audit, Manual Prospect Scanner, or Audit Leads queue. Source quality scores will appear once leads exist.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                <SummaryCard label="Active sources" value={snapshots.length} />
                <SummaryCard
                  label="Best source"
                  value={topSources[0]?.sourceLabel ?? "—"}
                  sub={topSources[0] ? `Score: ${topSources[0].qualityScore.total}` : undefined}
                />
                <SummaryCard
                  label="Priority A leads"
                  value={snapshots.reduce((s, x) => s + x.priorityALeads, 0)}
                />
                <SummaryCard
                  label="Walkthrough requests"
                  value={snapshots.reduce((s, x) => s + x.walkthroughRequested, 0)}
                />
                <SummaryCard
                  label="Projected current MRR"
                  value={fmt(totalProjectedMrr)}
                  sub="Across all active sources"
                />
                <SummaryCard
                  label="Sources to scale"
                  value={sourcesToScale}
                  sub="Grade: Scale"
                />
                <SummaryCard
                  label="Sources to improve / review"
                  value={sourcesToImprove}
                  sub="Grade: Improve or Selective"
                />
                {mix.length > 0 && (
                  <SummaryCard
                    label="Top category"
                    value={mix[0].categoryLabel}
                    sub={`${mix[0].pct}% of all leads`}
                  />
                )}
              </div>

              {/* ── 2. Source Performance Table ── */}
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Source Performance Table
              </h2>
              <p className="text-xs text-muted-foreground mb-3 italic">
                Execution Fit, Yield Potential, and Retention scores are internal preliminary estimates. They will recalibrate once real client yield data exists.
              </p>
              <div className="rounded-lg border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                      <th className="px-3 py-2">Source</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2 text-right">Leads</th>
                      <th className="px-3 py-2 text-right">Prio A</th>
                      <th className="px-3 py-2 text-right">Walkthru</th>
                      <th className="px-3 py-2 text-right">Won</th>
                      <th className="px-3 py-2 text-right">Lost</th>
                      <th className="px-3 py-2 text-right">Avg Score</th>
                      <th className="px-3 py-2 text-right">Proj MRR</th>
                      <th className="px-3 py-2 text-right">Quality</th>
                      <th className="px-3 py-2">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshots.map((s) => (
                      <tr
                        key={s.source}
                        className={`border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors ${selectedSnapshot?.source === s.source ? "bg-muted/50" : ""}`}
                        onClick={() => setSelectedSnapshot((prev) => prev?.source === s.source ? null : s)}
                      >
                        <td className="px-3 py-2 font-medium">{s.sourceLabel}</td>
                        <td className="px-3 py-2 text-muted-foreground text-xs">{s.categoryLabel}</td>
                        <td className="px-3 py-2 text-right">{s.totalLeads}</td>
                        <td className="px-3 py-2 text-right">{s.priorityALeads}</td>
                        <td className="px-3 py-2 text-right">{s.walkthroughRequested}</td>
                        <td className="px-3 py-2 text-right">{s.won}</td>
                        <td className="px-3 py-2 text-right">{s.lost}</td>
                        <td className="px-3 py-2 text-right">{s.averageInternalLeadScore}</td>
                        <td className="px-3 py-2 text-right text-xs">{fmt(s.projectedFoundingMrr)}</td>
                        <td className="px-3 py-2 text-right font-bold">{s.qualityScore.total}</td>
                        <td className="px-3 py-2"><GradeBadge grade={s.qualityGrade} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Source detail card */}
              {selectedSnapshot && (
                <Card className="mt-4 border-primary/30">
                  <CardHeader className="pb-2 flex-row items-center justify-between">
                    <CardTitle className="text-base">{selectedSnapshot.sourceLabel} — Source Detail</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedSnapshot(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div><p className="text-xs text-muted-foreground">Quality Score</p><p className="font-bold text-lg">{selectedSnapshot.qualityScore.total}/100</p></div>
                      <div><p className="text-xs text-muted-foreground">Grade</p><div className="mt-1"><GradeBadge grade={selectedSnapshot.qualityGrade} /></div></div>
                      <div><p className="text-xs text-muted-foreground">Yield Estimate</p><p className="font-bold">{selectedSnapshot.estimatedYieldPotential}</p></div>
                      <div><p className="text-xs text-muted-foreground">Category</p><p className="font-medium">{selectedSnapshot.categoryLabel}</p></div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {([
                        ["Lead Volume", selectedSnapshot.qualityScore.leadVolume, 15],
                        ["Lead Quality", selectedSnapshot.qualityScore.leadQuality, 20],
                        ["Walkthru Conv.", selectedSnapshot.qualityScore.walkthroughConversion, 15],
                        ["Close Conv.", selectedSnapshot.qualityScore.closeConversion, 15],
                        ["Package Value", selectedSnapshot.qualityScore.packageValue, 10],
                        ["Execution Fit †", selectedSnapshot.qualityScore.executionFit, 10],
                        ["Yield Potential †", selectedSnapshot.qualityScore.yieldPotential, 10],
                        ["Retention / Ref †", selectedSnapshot.qualityScore.retentionReferralPotential, 5],
                      ] as [string, number, number][]).map(([label, val, max]) => (
                        <div key={label} className="bg-muted/30 rounded p-2">
                          <p className="text-muted-foreground mb-1">{label}</p>
                          <p className="font-bold">{val}<span className="font-normal text-muted-foreground">/{max}</span></p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground italic">† Estimated — recalibrates once real yield data exists.</p>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-1">Recommendation</p>
                      <p className="text-sm text-muted-foreground">{selectedSnapshot.recommendation}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </section>

        {/* ── 3. Source Recommendations ── */}
        {hasLeads && recommendations.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              <TrendingUp className="inline h-4 w-4 mr-1 -mt-0.5" />
              Source Recommendations
            </h2>
            <p className="text-xs text-muted-foreground mb-3 italic">
              Recommendations are preliminary until real close and yield data exists.
            </p>
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div key={rec.source} className="border rounded-lg px-4 py-3 flex gap-3 items-start">
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-xs capitalize ${
                      rec.action === "scale"
                        ? "border-emerald-500 text-emerald-700"
                        : rec.action === "improve" || rec.action === "selective"
                          ? "border-blue-500 text-blue-700"
                          : "border-red-400 text-red-700"
                    }`}
                  >
                    {rec.action}
                  </Badge>
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{rec.sourceLabel}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{rec.reason}</p>
                    <p className="text-xs text-foreground mt-1">{rec.nextStep}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 4. Source Experiments ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              <Beaker className="inline h-4 w-4 mr-1 -mt-0.5" />
              Source Experiments
            </h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCreateForm((v) => !v)}
            >
              {showCreateForm ? (
                <><X className="h-4 w-4 mr-1" /> Cancel</>
              ) : (
                <><Plus className="h-4 w-4 mr-1" /> New Experiment</>
              )}
            </Button>
          </div>

          {showCreateForm && (
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Create Experiment</CardTitle>
              </CardHeader>
              <CardContent>
                <CreateExperimentForm onSave={handleExperimentSave} />
              </CardContent>
            </Card>
          )}

          {experiments.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
              <Beaker className="h-7 w-7 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium text-foreground mb-1">No experiments yet</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Plan a source experiment to track what you're testing and why. Examples:
              </p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                <li>"Test 10 halal restaurant walk-ins this week"</li>
                <li>"Send 15 Instagram DMs to Mediterranean restaurants"</li>
                <li>"Place QR audit cards with community partner"</li>
                <li>"Follow up with 5 nurture leads before Eid"</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-2">
              {(["active", "planned", "paused", "completed"] as LeadSourceExperimentStatus[]).map((status) => {
                const group = experiments.filter((e) => e.status === status);
                if (group.length === 0) return null;
                return (
                  <div key={status}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      {LEAD_SOURCE_EXPERIMENT_STATUS_LABELS[status]}
                    </p>
                    <div className="space-y-2">
                      {group.map((exp) => (
                        <ExperimentRow
                          key={exp.id}
                          exp={exp}
                          onStatusChange={handleStatusChange}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── 5. Source Learning Notes ── */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            <BookOpen className="inline h-4 w-4 mr-1 -mt-0.5" />
            Source Learning Notes
          </h2>
          <Card>
            <CardContent className="pt-5 space-y-3 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-1">The audit is one lead source — not the whole engine.</p>
                <p>Veroxa tracks leads from direct outreach, website tools, referrals, proof assets, and campaigns. Each source is scored for quality, not just volume.</p>
              </div>
              <Separator />
              <div>
                <p className="font-medium text-foreground mb-1">Yield is the scoreboard.</p>
                <p>The best lead source produces clients where Veroxa can create real customer actions — more reviews, more foot traffic, more online orders. Vanity metrics (followers, impressions) are not yield.</p>
              </div>
              <Separator />
              <div>
                <p className="font-medium text-foreground mb-1">Lead bringing power must match execution power.</p>
                <p>The Lead Engine and Execution Engine should compete to improve. A weak lead engine starves even the best execution system.</p>
              </div>
              <Separator />
              <div>
                <p className="font-medium text-foreground mb-1">Source scores are preliminary estimates.</p>
                <p>Execution Fit, Yield Potential, and Retention / Referral scores are derived from internal lead quality and source category until real client yield data is connected.</p>
              </div>
              <Separator />
              <div>
                <p className="font-medium text-foreground mb-1">Future upgrades.</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs mt-1">
                  <li>Source URL parameters for automatic attribution</li>
                  <li>QR code tracking per source</li>
                  <li>CSV import for bulk prospect lists</li>
                  <li>Partner / referral source tracking</li>
                  <li>Source-to-yield reporting after clients onboard</li>
                  <li>Source ROI dashboard</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Weak source warning */}
        {weakSources.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-sm font-medium text-red-900 mb-1">Sources consuming effort with low return:</p>
            <ul className="text-xs text-red-800 space-y-0.5">
              {weakSources.map((s) => (
                <li key={s.source}>• {s.sourceLabel} — grade: {LEAD_SOURCE_QUALITY_GRADE_LABELS[s.qualityGrade]}</li>
              ))}
            </ul>
            <p className="text-xs text-red-700 mt-2">Consider pausing these or running an experiment on a higher-potential source instead.</p>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
