import { useEffect, useState } from "react";
import { Bot, ShieldAlert } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { RealPortalReviewNotice, SafePortalEmptyCard } from "@/components/RealPortalSafeStates";
import { TeamReviewModeRouteSummary } from "@/components/team/TeamOperationalSpine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { useAuth } from "@/lib/auth/useAuth";
import { getSupabaseClient } from "@/lib/supabase";
import { canUseTeamAiDrafts } from "@/lib/aiDrafts/aiDraftConfig";
import { AI_DRAFT_SAFETY_FLAGS, AI_DRAFT_SOURCE_ENTITY_TYPES, AI_DRAFT_TYPES, createAiDraftRecord, holdAiDraft, listAiDraftsForTeam, markAiDraftReviewedInternally, rejectAiDraft, type AiDraftSafetyFlag, type AiDraftSourceEntityType, type AiDraftType } from "@/lib/aiDrafts/aiDraftService";
import type { AiDraftRecord } from "@/domain/liveAutomation/databaseTypes";

export default function TeamAiDrafts() {
  const auth = useAuth();
  const canUse = canUseTeamAiDrafts(auth);
  const [restaurantId, setRestaurantId] = useState("");
  const [draftType, setDraftType] = useState<AiDraftType>("next_step_recommendation");
  const [sourceEntityType, setSourceEntityType] = useState<AiDraftSourceEntityType | "none">("none");
  const [sourceEntityId, setSourceEntityId] = useState("");
  const [draftText, setDraftText] = useState("");
  const [safetyFlag, setSafetyFlag] = useState<AiDraftSafetyFlag>("ready_for_faraz_review");
  const [items, setItems] = useState<AiDraftRecord[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!canUse) return;
    const client = getSupabaseClient();
    if (!client) return;
    void listAiDraftsForTeam(client).then(setItems).catch(() => setItems([]));
  }, [canUse]);

  async function createDraft() {
    const client = getSupabaseClient();
    if (!client) return;
    setStatus("Saving internal draft…");
    try {
      const saved = await createAiDraftRecord({ client, restaurantId, draftType, sourceEntityType: sourceEntityType === "none" ? null : sourceEntityType, sourceEntityId: sourceEntityId.trim() || null, draftText, safetyFlags: [safetyFlag] });
      setItems((prev) => [saved, ...prev]);
      setDraftText("");
      setSourceEntityId("");
      setStatus("Internal draft saved for review");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "AI draft could not be saved");
    }
  }

  async function setItemStatus(item: AiDraftRecord, next: "held" | "rejected" | "approved") {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      const updated = next === "held" ? await holdAiDraft(client, item.id, item.restaurant_id) : next === "rejected" ? await rejectAiDraft(client, item.id, item.restaurant_id) : await markAiDraftReviewedInternally(client, item.id, item.restaurant_id);
      setItems((prev) => prev.map((draft) => (draft.id === updated.id ? updated : draft)));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "AI draft status could not be updated");
    }
  }

  if (!canUse) {
    return <PortalLayout items={teamPortalNavItems} portalName="Team Portal"><RealPortalReviewNotice /><SafePortalEmptyCard title="AI Draft Queue in review" body="AI drafts require real auth and the AI Drafts feature flag. Placeholder mode stays empty and does not show raw draft output, fake generated content, or client-visible AI work." testId="empty-team-ai-drafts" /><TeamReviewModeRouteSummary title="AI Draft Queue review-mode summary" /></PortalLayout>;
  }

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-2xl font-bold tracking-tight" data-testid="header-team-ai-drafts">AI Draft Queue</h2><p className="mt-1 text-sm text-muted-foreground">Internal draft only. Nothing is published automatically.</p></div><Badge variant="outline">Team only</Badge></div>
      <Card className="mb-4 border-amber-500/30 bg-amber-500/10"><CardContent className="flex gap-2 p-4 text-sm text-amber-100"><ShieldAlert className="mt-0.5 h-4 w-4" />Drafts are prepared for Faraz review. Business-truth changes still need owner confirmation before any customer-visible use.</CardContent></Card>
      <Card className="mb-4"><CardHeader><CardTitle className="text-sm">Create internal draft</CardTitle></CardHeader><CardContent className="grid gap-3"><Input value={restaurantId} onChange={(e) => setRestaurantId(e.target.value)} placeholder="restaurant_id required" /><Select value={draftType} onValueChange={(v) => setDraftType(v as AiDraftType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{AI_DRAFT_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select><Select value={sourceEntityType} onValueChange={(v) => setSourceEntityType(v as AiDraftSourceEntityType | "none")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">no source entity</SelectItem>{AI_DRAFT_SOURCE_ENTITY_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select><Input value={sourceEntityId} onChange={(e) => setSourceEntityId(e.target.value)} placeholder="source_entity_id optional" /><Textarea value={draftText} onChange={(e) => setDraftText(e.target.value)} placeholder="draft_text required" /><Select value={safetyFlag} onValueChange={(v) => setSafetyFlag(v as AiDraftSafetyFlag)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{AI_DRAFT_SAFETY_FLAGS.map((flag) => <SelectItem key={flag} value={flag}>{flag}</SelectItem>)}</SelectContent></Select><Button onClick={() => void createDraft()}>Save internal draft</Button>{status ? <p className="text-xs text-muted-foreground">{status}</p> : null}</CardContent></Card>
      <section className="grid gap-3" data-testid="team-ai-drafts-list">{items.length === 0 ? <SafePortalEmptyCard title="No AI drafts yet" body="Drafts will appear after Team creates internal review records in real-auth mode." /> : items.map((item) => <Card key={item.id}><CardContent className="p-4 text-sm"><div className="flex flex-wrap items-center gap-2"><Bot className="h-4 w-4 text-primary" /><Badge>{item.draft_type}</Badge><Badge variant="outline">{item.status}</Badge>{item.safety_flags.map((flag) => <Badge key={flag} variant="secondary">{flag}</Badge>)}</div><p className="mt-3 whitespace-pre-wrap font-medium">{item.draft_text}</p><p className="mt-2 text-xs text-muted-foreground">Restaurant: {item.restaurant_id} · Source: {item.source_entity_type ?? "none"} {item.source_entity_id ?? ""} · {new Date(item.created_at).toLocaleString()}</p><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => void setItemStatus(item, "approved")}>Mark reviewed internally</Button><Button size="sm" variant="secondary" onClick={() => void setItemStatus(item, "held")}>Hold</Button><Button size="sm" variant="destructive" onClick={() => void setItemStatus(item, "rejected")}>Reject</Button></div></CardContent></Card>)}</section>
      <TeamReviewModeRouteSummary title="AI Draft Queue safe-draft summary" />
    </PortalLayout>
  );
}
