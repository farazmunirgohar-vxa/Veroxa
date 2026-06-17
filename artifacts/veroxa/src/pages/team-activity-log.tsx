import { useEffect, useState } from "react";
import { Activity, ShieldAlert } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { RealPortalReviewNotice, SafePortalEmptyCard } from "@/components/RealPortalSafeStates";
import { TeamReviewModeRouteSummary } from "@/components/team/TeamOperationalSpine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { useAuth } from "@/lib/auth/useAuth";
import { getSupabaseClient } from "@/lib/supabase";
import { canUseTeamActivityLog } from "@/lib/activityLog/activityLogConfig";
import { ACTIVITY_LOG_EVENT_TYPES, listTeamActivity, recordActivityEvent, type ActivityLogEventType } from "@/lib/activityLog/activityLogService";
import type { ActivityLogRecord, ActivityVisibility } from "@/domain/liveAutomation/databaseTypes";

export default function TeamActivityLog() {
  const auth = useAuth();
  const canUse = canUseTeamActivityLog(auth);
  const [restaurantId, setRestaurantId] = useState("");
  const [eventType, setEventType] = useState<ActivityLogEventType>("team_note_added");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<ActivityVisibility>("internal_only");
  const [reportEligible, setReportEligible] = useState(false);
  const [items, setItems] = useState<ActivityLogRecord[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!canUse) return;
    const client = getSupabaseClient();
    if (!client) return;
    void listTeamActivity(client).then(setItems).catch(() => setItems([]));
  }, [canUse]);

  async function addActivityNote() {
    const client = getSupabaseClient();
    if (!client || !auth.session?.userId) return;
    setStatus("Saving…");
    try {
      const saved = await recordActivityEvent({ client, restaurantId, teamUserId: auth.session.userId, eventType, title, description, visibility, reportEligible });
      setItems((prev) => [saved, ...prev]);
      setTitle("");
      setDescription("");
      setVisibility("internal_only");
      setReportEligible(false);
      setStatus("Activity note saved");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Activity note could not be saved");
    }
  }

  if (!canUse) {
    return <PortalLayout items={teamPortalNavItems} portalName="Team Portal"><RealPortalReviewNotice /><SafePortalEmptyCard title="Activity Log in review" body="Activity Log requires real auth and the Activity Log feature flag. Placeholder mode stays empty and does not show fake activity history, fake completed work, fake metrics, or fake reports." testId="empty-team-activity-log" /><TeamReviewModeRouteSummary title="Activity Log review-mode summary" /></PortalLayout>;
  }

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-2xl font-bold tracking-tight" data-testid="header-team-activity-log">Activity Log</h2><p className="mt-1 text-sm text-muted-foreground">Internal operating memory for restaurant-scoped work. This is not client report generation.</p></div><Badge variant="outline">Team only</Badge></div>
      <Card className="mb-4 border-amber-500/30 bg-amber-500/10"><CardContent className="flex gap-2 p-4 text-sm text-amber-100"><ShieldAlert className="mt-0.5 h-4 w-4" />Client-visible activity may appear to the restaurant. Report eligible only marks future report input; it does not publish a report.</CardContent></Card>
      <Card className="mb-4"><CardHeader><CardTitle className="text-sm">Add activity note</CardTitle></CardHeader><CardContent className="grid gap-3"><Input value={restaurantId} onChange={(e) => setRestaurantId(e.target.value)} placeholder="restaurant_id required" /><Select value={eventType} onValueChange={(v) => setEventType(v as ActivityLogEventType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ACTIVITY_LOG_EVENT_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title required" /><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description optional" /><Select value={visibility} onValueChange={(v) => setVisibility(v as ActivityVisibility)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="internal_only">internal_only</SelectItem><SelectItem value="client_visible">client_visible</SelectItem></SelectContent></Select><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={reportEligible} onChange={(e) => setReportEligible(e.target.checked)} /> Mark as report eligible for future reviewed reports</label><Button onClick={() => void addActivityNote()}>Add activity note</Button>{status ? <p className="text-xs text-muted-foreground">{status}</p> : null}</CardContent></Card>
      <section className="grid gap-3" data-testid="team-activity-log-list">{items.length === 0 ? <SafePortalEmptyCard title="No activity events yet" body="Events will appear after Team records restaurant-scoped activity in real-auth mode." /> : items.map((item) => <Card key={item.id}><CardContent className="p-4 text-sm"><div className="flex flex-wrap items-center gap-2"><Activity className="h-4 w-4 text-primary" /><Badge>{item.event_type}</Badge><Badge variant="outline">{item.visibility}</Badge><Badge variant="secondary">report eligible: {String(item.report_eligible)}</Badge></div><p className="mt-3 font-medium">{item.title}</p>{item.description ? <p className="mt-1 text-muted-foreground">{item.description}</p> : null}<p className="mt-2 text-xs text-muted-foreground">Restaurant: {item.restaurant_id} · Related: {item.related_entity_type ?? "none"} · {new Date(item.created_at).toLocaleString()}</p></CardContent></Card>)}</section>
      <TeamReviewModeRouteSummary title="Activity Log safe-memory summary" />
    </PortalLayout>
  );
}
