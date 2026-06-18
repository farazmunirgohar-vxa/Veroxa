import { useEffect, useState } from "react";
import { CalendarCheck, CheckCircle2, FileText, Info } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { RealPortalReviewNotice } from "@/components/RealPortalSafeStates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { emptyStateCopy, momoCpV1Seed } from "@/domain/momoCpV1/momoClientPortalSeed";
import { useAuth } from "@/lib/auth/useAuth";
import { canReadClientReportsFromActivity } from "@/lib/reportsFromActivity/reportsConfig";
import { loadClientPortalReports, type ClientPortalReport } from "@/lib/reportsFromActivity/clientReportsReader";

export default function ClientReports() {
  const auth = useAuth();
  const canReadRealReports = canReadClientReportsFromActivity(auth);
  const [reports, setReports] = useState<ClientPortalReport[]>([]);

  useEffect(() => {
    if (!canReadRealReports || !auth.session?.clientId) return;
    void loadClientPortalReports(auth.session.clientId).then(setReports).catch(() => setReports([]));
  }, [auth.session?.clientId, canReadRealReports]);

  if (canReadRealReports) {
    return <PortalLayout items={clientPortalNavItems} portalName="Client Portal"><PageHeader title="Reports" description="Reviewed Veroxa work-history reports appear here when released inside the portal." testId="header-client-reports" /><ClientSafeCopy />{reports.length === 0 ? <Card data-testid="client-visible-reports-empty"><CardContent className="p-4 text-sm text-muted-foreground">No reviewed reports are available in the portal yet.</CardContent></Card> : <section className="grid gap-3" data-testid="client-visible-reports">{reports.map((report) => <Card key={report.id}><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><FileText className="h-4 w-4 text-primary" />{report.report_type === "weekly_update" ? "Weekly update" : "Monthly report"}<Badge variant="outline">Reviewed</Badge></CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-muted-foreground"><p className="font-medium text-foreground">{report.summary}</p><p>{report.period_start} to {report.period_end}</p><ReportBody body={report.body_json} /></CardContent></Card>)}</section>}</PortalLayout>;
  }

  return <PortalLayout items={clientPortalNavItems} portalName="Client Portal"><RealPortalReviewNotice /><PageHeader title="Reports" description="Weekly updates and monthly reports will stay simple, honest, and based on reviewed activity." testId="header-client-reports" /><ClientSafeCopy /><Card data-testid="this-weeks-update"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><CalendarCheck className="h-4 w-4 text-primary" />This Week’s Update</CardTitle></CardHeader><CardContent className="space-y-4 text-sm text-muted-foreground"><p>{momoCpV1Seed.reports.weeklyIntro}</p><section className="grid gap-3 md:grid-cols-3"><ReportList title="Done" items={momoCpV1Seed.reports.weeklyDone} /><ReportList title="Next" items={momoCpV1Seed.reports.weeklyNext} /><ReportList title="Needs Your Attention" items={momoCpV1Seed.reports.weeklyNeeds} /></section></CardContent></Card><section className="grid gap-4 lg:grid-cols-2"><Card data-testid="monthly-report-empty"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-primary" />Monthly Report</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Your first monthly report will appear after Veroxa has enough reviewed activity to report honestly.</CardContent></Card><Card data-testid="reports-stay-honest"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Info className="h-4 w-4 text-primary" />Reports Stay Honest</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Veroxa does not show fake numbers or promise orders, rankings, revenue, profit, or ROI.</CardContent></Card></section></PortalLayout>;
}
function ClientSafeCopy() { return <Card className="mb-4 border-amber-500/30 bg-amber-500/10"><CardContent className="grid gap-1 p-4 text-sm text-amber-100"><p>Reports are prepared from Veroxa activity.</p><p>Only reviewed reports appear here.</p><p>No fake metrics.</p><p>No revenue, order, ranking, or ROI guarantees.</p><p>This report reflects Veroxa work history, not external analytics.</p></CardContent></Card>; }
function ReportBody({ body }: { body: Record<string, unknown> }) { const sections = Array.isArray(body.sections) ? body.sections as Array<{ title?: string; items?: string[] }> : []; return <div className="grid gap-2">{sections.map((section) => <div key={section.title} className="rounded-lg border border-border/70 p-3"><p className="font-medium text-foreground">{section.title}</p>{Array.isArray(section.items) && section.items.length ? section.items.map((item) => <p key={item}>{item}</p>) : <p>No items listed.</p>}</div>)}</div>; }
function ReportList({ title, items }: { title: string; items: string[] }) { return <div className="rounded-lg border border-border/70 p-3"><p className="mb-2 font-medium text-foreground">{title}</p>{items.length ? <div className="space-y-2">{items.map((item) => <p key={item}>{item}</p>)}</div> : <p>{emptyStateCopy.nothingNeeded}</p>}</div>; }
