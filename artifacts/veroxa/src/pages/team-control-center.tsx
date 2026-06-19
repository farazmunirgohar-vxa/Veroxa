import { useEffect, useState } from "react";
import { Activity, Bot, FileText, KeyRound, Inbox, MessagesSquare, ShieldAlert, SlidersHorizontal } from "lucide-react";
import { Link } from "wouter";
import { PortalLayout } from "@/components/PortalLayout";
import { RealPortalReviewNotice, SafePortalEmptyCard } from "@/components/RealPortalSafeStates";
import { TeamReviewModeRouteSummary } from "@/components/team/TeamOperationalSpine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { useAuth } from "@/lib/auth/useAuth";
import { getSupabaseClient } from "@/lib/supabase";
import { canUseTeamControlCenter } from "@/lib/teamControlCenter/teamControlCenterConfig";
import { getTeamControlCenterSummary, listTeamControlCenterWorkItems, type TeamControlCenterSummary, type TeamControlCenterWorkItem } from "@/lib/teamControlCenter/teamControlCenterService";

const emptySummary: TeamControlCenterSummary = { work_needing_review: 0, client_visible_risk_or_owner_confirmation: 0, ai_drafts_needing_review: 0, messages_needing_reply: 0, profile_corrections_pending: 0, media_needing_review: 0, recent_activity: 0, reports_future_state: "Reports From Activity is active as PR #108 foundation." };

function SummaryCard({ title, value, href, icon: Icon }: { title: string; value: number | string; href?: string; icon: typeof SlidersHorizontal }) {
  return <Card><CardContent className="flex items-center justify-between gap-3 p-4"><div><p className="text-xs text-muted-foreground">{title}</p><p className="text-2xl font-bold">{value}</p></div><Icon className="h-5 w-5 text-primary" />{href ? <Button asChild size="sm" variant="outline"><Link href={href}>Open</Link></Button> : null}</CardContent></Card>;
}

export default function TeamControlCenter() {
  const auth = useAuth();
  const canUse = canUseTeamControlCenter(auth);
  const [summary, setSummary] = useState<TeamControlCenterSummary>(emptySummary);
  const [items, setItems] = useState<TeamControlCenterWorkItem[]>([]);

  useEffect(() => {
    if (!canUse) return;
    const client = getSupabaseClient();
    if (!client) return;
    void Promise.all([getTeamControlCenterSummary(client), listTeamControlCenterWorkItems(client)]).then(([nextSummary, nextItems]) => { setSummary(nextSummary); setItems(nextItems); }).catch(() => { setSummary(emptySummary); setItems([]); });
  }, [canUse]);

  if (!canUse) {
    return <PortalLayout items={teamPortalNavItems} portalName="Team Portal"><RealPortalReviewNotice /><SafePortalEmptyCard title="Internal Control Center in review" body="The Team Automation Control Center requires real auth, the Team Control Center feature flag, and an authenticated Team role. Placeholder mode stays empty and review-only with no fake live queue items." testId="empty-team-control-center" /><GuardrailCopy /><TeamReviewModeRouteSummary title="Team Control Center review-mode summary" /></PortalLayout>;
  }

  return <PortalLayout items={teamPortalNavItems} portalName="Team Portal"><div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-2xl font-bold tracking-tight" data-testid="header-team-control-center">Internal Control Center</h2><p className="mt-1 text-sm text-muted-foreground">Team-only summary of existing internal queues. Nothing is published automatically.</p></div><Badge variant="outline">Team only</Badge></div><GuardrailCopy />
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"><SummaryCard title="Work needing review" value={summary.work_needing_review} icon={SlidersHorizontal} /><SummaryCard title="Client-visible risk / owner confirmation needed" value={summary.client_visible_risk_or_owner_confirmation} href="/team/profile-corrections" icon={ShieldAlert} /><SummaryCard title="AI drafts needing review" value={summary.ai_drafts_needing_review} href="/team/ai-drafts" icon={Bot} /><SummaryCard title="Messages needing reply" value={summary.messages_needing_reply} href="/team/messages" icon={MessagesSquare} /><SummaryCard title="Profile corrections pending" value={summary.profile_corrections_pending} href="/team/profile-corrections" icon={SlidersHorizontal} /><SummaryCard title="Media needing review" value={summary.media_needing_review} href="/team/upload-inbox" icon={Inbox} /><SummaryCard title="Recent activity" value={summary.recent_activity} href="/team/activity-log" icon={Activity} /><SummaryCard title="Reports From Activity foundation" value="PR #108" href="/team/reports-from-activity" icon={FileText} /><SummaryCard title="Momo readiness gate" value="PR #109" href="/team/momo-live-readiness" icon={ShieldAlert} /><SummaryCard title="Activation Gate" value="PR #111" href="/team/momo-activation-gate" icon={KeyRound} /></section>
    <Card className="mt-4"><CardHeader><CardTitle className="text-sm">Work needing review</CardTitle></CardHeader><CardContent className="grid gap-3">{items.length === 0 ? <p className="text-sm text-muted-foreground">No real internal queue items are available right now.</p> : items.map((item) => <div key={item.id} className="rounded-lg border p-3 text-sm"><div className="flex flex-wrap items-center gap-2"><Badge>{item.source_type}</Badge><Badge variant="outline">{item.status}</Badge><Badge variant="secondary">{item.priority}</Badge><Badge variant="outline">{item.safety_label}</Badge></div><p className="mt-2 font-medium">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">Restaurant: {item.restaurant_id} · Source: {item.source_id}</p><Button asChild className="mt-2" size="sm" variant="outline"><Link href={item.route_href}>Review in existing Team page</Link></Button></div>)}</CardContent></Card><TeamReviewModeRouteSummary title="Team Control Center safe queue summary" /></PortalLayout>;
}

function GuardrailCopy() {
  return <Card className="mb-4 border-amber-500/30 bg-amber-500/10"><CardContent className="grid gap-1 p-4 text-sm text-amber-100"><p><ShieldAlert className="mr-2 inline h-4 w-4" />Client-visible actions still require review.</p><p>Business-truth changes still require owner confirmation.</p><p>Reports From Activity is active as PR #108 foundation.</p><p>Momo owner walkthrough remains blocked.</p><p>Momo Live Pilot Readiness Gate is internal-only and does not change activation state.</p><p>Controlled Momo Pilot Activation Gate is internal-only and requires a later Faraz decision.</p></CardContent></Card>;
}
