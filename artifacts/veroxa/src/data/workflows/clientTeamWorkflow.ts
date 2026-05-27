/**
 * clientTeamWorkflow.ts — M009
 *
 * Simple shared workflow model used by both Client and Team portals
 * to describe the operational state of work moving between client
 * uploads and scheduled posts.
 *
 * Demo only. All entries reference fictional demo IDs (demo-a … demo-d).
 * No real client/customer data. No writes. No database persistence.
 */

export type WorkflowStage =
  | "client_media_received"
  | "media_review_needed"
  | "media_accepted"
  | "needs_better_photo"
  | "draft_needed"
  | "draft_ready"
  | "team_review"
  | "scheduled"
  | "marked_complete"
  | "needs_client_action";

export type WorkflowType =
  | "media"
  | "draft"
  | "schedule"
  | "request"
  | "report";

export type WorkflowPriority = "low" | "normal" | "high" | "urgent";

export interface WorkflowItem {
  id: string;
  clientId: "demo-a" | "demo-b" | "demo-c" | "demo-d";
  title: string;
  type: WorkflowType;
  stage: WorkflowStage;
  priority: WorkflowPriority;
  /**
   * Audience-appropriate display strings are derived at render time
   * via `getClientStatusLabel(stage)` / `getTeamStatusLabel(stage)`
   * in `src/lib/workflows/workflowStatus.ts`. The stage→label map
   * there is the single source of truth, so the client and team
   * vocabularies cannot drift out of sync.
   */
  assignedRole: "team";
  dueLabel: string;
  relatedMediaId?: string;
  relatedPostId?: string;
  imageId?: string;
  demoOnly: true;
}

/**
 * First-client demo workflow. Intentionally small (≈12 items) so both
 * portals can render the whole set without filtering and the picture
 * stays comprehensible.
 */
export const demoClientTeamWorkflow: WorkflowItem[] = [
  {
    id: "wf-001",
    clientId: "demo-a",
    title: "Grilled platter — overhead",
    type: "media",
    stage: "media_review_needed",
    priority: "high",
    assignedRole: "team",
    dueLabel: "Today",
    relatedMediaId: "med-a-001",
    imageId: "food-grilled-platter",
    demoOnly: true,
  },
  {
    id: "wf-002",
    clientId: "demo-a",
    title: "Chef plating clip (Reel)",
    type: "media",
    stage: "media_accepted",
    priority: "normal",
    assignedRole: "team",
    dueLabel: "This week",
    relatedMediaId: "med-a-002",
    imageId: "kitchen-chef-plate",
    demoOnly: true,
  },
  {
    id: "wf-003",
    clientId: "demo-a",
    title: "Storefront wide shot",
    type: "media",
    stage: "needs_better_photo",
    priority: "high",
    assignedRole: "team",
    dueLabel: "By Friday",
    relatedMediaId: "med-a-003",
    demoOnly: true,
  },
  {
    id: "wf-004",
    clientId: "demo-a",
    title: "Friday lunch caption",
    type: "draft",
    stage: "draft_needed",
    priority: "high",
    assignedRole: "team",
    dueLabel: "Thu 4pm",
    imageId: "food-grilled-platter",
    demoOnly: true,
  },
  {
    id: "wf-005",
    clientId: "demo-a",
    title: "Weekend family promo",
    type: "draft",
    stage: "draft_ready",
    priority: "normal",
    assignedRole: "team",
    dueLabel: "Tomorrow",
    imageId: "food-bowl-hero",
    demoOnly: true,
  },
  {
    id: "wf-006",
    clientId: "demo-a",
    title: "Charcoal grill close-up Reel",
    type: "draft",
    stage: "team_review",
    priority: "normal",
    assignedRole: "team",
    dueLabel: "Today",
    imageId: "kitchen-chef-plate",
    demoOnly: true,
  },
  {
    id: "wf-007",
    clientId: "demo-a",
    title: "Sunday dinner — Instagram post",
    type: "schedule",
    stage: "scheduled",
    priority: "normal",
    assignedRole: "team",
    dueLabel: "Sun 6:15 PM",
    relatedPostId: "post-a-001",
    imageId: "food-plated-dinner",
    demoOnly: true,
  },
  {
    id: "wf-008",
    clientId: "demo-a",
    title: "Brunch stack — Saturday",
    type: "schedule",
    stage: "marked_complete",
    priority: "low",
    assignedRole: "team",
    dueLabel: "Posted Sat",
    relatedPostId: "post-a-002",
    imageId: "food-pancakes",
    demoOnly: true,
  },
  {
    id: "wf-009",
    clientId: "demo-a",
    title: "Approve 3 caption variants",
    type: "request",
    stage: "needs_client_action",
    priority: "urgent",
    assignedRole: "team",
    dueLabel: "By Thu",
    demoOnly: true,
  },
  {
    id: "wf-010",
    clientId: "demo-a",
    title: "Reshoot storefront at golden hour",
    type: "request",
    stage: "needs_client_action",
    priority: "high",
    assignedRole: "team",
    dueLabel: "This weekend",
    demoOnly: true,
  },
  {
    id: "wf-011",
    clientId: "demo-a",
    title: "Weekly performance summary",
    type: "report",
    stage: "draft_needed",
    priority: "normal",
    assignedRole: "team",
    dueLabel: "Fri 5pm",
    demoOnly: true,
  },
  {
    id: "wf-012",
    clientId: "demo-a",
    title: "Welcome video — atmosphere",
    type: "media",
    stage: "client_media_received",
    priority: "normal",
    assignedRole: "team",
    dueLabel: "Today",
    relatedMediaId: "med-a-004",
    demoOnly: true,
  },
];

export function getWorkflowItemsForClient(
  clientId: WorkflowItem["clientId"],
): WorkflowItem[] {
  return demoClientTeamWorkflow.filter((i) => i.clientId === clientId);
}
