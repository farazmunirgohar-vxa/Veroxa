import { useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import {
  demoContentReviewQueue,
  getRestaurantName,
  type ContentReviewStatus,
  type ContentType,
} from "@/data/demoData";
import { getDemoImage } from "@/data/demo/demoImages";

const CAPTION_VARIANTS = [
  {
    angle: "Safe",
    tone: "bg-sky-500/10 text-sky-300 border-sky-500/30",
    image: getDemoImage("food-grilled-platter")!,
    caption: "Fresh, hot, and ready for your next lunch break. Stop by today and enjoy a plate made with care.",
    platform: "Instagram",
    time: "Friday 11:30 AM",
  },
  {
    angle: "Engagement",
    tone: "bg-violet-500/10 text-violet-300 border-violet-500/30",
    image: getDemoImage("food-bowl-hero")!,
    caption: "A closer look at what goes into every plate before it reaches the table. What's your go-to order?",
    platform: "Facebook",
    time: "Saturday 2:00 PM",
  },
  {
    angle: "Sales",
    tone: "bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30",
    image: getDemoImage("food-plated-dinner")!,
    caption: "Dinner plans? This plate is ready when you are. Bring the family tonight.",
    platform: "Instagram",
    time: "Sunday 6:15 PM",
  },
];

const statusColor: Record<ContentReviewStatus, string> = {
  "Pending":        "border-muted-foreground/40 text-muted-foreground bg-muted/30",
  "In Review":      "border-sky-500/40 text-sky-300 bg-sky-500/10",
  "Approved":       "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
  "Needs Revision": "border-rose-500/40 text-rose-300 bg-rose-500/10",
};

const typeColor: Record<ContentType, string> = {
  Photo:    "border-sky-500/40 text-sky-300 bg-sky-500/10",
  Reel:     "border-violet-500/40 text-violet-300 bg-violet-500/10",
  Story:    "border-amber-500/40 text-amber-300 bg-amber-500/10",
  Carousel: "border-cyan-500/40 text-cyan-300 bg-cyan-500/10",
};

type CaptionDecision = "pending" | "draft_ready" | "sent_to_review" | "scheduled";

const captionDecisionLabel: Record<CaptionDecision, string> = {
  pending:        "Pending",
  draft_ready:    "Draft ready",
  sent_to_review: "Sent to review",
  scheduled:      "Scheduled",
};
const captionDecisionStyle: Record<CaptionDecision, string> = {
  pending:        "bg-muted/30 text-muted-foreground border-border",
  draft_ready:    "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  sent_to_review: "bg-sky-500/10 text-sky-300 border-sky-500/30",
  scheduled:      "bg-violet-500/10 text-violet-300 border-violet-500/30",
};

export default function TeamContentReview() {
  const pending  = demoContentReviewQueue.filter((i) => i.status === "Pending");
  const inReview = demoContentReviewQueue.filter((i) => i.status === "In Review");
  const done     = demoContentReviewQueue.filter((i) => i.status === "Approved" || i.status === "Needs Revision");

  // Review decisions held in component state; workflow persistence is
  // backend pending. No external sends or notifications.
  const [captionDecisions, setCaptionDecisions] = useState<Record<string, CaptionDecision>>({});
  const setDecision = (key: string, d: CaptionDecision) =>
    setCaptionDecisions((prev) => ({ ...prev, [key]: d }));

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <div className="mb-4">
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight"
          data-testid="header-content-review"
        >
          Content Review Queue
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          All content items awaiting team review, sorted by stage and due date.
        </p>
      </div>

      <DemoOnlyBanner
        message="Caption review decisions persist in the workflow foundation for this browser (backend pending). No external sends — client-facing steps require team approval."
        testId="banner-content-review"
      />

      {/* Caption variant selector */}
      <div className="mb-6" data-testid="section-caption-variants">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Caption variants — select a draft to approve
          </h3>
          <span className="text-xs text-muted-foreground">Backend persistence pending</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {CAPTION_VARIANTS.map((v) => {
            const decision: CaptionDecision = captionDecisions[v.angle] ?? "pending";
            return (
              <Card key={v.angle} className="bg-card/60 border-border overflow-hidden" data-testid={`variant-${v.angle.toLowerCase()}`}>
                <div className="aspect-[4/3] w-full overflow-hidden bg-muted/30">
                  <img src={v.image.url} alt={v.image.alt} loading="lazy" className="h-full w-full object-cover" />
                </div>
                <CardContent className="space-y-2 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`rounded border px-2 py-0.5 text-[11px] font-semibold ${v.tone}`}>{v.angle}</span>
                    <span className="text-[11px] text-muted-foreground">{v.platform} · {v.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-3">{v.caption}</p>
                  <div>
                    <span
                      className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded border ${captionDecisionStyle[decision]}`}
                      data-testid={`variant-decision-${v.angle.toLowerCase()}`}
                    >
                      {captionDecisionLabel[decision]}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 border-t border-border/50 pt-2">
                    <button
                      type="button"
                      className="rounded px-2.5 py-1 text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                      onClick={() => setDecision(v.angle, "draft_ready")}
                      data-testid={`btn-draft-ready-${v.angle.toLowerCase()}`}
                    >
                      Mark Draft Ready
                    </button>
                    <button
                      type="button"
                      className="rounded px-2.5 py-1 text-[11px] font-medium bg-sky-500/10 text-sky-300 border border-sky-500/30 hover:bg-sky-500/20 transition-colors"
                      onClick={() => setDecision(v.angle, "sent_to_review")}
                      data-testid={`btn-send-review-${v.angle.toLowerCase()}`}
                    >
                      Send to Review
                    </button>
                    <button
                      type="button"
                      className="rounded px-2.5 py-1 text-[11px] font-medium bg-violet-500/10 text-violet-300 border border-violet-500/30 hover:bg-violet-500/20 transition-colors"
                      onClick={() => setDecision(v.angle, "scheduled")}
                      data-testid={`btn-scheduled-${v.angle.toLowerCase()}`}
                    >
                      Mark Scheduled
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground/70">Persists in the workflow foundation (backend pending). No external sends.</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <SummaryPill label="Pending"    value={pending.length}  color="text-muted-foreground" />
        <SummaryPill label="In Review"  value={inReview.length} color="text-sky-400"          />
        <SummaryPill label="Actioned"   value={done.length}     color="text-emerald-400"       />
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">All items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {demoContentReviewQueue.map((item) => (
            <div
              key={item.id}
              className="rounded-md border border-border bg-muted/20 p-3"
              data-testid={`review-item-${item.id}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{item.title}</p>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${typeColor[item.contentType]}`}>
                    {item.contentType}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${statusColor[item.status]}`}>
                    {item.status}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                  Due {item.dueDate}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1 text-xs">
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground/70">Client: </span>
                  {getRestaurantName(item.clientId)}
                </span>
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground/70">Stage: </span>
                  {item.stage}
                </span>
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground/70">Reviewer: </span>
                  {item.assignedReviewer}
                </span>
              </div>

              <div className="mt-2 rounded border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-xs text-foreground/85 leading-relaxed">
                <span className="font-medium text-primary">AI: </span>
                {item.aiRecommendation}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </PortalLayout>
  );
}

function SummaryPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-3 text-center">
        <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}
