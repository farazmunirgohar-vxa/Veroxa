import { Link2 } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { RealPortalReviewNotice } from "@/components/RealPortalSafeStates";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clientPortalNavItems } from "@/lib/clientPortalNav";

const connections = [
  ["Meta Business Suite", "Pending Verification", "Recently", "Waiting for Momo’s House to add Veroxa as a partner."],
  ["Google Business Profile", "Pending Verification", "Recently", "Momo’s House needs to add Veroxa as a manager before Google updates can begin."],
];

export default function ClientConnections() {
  return <PortalLayout items={clientPortalNavItems} portalName="Client Portal"><RealPortalReviewNotice />
    <PageHeader title="Connections" description="Status tracking for the accounts Veroxa needs to manage your online presence after owner-approved access is confirmed." testId="header-client-connections" />
    <section className="grid gap-4 md:grid-cols-2">{connections.map(([platform, status, updated, notes]) => <Card key={platform} data-testid={`connection-${platform.toLowerCase().replaceAll(" ", "-")}`}><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Link2 className="h-4 w-4 text-primary" />{platform}</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><p><span className="font-medium">Status:</span> <StatusBadge tone="warning">{status}</StatusBadge></p><p><span className="font-medium">Last updated:</span> {updated}</p><p className="text-muted-foreground"><span className="font-medium text-foreground">Veroxa Notes:</span> {notes}</p></CardContent></Card>)}</section>
    <p className="mt-4 text-xs text-muted-foreground">Connections V1 is status tracking only. Veroxa is not connected through live account integrations from this page.</p>
  </PortalLayout>;
}
