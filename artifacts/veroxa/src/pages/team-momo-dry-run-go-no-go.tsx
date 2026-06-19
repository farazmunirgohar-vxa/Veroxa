import { AlertTriangle, ClipboardList, Lock, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import { PortalLayout } from "@/components/PortalLayout";
import { TeamReviewModeRouteSummary } from "@/components/team/TeamOperationalSpine";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOMO_DRY_RUN_CATEGORIES, MOMO_DRY_RUN_ITEMS, MOMO_DRY_RUN_SAFETY_COPY, type MomoDryRunItem } from "@/lib/momoDryRun/momoInternalDryRunGoNoGo";
import { teamPortalNavItems } from "@/lib/teamPortalNav";

const sectionLabels: Record<string, string> = {
  "Dry Run Scope": "Dry run scope",
  "Preflight Requirements": "Preflight requirements",
  "Business Truth Readiness": "Business truth readiness",
  "Media Content Readiness": "Media/content readiness",
  "Brand AI Readiness": "Brand/AI readiness",
  "AI Generation Readiness": "AI generation readiness",
  "AI Approval Readiness": "AI approval readiness",
  "Activity Log Readiness": "Activity log readiness",
  "Report Readiness": "Report readiness",
  "Client Visibility Boundaries": "Client visibility boundaries",
  "Real Auth / Access Blockers": "Real auth/access blockers",
  "No-Publication Boundaries": "No-publication boundaries",
  "Go / No-Go Decision": "Go/no-go decision",
  "Safe Internal Next Decision": "Safe internal next decision",
};

function DryRunCard({ item }: { item: MomoDryRunItem }) {
  return <Card><CardContent className="p-4"><div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{item.category}</Badge><Badge variant={item.risk === "critical" || item.status === "blocked" || item.status === "no_go" ? "destructive" : "outline"}>{item.status.replaceAll("_", " ")}</Badge><Badge variant={item.risk === "critical" ? "destructive" : "outline"}>{item.risk}</Badge></div><h3 className="mt-2 font-semibold">{item.title}</h3><p className="mt-1 text-sm text-muted-foreground">{item.description}</p><p className="mt-2 text-xs text-muted-foreground"><strong>Evidence note:</strong> {item.evidence_note}</p><p className="mt-1 text-xs text-muted-foreground"><strong>Blocked if:</strong> {item.blocked_if}</p><p className="mt-1 text-xs text-muted-foreground"><strong>Safe internal next step:</strong> {item.safe_internal_next_step}</p>{item.route_href ? <Button asChild className="mt-3" size="sm" variant="outline"><Link href={item.route_href}>Review internal dry run gate link</Link></Button> : null}</CardContent></Card>;
}

export default function TeamMomoDryRunGoNoGo() {
  const blockers = MOMO_DRY_RUN_ITEMS.filter((item) => item.risk === "critical" || item.status === "blocked" || item.status === "no_go");
  return <PortalLayout items={teamPortalNavItems} portalName="Team Portal"><div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-2xl font-bold tracking-tight" data-testid="header-team-momo-dry-run-go-no-go">Momo Internal Dry Run + Go/No-Go Gate</h2><p className="mt-1 text-sm text-muted-foreground">Internal dry run and go/no-go review only. This organizes blockers before any future Faraz-approved owner/walkthrough decision.</p></div><Badge variant="outline">Team only</Badge></div><Card className="border-amber-500/30 bg-amber-500/10"><CardContent className="grid gap-1 p-4 text-sm text-amber-100">{MOMO_DRY_RUN_SAFETY_COPY.map((line) => <p key={line}><ShieldAlert className="mr-2 inline h-4 w-4" />{line}</p>)}</CardContent></Card><section className="mt-4 grid gap-3 md:grid-cols-3"><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Overall dry-run status</p><p className="mt-2 text-2xl font-bold">Internal review only</p><p className="mt-1 text-xs text-muted-foreground">No activation, no client visibility, no generated output, no fake completion.</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Critical go/no-go blockers</p><p className="mt-2 text-2xl font-bold">{blockers.length}</p><p className="mt-1 text-xs text-muted-foreground">Truth, media rights, AI controls, access, visibility, and publication boundaries stay blocked until explicitly resolved.</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Review sections</p><p className="mt-2 text-2xl font-bold">{MOMO_DRY_RUN_CATEGORIES.length}</p><p className="mt-1 text-xs text-muted-foreground">Scope through safe internal next decision.</p></CardContent></Card></section><Card className="mt-4"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4" />Critical go/no-go blockers</CardTitle></CardHeader><CardContent className="grid gap-3">{blockers.map((item) => <DryRunCard key={item.id} item={item} />)}</CardContent></Card>{MOMO_DRY_RUN_CATEGORIES.map((category) => <Card className="mt-4" key={category}><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><ClipboardList className="h-4 w-4" />{sectionLabels[category]}</CardTitle></CardHeader><CardContent className="grid gap-3">{MOMO_DRY_RUN_ITEMS.filter((item) => item.category === category).map((item) => <DryRunCard key={item.id} item={item} />)}</CardContent></Card>)}<Card className="mt-4"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Lock className="h-4 w-4" />Allowed internal Team links only</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2 text-sm text-muted-foreground">{["/team/momo-ai-approval", "/team/momo-ai-generation", "/team/momo-brand-ai-rules", "/team/momo-media-content", "/team/momo-business-truth", "/team/momo-pilot-prep", "/team/momo-live-readiness", "/team/momo-activation-gate", "/team/control-center", "/team/profile-corrections", "/team/upload-inbox", "/team/messages", "/team/activity-log", "/team/ai-drafts", "/team/reports-from-activity"].map((href) => <Button asChild key={href} size="sm" variant="outline"><Link href={href}>{href}</Link></Button>)}</CardContent></Card><TeamReviewModeRouteSummary title="Momo Internal Dry Run + Go/No-Go Gate review-mode summary" /></PortalLayout>;
}
