import { useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, Sparkles, Flame, Users as UsersIcon, MapPin, Camera } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { pickImageForCaption } from "@/data/demo/demoContentMatching";
import { demoClientTeamWorkflow } from "@/data/workflows/clientTeamWorkflow";
import { getTeamReviewReadyItems } from "@/lib/workflows/workflowStatus";
import { EvidenceRecommendationCard } from "@/components/evidence/EvidenceRecommendationCard";
import { recommendNextPost } from "@/lib/evidence/evidenceSelectionEngine";

// All `mediaItems` below belong to Demo Grill House (demo-a).
const MEDIA_REVIEW_CLIENT_ID = "demo-a";

const guidanceMatches: Array<{
  icon: typeof Flame;
  title: string;
  match: string;
  tone: "good" | "promo" | "google" | "warn";
}> = [
  { icon: Flame,    title: "Grill flame shot",         match: "Matches halal grill guidance",   tone: "good"   },
  { icon: UsersIcon, title: "Family platter",          match: "Good for weekend promo",         tone: "promo"  },
  { icon: MapPin,   title: "Storefront photo",         match: "Useful for Google visibility",   tone: "google" },
  { icon: Camera,   title: "Dark / blurry prep photo", match: "Needs better lighting",          tone: "warn"   },
];

const matchToneStyles: Record<string, string> = {
  good: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  promo: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30",
  google: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  warn: "bg-amber-500/10 text-amber-400 border-amber-500/30",
};

type LocalDecision = "pending" | "accepted" | "needs_reshoot" | "saved";

interface MediaItem {
  id: number;
  title: string;
  client: string;
  initialQuality: "Approved" | "Needs Reshoot" | "Needs Crop";
  note: string;
}

const mediaItems: MediaItem[] = getTeamReviewReadyItems(demoClientTeamWorkflow)
  .filter((item) => item.type === "media")
  .map((item, index) => ({
    id: index + 1,
    title: item.title,
    client: item.clientId === MEDIA_REVIEW_CLIENT_ID ? "Demo Grill House" : item.clientId,
    initialQuality: item.stage === "needs_better_photo" ? "Needs Reshoot" : "Approved",
    note: item.stage === "needs_better_photo"
      ? "Needs a clearer photo before content use"
      : "Ready for team review",
  }));

const decisionLabel: Record<LocalDecision, string> = {
  pending:       "Pending review",
  accepted:      "Mark revieweded for content",
  needs_reshoot: "Client reshoot needed",
  saved:         "Saved for later",
};

const decisionStyle: Record<LocalDecision, string> = {
  pending:       "bg-muted/30 text-muted-foreground border-border",
  accepted:      "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  needs_reshoot: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  saved:         "bg-sky-500/10 text-sky-300 border-sky-500/30",
};

const teamEvidenceRec = recommendNextPost("demo-a");

export default function TeamMediaReview() {
  // Review decisions stay in component state only. No external sends or notifications.
  const [decisions, setDecisions] = useState<Record<number, LocalDecision>>({});

  const setDecision = (id: number, d: LocalDecision) =>
    setDecisions((prev) => ({ ...prev, [id]: d }));

  const summary = useMemo(() => {
    let pending = 0, accepted = 0, reshoot = 0, saved = 0;
    for (const item of mediaItems) {
      const d = decisions[item.id] ?? "pending";
      if (d === "pending")       pending++;
      else if (d === "accepted") accepted++;
      else if (d === "needs_reshoot") reshoot++;
      else if (d === "saved")    saved++;
    }
    return { pending, accepted, reshoot, saved };
  }, [decisions]);

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground" data-testid="header-media-review">Media Review</h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">Review and act on uploaded media — Mark reviewed, request a reshoot, or save for later.</p>
      </div>

      <DemoOnlyBanner message="Demo only — review choices stay on this page. No uploads, cloud writes, or client notifications happen." testId="banner-team-media" />

      <p className="text-xs text-muted-foreground mb-4" data-testid="upload-inbox-cross-link">
        New restaurant uploads appear in the{" "}
        <a href="/demo/team/upload-inbox" className="text-primary hover:underline">
          Upload Inbox
        </a>{" "}
        first, then move to Media Review.
      </p>

      {/* Summary tiles — react to local action state */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6" data-testid="section-review-summary">
        <SummaryTile label="Pending"         value={summary.pending}  color="text-muted-foreground" testId="summary-pending"  />
        <SummaryTile label="Reviewed today"  value={summary.accepted} color="text-emerald-400"       testId="summary-accepted" />
        <SummaryTile label="Needs reshoot"   value={summary.reshoot}  color="text-amber-400"         testId="summary-reshoot"  />
        <SummaryTile label="Saved for later" value={summary.saved}    color="text-sky-400"           testId="summary-saved"    />
      </div>

      {/* Guidance Match — static preview of how Veroxa will compare uploads to the capture plan */}
      <Card className="bg-card border-primary/30 mb-6" data-testid="card-guidance-match">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-primary" />
                <CardTitle className="text-base font-semibold">Content Review Guidance</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                How each uploaded asset maps to the recommended capture plan for this client.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {guidanceMatches.map((m, i) => {
              const Icon = m.icon;
              return (
                <li
                  key={m.title}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-md border border-border bg-muted/20"
                  data-testid={`guidance-match-${i}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-md bg-primary/10 text-primary flex-shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium truncate">{m.title}</span>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${matchToneStyles[m.tone]}`}>
                    {m.match}
                  </span>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {/* Evidence-Based Pick — evidence engine */}
      <div className="mb-6" data-testid="section-evidence-pick">
        <EvidenceRecommendationCard
          recommendation={teamEvidenceRec}
          variant="team"
          testId="team-evidence-recommendation"
        />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mediaItems.map((item) => {
          const decision: LocalDecision = decisions[item.id] ?? "pending";
          const approved = item.initialQuality === "Approved";
          const img = pickImageForCaption(item.title, MEDIA_REVIEW_CLIENT_ID);
          return (
            <Card key={item.id} className="bg-card border-border overflow-hidden" data-testid={`media-item-${item.id}`}>
              <div className="aspect-video w-full overflow-hidden bg-muted/30">
                <img
                  src={img.url}
                  alt={img.alt}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <CardContent className="p-5 pt-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm font-semibold leading-snug">{item.title}</h4>
                  <Badge variant="outline" className={`border-none flex-shrink-0 ${
                    approved ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                  }`}>
                    {item.initialQuality}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{item.client}</p>
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  {approved
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    : <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  }
                  <span>{item.note}</span>
                </div>

                {/* Current local decision badge */}
                <div className="mt-3">
                  <span
                    className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded border ${decisionStyle[decision]}`}
                    data-testid={`decision-${item.id}`}
                  >
                    {decisionLabel[decision]}
                  </span>
                </div>

                {/* Local action row */}
                <div className="mt-3 flex flex-wrap gap-2 border-t border-border/50 pt-3">
                  <button
                    type="button"
                    className={`rounded px-3 py-1 text-xs font-medium border transition-colors ${
                      decision === "accepted"
                        ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/50"
                        : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                    }`}
                    onClick={() => setDecision(item.id, "accepted")}
                    data-testid={`btn-accept-${item.id}`}
                  >
                    Mark reviewed
                  </button>
                  <button
                    type="button"
                    className={`rounded px-3 py-1 text-xs font-medium border transition-colors ${
                      decision === "needs_reshoot"
                        ? "bg-amber-500/20 text-amber-200 border-amber-500/50"
                        : "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                    }`}
                    onClick={() => setDecision(item.id, "needs_reshoot")}
                    data-testid={`btn-reshoot-${item.id}`}
                  >
                    Needs Better Photo
                  </button>
                  <button
                    type="button"
                    className={`rounded px-3 py-1 text-xs font-medium border transition-colors ${
                      decision === "saved"
                        ? "bg-sky-500/20 text-sky-200 border-sky-500/50"
                        : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/50"
                    }`}
                    onClick={() => setDecision(item.id, "saved")}
                    data-testid={`btn-save-${item.id}`}
                  >
                    Hold for later
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground/70">Local review note only. No client notification is sent.</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PortalLayout>
  );
}

function SummaryTile({
  label, value, color, testId,
}: { label: string; value: number; color: string; testId: string }) {
  return (
    <Card className="bg-card border-border" data-testid={testId}>
      <CardContent className="p-3 text-center">
        <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}
