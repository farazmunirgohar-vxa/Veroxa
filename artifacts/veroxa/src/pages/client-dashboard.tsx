import { Link } from "wouter";
import { CheckCircle2, Clock3, Link2, MessageSquare, ShieldCheck } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { RealPortalReviewNotice } from "@/components/RealPortalSafeStates";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { getClientPortalHref } from "@/lib/clientPortalRoutes";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { momoCpV1Seed, statusTone } from "@/domain/momoCpV1/momoClientPortalSeed";

export default function ClientDashboard() {
  const mode = useRealPortalDataMode();
  const hrefFor = (section: "media" | "messages" | "connections" | "profile") => getClientPortalHref(section, mode.isPublicDemoRoute);
  return <PortalLayout items={clientPortalNavItems} portalName="Client Portal"><RealPortalReviewNotice />
    <PageHeader title="Welcome, Momo’s House" description="Veroxa is helping organize and improve your restaurant’s online presence across Google, Facebook, Instagram, media, and reporting." testId="header-client-dashboard" />
    <Card className="mb-4 border-primary/20 bg-primary/5"><CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 text-primary" /><p>Nothing goes live without Veroxa team review and owner-confirmed business details.</p></CardContent></Card>
    <section className="grid gap-4 lg:grid-cols-3">
      <Card data-testid="completed-by-veroxa"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-primary" />Completed by Veroxa</CardTitle></CardHeader><CardContent className="space-y-3">{momoCpV1Seed.home.completed.map((item) => <Task key={item.title} {...item} />)}</CardContent></Card>
      <Card data-testid="needed-from-you"><CardHeader><CardTitle className="text-sm">Needed From You</CardTitle></CardHeader><CardContent className="space-y-3">{momoCpV1Seed.home.needed.map((item) => <div key={item.title} className="rounded-lg border border-border/70 p-3"><div className="flex items-start justify-between gap-3"><p className="text-sm font-medium">{item.title}</p><StatusBadge tone={statusTone(item.status)}>{item.status}</StatusBadge></div><Link href={hrefFor(item.section as "media" | "connections" | "profile")}><Button className="mt-3" size="sm" variant="outline">Open</Button></Link></div>)}</CardContent></Card>
      <Card data-testid="in-progress"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Clock3 className="h-4 w-4 text-primary" />In Progress</CardTitle></CardHeader><CardContent className="space-y-3">{momoCpV1Seed.home.inProgress.map((item) => <Task key={item.title} {...item} />)}</CardContent></Card>
    </section>
    <section className="mt-4 grid gap-4 lg:grid-cols-2">
      <Card data-testid="recent-messages"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><MessageSquare className="h-4 w-4 text-primary" />Recent Messages</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground">{momoCpV1Seed.home.recentMessages.map((item) => <p key={item} className="rounded-lg border border-border/70 p-3">{item}</p>)}<p className="text-xs">Messages are tracked manually while the portal remains pre-live. New messages are not automatically delivered from this screen yet.</p><Link href={hrefFor("messages")}><Button variant="outline">Open Messages</Button></Link></CardContent></Card>
      <Card data-testid="connection-preview"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Link2 className="h-4 w-4 text-primary" />Connection Preview</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">{momoCpV1Seed.connections.map((c) => <Task key={c.platform} title={c.platform} status={c.status} note={c.notes} />)}<Link href={hrefFor("connections")}><Button variant="outline">Open Connections</Button></Link></CardContent></Card>
    </section>
  </PortalLayout>;
}
function Task({ title, status, note }: { title: string; status: string; note?: string }) { return <div className="rounded-lg border border-border/70 p-3"><div className="flex items-start justify-between gap-3"><p className="text-sm font-medium">{title}</p><StatusBadge tone={statusTone(status)}>{status}</StatusBadge></div>{note ? <p className="mt-2 text-xs text-muted-foreground">{note}</p> : null}</div>; }
