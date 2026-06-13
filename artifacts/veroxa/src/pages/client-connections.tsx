import { Link2 } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { RealPortalReviewNotice } from "@/components/RealPortalSafeStates";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { momoCpV1Seed, statusTone } from "@/domain/momoCpV1/momoClientPortalSeed";
export default function ClientConnections() { return <PortalLayout items={clientPortalNavItems} portalName="Client Portal"><RealPortalReviewNotice /><PageHeader title="Connections" description="Status tracking for Meta Business Suite and Google Business Profile access only. No live integrations or OAuth connect buttons are active." testId="header-client-connections" /><section className="grid gap-4 md:grid-cols-2">{momoCpV1Seed.connections.map((c) => <Card key={c.platform} data-testid={`connection-${c.platform.toLowerCase().replaceAll(" ", "-")}`}><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Link2 className="h-4 w-4 text-primary" />{c.platform}</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><p><span className="font-medium">Status:</span> <StatusBadge tone={statusTone(c.status)}>{c.status}</StatusBadge></p><p><span className="font-medium">Last updated:</span> {c.updated}</p><p className="text-muted-foreground"><span className="font-medium text-foreground">Veroxa Notes:</span> {c.notes}</p></CardContent></Card>)}</section><p className="mt-4 text-xs text-muted-foreground">Connections V1 is status tracking only. Veroxa is not connected through live account integrations from this page.</p></PortalLayout>; }
