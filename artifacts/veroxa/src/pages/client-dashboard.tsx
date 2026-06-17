import { Link } from "wouter";
import { Clock3, Link2, MessageSquare, ShieldCheck } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { getClientPortalHref } from "@/lib/clientPortalRoutes";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { emptyStateCopy, momoCpV1Seed, statusTone } from "@/domain/momoCpV1/momoClientPortalSeed";
import { RecentVeroxaActivityCard } from "@/components/client/RecentVeroxaActivityCard";

export default function ClientDashboard() {
  const mode = useRealPortalDataMode();
  const hrefFor = (section: "media" | "messages" | "connections" | "profile") => getClientPortalHref(section, mode.isPublicDemoRoute);

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <PageHeader title="Welcome, Momo’s House" description="Veroxa is preparing your restaurant workspace. Nothing goes live without Veroxa review and owner-confirmed details." testId="header-client-dashboard" />
      <Card className="border-primary/20 bg-primary/5"><CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 text-primary" /><p>Nothing goes live without Veroxa review and owner-confirmed details.</p></CardContent></Card>
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card data-testid="needs-your-attention"><CardHeader><CardTitle className="text-sm">Needs Your Attention</CardTitle></CardHeader><CardContent className="space-y-3">{momoCpV1Seed.home.ownerActions.length ? momoCpV1Seed.home.ownerActions.slice(0, 3).map((item) => <div key={item.title} className="rounded-lg border border-border/70 p-3"><div className="flex items-start justify-between gap-3"><p className="text-sm font-medium">{item.title}</p><StatusBadge tone={statusTone(item.status)}>{item.status}</StatusBadge></div><Link href={hrefFor(item.section as "media" | "connections" | "profile")}><Button className="mt-3" size="sm" variant="outline">{item.buttonLabel}</Button></Link></div>) : <EmptyState body={emptyStateCopy.ownerReview} />}</CardContent></Card>
        <Card data-testid="veroxa-working-on"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Clock3 className="h-4 w-4 text-primary" />Veroxa Is Working On</CardTitle></CardHeader><CardContent className="space-y-3">{momoCpV1Seed.home.veroxaWorkingOn.slice(0, 3).map((item) => <Task key={item.title} {...item} />)}</CardContent></Card>
      </section>
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <RecentVeroxaActivityCard />
        <Card data-testid="latest-update"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><MessageSquare className="h-4 w-4 text-primary" />Latest Update</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground"><p>{momoCpV1Seed.home.latestUpdate}</p><Link href={hrefFor("messages")}><Button variant="outline">Open Messages</Button></Link></CardContent></Card>
        <Card data-testid="small-connection-status"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Link2 className="h-4 w-4 text-primary" />Connection Status</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{momoCpV1Seed.connections.map((c) => <div key={c.platform} className="flex items-center justify-between gap-3 rounded-lg border border-border/70 p-3"><span>{c.platform.replace(" Business Suite", "").replace(" Business Profile", "")}</span><StatusBadge tone={statusTone(c.status)}>{c.status}</StatusBadge></div>)}<Link href={hrefFor("connections")}><Button className="mt-2" size="sm" variant="outline">Open Connections</Button></Link></CardContent></Card>
      </section>
    </PortalLayout>
  );
}
function EmptyState({ body }: { body: string }) { return <div className="rounded-lg border border-border/70 p-3 text-sm"><p className="font-medium">{emptyStateCopy.nothingNeeded}</p><p className="mt-1 text-muted-foreground">{body}</p></div>; }
function Task({ title, status }: { title: string; status: string }) { return <div className="rounded-lg border border-border/70 p-3"><div className="flex items-start justify-between gap-3"><p className="text-sm font-medium">{title}</p><StatusBadge tone={statusTone(status)}>{status}</StatusBadge></div></div>; }
