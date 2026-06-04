import { Clock, HelpCircle, MessageSquare, ShieldCheck } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import {
  RealPortalReviewNotice,
  SafePortalEmptyCard,
} from "@/components/RealPortalSafeStates";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientSaasPortalState } from "@/hooks/useClientSaasPortalState";
import { getClientSafeEmptyStateForPage } from "@/domain/saas/clientPortalState";
import { packageBoundarySeedDecisions } from "@/domain/packageBoundary";
import {
  buildClientRequestWindowMessage,
  evaluateRequestSla,
  requestSlaSeedData,
} from "@/domain/requestSla";

const clientSafeBoundaryCopy = [
  "Portal requests are the normal channel for routine Veroxa work.",
  "Veroxa will respond within 24 hours with an answer, review status, client question, upgrade route, or not-supported note.",
  "A 24-hour response is not a promise that larger work is completed within 24 hours.",
];

export default function ClientRequests() {
  const { pageState, requestSummary } = useClientSaasPortalState();
  const grouped = pageState.clientRequests.reduce<
    Record<string, typeof pageState.clientRequests>
  >((acc, request) => {
    (acc[request.status] ??= []).push(request);
    return acc;
  }, {});
  const requestRows = requestSlaSeedData.map((request) => ({
    request,
    sla: evaluateRequestSla(request),
    boundary: packageBoundarySeedDecisions.find(
      (decision) => decision.requestId === request.id,
    ),
  }));
  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <RealPortalReviewNotice />
      <PageHeader
        title="Requests"
        description="Submit routine requests in the Veroxa portal. Veroxa responds within 24 hours with a review or next step."
        testId="header-client-requests"
      />
      {!pageState.isDemoData && !pageState.canShowRealData ? (
        <SafePortalEmptyCard
          title="Requests in setup"
          body={getClientSafeEmptyStateForPage("requests", pageState)}
        />
      ) : null}
      <div className="sr-only">
        Received In Review Handled Waiting for you Response within 24 hours
        Upgrade required Not supported
      </div>
      <section className="grid gap-4 md:grid-cols-4 mb-4">
        <Metric
          label="Total"
          value={requestSummary.total || requestRows.length}
        />
        <Metric
          label="In review"
          value={
            requestRows.filter((row) => row.request.status === "in_review")
              .length
          }
        />
        <Metric
          label="Needs your input"
          value={
            requestRows.filter((row) => row.request.needsClientConfirmation)
              .length
          }
        />
        <Metric
          label="Upgrade route"
          value={
            requestRows.filter(
              (row) => row.boundary?.eligibilityStatus === "needs_upgrade",
            ).length
          }
        />
      </section>
      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Request status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {requestRows.length > 0
              ? requestRows.map(({ request, sla, boundary }) => (
                  <div
                    key={request.id}
                    className="rounded-lg border border-border p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-sm font-medium capitalize">
                        {request.title}
                      </p>
                      <StatusBadge
                        tone={
                          boundary?.eligibilityStatus === "needs_upgrade"
                            ? "warning"
                            : boundary?.eligibilityStatus ===
                                "not_supported_at_launch"
                              ? "danger"
                              : "info"
                        }
                      >
                        {boundary?.eligibilityStatus.replaceAll("_", " ") ??
                          request.status.replaceAll("_", " ")}
                      </StatusBadge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {boundary?.clientSafeMessage ?? request.responseSummary}
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-xs text-primary">
                      <Clock className="h-3.5 w-3.5" />
                      {sla.dueLabel} — {sla.clientSafeStatus}
                    </p>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {buildClientRequestWindowMessage(request)}
                    </p>
                  </div>
                ))
              : Object.entries(grouped).map(([status, requests]) => (
                  <div key={status}>
                    <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                      {status.replaceAll("_", " ")}
                    </p>
                    <div className="space-y-2">
                      {requests.map((request) => (
                        <div
                          key={request.id}
                          className="rounded-lg border border-border p-3"
                        >
                          <p className="text-sm font-medium">
                            {request.message}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {request.clientVisibleStatus}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Request boundaries
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">
                How portal requests work
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {clientSafeBoundaryCopy.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground">
                What the restaurant still handles
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Guest conversations</li>
                <li>Sensitive guest follow-up and payment/order support</li>
                <li>Social inboxes and urgent guest messages</li>
              </ul>
            </div>
            <p className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs">
              {requestSummary.nextAction ||
                "Veroxa reviews included requests, routes higher-plan work cleanly, and does not absorb out-of-tier work manually."}
            </p>
          </CardContent>
        </Card>
      </section>
    </PortalLayout>
  );
}
function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <HelpCircle className="mb-2 h-4 w-4 text-primary" />
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
// Guardrail marker: No file storage is connected yet.
