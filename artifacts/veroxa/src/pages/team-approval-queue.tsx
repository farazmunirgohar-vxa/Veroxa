import { useMemo } from "react";
import { ShieldCheck } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import {
  RealPortalReviewNotice,
  SafePortalEmptyCard,
} from "@/components/RealPortalSafeStates";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { PageHeader } from "@/components/common";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { Card, CardContent } from "@/components/ui/card";
import { PreparedActionCard } from "@/components/PreparedActionCard";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import {
  preparedActionRepository,
  usePreparedActions,
} from "@/lib/preparedActions";
import {
  PREPARED_ACTION_PRIORITY_LABELS,
  type PreparedAction,
  type PreparedActionId,
  type PreparedActionPriority,
} from "@/domain/preparedActions";

/**
 * /team/approval-queue — Approval Queue.
 *
 * The human gate of the Approval-to-Execution model: prepared actions appear
 * here for Faraz to approve, edit later, ask the client, skip, or queue for
 * execution. Nothing changes publicly from this page — approved items are held
 * safely for later handling. Mobile-friendly so review works anywhere.
 */

const PRIORITY_ORDER: PreparedActionPriority[] = ["high", "medium", "low"];

export default function TeamApprovalQueue() {
  const portalDataMode = useRealPortalDataMode();
  const canUseFixtureData =
    portalDataMode.allowDemoFixtures || portalDataMode.isLiveDataConnected;

  const actions = usePreparedActions();

  // Open items first (still need a decision), grouped by priority. Resolved
  // items (approved / queued / skipped) drop to a "Recently handled" section.
  const { openByPriority, handled } = useMemo(() => {
    const open: PreparedAction[] = [];
    const done: PreparedAction[] = [];
    for (const a of actions) {
      if (
        a.status === "approved" ||
        a.status === "queued_for_execution" ||
        a.status === "skipped" ||
        a.status === "executed" ||
        a.status === "archived"
      ) {
        done.push(a);
      } else {
        open.push(a);
      }
    }
    const grouped = new Map<PreparedActionPriority, PreparedAction[]>();
    for (const p of PRIORITY_ORDER) grouped.set(p, []);
    for (const a of open) grouped.get(a.priority)!.push(a);
    return { openByPriority: grouped, handled: done };
  }, [actions]);

  const totalOpen = PRIORITY_ORDER.reduce(
    (n, p) => n + (openByPriority.get(p)?.length ?? 0),
    0,
  );

  const handlers = {
    onApprove: preparedActionRepository.markApproved,
    onEditLater: (id: PreparedActionId) =>
      preparedActionRepository.updatePreparedActionStatus(id, "edited"),
    onAskClient: preparedActionRepository.markNeedsClientConfirmation,
    onSkip: preparedActionRepository.markSkipped,
    onQueueForExecution: preparedActionRepository.markQueuedForExecution,
  };

  if (!canUseFixtureData) {
    return (
      <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
        <RealPortalReviewNotice />
        <SafePortalEmptyCard
          title="Approval Queue in review"
          body="Live prepared actions are not connected yet. Approval items will appear here only after real client operations are connected."
          testId="empty-team-approval-queue"
        />
      </PortalLayout>
    );
  }

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <PageHeader
        title="Approval Queue"
        description="Review prepared actions before anything changes publicly."
        testId="header-approval-queue"
      />

      <DemoOnlyBanner
        message="Nothing changes publicly from this page. Approval keeps an action ready for later review and handling."
        testId="banner-approval-queue"
      />

      {totalOpen === 0 && (
        <Card data-testid="approval-queue-empty">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Nothing waiting for review right now. Prepared actions will appear
            here as Veroxa gets work ready.
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {PRIORITY_ORDER.map((priority) => {
          const items = openByPriority.get(priority) ?? [];
          if (items.length === 0) return null;
          return (
            <div key={priority} data-testid={`approval-group-${priority}`}>
              <div className="mb-2 flex items-center justify-between px-0.5">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {PREPARED_ACTION_PRIORITY_LABELS[priority]}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {items.length} action{items.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {items.map((action) => (
                  <PreparedActionCard
                    key={action.id}
                    action={action}
                    testId={`prepared-action-${action.id}`}
                    {...handlers}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {handled.length > 0 && (
        <div className="mt-8" data-testid="approval-handled-section">
          <div className="mb-2 flex items-center gap-2 px-0.5 text-muted-foreground">
            <ShieldCheck className="w-4 h-4" />
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Recently handled
            </h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {handled.map((action) => (
              <PreparedActionCard
                key={action.id}
                action={action}
                testId={`prepared-action-${action.id}`}
                {...handlers}
              />
            ))}
          </div>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground/70 mt-6 px-0.5">
        Approved actions wait safely until the team is ready to handle them.
        Items that need the restaurant&apos;s confirmation are never changed
        until they confirm.
      </p>
    </PortalLayout>
  );
}
