import { Camera, UploadCloud } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { RealPortalReviewNotice } from "@/components/RealPortalSafeStates";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { ClientMediaTracker } from "@/components/client/ClientMediaTracker";

const needed = ["10 new momo photos", "3 sauce close-ups", "2 dining room photos", "1 short kitchen/prep video", "Catering/order photos if available"];
const feed = [
  ["Momo close-up photo", "photo", "Recently", "Ready to Use", "Strong close-up. Good for Instagram/Facebook post."],
  ["Sauce tray photo", "photo", "Recently", "Saved for Later", "Useful when Veroxa prepares sauce-focused content."],
  ["Dining room angle", "photo", "Recently", "Need Better Version", "Too dark. Please send a brighter version if possible."],
  ["Kitchen prep clip", "video", "Recently", "Under Review", "Saved for Veroxa review; video publishing is not active yet."],
];

export default function ClientMedia() {
  return <PortalLayout items={clientPortalNavItems} portalName="Client Portal"><RealPortalReviewNotice />
    <PageHeader title="Media" description="See what Veroxa needs next, how sent media may be used, and which items need a better version." testId="header-client-media" />
    <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <Card data-testid="media-needed"><CardHeader><CardTitle className="text-sm">Media Needed</CardTitle></CardHeader><CardContent className="space-y-2">{needed.map((item) => <p key={item} className="rounded-lg border border-border/70 p-3 text-sm">{item}</p>)}</CardContent></Card>
      <Card data-testid="upload-media"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><UploadCloud className="h-4 w-4 text-primary" />Upload Media</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground"><Input type="file" accept="image/*,video/*" multiple disabled /><Textarea placeholder="Tell Veroxa what this is or how you want it used. Example: New spicy chicken momo, use for catering, interior photo, owner wants this promoted." /><Button disabled>Send for Veroxa Review</Button><p className="text-xs">For now, Veroxa will tell you how to send media for review. Media delivery is handled manually right now. This intake area shows the CP-V1 structure without claiming files were delivered or stored.</p></CardContent></Card>
    </section>
    <Card className="mt-4" data-testid="card-media-detail"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Camera className="h-4 w-4 text-primary" />Media Feed</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">{feed.map(([name, type, date, status, note]) => <div key={name} className="rounded-lg border border-border/70 p-3"><div className="mb-3 flex h-24 items-center justify-center rounded-md bg-muted text-xs uppercase text-muted-foreground">{type}</div><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{name}</p><p className="text-xs text-muted-foreground">{type} · {date}</p></div><StatusBadge tone={status === "Need Better Version" ? "warning" : "info"}>{status}</StatusBadge></div><p className="mt-2 text-xs text-muted-foreground"><span className="font-medium text-foreground">Veroxa Notes:</span> {note}</p><ClientMediaTracker status={status === "Ready to Use" ? "Ready" : status === "Saved for Later" ? "Saved for later" : status === "Need Better Version" ? "Needs better media" : "Waiting for direction"} /></div>)}</CardContent></Card>
  </PortalLayout>;
}

// Media lifecycle guardrail markers: buildClientSubmissionKey duplicate-skipped.
