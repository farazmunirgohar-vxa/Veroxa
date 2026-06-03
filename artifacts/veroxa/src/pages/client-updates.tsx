import type { ElementType } from "react";
import { CalendarDays, CheckCircle2, Clock, ListChecks } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { RealPortalReviewNotice, SafePortalEmptyCard } from "@/components/RealPortalSafeStates";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientSaasPortalState } from "@/hooks/useClientSaasPortalState";
import { getClientSafeEmptyStateForPage } from "@/domain/saas/clientPortalState";

export default function ClientUpdates() {
  const { pageState, updateSummaries } = useClientSaasPortalState();
  return <PortalLayout items={clientPortalNavItems} portalName="Client Portal"><RealPortalReviewNotice /><PageHeader title="Updates" description="Weekly Veroxa progress notes appear here after team review. Available signals will be reported honestly when connected." testId="header-client-updates" />
  {!pageState.isDemoData && !pageState.canShowRealData ? <SafePortalEmptyCard title="Updates in setup" body={getClientSafeEmptyStateForPage("updates", pageState)} /> : null}
  <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]"><Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" />Weekly update preview</CardTitle></CardHeader><CardContent className="space-y-4">{updateSummaries.length > 0 ? updateSummaries.map((update) => <div key={update.id} className="rounded-lg border border-border p-4"><p className="font-medium">{update.title}</p><div className="mt-3 grid gap-3 md:grid-cols-3"><Column icon={CheckCircle2} title="Completed" items={update.completed} /><Column icon={Clock} title="Waiting on client" items={update.waitingOnClient} /><Column icon={ListChecks} title="Next week" items={[update.nextDirection]} /></div><p className="mt-3 text-xs text-muted-foreground">Source: {update.sourceLabel === "demo" ? "sample data" : "setup state"}</p></div>) : <p className="text-sm text-muted-foreground">Weekly updates appear after Veroxa reviews and prepares verified progress notes.</p>}</CardContent></Card>
  <Card><CardHeader><CardTitle className="text-sm">Signals Veroxa may review</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-muted-foreground"><p>Online presence signals.</p><p>Calls, directions, menu visits, and order-path activity may be reviewed when connected.</p><p>No fake metrics are shown while account data is not connected.</p>{pageState.activityPreview.map((log) => <p className="rounded-lg border border-border p-2 text-xs" key={log.id}>{log.summary}</p>)}</CardContent></Card></section></PortalLayout>;
}
function Column({ icon: Icon, title, items }: { icon: ElementType; title: string; items: string[] }) { return <div><p className="flex items-center gap-2 text-xs font-medium text-foreground"><Icon className="h-3.5 w-3.5 text-primary" />{title}</p><ul className="mt-2 space-y-1 text-xs text-muted-foreground">{items.map((item) => <li key={item}>{item}</li>)}</ul></div>; }
