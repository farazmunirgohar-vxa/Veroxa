import { useState } from "react";
import { UserRound } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { RealPortalReviewNotice } from "@/components/RealPortalSafeStates";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { clientPortalNavItems } from "@/lib/clientPortalNav";

export default function ClientProfile() {
  const [edited, setEdited] = useState(false);
  return <PortalLayout items={clientPortalNavItems} portalName="Client Portal"><RealPortalReviewNotice />
    <PageHeader title="Profile" description="Review what Veroxa knows about Momo’s House and correct business details before Veroxa prepares public-facing work." testId="header-client-profile" />
    {edited ? <Card className="mb-4 border-amber-500/20 bg-amber-500/5"><CardContent className="p-4 text-sm"><StatusBadge tone="warning">Pending Veroxa Review</StatusBadge><p className="mt-2 text-muted-foreground">Your changes are held in this review-mode screen only. Nothing publishes automatically.</p></CardContent></Card> : null}
    <section className="grid gap-4 lg:grid-cols-2">
      <ProfileCard title="Basic Info" fields={["Restaurant name", "Address", "Phone number", "Business hours", "Cuisine type"]} onEdit={() => setEdited(true)} />
      <ProfileCard title="Contacts" fields={["Primary contact (required)", "Secondary contact (recommended)"]} onEdit={() => setEdited(true)} />
      <ProfileCard title="Menu & Ordering" fields={["Menu link", "Online ordering link", "Delivery availability", "Catering availability, if owner confirms"]} onEdit={() => setEdited(true)} />
      <Card><CardHeader><CardTitle className="text-sm">Brand Voice</CardTitle></CardHeader><CardContent className="space-y-3"><Textarea onChange={() => setEdited(true)} defaultValue={"Family-friendly, casual, great for first-time momo customers. Catering available only if confirmed. Avoid halal/organic/healthy/spicy/dietary claims unless owner confirms."} /><FieldStatus edited={edited} /></CardContent></Card>
      <ProfileCard title="Website" fields={["Website URL", "Website access status: Not Needed / Requested / Pending / Connected / Access Unavailable"]} onEdit={() => setEdited(true)} />
    </section>
    <div className="mt-4 flex flex-wrap items-center gap-3"><Button onClick={() => setEdited(true)}><UserRound className="mr-2 h-4 w-4" />Save Changes for Veroxa Review</Button><p className="text-xs text-muted-foreground">Owner edits become Pending Veroxa Review and do not update Google, Meta, website, reports, public content, or any live platform.</p></div>
  </PortalLayout>;
}

function ProfileCard({ title, fields, onEdit }: { title: string; fields: string[]; onEdit: () => void }) {
  return <Card><CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader><CardContent className="space-y-3">{fields.map((field) => <label key={field} className="block space-y-1"><span className="text-xs font-medium text-muted-foreground">{field}</span><Input onChange={onEdit} placeholder={field} /></label>)}<FieldStatus /></CardContent></Card>;
}
function FieldStatus({ edited = false }: { edited?: boolean }) { return <div className="flex flex-wrap gap-2"><StatusBadge tone="info">Pre-filled by Veroxa — please review</StatusBadge>{edited ? <StatusBadge tone="warning">Edited by owner</StatusBadge> : null}<StatusBadge tone="warning">Needs Attention</StatusBadge><StatusBadge tone="info">Confirmed</StatusBadge></div>; }
