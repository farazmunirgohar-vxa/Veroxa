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

const completed = [
  ["Reviewed your online presence", "Completed", "Initial Momo House review has been organized for owner review."],
  ["Pre-filled your restaurant profile", "Prepared", "Business details are ready for you to confirm before Veroxa uses them."],
  ["Organized your first setup checklist", "Completed", "The next owner actions are grouped below."],
  ["Reviewed menu/order links", "Prepared", "Veroxa is checking the best owner-confirmed link to use."],
  ["Prepared first media guidance", "Prepared", "The Media page lists the specific photos and video that would help next."],
  ["Prepared Meta and Google access steps", "Prepared", "Connection steps are tracked without any live account integration."],
];


const inProgress = [
  ["Preparing first content direction", "In Progress"],
  ["Reviewing Google Business Profile connection", "Waiting on Access"],
  ["Waiting on Meta access", "Waiting on Access"],
  ["Organizing media guidance", "Waiting on Media"],
  ["Preparing first weekly update", "Under Veroxa Review"],
  ["Preparing first monthly report structure", "Under Veroxa Review"],
];

const messages = [
  "Veroxa: Please confirm your current business hours.",
  "Veroxa: Meta and Google access are still pending.",
  "Momo’s House: We will send new food photos this week.",
];

export default function ClientDashboard() {
  const mode = useRealPortalDataMode();
  const hrefFor = (section: "media" | "messages" | "connections" | "profile") => getClientPortalHref(section, mode.isPublicDemoRoute);
  const needed = [
    ["Confirm business hours", "Needs Your Review", hrefFor("profile")],
    ["Confirm menu/order link", "Needs Your Review", hrefFor("profile")],
    ["Send 10–15 current food photos", "Waiting on You", hrefFor("media")],
    ["Add Veroxa to Meta Business Suite", "Waiting on You", hrefFor("connections")],
    ["Add Veroxa as Google Business Profile Manager", "Waiting on You", hrefFor("connections")],
    ["Confirm catering availability", "Needs Your Review", hrefFor("profile")],
  ];
  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <RealPortalReviewNotice />
      <PageHeader
        title="Welcome, Momo’s House"
        description="Veroxa is helping organize and improve your restaurant’s online presence across Google, Facebook, Instagram, media, and reporting."
        testId="header-client-dashboard"
      />
      <Card className="mb-4 border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
          <p>Nothing goes live without Veroxa team review and owner-confirmed business details.</p>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1" data-testid="completed-by-veroxa">
          <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-primary" />Completed by Veroxa</CardTitle></CardHeader>
          <CardContent className="space-y-3">{completed.map(([title, status, note]) => <Task key={title} title={title} status={status} note={note} />)}</CardContent>
        </Card>
        <Card className="lg:col-span-1" data-testid="needed-from-you">
          <CardHeader><CardTitle className="text-sm">Needed From You</CardTitle></CardHeader>
          <CardContent className="space-y-3">{needed.map(([title, status, href]) => <div key={title} className="rounded-lg border border-border/70 p-3"><div className="flex items-start justify-between gap-3"><p className="text-sm font-medium">{title}</p><StatusBadge tone="warning">{status}</StatusBadge></div><Link href={href}><Button className="mt-3" size="sm" variant="outline">Open</Button></Link></div>)}</CardContent>
        </Card>
        <Card className="lg:col-span-1" data-testid="in-progress">
          <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Clock3 className="h-4 w-4 text-primary" />In Progress</CardTitle></CardHeader>
          <CardContent className="space-y-3">{inProgress.map(([title, status]) => <Task key={title} title={title} status={status} />)}</CardContent>
        </Card>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card data-testid="recent-messages"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><MessageSquare className="h-4 w-4 text-primary" />Recent Messages</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground">{messages.map((item) => <p key={item} className="rounded-lg border border-border/70 p-3">{item}</p>)}<p className="text-xs">Messages are tracked manually while the portal remains pre-live. New messages are not automatically delivered from this screen yet.</p><Link href={hrefFor("messages")}><Button variant="outline">Open Messages</Button></Link></CardContent></Card>
        <Card data-testid="connection-preview"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Link2 className="h-4 w-4 text-primary" />Connection Preview</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><Task title="Meta Business Suite" status="Pending Verification" note="Waiting for Momo’s House to add Veroxa as a partner." /><Task title="Google Business Profile" status="Pending Verification" note="Momo’s House needs to add Veroxa as a manager before Google updates can begin." /><Link href={hrefFor("connections")}><Button variant="outline">Open Connections</Button></Link></CardContent></Card>
      </section>
    </PortalLayout>
  );
}

function Task({ title, status, note }: { title: string; status: string; note?: string }) {
  return <div className="rounded-lg border border-border/70 p-3"><div className="flex items-start justify-between gap-3"><p className="text-sm font-medium">{title}</p><StatusBadge tone="info">{status}</StatusBadge></div>{note ? <p className="mt-2 text-xs text-muted-foreground">{note}</p> : null}</div>;
}
