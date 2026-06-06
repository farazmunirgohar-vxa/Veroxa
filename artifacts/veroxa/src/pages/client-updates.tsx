import { CalendarCheck, CheckCircle2, Clock, Image, MessageSquare, ShieldCheck } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { RealPortalReviewNotice, SafePortalEmptyCard } from "@/components/RealPortalSafeStates";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientSaasPortalState } from "@/hooks/useClientSaasPortalState";
import { buildClientWeeklyUpdatePreview, buildWeeklyUpdateFromClientSummary, getClientWeeklyUpdateReminder, getPortalRequestResponseReminder, weeklyUpdateTemplateSections } from "@/domain/weeklyUpdates";

export default function ClientUpdates() {
  const { pageState, updateSummaries } = useClientSaasPortalState();
  const loadedUpdate = updateSummaries[0]
    ? buildWeeklyUpdateFromClientSummary(updateSummaries[0], pageState.restaurant?.name ?? "Your restaurant")
    : null;
  const { update, readiness } = buildClientWeeklyUpdatePreview(loadedUpdate ?? undefined);
  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <RealPortalReviewNotice />
      <PageHeader title="Weekly Updates" description="A simple weekly summary of what Veroxa worked on, what is pending, what media is needed, and what is next." testId="header-client-updates" />
      {!pageState.isDemoData && !pageState.canShowRealData ? <SafePortalEmptyCard title="Veroxa is preparing your weekly update workspace" body="Your weekly updates will appear here once Veroxa has reviewed your account setup. For now, this page shows the safe service update structure without pretending progress already happened." icon="info" /> : null}

      <Card className="mb-4 border-primary/20 bg-primary/5" data-testid="latest-weekly-update">
        <CardContent className="p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold">{update.weekLabel} — {update.restaurantName}</p>
            <p className="text-xs text-muted-foreground">{update.clientSafeSummary}</p>
          </div>
          <StatusBadge tone={readiness.status === "needs_media" || readiness.status === "needs_confirmation" ? "warning" : "info"}>{readiness.label}</StatusBadge>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <WeeklySection icon={CheckCircle2} title="What Veroxa worked on" items={update.completedThisWeek} />
          <WeeklySection icon={ShieldCheck} title="What was posted or prepared" items={update.preparedThisWeek} />
          <WeeklySection icon={Clock} title="What is pending" items={update.pendingItems} />
        </div>
        <div className="space-y-4">
          <WeeklySection icon={Image} title="Media needed" items={update.mediaNeeded} />
          <WeeklySection icon={ShieldCheck} title="What you need to confirm" items={update.clientConfirmationsNeeded} />
          <WeeklySection icon={CalendarCheck} title="Next week focus" items={update.nextWeekFocus} />
          <Card className="border-sky-500/20 bg-sky-500/5">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4" />Request response reminder</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{getPortalRequestResponseReminder()}</p>
              <p>{getClientWeeklyUpdateReminder(update)}</p>
              {update.requestsAnswered.map((item) => <p key={item} className="rounded-lg border border-border/50 p-2 text-xs">{item}</p>)}
            </CardContent>
          </Card>
        </div>
      </section>

      <Card className="mt-4">
        <CardHeader><CardTitle className="text-sm">Weekly update structure</CardTitle></CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {weeklyUpdateTemplateSections.map((section) => <div key={section} className="rounded-lg border border-border p-3 text-xs text-muted-foreground">{section}</div>)}
        </CardContent>
      </Card>
    </PortalLayout>
  );
}

function WeeklySection({ icon: Icon, title, items }: { icon: typeof CalendarCheck; title: string; items: string[] }) {
  return <Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><Icon className="h-4 w-4 text-primary" />{title}</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-muted-foreground">{items.map((item) => <p key={item} className="rounded-lg border border-border/50 p-2">{item}</p>)}</CardContent></Card>;
}
