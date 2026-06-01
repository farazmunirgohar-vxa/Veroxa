import { CheckCircle2, ImageIcon, MessageSquare } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { RealPortalReviewNotice } from "@/components/RealPortalSafeStates";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { useActiveClientPortalContext } from "@/lib/clientPortalContext";
import { clientTeamWorkRepository } from "@/lib/repositories";
import { normalizeClientMediaDisplayStatus } from "@/lib/clientMediaLifecycle";


type SimpleStatus = "Received" | "In Review" | "Ready" | "Scheduled" | "Posted" | "Waiting for you";

const statusTone: Record<SimpleStatus, string> = {
  Received: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  "In Review": "border-primary/30 bg-primary/10 text-primary",
  Ready: "border-primary/30 bg-primary/10 text-primary",
  Scheduled: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  Posted: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  "Waiting for you": "border-amber-500/30 bg-amber-500/10 text-amber-300",
};

function toSimpleStatus(input: string): SimpleStatus {
  const status = normalizeClientMediaDisplayStatus(input);
  if (status === "Posted" || status === "Already used") return "Posted";
  if (status === "Scheduled") return "Scheduled";
  if (status === "Ready") return "Ready";
  if (status === "Needs better media" || status === "Waiting for direction") return "Waiting for you";
  if (status === "Reviewed") return "In Review";
  return "Received";
}

export default function ClientUpdates() {
  const mode = useRealPortalDataMode();
  const { activeClientId } = useActiveClientPortalContext();
  const canUseFixtureData = Boolean(activeClientId) && (mode.allowDemoFixtures || mode.isLiveDataConnected);
  const submissions = canUseFixtureData
    ? clientTeamWorkRepository.getClientVisibleSubmissions(activeClientId!)
    : [];

  const mediaUpdates = submissions
    .filter((item) => item.submissionType === "media")
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      title: item.title,
      note: item.clientVisibleNote,
      status: toSimpleStatus(item.status),
    }));
  const waitingItems = canUseFixtureData
    ? clientTeamWorkRepository.getClientActionRequiredItems(activeClientId!).slice(0, 3)
    : [];

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <RealPortalReviewNotice />

      <div>
        <h2 className="text-3xl font-bold tracking-tight" data-testid="header-updates">Updates</h2>
        <p className="mt-1 max-w-2xl text-sm md:text-base text-muted-foreground">
          Simple progress on media reviewed, media ready, media scheduled, media posted, and anything Veroxa needs from you.
        </p>
      </div>

      <Card className="border-primary/20 bg-card" data-testid="card-media-progress">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-4 w-4 text-primary" /> Media progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {mediaUpdates.length === 0 ? (
            <p className="text-sm text-muted-foreground">Media updates will appear after uploads are reviewed.</p>
          ) : (
            mediaUpdates.map((item) => <UpdateRow key={item.id} item={item} />)
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card" data-testid="card-needs-client">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-primary" /> What Veroxa needs from you
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {waitingItems.length === 0 ? (
            <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium">Nothing needed right now</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Veroxa will ask here if a quick answer would help.</p>
                </div>
              </div>
            </div>
          ) : (
            waitingItems.map((item) => (
              <div key={item.id} className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-3">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.clientVisibleNote}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </PortalLayout>
  );
}

function UpdateRow({ item }: { item: { id: string; title: string; note: string; status: SimpleStatus } }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 px-3 py-3" data-testid={`update-row-${item.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{item.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{item.note}</p>
        </div>
        <Badge variant="outline" className={`text-[10px] ${statusTone[item.status]}`}>{item.status}</Badge>
      </div>
    </div>
  );
}
