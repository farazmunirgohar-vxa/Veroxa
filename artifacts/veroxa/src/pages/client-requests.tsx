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
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { getClientSafeEmptyStateForPage } from "@/domain/saas/clientPortalState";
import { packageBoundarySeedDecisions } from "@/domain/packageBoundary";
import {
  buildClientRequestWindowMessage,
  evaluateRequestSla,
  getRequestSlaSeedData,
} from "@/domain/requestSla";

const clientSafeBoundaryCopy = [
  "Portal requests are the normal channel for routine Veroxa work.",
  "Veroxa will respond within 24 hours with an answer, review status, client question, coming-soon note, add-on note, not-included note, or not-supported note.",
  "A 24-hour response is not a promise that larger work is completed within 24 hours.",
];

export default function ClientRequests() {
  const mode = useRealPortalDataMode();
  const { pageState, requestSummary } = useClientSaasPortalState();
  const canUseSeedRequests = mode.isPublicDemoRoute;
  const grouped = pageState.clientRequests.reduce<
    Record<string, typeof pageState.clientRequests>
  >((acc, request) => {
    (acc[request.status] ??= []).push(request);
    return acc;
  }, {});
  const requestRows = canUseSeedRequests
    ? getRequestSlaSeedData().map((request) => ({
        request,
        sla: evaluateRequestSla(request),
        boundary: packageBoundarySeedDecisions.find(
          (decision) => decision.requestId === request.id,
        ),
      }))
    : [];
  const metrics = canUseSeedRequests
    ? {
        total: requestRows.length,
        inReview: requestRows.filter(
          (row) => row.request.status === "in_review",
        ).length,
        needsClientInput: requestRows.filter(
          (row) => row.request.needsClientConfirmation,
        ).length,
        comingSoon: requestRows.filter(
          (row) => row.boundary?.eligibilityStatus === "coming_soon_not_included",
        ).length,
        addOnAvailable: requestRows.filter(
          (row) => row.boundary?.eligibilityStatus === "add_on_available",
        ).length,
      }
    : {
        total: requestSummary.total,
        inReview: grouped.in_review?.length ?? 0,
        needsClientInput: requestSummary.needsClientConfirmation,
        comingSoon: 0,
        addOnAvailable: 0,
      };
  const showSafeEmptyState = !pageState.isDemoData && !pageState.canShowRealData;
  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <RealPortalReviewNotice />
      <PageHeader
        title="Requests"
        description="Submit routine requests in the Veroxa portal. Veroxa responds within 24 hours with a review or next step."
        testId="header-client-requests"
      />
      {showSafeEmptyState ? (
        <SafePortalEmptyCard
          title="Requests in setup"
          body={getClientSafeEmptyStateForPage("requests", pageState)}
        />
      ) : null}
      <div className="sr-only">
        Received In Review Handled Waiting for you Response within 24 hours
        Included Needs confirmation Coming soon Add-on available Not included at launch Needs manual review Not supported
      </div>
      {showSafeEmptyState ? null : (
        <section className="grid gap-4 md:grid-cols-5 mb-4">
          <Metric label="Total" value={metrics.total} />
          <Metric label="In review" value={metrics.inReview} />
          <Metric label="Needs your input" value={metrics.needsClientInput} />
          <Metric label="Coming soon" value={metrics.comingSoon} />
          <Metric label="Add-on available" value={metrics.addOnAvailable} />
        </section>
      )}
      {showSafeEmptyState ? null : (
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
                          boundary?.eligibilityStatus === "coming_soon_not_included"
                            ? "warning"
                            : boundary?.eligibilityStatus === "add_on_available"
                              ? "success"
                              : boundary?.eligibilityStatus === "not_supported_at_launch"
                                ? "danger"
                                : "info"
                        }
                      >
                        {formatClientSafeBoundaryStatus(boundary?.eligibilityStatus) ??
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
            <div className="grid gap-3 sm:grid-cols-2">
              <BoundaryExample title="Included" items={["Google update", "website alignment", "Facebook/Instagram picture post", "media guidance", "reporting question", "menu/contact/link correction"]} />
              <BoundaryExample title="Needs confirmation" items={["hours", "menu/prices", "existing offer details", "order/reservation links"]} />
              <BoundaryExample title="Add-on available" items={["new basic website +$95", "missing Facebook page +$45/profile", "missing Instagram profile +$45/profile"]} />
              <BoundaryExample title="Coming soon" items={["Yelp", "TikTok", "Reels/video", "ads"]} />
              <BoundaryExample title="Not included at launch" items={["DMs/comments/customer service", "refunds/complaints", "full custom development", "hosting/domain/email"]} />
              <BoundaryExample title="Needs manual review" items={["unclear scope", "sensitive business detail", "larger request timing"]} />
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
                "Veroxa reviews included Complete Online Presence requests, routes Yelp/TikTok/Reels/Ads/daily posting as coming soon, marks new basic website and missing Facebook/Instagram profile creation as add-ons, and keeps customer-service/full-custom-website requests outside launch scope."}
            </p>
          </CardContent>
        </Card>
      </section>
      )}
    </PortalLayout>
  );
}
function BoundaryExample({ title, items }: { title: string; items: string[] }) {
  return <div className="rounded-lg border border-border/70 p-3"><p className="font-medium text-foreground">{title}</p><ul className="mt-2 list-disc space-y-1 pl-5 text-xs">{items.map((item) => <li key={item}>{item}</li>)}</ul></div>;
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

function formatClientSafeBoundaryStatus(status?: string): string | null {
  if (!status) return null;
  if (status === "included") return "Included";
  if (status === "needs_confirmation") return "Needs confirmation";
  if (status === "coming_soon_not_included") return "Coming soon";
  if (status === "add_on_available") return "Add-on available";
  if (status === "not_supported_at_launch") return "Not included at launch";
  if (status === "unclear" || status === "needs_team_review") return "Needs manual review";
  return status.replaceAll("_", " ");
}
