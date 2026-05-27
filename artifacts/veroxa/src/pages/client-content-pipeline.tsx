import { Info } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import {
  demoContentPipelineItems,
  type PipelineStage,
  type ContentType,
  type PipelineStatus,
  type DemoPipelineItem,
} from "@/data/demoData";

const DEMO_CLIENT_ID = "demo-a";

// Client-facing stage labels — no internal workflow or role names
const clientStageLabel: Record<PipelineStage, string> = {
  "Media Received":     "Received",
  "AI Review":          "Being Reviewed",
  "Caption Drafting":   "Caption In Progress",
  "Team Review":        "Veroxa Review",
  "Scheduled / Posted": "Scheduled / Posted",
};

const pipelineStageOrder: PipelineStage[] = [
  "Media Received",
  "AI Review",
  "Caption Drafting",
  "Team Review",
  "Scheduled / Posted",
];

const contentTypeColor: Record<ContentType, string> = {
  Photo:    "border-sky-500/40 text-sky-300 bg-sky-500/10",
  Reel:     "border-violet-500/40 text-violet-300 bg-violet-500/10",
  Story:    "border-amber-500/40 text-amber-300 bg-amber-500/10",
  Carousel: "border-cyan-500/40 text-cyan-300 bg-cyan-500/10",
};

// Client-facing status labels
const clientStatusLabel: Record<PipelineStatus, string> = {
  "New":               "Received",
  "Reviewing":         "Being Reviewed",
  "Drafting":          "In Progress",
  "Awaiting Approval": "In Review",
  "Approved":          "Approved",
  "Scheduled":         "Scheduled",
  "Posted":            "Posted",
  "Needs Revision":    "Needs Update",
};

const statusColor: Record<PipelineStatus, string> = {
  "New":               "border-muted-foreground/40 text-muted-foreground bg-muted/30",
  "Reviewing":         "border-sky-500/40 text-sky-300 bg-sky-500/10",
  "Drafting":          "border-violet-500/40 text-violet-300 bg-violet-500/10",
  "Awaiting Approval": "border-amber-500/40 text-amber-300 bg-amber-500/10",
  "Approved":          "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
  "Scheduled":         "border-cyan-500/40 text-cyan-300 bg-cyan-500/10",
  "Posted":            "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
  "Needs Revision":    "border-rose-500/40 text-rose-300 bg-rose-500/10",
};

export default function ClientContentPipeline() {
  const items = demoContentPipelineItems.filter(
    (i) => i.clientId === DEMO_CLIENT_ID,
  );

  const byStage: Record<PipelineStage, DemoPipelineItem[]> = {
    "Media Received":     items.filter((i) => i.stage === "Media Received"),
    "AI Review":          items.filter((i) => i.stage === "AI Review"),
    "Caption Drafting":   items.filter((i) => i.stage === "Caption Drafting"),
    "Team Review":        items.filter((i) => i.stage === "Team Review"),
    "Scheduled / Posted": items.filter((i) => i.stage === "Scheduled / Posted"),
  };

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <div className="mb-4">
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight"
          data-testid="header-content-pipeline"
        >
          Content
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          See how your content is progressing from submission through to
          posting — a preview of the Veroxa workflow.
        </p>
      </div>

      <DemoOnlyBanner
        message="Demo only — pipeline shows sample content. No real publishing or social integrations are connected."
        testId="banner-content-pipeline"
      />

      <Card className="bg-card border-border mb-4">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
          <p className="text-sm text-foreground/85 leading-relaxed">
            Veroxa keeps your content organized from the moment it's received
            through to when it goes live. Each card moves forward as it's
            reviewed, captioned, and scheduled.
          </p>
        </CardContent>
      </Card>

      {/* Pipeline columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        {pipelineStageOrder.map((stage) => (
          <Card
            key={stage}
            className="bg-card border-border"
            data-testid={`column-${clientStageLabel[stage].replace(/\s+|\//g, "-").toLowerCase()}`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between gap-2">
                <span>{clientStageLabel[stage]}</span>
                <Badge variant="outline" className="text-[10px]">
                  {byStage[stage].length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {byStage[stage].length === 0 && (
                <p className="text-[11px] text-muted-foreground italic px-1">
                  No items at this stage.
                </p>
              )}
              {byStage[stage].map((card) => (
                <div
                  key={card.id}
                  className="rounded-md border border-border bg-muted/20 p-2.5"
                  data-testid={`pipeline-card-${card.id}`}
                >
                  <p className="text-xs font-medium leading-snug mb-1.5">
                    {card.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-1 mb-1.5">
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${contentTypeColor[card.contentType]}`}
                    >
                      {card.contentType}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${statusColor[card.status]}`}
                    >
                      {clientStatusLabel[card.status]}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-1">
                    {card.relatedMenuItem}
                  </p>
                  {card.postingWindow && (
                    <p className="text-[10px] text-muted-foreground border-t border-border pt-1.5 mt-1.5">
                      Posting window: {card.postingWindow}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </PortalLayout>
  );
}
