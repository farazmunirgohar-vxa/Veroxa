import { Mail, Send } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { RealPortalReviewNotice } from "@/components/RealPortalSafeStates";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { momoCpV1Seed, statusTone } from "@/domain/momoCpV1/momoClientPortalSeed";
export default function ClientMessages() { return <PortalLayout items={clientPortalNavItems} portalName="Client Portal"><RealPortalReviewNotice /><PageHeader title="Messages" description="Communicate with Veroxa in a simple inbox-style view. Routine owner communication belongs here, not in a ticket system." testId="header-client-messages" /><section className="grid gap-4 lg:grid-cols-3"><MessageList title="Inbox" icon={Mail} items={momoCpV1Seed.messages.inbox} from="Veroxa" /><MessageList title="Sent" icon={Send} items={momoCpV1Seed.messages.sent} from="Momo’s House" /><Card data-testid="new-message"><CardHeader><CardTitle className="text-sm">New Message</CardTitle></CardHeader><CardContent className="space-y-3"><Input placeholder="Subject (optional)" /><Textarea required placeholder="Message (required)" /><Input type="file" multiple disabled /><Button disabled>Send Message</Button><p className="text-xs text-muted-foreground">Message delivery/storage is not connected yet. Please use this structure for review-mode drafting; Veroxa will confirm the manual communication path.</p></CardContent></Card></section></PortalLayout>; }
function MessageList({ title, icon: Icon, items, from }: { title: string; icon: typeof Mail; items: {subject:string; status:string}[]; from: string }) { return <Card data-testid={`messages-${title.toLowerCase()}`}><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Icon className="h-4 w-4 text-primary" />{title}</CardTitle></CardHeader><CardContent className="space-y-3">{items.map(({subject, status}) => <div key={subject} className="rounded-lg border border-border/70 p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium">{subject}</p><p className="text-xs text-muted-foreground">{from}</p></div><StatusBadge tone={statusTone(status)}>{status}</StatusBadge></div></div>)}</CardContent></Card>; }
