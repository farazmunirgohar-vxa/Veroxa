import { useEffect, useState } from "react";
import { Mail, MessageSquare, ShieldCheck } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { emptyStateCopy, momoCpV1Seed, statusTone } from "@/domain/momoCpV1/momoClientPortalSeed";
import { useAuth } from "@/lib/auth/useAuth";
import { getSupabaseClient } from "@/lib/supabase";
import type { MessageRecord } from "@/domain/liveAutomation/databaseTypes";
import { canUseClientMessages } from "@/lib/messages/messageConfig";
import { listRestaurantMessages, sendClientMessage } from "@/lib/messages/messageService";

function clientStatusLabel(message: MessageRecord): string {
  if (message.sender_role === "team") return "Reply from Veroxa";
  if (message.status === "resolved") return "Reviewed";
  if (message.status === "read") return "In review";
  return "Sent to Veroxa";
}

export default function ClientMessages() {
  const auth = useAuth();
  const canMessage = canUseClientMessages(auth);
  const restaurantId = auth.session?.clientId ?? null;
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [body, setBody] = useState("");
  const [sendState, setSendState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    if (!canMessage || !restaurantId) return;
    const client = getSupabaseClient();
    if (!client) return;
    void listRestaurantMessages(client, restaurantId).then(setMessages).catch(() => setMessages([]));
  }, [canMessage, restaurantId]);

  async function submitMessage() {
    if (!canMessage || !restaurantId || !auth.session?.userId) return;
    const client = getSupabaseClient();
    if (!client) return;
    setSendState("sending");
    try {
      const sent = await sendClientMessage({ client, restaurantId, userId: auth.session.userId, body });
      setMessages((prev) => [...prev, sent]);
      setBody("");
      setSendState("sent");
    } catch {
      setSendState("error");
    }
  }

  if (!canMessage) {
    return (
      <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
        <PageHeader title="Messages" description="Simple guidance from Veroxa will appear here when something needs your attention." testId="header-client-messages" />
        <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <Card data-testid="messages-from-veroxa"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-primary" />Messages from Veroxa</CardTitle></CardHeader><CardContent className="space-y-3">{momoCpV1Seed.messages.fromVeroxa.length ? momoCpV1Seed.messages.fromVeroxa.map(({ subject, status }) => <div key={subject} className="rounded-lg border border-border/70 p-3"><div className="flex items-start justify-between gap-3"><p className="text-sm font-medium">{subject}</p><StatusBadge tone={statusTone(status)}>{status}</StatusBadge></div></div>) : <div className="rounded-lg border border-border/70 p-3 text-sm"><p className="font-medium">{emptyStateCopy.nothingNeeded}</p><p className="mt-1 text-muted-foreground">{emptyStateCopy.messages}</p></div>}</CardContent></Card>
          <Card data-testid="how-to-contact-veroxa"><CardHeader><CardTitle className="text-sm">How to Contact Veroxa</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground"><p>Message sending inside the portal is not connected yet. Placeholder mode does not show fake sent messages, fake delivery states, or fake replies. For now, please contact Veroxa directly.</p><Button variant="outline" asChild><a href="mailto:faraz@veroxa.app">Contact Veroxa</a></Button></CardContent></Card>
        </section>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <PageHeader title="Message Veroxa" description="Veroxa will review and reply here. Messages do not mean instant completion." testId="header-client-messages" />
      <Card className="mb-4 border-primary/20 bg-primary/5"><CardContent className="flex gap-2 p-4 text-sm text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />Nothing is published automatically. Veroxa reviews messages before taking any public or customer-visible action.</CardContent></Card>
      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card data-testid="client-message-composer"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><MessageSquare className="h-4 w-4 text-primary" />Message Veroxa</CardTitle></CardHeader><CardContent className="space-y-3"><Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write your message for Veroxa" /><Button onClick={() => void submitMessage()} disabled={sendState === "sending"}>{sendState === "sending" ? "Sending…" : "Send message"}</Button>{sendState === "sent" ? <p className="text-xs text-emerald-300">Message sent for Veroxa review. This is not an instant-completion promise.</p> : null}{sendState === "error" ? <p className="text-xs text-red-300">Message could not be sent. Please try again.</p> : null}</CardContent></Card>
        <Card data-testid="client-message-thread"><CardHeader><CardTitle className="text-sm">Portal thread</CardTitle></CardHeader><CardContent className="space-y-3">{messages.length === 0 ? <p className="rounded-lg border border-border/70 p-3 text-sm text-muted-foreground">No portal messages yet.</p> : messages.map((message) => <div key={message.id} className="rounded-lg border border-border/70 p-3 text-sm"><div className="flex items-start justify-between gap-3"><p className="font-medium">{message.sender_role === "team" ? "Veroxa" : "You"}</p><StatusBadge tone={message.status === "resolved" ? "success" : "warning"}>{clientStatusLabel(message)}</StatusBadge></div><p className="mt-2 whitespace-pre-wrap text-muted-foreground">{message.body}</p><p className="mt-2 text-xs text-muted-foreground">{new Date(message.created_at).toLocaleString()}</p></div>)}</CardContent></Card>
      </section>
    </PortalLayout>
  );
}
