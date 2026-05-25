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

export default function TeamContentReview() {
  const pending  = demoContentReviewQueue.filter((i) => i.status === "Pending");
  const inReview = demoContentReviewQueue.filter((i) => i.status === "In Review");
  const done     = demoContentReviewQueue.filter((i) => i.status === "Approved" || i.status === "Needs Revision");

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
        message="Demo only — read-only review queue. No approvals or revisions are saved."
        testId="banner-content-review"
      />

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
