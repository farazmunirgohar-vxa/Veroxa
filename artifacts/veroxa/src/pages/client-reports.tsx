import { BarChart3, CalendarCheck, CheckCircle2, Info } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { RealPortalReviewNotice } from "@/components/RealPortalSafeStates";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientSaasPortalState } from "@/hooks/useClientSaasPortalState";
import { buildMonthlyReportFromClientSummary } from "@/domain/monthlyReports";

const weeklyDone = ["Reviewed Google profile", "Organized new photos", "Prepared first content ideas", "Checked menu/order links", "Drafted first captions"];
const weeklyNext = ["Prepare 3 content pieces", "Review new food photos", "Prepare Google update", "Build first monthly report draft", "Confirm Meta access"];
const weeklyNeeds = ["Send new momo photos", "Confirm holiday hours", "Confirm catering availability", "Add Veroxa to Meta", "Add Veroxa to Google Business Profile"];
const worked = ["Close-up momo photos", "Sauce-focused posts", "Google photo freshness", "Best-seller content"];
const didnt = ["Dark photos", "Repeated angles", "Not enough new media", "Missing catering confirmation", "Pending Google/Meta access"];
const nextMonth = ["Focus on chicken momo and sauce content", "Add more Google photos", "Prepare catering visibility content", "Improve snack/drink content variety", "Need 10 new food photos", "Need confirmation of holiday hours", "Need confirmation of catering availability"];

export default function ClientReports() {
  const { reportSummaries, pageState } = useClientSaasPortalState();
  const loadedMonthlyReport = reportSummaries.find((summary) => summary.reportType === "monthly");
  if (loadedMonthlyReport) buildMonthlyReportFromClientSummary(loadedMonthlyReport, pageState.restaurant?.name ?? "Momo’s House");
  return <PortalLayout items={clientPortalNavItems} portalName="Client Portal"><RealPortalReviewNotice />
    <PageHeader title="Reports" description="Weekly Updates and Monthly Reports live together here so you can see what happened, what is planned, and what Veroxa needs next." testId="header-client-reports" />
    <Card className="mb-4"><CardHeader><CardTitle className="text-sm">Weekly Updates</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">What happened this week, what is planned next week, and what Veroxa needs from you.</CardContent></Card>
    <section className="grid gap-4 lg:grid-cols-3"><ReportSection icon={CalendarCheck} title="What was done this week" items={weeklyDone} /><ReportSection icon={CalendarCheck} title="What is next week’s plan" items={weeklyNext} /><ReportSection icon={Info} title="What Veroxa needs from you" items={weeklyNeeds} /></section>
    <Card className="my-4"><CardHeader><CardTitle className="text-sm">Monthly Reports</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Are more people finding us, what worked, what did not work, and what is the plan next month?</CardContent></Card>
    <ReportSection icon={CheckCircle2} title="What Veroxa handled" items={["Reviewed online presence setup", "Organized media guidance", "Prepared connection next steps"]} />
    <Card className="my-4 border-primary/20 bg-primary/5" data-testid="monthly-reach-actions"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><BarChart3 className="h-4 w-4 text-primary" />Reach & Customer Actions</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Reach/action signals: Google and Meta performance data will appear after Veroxa has access and enough activity to report honestly.</CardContent></Card>
    <section className="grid gap-4 lg:grid-cols-3"><ReportSection icon={CheckCircle2} title="What Worked / What Didn’t Work" items={["Worked: " + worked.join(", "), "Didn’t Work: " + didnt.join(", ")]} /><ReportSection icon={CalendarCheck} title="Next month focus" items={nextMonth} /><ReportSection icon={Info} title="Monthly Report Safety" items={["No fake numbers are shown.", "No promises about orders, rankings, profit, ROI, or complicated attribution math are shown.", "Veroxa keeps internal value/profit review out of client reports."]} /></section>
  </PortalLayout>;
}
function ReportSection({ icon: Icon, title, items }: { icon: typeof Info; title: string; items: string[] }) { return <Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Icon className="h-4 w-4 text-primary" />{title}</CardTitle></CardHeader><CardContent className="space-y-2">{items.map((item) => <p key={item} className="rounded-lg border border-border/70 p-3 text-sm text-muted-foreground">{item}</p>)}</CardContent></Card>; }
