import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Loader2, MessageSquare, ShieldCheck } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { getClientPortalHref } from "@/lib/clientPortalRoutes";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { momoCpV1Seed, statusTone } from "@/domain/momoCpV1/momoClientPortalSeed";
import { useAuth } from "@/lib/auth/useAuth";
import { getSupabaseClient } from "@/lib/supabase";
import type { RestaurantProfileFieldRecord } from "@/domain/liveAutomation/databaseTypes";
import { canUseProfileCorrections, isSensitiveBusinessTruthField } from "@/lib/profileCorrections/profileCorrectionConfig";
import { listRestaurantProfileFields, requestProfileCorrection } from "@/lib/profileCorrections/profileCorrectionService";

export default function ClientProfile() {
  const mode = useRealPortalDataMode();
  const auth = useAuth();
  const messagesHref = getClientPortalHref("messages", mode.isPublicDemoRoute);
  const correctionsEnabled = canUseProfileCorrections(auth);
  const [fields, setFields] = useState<RestaurantProfileFieldRecord[]>([]);
  const [requestedValues, setRequestedValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Record<string, "idle" | "sending" | "sent" | "error">>({});

  useEffect(() => {
    if (!correctionsEnabled || !auth.session?.clientId) return;
    const client = getSupabaseClient();
    if (!client) return;
    void listRestaurantProfileFields(client, auth.session.clientId).then(setFields).catch(() => setFields([]));
  }, [auth.session?.clientId, correctionsEnabled]);

  const groupedFields = useMemo(() => {
    const groups = new Map<string, RestaurantProfileFieldRecord[]>();
    fields.forEach((field) => groups.set(field.section, [...(groups.get(field.section) ?? []), field]));
    return Array.from(groups.entries()).map(([section, sectionFields]) => ({ section, fields: sectionFields }));
  }, [fields]);

  async function submitCorrection(field: RestaurantProfileFieldRecord) {
    if (!correctionsEnabled || !auth.session?.clientId || !auth.session.userId) return;
    const client = getSupabaseClient();
    if (!client) return;
    setStatus((prev) => ({ ...prev, [field.id]: "sending" }));
    try {
      await requestProfileCorrection({ client, restaurantId: auth.session.clientId, userId: auth.session.userId, field, requestedValue: requestedValues[field.id] ?? "" });
      setStatus((prev) => ({ ...prev, [field.id]: "sent" }));
      setRequestedValues((prev) => ({ ...prev, [field.id]: "" }));
    } catch {
      setStatus((prev) => ({ ...prev, [field.id]: "error" }));
    }
  }

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <PageHeader title="Profile" description="Review what Veroxa knows about your restaurant. Veroxa will review before anything changes." testId="header-client-profile" />

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 text-sm leading-6 text-muted-foreground">
          Veroxa will review before anything changes. Nothing is published automatically, and profile corrections do not update Google, social profiles, websites, menus, prices, or public links by themselves.
        </CardContent>
      </Card>

      {correctionsEnabled ? (
        <section className="grid gap-4 lg:grid-cols-2" data-testid="profile-correction-enabled-fields">
          {groupedFields.length === 0 ? <Card><CardContent className="p-4 text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading profile fields for Veroxa review…</CardContent></Card> : null}
          {groupedFields.map((section) => (
            <Card key={section.section}>
              <CardHeader><CardTitle className="text-sm">{section.section}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {section.fields.map((field) => {
                  const sensitive = isSensitiveBusinessTruthField(field.label);
                  return <div key={field.id} className="rounded-xl border border-border/70 bg-background/70 p-3">
                    <div className="flex items-start justify-between gap-3"><p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">{field.label}</p><StatusBadge tone={statusTone(field.status)}>{field.status}</StatusBadge></div>
                    <p className="mt-2 text-sm leading-6 text-foreground">{field.value ?? "Not provided yet"}</p>
                    {sensitive ? <p className="mt-2 text-xs text-amber-300">Business-truth field: Veroxa may record your request, but owner confirmation and team review are required before use.</p> : null}
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row"><textarea className="min-h-20 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={requestedValues[field.id] ?? ""} onChange={(event) => setRequestedValues((prev) => ({ ...prev, [field.id]: event.target.value }))} placeholder="Request correction" aria-label={`Request correction for ${field.label}`} /><Button onClick={() => void submitCorrection(field)} disabled={status[field.id] === "sending"}>{status[field.id] === "sending" ? "Sending…" : "Request correction"}</Button></div>
                    {status[field.id] === "sent" ? <p className="mt-2 flex items-center gap-2 text-xs text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" />Pending Veroxa review. Nothing is published automatically.</p> : null}
                    {status[field.id] === "error" ? <p className="mt-2 text-xs text-red-300">Please try again or message Veroxa.</p> : null}
                  </div>;
                })}
              </CardContent>
            </Card>
          ))}
        </section>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2" data-testid="profile-review-sections">
          {momoCpV1Seed.profile.map((section) => <Card key={section.section}><CardHeader className="space-y-1"><CardTitle className="text-sm">{section.section}</CardTitle>{section.purpose ? <p className="text-xs leading-5 text-muted-foreground">{section.purpose}</p> : null}</CardHeader><CardContent className="space-y-3">{section.fields.map((field) => <div key={field.label} className="rounded-xl border border-border/70 bg-background/70 p-3"><div className="flex items-start justify-between gap-3"><p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">{field.label}</p><StatusBadge tone={statusTone(field.status)}>{field.status}</StatusBadge></div><p className="mt-2 text-sm leading-6 text-foreground">{field.value}</p></div>)}</CardContent></Card>)}
        </section>
      )}

      <Card data-testid="profile-correction-path"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><ShieldCheck className="h-4 w-4 text-primary" />Need to correct something?</CardTitle></CardHeader><CardContent className="space-y-3 text-sm leading-6 text-muted-foreground"><p>{correctionsEnabled ? "Use Request correction above. Veroxa will review before anything changes." : "Please message Veroxa with the correction. Veroxa will review changes before using them publicly."}</p><Link href={messagesHref}><Button variant="outline"><MessageSquare className="mr-2 h-4 w-4" />Message Veroxa About Profile</Button></Link></CardContent></Card>
    </PortalLayout>
  );
}
