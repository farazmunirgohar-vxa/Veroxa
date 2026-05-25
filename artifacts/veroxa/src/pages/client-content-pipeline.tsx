import { Info } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { AiSuggestionsPanel } from "@/components/AiSuggestionsPanel";
import {
  demoContentPipelineItems,
  pipelineStages,
  type PipelineStage,
  type ContentType,
  type PipelineStatus,
  type DemoPipelineItem,
  getRestaurantName,
} from "@/data/demoData";

const DEMO_CLIENT_ID = "mamadali";

const contentTypeColor: Record<ContentType, string> = {
  Photo:    "border-sky-500/40 text-sky-300 bg-sky-500/10",
  Reel:     "border-violet-500/40 text-violet-300 bg-violet-500/10",
  Story:    "border-amber-500/40 text-amber-300 bg-amber-500/10",
  Carousel: "border-cyan-500/40 text-cyan-300 bg-cyan-500/10",
};

const statusColor: Record<PipelineStatus, string> = {
  "New":              "border-muted-foreground/40 text-muted-foreground bg-muted/30",
  "Reviewing":        "border-sky-500/40 text-sky-300 bg-sky-500/10",
  "Drafting":         "border-violet-500/40 text-violet-300 bg-violet-500/10",
  "Awaiting Approval":"border-amber-500/40 text-amber-300 bg-amber-500/10",
  "Approved":         "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
  "Scheduled":        "border-cyan-500/40 text-cyan-300 bg-cyan-500/10",
  "Posted":           "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
  "Needs Revision":   "border-rose-500/40 text-rose-300 bg-rose-500/10",
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
          Content Pipeline
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          How {getRestaurantName(DEMO_CLIENT_ID)}'s media moves from upload to
          published post — a static preview of the Veroxa workflow.
        </p>
      </div>

      <DemoOnlyBanner
        message="Demo only — pipeline shows sample content. No real publishing, AI calls, or social integrations are connected."
        testId="banner-content-pipeline"
      />

      <Card className="bg-card border-border mb-4">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
          <p className="text-sm text-foreground/85 leading-relaxed">
            Veroxa uses this pipeline to keep content organized from upload to
            posting. Each card moves left-to-right as the media is reviewed,
            captioned, approved, and scheduled.
          </p>
        </CardContent>
      </Card>

      {/* Pipeline columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 mb-6">
        {pipelineStages.map((stage) => (
          <Card
            key={stage}
            className="bg-card border-border"
            data-testid={`column-${stage.replace(/\s+|\//g, "-").toLowerCase()}`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between gap-2">
                <span>{stage}</span>
                <Badge variant="outline" className="text-[10px]">
                  {byStage[stage].length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {byStage[stage].length === 0 && (
                <p className="text-[11px] text-muted-foreground italic px-1">
                  No items in this stage.
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
                      {card.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-1">
                    {card.relatedMenuItem}
                  </p>
                  <div className="text-[10px] text-muted-foreground border-t border-border pt-1.5 mt-1.5 space-y-0.5">
                    <p>Window: {card.postingWindow}</p>
                    <p>Owner: {card.assignedRole}</p>
                    {card.confidence > 0 && (
                      <p>AI score: {card.confidence}%</p>
                    )}
                    {card.notes && (
                      <p className="italic text-foreground/70 mt-1">
                        {card.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <AiSuggestionsPanel
        clientId={DEMO_CLIENT_ID}
        testId="panel-pipeline-suggestions"
      />
    </PortalLayout>
  );
}
