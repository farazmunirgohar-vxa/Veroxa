import { ArrowRight, CheckCircle2, HelpCircle } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientPortalData } from "@/hooks/useClientPortalData";
import { ClientRequestsClarity } from "@/components/ClientExecutionReinforcement";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { demoClientTeamWorkflow } from "@/data/workflows/clientTeamWorkflow";
import {
  getClientActionNeededItems,
  getClientRequestHelpText,
  getClientStatusLabel,
} from "@/lib/workflows/workflowStatus";

const SHOWCASE_ID = "demo-a";

const priorityLabel = {
  urgent: "Needed soon",
  high: "Helpful this week",
  normal: "When you can",
  low: "Low pressure",
} as const;

const priorityTone = {
  urgent: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  high: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  normal: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  low: "border-border bg-muted/20 text-muted-foreground",
} as const;

export default function ClientRequests() {
  const { source, dataSourceMessage } = useClientPortalData();
  const actionItems = getClientActionNeededItems(demoClientTeamWorkflow, SHOWCASE_ID);

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="header-client-requests">
          Requests from Veroxa
        </h2>
        <DataSourceBadge source={source} message={dataSourceMessage} />
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Quick to-dos that help us keep your content fresh and on-brand.
        </p>
      </div>

      <div className="mb-4">
        <ClientRequestsClarity clientId={SHOWCASE_ID} />
      </div>

      <Card className="bg-card border-border mb-4" data-testid="card-client-action-needed">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-primary" />
            What Veroxa needs from you ({actionItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {actionItems.length === 0 ? (
            <div className="flex items-start gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Nothing needed from you right now</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Veroxa is handling the current work. We&apos;ll ask here if we need a quick detail.
                </p>
              </div>
            </div>
          ) : (
            actionItems.map((item) => (
              <div
                key={item.id}
                className="rounded-md border border-border bg-muted/20 px-3 py-3"
                data-testid={`client-request-${item.id}`}
              >
                <div className="flex items-start justify-between gap-2 flex-wrap mb-1.5">
                  <p className="text-sm font-medium leading-snug">{item.title}</p>
                  <Badge variant="outline" className={`text-[10px] ${priorityTone[item.priority]}`}>
                    {priorityLabel[item.priority]}
                  </Badge>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  {getClientRequestHelpText(item)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Status: {getClientStatusLabel(item.stage)} · {item.dueLabel}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20" data-testid="card-client-request-note">
        <CardContent className="p-4 flex items-start gap-3">
          <ArrowRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold">How this works</p>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              Send the requested detail or photo when convenient. Veroxa reviews everything before anything is shown publicly.
            </p>
          </div>
        </CardContent>
      </Card>
    </PortalLayout>
  );
}
