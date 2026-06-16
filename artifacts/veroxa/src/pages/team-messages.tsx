import { useEffect, useMemo, useState } from "react";
import { Inbox, MessageSquare, ShieldAlert } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { RealPortalReviewNotice, SafePortalEmptyCard } from "@/components/RealPortalSafeStates";
import { TeamReviewModeRouteSummary } from "@/components/team/TeamOperationalSpine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { useAuth } from "@/lib/auth/useAuth";
import { getSupabaseClient } from "@/lib/supabase";
import type { MessageRecord } from "@/domain/liveAutomation/databaseTypes";
import { canUseTeamMessages } from "@/lib/messages/messageConfig";
import { listTeamMessages, sendTeamReply, updateMessageStatusForTeam } from "@/lib/messages/messageService";

export default function TeamMessages() {
  const auth = useAuth();
  const canReview = canUseTeamMessages(auth);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [replyBody, setReplyBody] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!canReview) return;
    const client = getSupabaseClient();
    if (!client) return;
    void listTeamMessages(client).then(setMessages).catch(() => setMessages([]));
  }, [canReview]);

  const grouped = useMemo(() => {
    const map = new Map<string, MessageRecord[]>();
    for (const message of messages) map.set(message.restaurant_id, [...(map.get(message.restaurant_id) ?? []), message]);
    return Array.from(map.entries()).map(([restaurantId, restaurantMessages]) => ({ restaurantId, messages: restaurantMessages.sort((a, b) => a.created_at.localeCompare(b.created_at)) }));
  }, [messages]);

  async function reply(restaurantId: string) {
    if (!auth.session?.userId) return;
    const client = getSupabaseClient();
    if (!client) return;
    setStatus((prev) => ({ ...prev, [restaurantId]: "Sending…" }));
    try {
      const sent = await sendTeamReply({ client, restaurantId, userId: auth.session.userId, body: replyBody[restaurantId] ?? "" });
      setMessages((prev) => [sent, ...prev]);
      setReplyBody((prev) => ({ ...prev, [restaurantId]: "" }));
      setStatus((prev) => ({ ...prev, [restaurantId]: "Reply saved" }));
    } catch {
      setStatus((prev) => ({ ...prev, [restaurantId]: "Could not send reply" }));
    }
  }

  async function updateStatus(message: MessageRecord, nextStatus: "read" | "resolved") {
    const client = getSupabaseClient();
    if (!client) return;
    setStatus((prev) => ({ ...prev, [message.id]: "Saving…" }));
    try {
      await updateMessageStatusForTeam({ client, messageId: message.id, restaurantId: message.restaurant_id, status: nextStatus });
      setMessages((prev) => prev.map((item) => item.id === message.id ? { ...item, status: nextStatus } : item));
      setStatus((prev) => ({ ...prev, [message.id]: "Saved" }));
    } catch {
      setStatus((prev) => ({ ...prev, [message.id]: "Could not save" }));
    }
  }

  if (!canReview) {
    return <PortalLayout items={teamPortalNavItems} portalName="Team Portal"><RealPortalReviewNotice /><SafePortalEmptyCard title="Message Inbox in review" body="Portal messages require real auth and the explicit Messages flag. Placeholder mode stays empty and does not show fake client messages or fake replies." testId="empty-team-messages" /><TeamReviewModeRouteSummary title="Messages review-mode summary" /></PortalLayout>;
  }

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between"><div><h2 className="text-2xl font-bold tracking-tight" data-testid="header-team-messages">Message Inbox</h2><p className="mt-1 text-sm text-muted-foreground">Restaurant-scoped portal messaging for Client Portal threads.</p></div><Badge variant="outline">Portal messaging only</Badge></div>
      <Card className="mb-4 border-amber-500/30 bg-amber-500/10"><CardContent className="flex gap-2 p-4 text-sm text-amber-100"><ShieldAlert className="mt-0.5 h-4 w-4" />This is not SMS, email, DMs, comments, or customer-service inbox handling. It does not handle refunds, order support, public replies, or publishing.</CardContent></Card>
      <section className="grid gap-4" data-testid="team-message-inbox">
        {grouped.length === 0 ? <SafePortalEmptyCard title="No portal messages yet" body="Client portal messages will appear here after real-auth clients send them." /> : null}
        {grouped.map((thread) => <Card key={thread.restaurantId}><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Inbox className="h-4 w-4 text-primary" />Restaurant thread <Badge variant="secondary">{thread.restaurantId}</Badge></CardTitle></CardHeader><CardContent className="space-y-3">{thread.messages.map((message) => <div key={message.id} className="rounded-lg border border-border/70 p-3 text-sm"><div className="flex flex-wrap items-start justify-between gap-2"><p className="font-medium">{message.sender_role === "team" ? "Team" : "Client"}</p><div className="flex gap-2"><Badge variant="outline">{message.status}</Badge><Badge variant="secondary">{new Date(message.created_at).toLocaleString()}</Badge></div></div><p className="mt-2 whitespace-pre-wrap text-muted-foreground">{message.body}</p><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => void updateStatus(message, "read")}>Mark read</Button><Button size="sm" onClick={() => void updateStatus(message, "resolved")}>Mark resolved</Button></div>{status[message.id] ? <p className="mt-2 text-xs text-muted-foreground">{status[message.id]}</p> : null}</div>)}<div className="rounded-lg border border-border/70 p-3"><p className="mb-2 flex items-center gap-2 text-sm font-medium"><MessageSquare className="h-4 w-4 text-primary" />Reply in portal</p><Textarea value={replyBody[thread.restaurantId] ?? ""} onChange={(event) => setReplyBody((prev) => ({ ...prev, [thread.restaurantId]: event.target.value }))} placeholder="Write a portal reply" /><Button className="mt-2" onClick={() => void reply(thread.restaurantId)}>Send reply</Button>{status[thread.restaurantId] ? <p className="mt-2 text-xs text-muted-foreground">{status[thread.restaurantId]}</p> : null}</div></CardContent></Card>)}
      </section>
      <TeamReviewModeRouteSummary title="Messages safe-reply summary" />
    </PortalLayout>
  );
}
