import { ClipboardCheck, CalendarDays, ArrowRight } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientPortalData } from "@/hooks/useClientPortalData";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { demoClientRequests, requestStatusColor, requestPriorityColor } from "@/data/demoData";
import { demoClientTeamWorkflow } from "@/data/workflows/clientTeamWorkflow";
import { sortWorkflowItems, isClientActionNeeded } from "@/lib/workflows/workflowStatus";
import { WorkflowItemCard } from "@/components/workflows/WorkflowItemCard";

const SHOWCASE_ID = "demo-a";

export default function ClientRequests() {
  const { source, dataSourceMessage } = useClientPortalData();
  const open = demoClientRequests.filter((r) => r.clientId === SHOWCASE_ID && r.status !== "Completed");
  const done = demoClientRequests.filter((r) => r.clientId === SHOWCASE_ID && r.status === "Completed");

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

      <DemoOnlyBanner message="Demo only — request items are illustrative. No notifications or messages are sent." testId="banner-client-requests" />

      {/* Workflow-derived "Action needed" strip — friendly labels only. */}
      {(() => {
        const actionItems = sortWorkflowItems(
          demoClientTeamWorkflow.filter(
            (i) => i.clientId === SHOWCASE_ID && isClientActionNeeded(i.stage),
          ),
        );
        if (actionItems.length === 0) return null;
        return (
          <Card className="bg-amber-500/5 border-amber-500/30 mb-4" data-testid="card-client-action-needed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-amber-300" />
                Action needed from you ({actionItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {actionItems.map((item) => (
                <WorkflowItemCard key={item.id} item={item} mode="client" />
              ))}
            </CardContent>
          </Card>
        );
      })()}

      <Card className="bg-card border-primary/30 mb-4">
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><ArrowRight className="w-4 h-4 text-primary" /> Open ({open.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {open.length === 0 ? (
            <p className="text-xs text-emerald-400">You're all caught up. Thank you!</p>
          ) : open.map((r) => (
            <div key={r.id} className="rounded-md border border-border bg-muted/20 px-3 py-3" data-testid={`request-${r.id}`}>
              <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                <p className="text-sm font-medium leading-snug">{r.title}</p>
                <div className="flex gap-1">
                  <Badge variant="outline" className={`text-[9px] ${requestPriorityColor[r.priority]}`}>{r.priority}</Badge>
                  <Badge variant="outline" className={`text-[9px] ${requestStatusColor[r.status]}`}>{r.status}</Badge>
                </div>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">{r.description}</p>
              <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
                <CalendarDays className="w-3 h-3" /> Due {r.dueDate}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-emerald-400" /> Recently completed ({done.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {done.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No completed requests yet.</p>
          ) : done.map((r) => (
            <div key={r.id} className="rounded-md border border-border bg-muted/10 px-3 py-2 opacity-80">
              <p className="text-sm font-medium">{r.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Completed by {r.dueDate}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </PortalLayout>
  );
}
