import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, FileText, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
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
import { canUseTeamReportsFromActivity } from "@/lib/reportsFromActivity/reportsConfig";
import { createReportDraftFromActivity, listReportEligibleActivity, listTeamReports, updateReportStatusForTeam, type ReportType } from "@/lib/reportsFromActivity/reportsService";
import type { ActivityLogRecord, ReportRecord, ReportStatus } from "@/domain/liveAutomation/databaseTypes";

const statuses: ReportStatus[] = ["ready_for_faraz_review", "approved", "published_to_client"];
const today = new Date().toISOString().slice(0, 10);

export default function TeamReportsFromActivity() {
  const auth = useAuth();
  const canUse = canUseTeamReportsFromActivity(auth);
  const [restaurantId, setRestaurantId] = useState("");
  const [periodStart, setPeriodStart] = useState(today);
  const [periodEnd, setPeriodEnd] = useState(today);
  const [reportType, setReportType] = useState<ReportType>("weekly_update");
  const [summary, setSummary] = useState("");
  const [activity, setActivity] = useState<ActivityLogRecord[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!canUse) return;
    const client = getSupabaseClient();
    if (!client) return;
    void listTeamReports(client).then(setReports).catch(() => setReports([]));
  }, [canUse]);

  const bodyJson = useMemo(() => ({
    period: { start: periodStart, end: periodEnd },
    sections: [
      { title: "Work completed", items: activity.filter((item) => item.visibility === "client_visible").map((item) => item.title) },
      { title: "Items reviewed", items: activity.map((item) => item.event_type) },
      { title: "Needs owner confirmation", items: activity.filter((item) => /confirm|owner|truth|correction/i.test(`${item.title} ${item.description ?? ""}`)).map((item) => item.title) },
      { title: "Next steps", items: [] },
    ],
    source_activity_count: activity.length,
    limitations: ["This report is based on Veroxa activity records only.", "No external analytics or revenue/order metrics are included."],
  }), [activity, periodEnd, periodStart]);

  async function loadActivity() {
    const client = getSupabaseClient();
    if (!client) return;
    setStatus("Loading report eligible activity…");
    try { setActivity(await listReportEligibleActivity(client, restaurantId, periodStart, periodEnd)); setStatus("Report eligible activity loaded."); } catch (error) { setStatus(error instanceof Error ? error.message : "Activity could not be loaded."); }
  }
  async function createDraft() {
    const client = getSupabaseClient();
    if (!client) return;
    setStatus("Creating report draft…");
    try { const draft = await createReportDraftFromActivity({ client, restaurantId, reportType, periodStart, periodEnd, summary, bodyJson }); setReports((prev) => [draft, ...prev]); setStatus("Draft report created for Team review."); } catch (error) { setStatus(error instanceof Error ? error.message : "Draft report could not be created."); }
  }
  async function moveReport(report: ReportRecord, nextStatus: ReportStatus) {
    const client = getSupabaseClient();
    if (!client) return;
    const updated = await updateReportStatusForTeam({ client, reportId: report.id, restaurantId: report.restaurant_id, status: nextStatus });
    setReports((prev) => prev.map((item) => item.id === updated.id ? updated : item));
  }

  if (!canUse) {
    return <PortalLayout items={teamPortalNavItems} portalName="Team Portal"><RealPortalReviewNotice /><SafePortalEmptyCard title="Reports From Activity in review" body="Reports From Activity requires real auth, the Reports From Activity feature flag, and an authenticated Team role. Placeholder mode stays empty and review-only with no fake reports, fake metrics, or external analytics." testId="empty-team-reports-from-activity" /><WarningBox /><TeamReviewModeRouteSummary title="Reports From Activity review-mode summary" /></PortalLayout>;
  }

  const groups = { draft: reports.filter((r) => r.status === "draft"), ready: reports.filter((r) => r.status === "ready_for_faraz_review"), client: reports.filter((r) => r.status === "published_to_client"), held: reports.filter((r) => !["draft", "ready_for_faraz_review", "published_to_client"].includes(r.status)) };

  return <PortalLayout items={teamPortalNavItems} portalName="Team Portal"><div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-2xl font-bold tracking-tight" data-testid="header-team-reports-from-activity">Reports From Activity</h2><p className="mt-1 text-sm text-muted-foreground">Prepare Team-reviewed report drafts from real Veroxa activity records only.</p></div><Badge variant="outline">Team only</Badge></div><WarningBox />
    <Card className="mb-4"><CardHeader><CardTitle className="text-sm">Report eligible activity</CardTitle></CardHeader><CardContent className="grid gap-3"><Input value={restaurantId} onChange={(e) => setRestaurantId(e.target.value)} placeholder="restaurant_id required" /><div className="grid gap-3 md:grid-cols-2"><Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} /><Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} /></div><Button onClick={() => void loadActivity()}>Load real activity</Button>{activity.map((item) => <div key={item.id} className="rounded-lg border p-3 text-sm"><Badge>{item.event_type}</Badge><Badge className="ml-2" variant="outline">{item.visibility}</Badge><p className="mt-2 font-medium">{item.title}</p>{item.description ? <p className="text-muted-foreground">{item.description}</p> : null}</div>)}</CardContent></Card>
    <Card className="mb-4"><CardHeader><CardTitle className="text-sm">Create draft report</CardTitle></CardHeader><CardContent className="grid gap-3"><Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="weekly_update">weekly_update</SelectItem><SelectItem value="monthly_report">monthly_report</SelectItem></SelectContent></Select><Textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Summary required. Keep it grounded in Veroxa work history." /><Button onClick={() => void createDraft()}>Create draft report from real activity</Button>{status ? <p className="text-xs text-muted-foreground">{status}</p> : null}</CardContent></Card>
    <ReportSection title="Draft reports" reports={groups.draft} onMove={moveReport} /><ReportSection title="Reports ready for Faraz review" reports={groups.ready} onMove={moveReport} /><ReportSection title="Client-visible reports inside portal" reports={groups.client} onMove={moveReport} /><ReportSection title="Held/rejected reports if supported" reports={groups.held} onMove={moveReport} />
    <div className="mt-4 flex gap-2"><Button asChild variant="outline"><Link href="/team/activity-log">Open Activity Log</Link></Button><Button asChild variant="outline"><Link href="/team/control-center">Open Team Control Center</Link></Button></div><TeamReviewModeRouteSummary title="Reports From Activity safe-report summary" /></PortalLayout>;
}

function WarningBox() { return <Card className="mb-4 border-amber-500/30 bg-amber-500/10"><CardContent className="grid gap-1 p-4 text-sm text-amber-100"><p><ShieldAlert className="mr-2 inline h-4 w-4" />Reports are prepared from Veroxa activity.</p><p>No fake metrics.</p><p>No revenue, order, ranking, or ROI guarantees.</p><p>Publishing means visible inside the client portal only. It does not post externally.</p></CardContent></Card>; }
function ReportSection({ title, reports, onMove }: { title: string; reports: ReportRecord[]; onMove: (report: ReportRecord, status: ReportStatus) => void }) { return <Card className="mb-4"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><FileText className="h-4 w-4 text-primary" />{title}</CardTitle></CardHeader><CardContent className="grid gap-3">{reports.length === 0 ? <p className="text-sm text-muted-foreground">No real reports in this state.</p> : reports.map((report) => <div key={report.id} className="rounded-lg border p-3 text-sm"><div className="flex flex-wrap items-center gap-2"><Badge>{report.report_type}</Badge><Badge variant="outline">{report.status}</Badge><Badge variant="secondary"><CalendarCheck className="mr-1 h-3 w-3" />{report.period_start} to {report.period_end}</Badge></div><p className="mt-2 font-medium">{report.summary}</p><div className="mt-2 flex flex-wrap gap-2">{statuses.map((next) => <Button key={next} size="sm" variant="outline" onClick={() => void onMove(report, next)}>Mark {next}</Button>)}</div></div>)}</CardContent></Card>; }
