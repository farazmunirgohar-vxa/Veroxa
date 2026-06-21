import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, Lock, ShieldAlert, Wrench } from "lucide-react";
import { Link } from "wouter";
import { PortalLayout } from "@/components/PortalLayout";
import { RealPortalReviewNotice, SafePortalEmptyCard } from "@/components/RealPortalSafeStates";
import { TeamReviewModeRouteSummary } from "@/components/team/TeamOperationalSpine";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/useAuth";
import { canUseMomoActivationGate } from "@/lib/momoActivation/momoActivationConfig";
import { getMomoActivationGate, type MomoActivationGate, type MomoActivationGateItem } from "@/lib/momoActivation/momoActivationGateService";
import { getSupabaseClient } from "@/lib/supabase";
import { teamPortalNavItems } from "@/lib/teamPortalNav";

const requiredCopy = [
  "Activation gate only.",
  "This does not activate the pilot.",
  "This does not turn on real auth.",
  "This does not create client credentials.",
  "This does not contact Momo’s House.",
  "This does not publish externally.",
  "This does not connect Google, Meta, Yelp, TikTok, or delivery platforms.",
  "Faraz approval is required before any pilot activation step.",
  "Momo owner walkthrough remains blocked.",
];

const fallback: MomoActivationGate = { summary: { overall_status: "blocked", blocker_count: 0, owner_confirmation_count: 0, manual_setup_count: 0, future_step_count: 0, faraz_decision_count: 0, total_count: 0, decision_text: "Activation gate is not available in placeholder/review mode." }, checklist: [], blockers: [] };
const internalLinks = ["/team/momo-live-readiness", "/team/control-center", "/team/reports-from-activity", "/team/activity-log", "/team/ai-drafts", "/team/messages", "/team/profile-corrections", "/team/upload-inbox"];

function StatusBadge({ status }: { status: string }) { return <Badge variant={status === "blocked" || status === "not_allowed" ? "destructive" : status === "ready_for_faraz_decision" ? "default" : "outline"}>{status.replaceAll("_", " ")}</Badge>; }
function GateItemCard({ item }: { item: MomoActivationGateItem }) {
  return <Card><CardContent className="p-4"><div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{item.category}</Badge><StatusBadge status={item.status} /><Badge variant={item.severity === "critical" ? "destructive" : "outline"}>{item.severity}</Badge></div><h3 className="mt-2 font-semibold">{item.title}</h3><p className="mt-1 text-sm text-muted-foreground">{item.description}</p><p className="mt-2 text-xs text-muted-foreground"><strong>Evidence:</strong> {item.evidence}</p><p className="mt-1 text-xs text-muted-foreground"><strong>Safe action hint:</strong> {item.action_hint}</p>{item.route_href ? <Button asChild className="mt-3" size="sm" variant="outline"><Link href={item.route_href}>Open existing Team page</Link></Button> : null}</CardContent></Card>;
}
function BoundaryCopy() { return <Card className="border-amber-500/30 bg-amber-500/10"><CardContent className="grid gap-1 p-4 text-sm text-amber-100">{requiredCopy.map((line) => <p key={line}><ShieldAlert className="mr-2 inline h-4 w-4" />{line}</p>)}</CardContent></Card>; }

export default function TeamMomoActivationGate() {
  const auth = useAuth();
  const canUse = canUseMomoActivationGate(auth);
  const [gate, setGate] = useState<MomoActivationGate>(fallback);

  useEffect(() => {
    if (!canUse) return;
    const client = getSupabaseClient();
    if (!client) return;
    void getMomoActivationGate(client).then(setGate).catch(() => setGate(fallback));
  }, [canUse]);

  if (!canUse) {
    return <PortalLayout items={teamPortalNavItems} portalName="Team Portal"><Button asChild className="mb-4" size="sm" variant="outline"><Link href="/team/momo">Open grouped Momo workspace</Link></Button><RealPortalReviewNotice /><SafePortalEmptyCard title="Controlled Momo Pilot Activation Gate in review" body="This Team-only activation-decision gate requires real auth, the Momo activation gate feature flag, and an authenticated Team role. Placeholder mode stays honest and empty with no fake activation readiness, no credential creation, no external contact, no platform connection, and no pilot activation." testId="empty-team-momo-activation-gate" /><BoundaryCopy /><Card className="mt-4"><CardContent className="p-4"><Button asChild size="sm" variant="outline"><Link href="/team/momo-dry-run-go-no-go">Review internal dry run gate</Link></Button></CardContent></Card><TeamReviewModeRouteSummary title="Controlled Momo Pilot Activation Gate review-mode summary" /></PortalLayout>;
  }

  const ownerItems = gate.checklist.filter((entry) => entry.status === "needs_owner_confirmation" || entry.category === "Business Truth Confirmation");
  const manualItems = gate.checklist.filter((entry) => entry.status === "needs_manual_setup" || entry.status === "future_step_required" || entry.category === "External Platform Boundary");
  const evidenceItems = gate.checklist.filter((entry) => ["Readiness Foundation", "Client Portal Boundary", "Report Boundary"].includes(entry.category));
  const accessItems = gate.checklist.filter((entry) => entry.category === "Access Boundary" || entry.category === "Team Control Boundary");
  const externalItems = gate.checklist.filter((entry) => entry.category === "External Platform Boundary");
  const publishingItems = gate.checklist.filter((entry) => entry.category === "Publishing Boundary");
  const finalItems = gate.checklist.filter((entry) => entry.category === "Final Decision");

  return <PortalLayout items={teamPortalNavItems} portalName="Team Portal"><Button asChild className="mb-4" size="sm" variant="outline"><Link href="/team/momo">Open grouped Momo workspace</Link></Button><div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-2xl font-bold tracking-tight" data-testid="header-team-momo-activation-gate">Controlled Momo Pilot Activation Gate</h2><p className="mt-1 text-sm text-muted-foreground">Internal Team-only decision gate that reads existing readiness evidence and blockers. This does not perform activation.</p></div><Badge variant="outline">Team only</Badge></div><BoundaryCopy />
    <section className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6"><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Overall gate status</p><p className="mt-2 text-xl font-bold">{gate.summary.overall_status.replaceAll("_", " ")}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Critical blockers</p><p className="mt-2 text-2xl font-bold">{gate.summary.blocker_count}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Owner confirmation required</p><p className="mt-2 text-2xl font-bold">{gate.summary.owner_confirmation_count}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Manual setup required</p><p className="mt-2 text-2xl font-bold">{gate.summary.manual_setup_count}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Future step required</p><p className="mt-2 text-2xl font-bold">{gate.summary.future_step_count}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Faraz decision items</p><p className="mt-2 text-2xl font-bold">{gate.summary.faraz_decision_count}</p></CardContent></Card></section>
    <Card className="mt-4"><CardContent className="p-4 text-sm text-muted-foreground"><strong>Decision summary:</strong> {gate.summary.decision_text}</CardContent></Card>
    <Card className="mt-4"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4" />Critical blockers</CardTitle></CardHeader><CardContent className="grid gap-3">{gate.blockers.length ? gate.blockers.map((entry) => <GateItemCard key={entry.id} item={entry} />) : <p className="text-sm text-muted-foreground">No blocker records returned by the real activation gate check.</p>}</CardContent></Card>
    <Card className="mt-4"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Lock className="h-4 w-4" />Owner confirmation required</CardTitle></CardHeader><CardContent className="grid gap-3">{ownerItems.map((entry) => <GateItemCard key={entry.id} item={entry} />)}</CardContent></Card>
    <Card className="mt-4"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Wrench className="h-4 w-4" />Manual setup required</CardTitle></CardHeader><CardContent className="grid gap-3">{manualItems.map((entry) => <GateItemCard key={entry.id} item={entry} />)}</CardContent></Card>
    <Card className="mt-4"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><ClipboardList className="h-4 w-4" />Existing readiness evidence</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">{evidenceItems.map((entry) => <GateItemCard key={entry.id} item={entry} />)}</CardContent></Card>
    <Card className="mt-4"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Lock className="h-4 w-4" />Access/auth boundary</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">{accessItems.map((entry) => <GateItemCard key={entry.id} item={entry} />)}</CardContent></Card>
    <Card className="mt-4"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><ShieldAlert className="h-4 w-4" />External platform boundary</CardTitle></CardHeader><CardContent className="grid gap-3">{externalItems.map((entry) => <GateItemCard key={entry.id} item={entry} />)}</CardContent></Card>
    <Card className="mt-4"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><ShieldAlert className="h-4 w-4" />Publishing boundary</CardTitle></CardHeader><CardContent className="grid gap-3">{publishingItems.map((entry) => <GateItemCard key={entry.id} item={entry} />)}</CardContent></Card>
    <Card className="mt-4"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4" />Final Faraz decision required</CardTitle></CardHeader><CardContent className="grid gap-3">{finalItems.map((entry) => <GateItemCard key={entry.id} item={entry} />)}<p className="text-sm text-muted-foreground">Momo owner walkthrough remains blocked until Faraz approval.</p><div className="flex flex-wrap gap-2 pt-2">{internalLinks.map((href) => <Button asChild key={href} size="sm" variant="outline"><Link href={href}>{href.replace("/team/", "")}</Link></Button>)}</div></CardContent></Card><Card className="mt-4"><CardContent className="p-4"><Button asChild size="sm" variant="outline"><Link href="/team/momo-dry-run-go-no-go">Review internal dry run gate</Link></Button></CardContent></Card><TeamReviewModeRouteSummary title="Controlled Momo Pilot Activation Gate safe checklist summary" /></PortalLayout>;
}
