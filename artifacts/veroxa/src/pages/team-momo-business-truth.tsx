import { AlertTriangle, ClipboardList, Lock, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import { PortalLayout } from "@/components/PortalLayout";
import { TeamReviewModeRouteSummary } from "@/components/team/TeamOperationalSpine";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOMO_BUSINESS_TRUTH_ALLOWED_TEAM_LINKS, MOMO_BUSINESS_TRUTH_CATEGORIES, MOMO_BUSINESS_TRUTH_REVIEW_ITEMS, type MomoBusinessTruthReviewItem } from "@/lib/momoBusinessTruth/momoBusinessTruthReview";
import { teamPortalNavItems } from "@/lib/teamPortalNav";

const requiredCopy = [
  "Internal business-truth review only.",
  "This does not activate the pilot.",
  "This does not turn on real auth.",
  "This does not create credentials.",
  "This does not contact Momo’s House.",
  "This does not publish externally.",
  "This does not connect Google, Meta, Yelp, TikTok, or delivery platforms.",
  "Business-truth changes still require owner confirmation.",
  "Sensitive claims are blocked until owner-confirmed.",
  "Momo owner walkthrough remains blocked.",
  "No next activation PR is approved by default.",
  "Future real-world activation requires separate explicit Faraz approval.",
];

function TruthItemCard({ item }: { item: MomoBusinessTruthReviewItem }) {
  return <Card><CardContent className="p-4"><div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{item.category}</Badge><Badge variant={item.status === "blocked" || item.status === "unsafe_for_public_use" ? "destructive" : "outline"}>{item.status.replaceAll("_", " ")}</Badge><Badge variant={item.risk === "critical" ? "destructive" : "outline"}>{item.risk}</Badge></div><h3 className="mt-2 font-semibold">{item.label}</h3><p className="mt-1 text-sm text-muted-foreground"><strong>Current value:</strong> {item.current_value}</p><p className="mt-1 text-xs text-muted-foreground"><strong>Source note:</strong> {item.source_note}</p><p className="mt-1 text-xs text-muted-foreground"><strong>Public use rule:</strong> {item.public_use_rule}</p><p className="mt-1 text-xs text-muted-foreground"><strong>Future owner-confirmation question:</strong> {item.owner_confirmation_question}</p><p className="mt-1 text-xs text-muted-foreground"><strong>Safe internal next step:</strong> {item.safe_internal_next_step}</p>{item.route_href ? <Button asChild className="mt-3" size="sm" variant="outline"><Link href={item.route_href}>Open existing Team page</Link></Button> : null}</CardContent></Card>;
}

export default function TeamMomoBusinessTruth() {
  const blockers = MOMO_BUSINESS_TRUTH_REVIEW_ITEMS.filter((item) => item.risk === "critical" || item.status === "blocked" || item.status === "unsafe_for_public_use");
  return <PortalLayout items={teamPortalNavItems} portalName="Team Portal"><div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-2xl font-bold tracking-tight" data-testid="header-team-momo-business-truth">Momo Business Truth Review Pack</h2><p className="mt-1 text-sm text-muted-foreground">Team-only map of known internal context, prefilled unconfirmed facts, owner-confirmation needs, unsafe public claims, and blocked sensitive claims.</p></div><Badge variant="outline">Team only</Badge></div><Card className="border-amber-500/30 bg-amber-500/10"><CardContent className="grid gap-1 p-4 text-sm text-amber-100">{requiredCopy.map((line) => <p key={line}><ShieldAlert className="mr-2 inline h-4 w-4" />{line}</p>)}</CardContent></Card><section className="mt-4 grid gap-3 md:grid-cols-3"><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Overall business-truth status</p><p className="mt-2 text-2xl font-bold">Blocked for public use</p><p className="mt-1 text-xs text-muted-foreground">Internal review only; no readiness claim.</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Critical business-truth blockers</p><p className="mt-2 text-2xl font-bold">{blockers.length}</p><p className="mt-1 text-xs text-muted-foreground">Menu, hours, claims, links, access, and media rights.</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Review categories</p><p className="mt-2 text-2xl font-bold">{MOMO_BUSINESS_TRUTH_CATEGORIES.length}</p><p className="mt-1 text-xs text-muted-foreground">Static internal business-truth review.</p></CardContent></Card></section><Card className="mt-4"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4" />Critical business-truth blockers</CardTitle></CardHeader><CardContent className="grid gap-3">{blockers.map((item) => <TruthItemCard key={item.id} item={item} />)}</CardContent></Card>{MOMO_BUSINESS_TRUTH_CATEGORIES.map((category) => <Card className="mt-4" key={category}><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><ClipboardList className="h-4 w-4" />{category}</CardTitle></CardHeader><CardContent className="grid gap-3">{MOMO_BUSINESS_TRUTH_REVIEW_ITEMS.filter((item) => item.category === category).map((item) => <TruthItemCard key={item.id} item={item} />)}</CardContent></Card>)}<Card className="mt-4"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Lock className="h-4 w-4" />Safe internal next decision</CardTitle></CardHeader><CardContent className="grid gap-2 text-sm text-muted-foreground"><p>Faraz reviews the internal truth map, may keep researching internally, and may separately decide whether a future owner-confirmation plan is needed. No external action is created by this PR.</p><div className="flex flex-wrap gap-2">{MOMO_BUSINESS_TRUTH_ALLOWED_TEAM_LINKS.map((href) => <Button asChild key={href} size="sm" variant="outline"><Link href={href}>{href}</Link></Button>)}</div></CardContent></Card><TeamReviewModeRouteSummary title="Momo Business Truth Review Pack review-mode summary" /></PortalLayout>;
}
