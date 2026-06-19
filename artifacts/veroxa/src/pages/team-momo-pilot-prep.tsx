import { AlertTriangle, ClipboardList, Lock, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import { PortalLayout } from "@/components/PortalLayout";
import { TeamReviewModeRouteSummary } from "@/components/team/TeamOperationalSpine";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOMO_PILOT_PREP_ALLOWED_TEAM_LINKS, MOMO_PILOT_PREP_CATEGORIES, MOMO_PILOT_PREP_CHECKLIST, type MomoPilotPrepChecklistItem } from "@/lib/momoPilotPrep/momoPilotPrepChecklist";
import { teamPortalNavItems } from "@/lib/teamPortalNav";

const requiredCopy = [
  "Internal prep only.",
  "This does not activate the pilot.",
  "This does not turn on real auth.",
  "This does not create credentials.",
  "This does not contact Momo’s House.",
  "This does not publish externally.",
  "This does not connect Google, Meta, Yelp, TikTok, or delivery platforms.",
  "Business-truth changes still require owner confirmation.",
  "Momo owner walkthrough remains blocked.",
  "No next activation PR is approved by default.",
  "Future real-world activation requires separate explicit Faraz approval.",
];

function ItemCard({ item }: { item: MomoPilotPrepChecklistItem }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{item.category}</Badge>
          <Badge variant={item.status === "blocked" ? "destructive" : "outline"}>{item.status.replaceAll("_", " ")}</Badge>
          <Badge variant={item.severity === "critical" ? "destructive" : "outline"}>{item.severity}</Badge>
        </div>
        <h3 className="mt-2 font-semibold">{item.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
        <p className="mt-2 text-xs text-muted-foreground"><strong>Evidence:</strong> {item.evidence}</p>
        <p className="mt-1 text-xs text-muted-foreground"><strong>Safe next step:</strong> {item.safe_next_step}</p>
        {item.route_href ? <Button asChild className="mt-3" size="sm" variant="outline"><Link href={item.route_href}>Open existing Team page</Link></Button> : null}
      </CardContent>
    </Card>
  );
}

export default function TeamMomoPilotPrep() {
  const blockers = MOMO_PILOT_PREP_CHECKLIST.filter((item) => item.severity === "critical" || item.status === "blocked");
  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" data-testid="header-team-momo-pilot-prep">Momo Internal Pilot Prep Pack</h2>
          <p className="mt-1 text-sm text-muted-foreground">Team-only internal preparation surface for what Faraz needs to verify, prepare, and collect before any future decision.</p>
        </div>
        <Badge variant="outline">Team only</Badge>
      </div>
      <Card className="border-amber-500/30 bg-amber-500/10">
        <CardContent className="grid gap-1 p-4 text-sm text-amber-100">
          {requiredCopy.map((line) => <p key={line}><ShieldAlert className="mr-2 inline h-4 w-4" />{line}</p>)}
        </CardContent>
      </Card>
      <section className="mt-4 grid gap-3 md:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Overall internal prep status</p><p className="mt-2 text-2xl font-bold">Blocked for external use</p><p className="mt-1 text-xs text-muted-foreground">Internal review only; no readiness claim.</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Critical blockers</p><p className="mt-2 text-2xl font-bold">{blockers.length}</p><p className="mt-1 text-xs text-muted-foreground">Business truth, access, and activation boundaries.</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Checklist categories</p><p className="mt-2 text-2xl font-bold">{MOMO_PILOT_PREP_CATEGORIES.length}</p><p className="mt-1 text-xs text-muted-foreground">Static internal checklist only.</p></CardContent></Card>
      </section>
      <Card className="mt-4"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4" />Critical blockers</CardTitle></CardHeader><CardContent className="grid gap-3">{blockers.map((item) => <ItemCard key={item.id} item={item} />)}</CardContent></Card>
      {MOMO_PILOT_PREP_CATEGORIES.map((category) => (
        <Card className="mt-4" key={category}>
          <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><ClipboardList className="h-4 w-4" />{category}</CardTitle></CardHeader>
          <CardContent className="grid gap-3">{MOMO_PILOT_PREP_CHECKLIST.filter((item) => item.category === category).map((item) => <ItemCard key={item.id} item={item} />)}</CardContent>
        </Card>
      ))}
      <Card className="mt-4"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Lock className="h-4 w-4" />Safe internal next steps</CardTitle></CardHeader><CardContent className="grid gap-2 text-sm text-muted-foreground"><p>Use existing internal Team pages only. This prep pack creates no account, credential, outreach, publishing, sync, or live workflow.</p><Button asChild size="sm" variant="outline"><Link href="/team/momo-business-truth">Review business truth internally</Link></Button><div className="flex flex-wrap gap-2">{MOMO_PILOT_PREP_ALLOWED_TEAM_LINKS.map((href) => <Button asChild key={href} size="sm" variant="outline"><Link href={href}>{href}</Link></Button>)}</div></CardContent></Card>
      <TeamReviewModeRouteSummary title="Momo Internal Pilot Prep Pack review-mode summary" />
    </PortalLayout>
  );
}
