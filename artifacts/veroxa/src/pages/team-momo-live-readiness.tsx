import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, Lock, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import { PortalLayout } from "@/components/PortalLayout";
import { RealPortalReviewNotice, SafePortalEmptyCard } from "@/components/RealPortalSafeStates";
import { TeamReviewModeRouteSummary } from "@/components/team/TeamOperationalSpine";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/useAuth";
import { canUseMomoReadinessGate } from "@/lib/momoReadiness/momoReadinessConfig";
import { getMomoLivePilotReadiness, type MomoLivePilotReadiness, type MomoReadinessItem } from "@/lib/momoReadiness/momoReadinessService";
import { getSupabaseClient } from "@/lib/supabase";
import { teamPortalNavItems } from "@/lib/teamPortalNav";

const requiredCopy = [
  "Readiness gate only.",
  "This does not activate the pilot.",
  "This does not contact Momo’s House.",
  "This does not publish externally.",
  "Business-truth changes still require owner confirmation.",
  "Faraz approval is required before PR #110 controlled activation.",
  "Momo owner walkthrough remains blocked.",
];

const fallback: MomoLivePilotReadiness = { summary: { overall_status: "not_configured", ready_count: 0, blocker_count: 0, owner_confirmation_count: 0, review_count: 0, total_count: 0 }, checklist: [], blockers: [] };

function StatusBadge({ status }: { status: string }) { return <Badge variant={status === "ready" ? "default" : status === "blocked" ? "destructive" : "outline"}>{status.replaceAll("_", " ")}</Badge>; }
function ReadinessItemCard({ item }: { item: MomoReadinessItem }) {
  return <Card><CardContent className="p-4"><div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{item.category}</Badge><StatusBadge status={item.status} /><Badge variant={item.severity === "critical" ? "destructive" : "outline"}>{item.severity}</Badge></div><h3 className="mt-2 font-semibold">{item.title}</h3><p className="mt-1 text-sm text-muted-foreground">{item.description}</p><p className="mt-2 text-xs text-muted-foreground"><strong>Evidence:</strong> {item.evidence}</p><p className="mt-1 text-xs text-muted-foreground"><strong>Safe next step:</strong> {item.action_hint}</p>{item.route_href ? <Button asChild className="mt-3" size="sm" variant="outline"><Link href={item.route_href}>Open existing Team page</Link></Button> : null}</CardContent></Card>;
}

function BoundaryCopy() {
  return <Card className="border-amber-500/30 bg-amber-500/10"><CardContent className="grid gap-1 p-4 text-sm text-amber-100">{requiredCopy.map((line) => <p key={line}><ShieldAlert className="mr-2 inline h-4 w-4" />{line}</p>)}</CardContent></Card>;
}

export default function TeamMomoLiveReadiness() {
  const auth = useAuth();
  const canUse = canUseMomoReadinessGate(auth);
  const [readiness, setReadiness] = useState<MomoLivePilotReadiness>(fallback);

  useEffect(() => {
    if (!canUse) return;
    const client = getSupabaseClient();
    if (!client) return;
    void getMomoLivePilotReadiness(client).then(setReadiness).catch(() => setReadiness(fallback));
  }, [canUse]);

  if (!canUse) {
    return <PortalLayout items={teamPortalNavItems} portalName="Team Portal"><RealPortalReviewNotice /><SafePortalEmptyCard title="Momo Live Pilot Readiness Gate in review" body="This Team-only readiness gate requires real auth, the Momo readiness feature flag, and an authenticated Team role. Placeholder mode stays honest and empty with no fake completed readiness, no live pilot change, and no external action." testId="empty-team-momo-live-readiness" /><BoundaryCopy /><TeamReviewModeRouteSummary title="Momo Live Pilot Readiness Gate review-mode summary" /></PortalLayout>;
  }

  const ownerItems = readiness.checklist.filter((entry) => entry.status === "needs_owner_confirmation");
  const moduleItems = readiness.checklist.filter((entry) => !["Activation Boundaries", "Restaurant Identity"].includes(entry.category));
  const foundations = readiness.checklist.filter((entry) => ["Restaurant Identity", "Client Access Readiness", "Activation Boundaries"].includes(entry.category));

  return <PortalLayout items={teamPortalNavItems} portalName="Team Portal"><div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-2xl font-bold tracking-tight" data-testid="header-team-momo-live-readiness">Momo Live Pilot Readiness Gate</h2><p className="mt-1 text-sm text-muted-foreground">Team-only internal checklist for controlled activation consideration after Live Automation V1 foundations.</p></div><Badge variant="outline">Team only</Badge></div><BoundaryCopy />
    <section className="mt-4 grid gap-3 md:grid-cols-4"><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Overall readiness status</p><p className="mt-2 text-2xl font-bold">{readiness.summary.overall_status.replaceAll("_", " ")}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Critical blockers</p><p className="mt-2 text-2xl font-bold">{readiness.summary.blocker_count}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Needs owner confirmation</p><p className="mt-2 text-2xl font-bold">{readiness.summary.owner_confirmation_count}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Checklist items</p><p className="mt-2 text-2xl font-bold">{readiness.summary.total_count}</p></CardContent></Card></section>
    <Card className="mt-4"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4" />Critical blockers</CardTitle></CardHeader><CardContent className="grid gap-3">{readiness.blockers.length ? readiness.blockers.map((entry) => <ReadinessItemCard key={entry.id} item={entry} />) : <p className="text-sm text-muted-foreground">No blocker records returned by the real readiness check.</p>}</CardContent></Card>
    <Card className="mt-4"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Lock className="h-4 w-4" />Needs owner confirmation</CardTitle></CardHeader><CardContent className="grid gap-3">{ownerItems.length ? ownerItems.map((entry) => <ReadinessItemCard key={entry.id} item={entry} />) : <p className="text-sm text-muted-foreground">No owner-confirmation items returned by the real readiness check.</p>}</CardContent></Card>
    <Card className="mt-4"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4" />Foundation checklist</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">{foundations.map((entry) => <ReadinessItemCard key={entry.id} item={entry} />)}</CardContent></Card>
    <Card className="mt-4"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><ClipboardList className="h-4 w-4" />Module readiness</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">{moduleItems.map((entry) => <ReadinessItemCard key={entry.id} item={entry} />)}</CardContent></Card>
    <Card className="mt-4"><CardHeader><CardTitle className="text-sm">Activation boundaries</CardTitle></CardHeader><CardContent className="grid gap-2 text-sm text-muted-foreground"><p>PR #110 required before activation.</p><p>Faraz approval is required before PR #110 controlled activation.</p><p>Momo owner walkthrough remains blocked.</p><div className="flex flex-wrap gap-2 pt-2">{["/team/control-center", "/team/reports-from-activity", "/team/activity-log", "/team/ai-drafts", "/team/messages", "/team/profile-corrections", "/team/upload-inbox"].map((href) => <Button asChild key={href} size="sm" variant="outline"><Link href={href}>{href.replace("/team/", "")}</Link></Button>)}</div></CardContent></Card><TeamReviewModeRouteSummary title="Momo Live Pilot Readiness Gate safe checklist summary" /></PortalLayout>;
}
