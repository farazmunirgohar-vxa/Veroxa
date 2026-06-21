import { AlertTriangle, ClipboardList, Lock, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import { PortalLayout } from "@/components/PortalLayout";
import { TeamReviewModeRouteSummary } from "@/components/team/TeamOperationalSpine";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOMO_MEDIA_CONTENT_ALLOWED_TEAM_LINKS, MOMO_MEDIA_CONTENT_CATEGORIES, MOMO_MEDIA_CONTENT_INVENTORY_ITEMS, type MomoMediaContentInventoryItem } from "@/lib/momoMediaContent/momoMediaContentInventory";
import { teamPortalNavItems } from "@/lib/teamPortalNav";

const requiredCopy = [
  "Internal media/content inventory only.",
  "This does not activate the pilot.",
  "This does not turn on real auth.",
  "This does not create credentials.",
  "This does not contact Momo’s House.",
  "This does not upload, create, seed, or fake media.",
  "This does not publish externally.",
  "This does not connect Google, Meta, Yelp, TikTok, or delivery platforms.",
  "Media usage rights require owner confirmation before public use.",
  "Business-truth changes still require owner confirmation.",
  "AI may use only confirmed business truth and permissioned media in later internal drafts.",
  "Momo owner walkthrough remains blocked.",
  "No next activation PR is approved by default.",
  "Future real-world activation requires separate explicit Faraz approval.",
];

function InventoryItemCard({ item }: { item: MomoMediaContentInventoryItem }) {
  return <Card><CardContent className="p-4"><div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{item.category}</Badge><Badge variant={item.status === "blocked_for_public_use" || item.status === "missing" ? "destructive" : "outline"}>{item.status.replaceAll("_", " ")}</Badge><Badge variant={item.risk === "critical" ? "destructive" : "outline"}>{item.risk}</Badge></div><h3 className="mt-2 font-semibold">{item.title}</h3><p className="mt-1 text-sm text-muted-foreground">{item.description}</p><p className="mt-2 text-xs text-muted-foreground"><strong>Current source note:</strong> {item.current_source_note}</p><p className="mt-1 text-xs text-muted-foreground"><strong>AI use rule:</strong> {item.ai_use_rule}</p><p className="mt-1 text-xs text-muted-foreground"><strong>Public use rule:</strong> {item.public_use_rule}</p><p className="mt-1 text-xs text-muted-foreground"><strong>Safe internal next step:</strong> {item.safe_internal_next_step}</p>{item.route_href ? <Button asChild className="mt-3" size="sm" variant="outline"><Link href={item.route_href}>Open existing Team page</Link></Button> : null}</CardContent></Card>;
}

export default function TeamMomoMediaContent() {
  const blockers = MOMO_MEDIA_CONTENT_INVENTORY_ITEMS.filter((item) => item.risk === "critical" || item.status === "blocked_for_public_use" || item.status === "missing" || item.status === "needs_usage_rights_confirmation");
  return <PortalLayout items={teamPortalNavItems} portalName="Team Portal"><Button asChild className="mb-4" size="sm" variant="outline"><Link href="/team/momo">Open grouped Momo workspace</Link></Button><div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-2xl font-bold tracking-tight" data-testid="header-team-momo-media-content">Momo Media + Content Inventory Pack</h2><p className="mt-1 text-sm text-muted-foreground">Team-only media/content map for what is available only as internal context, missing, rights-blocked, or safe only for later internal drafting.</p></div><Badge variant="outline">Team only</Badge></div><Card className="border-amber-500/30 bg-amber-500/10"><CardContent className="grid gap-1 p-4 text-sm text-amber-100">{requiredCopy.map((line) => <p key={line}><ShieldAlert className="mr-2 inline h-4 w-4" />{line}</p>)}</CardContent></Card><section className="mt-4 grid gap-3 md:grid-cols-3"><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Overall media/content status</p><p className="mt-2 text-2xl font-bold">Blocked for public use</p><p className="mt-1 text-xs text-muted-foreground">Internal inventory only; no usable public media is claimed.</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Critical media/content blockers</p><p className="mt-2 text-2xl font-bold">{blockers.length}</p><p className="mt-1 text-xs text-muted-foreground">Missing assets, business truth, privacy consent, and usage rights.</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Inventory categories</p><p className="mt-2 text-2xl font-bold">{MOMO_MEDIA_CONTENT_CATEGORIES.length}</p><p className="mt-1 text-xs text-muted-foreground">Static internal model; no uploads or generated media.</p></CardContent></Card></section><Card className="mt-4"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4" />Critical media/content blockers</CardTitle></CardHeader><CardContent className="grid gap-3">{blockers.map((item) => <InventoryItemCard key={item.id} item={item} />)}</CardContent></Card>{MOMO_MEDIA_CONTENT_CATEGORIES.map((category) => <Card className="mt-4" key={category}><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><ClipboardList className="h-4 w-4" />{category}</CardTitle></CardHeader><CardContent className="grid gap-3">{MOMO_MEDIA_CONTENT_INVENTORY_ITEMS.filter((item) => item.category === category).map((item) => <InventoryItemCard key={item.id} item={item} />)}</CardContent></Card>)}<Card className="mt-4"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Lock className="h-4 w-4" />Safe internal next decision</CardTitle></CardHeader><CardContent className="grid gap-2 text-sm text-muted-foreground"><p>Faraz reviews media inventory, identifies missing media, and decides what is safe for later internal AI drafting. No external action is created by this PR.</p><div className="flex flex-wrap gap-2">{MOMO_MEDIA_CONTENT_ALLOWED_TEAM_LINKS.map((href) => <Button asChild key={href} size="sm" variant="outline"><Link href={href}>{href}</Link></Button>)}</div><Button asChild size="sm" variant="outline"><Link href="/team/momo-ai-generation">Open AI generation readiness</Link></Button></CardContent></Card><TeamReviewModeRouteSummary title="Momo Media + Content Inventory Pack review-mode summary" /><Card className="mt-4"><CardContent className="p-4"><Button asChild size="sm" variant="outline"><Link href="/team/momo-brand-ai-rules">Review AI drafting boundaries</Link></Button></CardContent></Card></PortalLayout>;
}
