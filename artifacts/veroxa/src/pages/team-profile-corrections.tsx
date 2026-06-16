import { useEffect, useState } from "react";
import { ClipboardCheck, ShieldAlert } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { RealPortalReviewNotice, SafePortalEmptyCard } from "@/components/RealPortalSafeStates";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { TeamReviewModeRouteSummary } from "@/components/team/TeamOperationalSpine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/useAuth";
import { getSupabaseClient } from "@/lib/supabase";
import type { ProfileCorrectionRecord } from "@/domain/liveAutomation/databaseTypes";
import { canTeamReviewProfileCorrections, isSensitiveBusinessTruthField } from "@/lib/profileCorrections/profileCorrectionConfig";
import { decideProfileCorrection, listProfileCorrectionsForTeam, type ProfileCorrectionDecision } from "@/lib/profileCorrections/profileCorrectionService";

export default function TeamProfileCorrections() {
  const portalDataMode = useRealPortalDataMode();
  const auth = useAuth();
  const canReview = canTeamReviewProfileCorrections(auth);
  const [corrections, setCorrections] = useState<ProfileCorrectionRecord[]>([]);
  const [status, setStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!canReview) return;
    const client = getSupabaseClient();
    if (!client) return;
    void listProfileCorrectionsForTeam(client).then(setCorrections).catch(() => setCorrections([]));
  }, [canReview]);

  async function decide(correction: ProfileCorrectionRecord, decision: ProfileCorrectionDecision) {
    if (!auth.session?.userId) return;
    const client = getSupabaseClient();
    if (!client) return;
    setStatus((prev) => ({ ...prev, [correction.id]: "Saving…" }));
    try {
      await decideProfileCorrection({ client, correction, reviewerId: auth.session.userId, decision, reviewNote: decision === "approved" ? "Approved for internal Veroxa profile only. No public/platform update." : null });
      setStatus((prev) => ({ ...prev, [correction.id]: "Saved" }));
      setCorrections((prev) => prev.map((item) => item.id === correction.id ? { ...item, status: decision, reviewed_by: auth.session?.userId ?? null } : item));
    } catch {
      setStatus((prev) => ({ ...prev, [correction.id]: "Could not save" }));
    }
  }

  if (!canReview) {
    return <PortalLayout items={teamPortalNavItems} portalName="Team Portal"><RealPortalReviewNotice /><SafePortalEmptyCard title="Profile Correction Queue in review" body="Profile correction decisions require real auth and the explicit Profile Corrections flag. Placeholder mode stays empty and does not show fake correction requests." testId="empty-team-profile-corrections" /><TeamReviewModeRouteSummary title="Profile corrections review-mode summary" /></PortalLayout>;
  }

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div><h2 className="text-2xl font-bold tracking-tight" data-testid="header-team-profile-corrections">Profile Correction Queue</h2><p className="mt-1 text-sm text-muted-foreground">Review requested restaurant profile corrections. Approvals update internal Veroxa profile records only.</p></div>
        <Badge variant="outline">No public/platform updates</Badge>
      </div>
      <Card className="mb-4 border-amber-500/30 bg-amber-500/10"><CardContent className="flex gap-2 p-4 text-sm text-amber-100"><ShieldAlert className="mt-0.5 h-4 w-4" />Business-truth fields require owner confirmation before execution. Nothing here updates Google, Meta, website, menus, prices, public links, or external platforms.</CardContent></Card>
      <section className="grid gap-4" data-testid="team-profile-correction-list">
        {corrections.length === 0 ? <SafePortalEmptyCard title="No correction requests yet" body="New profile correction requests will appear here after real-auth clients submit them." /> : null}
        {corrections.map((correction) => {
          const label = correction.field_label ?? "Profile field";
          const sensitive = isSensitiveBusinessTruthField(label);
          return <Card key={correction.id}><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><ClipboardCheck className="h-4 w-4 text-primary" />{label}<Badge variant="outline">{correction.status}</Badge>{sensitive ? <Badge variant="secondary">Business-truth review</Badge> : null}</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><div className="grid gap-3 md:grid-cols-2"><div className="rounded-lg border border-border/70 p-3"><p className="text-xs uppercase tracking-wide text-muted-foreground">Current value</p><p className="mt-1">{correction.current_value ?? "Not provided"}</p></div><div className="rounded-lg border border-border/70 p-3"><p className="text-xs uppercase tracking-wide text-muted-foreground">Requested value</p><p className="mt-1">{correction.requested_value ?? "Not provided"}</p></div></div><p className="text-xs text-muted-foreground">Requested by: {correction.requested_by ?? "Unknown"} · Created: {new Date(correction.created_at).toLocaleString()}</p><div className="flex flex-wrap gap-2"><Button onClick={() => void decide(correction, "approved")} disabled={correction.status === "approved"}>Approve internal profile correction</Button><Button variant="outline" onClick={() => void decide(correction, "needs_owner_input")}>Needs owner input</Button><Button variant="destructive" onClick={() => void decide(correction, "rejected")}>Reject</Button></div>{status[correction.id] ? <p className="text-xs text-muted-foreground">{status[correction.id]}</p> : null}</CardContent></Card>;
        })}
      </section>
      <TeamReviewModeRouteSummary title="Profile corrections safe-decision summary" />
    </PortalLayout>
  );
}
