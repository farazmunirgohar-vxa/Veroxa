import { AlertTriangle, Bot, ClipboardList, Lock, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import { PortalLayout } from "@/components/PortalLayout";
import { TeamReviewModeRouteSummary } from "@/components/team/TeamOperationalSpine";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOMO_BRAND_AI_ALLOWED_TEAM_LINKS, MOMO_BRAND_AI_CATEGORIES, MOMO_BRAND_AI_RULE_ITEMS, type MomoBrandAiRuleItem } from "@/lib/momoBrandAi/momoBrandAiRules";
import { teamPortalNavItems } from "@/lib/teamPortalNav";

const requiredCopy = [
  "Internal brand voice and AI prompt-rule preparation only.",
  "This does not generate AI output.",
  "This does not call any AI provider.",
  "This does not activate the pilot.",
  "This does not turn on real auth.",
  "This does not create credentials.",
  "This does not contact Momo’s House.",
  "This does not upload, create, seed, generate, or fake media.",
  "This does not publish externally.",
  "This does not connect Google, Meta, Yelp, TikTok, or delivery platforms.",
  "AI may use only confirmed business truth and permissioned media in later internal drafts.",
  "Business-truth changes still require owner confirmation.",
  "Media usage rights require owner confirmation before public use.",
  "Sensitive claims are blocked until owner-confirmed.",
  "All future AI output requires Team/Faraz review before customer-visible use.",
  "Momo owner walkthrough remains blocked.",
  "No next activation PR is approved by default.",
  "Future real-world activation requires separate explicit Faraz approval.",
];

const sectionLabels: Record<string, string> = { "Brand Voice Foundation": "Brand voice foundation", "Approved Tone": "Approved tone", "Unsafe Tone": "Unsafe tone", "Content Pillar Prompt Rules": "Content pillar prompt rules", "Caption Drafting Rules": "Caption drafting rules", "Local SEO Rules": "Local SEO rules", "Sensitive Claim Rules": "Sensitive claim rules", "Media Dependency Rules": "Media dependency rules", "Business Truth Dependency Rules": "Business truth dependency rules", "AI Forbidden Outputs": "AI forbidden outputs", "Prompt Template Boundaries": "Prompt template boundaries", "Team Review Requirements": "Team review requirements", "Future Confirmation Questions": "Future confirmation questions", "Safe Internal Next Decision": "Safe internal next decision" };

function RuleCard({ item }: { item: MomoBrandAiRuleItem }) {
  return <Card><CardContent className="p-4"><div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{item.category}</Badge><Badge variant={item.status === "blocked_for_public_use" ? "destructive" : "outline"}>{item.status.replaceAll("_", " ")}</Badge><Badge variant={item.risk === "critical" ? "destructive" : "outline"}>{item.risk}</Badge></div><h3 className="mt-2 font-semibold">{item.title}</h3><p className="mt-1 text-sm text-muted-foreground">{item.description}</p><p className="mt-2 text-xs text-muted-foreground"><strong>Allowed AI behavior:</strong> {item.allowed_ai_behavior}</p><p className="mt-1 text-xs text-muted-foreground"><strong>Blocked AI behavior:</strong> {item.blocked_ai_behavior}</p><p className="mt-1 text-xs text-muted-foreground"><strong>Required confirmation:</strong> {item.required_confirmation}</p><p className="mt-1 text-xs text-muted-foreground"><strong>Safe internal next step:</strong> {item.safe_internal_next_step}</p>{item.route_href ? <Button asChild className="mt-3" size="sm" variant="outline"><Link href={item.route_href}>Open existing Team page</Link></Button> : null}</CardContent></Card>;
}

export default function TeamMomoBrandAiRules() {
  const blockers = MOMO_BRAND_AI_RULE_ITEMS.filter((item) => item.risk === "critical" || item.status === "blocked_for_public_use" || item.status.includes("confirmation"));
  return <PortalLayout items={teamPortalNavItems} portalName="Team Portal"><div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-2xl font-bold tracking-tight" data-testid="header-team-momo-brand-ai-rules">Momo Brand Voice + AI Prompt Rules Pack</h2><p className="mt-1 text-sm text-muted-foreground">Team-only internal rulebook for safe future Momo AI drafting boundaries. No AI output is generated here.</p></div><Badge variant="outline">Team only</Badge></div><Card className="border-amber-500/30 bg-amber-500/10"><CardContent className="grid gap-1 p-4 text-sm text-amber-100">{requiredCopy.map((line) => <p key={line}><ShieldAlert className="mr-2 inline h-4 w-4" />{line}</p>)}</CardContent></Card><section className="mt-4 grid gap-3 md:grid-cols-3"><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Overall brand/AI rules status</p><p className="mt-2 text-2xl font-bold">Internal rules only</p><p className="mt-1 text-xs text-muted-foreground">Not live, not customer-visible, not an activation step.</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Critical AI/content blockers</p><p className="mt-2 text-2xl font-bold">{blockers.length}</p><p className="mt-1 text-xs text-muted-foreground">Business truth, sensitive claims, media rights, and Team review remain blockers.</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Rule sections</p><p className="mt-2 text-2xl font-bold">{MOMO_BRAND_AI_CATEGORIES.length}</p><p className="mt-1 text-xs text-muted-foreground">Static internal model; no provider calls or stored drafts.</p></CardContent></Card></section><Card className="mt-4"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4" />Critical AI/content blockers</CardTitle></CardHeader><CardContent className="grid gap-3">{blockers.map((item) => <RuleCard key={item.id} item={item} />)}</CardContent></Card>{MOMO_BRAND_AI_CATEGORIES.map((category) => <Card className="mt-4" key={category}><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><ClipboardList className="h-4 w-4" />{sectionLabels[category]}</CardTitle></CardHeader><CardContent className="grid gap-3">{MOMO_BRAND_AI_RULE_ITEMS.filter((item) => item.category === category).map((item) => <RuleCard key={item.id} item={item} />)}</CardContent></Card>)}<Card className="mt-4"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Lock className="h-4 w-4" />Allowed internal Team links only</CardTitle></CardHeader><CardContent className="grid gap-2 text-sm text-muted-foreground"><p><Bot className="mr-2 inline h-4 w-4" />Review related internal surfaces only. These links do not trigger external action.</p><div className="flex flex-wrap gap-2">{MOMO_BRAND_AI_ALLOWED_TEAM_LINKS.map((href) => <Button asChild key={href} size="sm" variant="outline"><Link href={href}>{href}</Link></Button>)}</div><Button asChild size="sm" variant="outline"><Link href="/team/momo-ai-generation">Review controlled AI generation foundation</Link></Button><Button asChild size="sm" variant="outline"><Link href="/team/momo-ai-approval">Open internal AI approval queue</Link></Button></CardContent></Card><TeamReviewModeRouteSummary title="Momo Brand Voice + AI Prompt Rules Pack review-mode summary" /></PortalLayout>;
}
