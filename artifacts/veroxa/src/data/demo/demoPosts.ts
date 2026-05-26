// demoPosts.ts — future: posts + content_concepts tables
// Covers content pipeline items, workflow engine content items, and team tasks.

// ── Content pipeline — future: posts + content_concepts ──────────
export type PipelineStage =
  | "Media Received"
  | "AI Review"
  | "Caption Drafting"
  | "Team Review"
  | "Scheduled / Posted";

export type ContentType   = "Photo" | "Reel" | "Story" | "Carousel";
export type PipelineRole  = "Client" | "Media Agent" | "Caption Agent" | "Team" | "Scheduling Agent";
export type PipelineStatus =
  | "New"
  | "Reviewing"
  | "Drafting"
  | "Awaiting Approval"
  | "Approved"
  | "Scheduled"
  | "Posted"
  | "Needs Revision";

export interface DemoPipelineItem {
  id: string;
  clientId: string;
  title: string;
  contentType: ContentType;
  relatedMenuItem: string;
  stage: PipelineStage;
  assignedRole: PipelineRole;
  status: PipelineStatus;
  postingWindow: string;
  confidence: number;
  notes: string;
}

export const demoContentPipelineItems: DemoPipelineItem[] = [
  { id: "cp1",  clientId: "mamadali", title: "Chicken Shawarma close-up",   contentType: "Photo",    relatedMenuItem: "Chicken Shawarma Plate",   stage: "Scheduled / Posted", assignedRole: "Scheduling Agent", status: "Scheduled",         postingWindow: "Tue 6:30 PM",    confidence: 94, notes: "Lunch-window post — peak dinner engagement." },
  { id: "cp2",  clientId: "mamadali", title: "Charcoal grill slow-mo reel", contentType: "Reel",     relatedMenuItem: "Mixed Grill Platter",      stage: "Team Review",        assignedRole: "Team",             status: "Awaiting Approval", postingWindow: "Fri 7:00 PM",    confidence: 91, notes: "Final color grade pending team sign-off." },
  { id: "cp3",  clientId: "mamadali", title: "BTS — kitchen prep clip",     contentType: "Story",    relatedMenuItem: "Mixed Grill Platter",      stage: "Caption Drafting",   assignedRole: "Caption Agent",    status: "Drafting",          postingWindow: "Wed 5:00 PM",    confidence: 86, notes: "3 caption options generated." },
  { id: "cp4",  clientId: "urban",    title: "Lunch special reel",          contentType: "Reel",     relatedMenuItem: "Carnitas Tacos",           stage: "AI Review",          assignedRole: "Media Agent",      status: "Reviewing",         postingWindow: "Thu 12:00 PM",   confidence: 88, notes: "Quality check in progress." },
  { id: "cp5",  clientId: "urban",    title: "Birria cheese-pull close-up", contentType: "Photo",    relatedMenuItem: "Birria Quesatacos",        stage: "Media Received",     assignedRole: "Client",           status: "New",               postingWindow: "Sat 1:00 PM",    confidence: 0,  notes: "Uploaded — awaiting media review." },
  { id: "cp6",  clientId: "crescent", title: "Mediterranean platter hero",  contentType: "Photo",    relatedMenuItem: "Mediterranean Platter",    stage: "Scheduled / Posted", assignedRole: "Scheduling Agent", status: "Posted",            postingWindow: "Posted Mon 8 PM", confidence: 96, notes: "Strong engagement in first 2 hours." },
  { id: "cp7",  clientId: "crescent", title: "Olive oil pour reel",         contentType: "Reel",     relatedMenuItem: "Olive Oil Tasting Flight", stage: "Caption Drafting",   assignedRole: "Caption Agent",    status: "Drafting",          postingWindow: "Thu 7:30 PM",    confidence: 90, notes: "Editorial caption with sensory lead-in." },
  { id: "cp8",  clientId: "crescent", title: "Owner story clip",            contentType: "Story",    relatedMenuItem: "Grilled Octopus",          stage: "Team Review",        assignedRole: "Team",             status: "Approved",          postingWindow: "Fri 8:00 PM",    confidence: 89, notes: "Approved — moving to scheduling." },
  { id: "cp9",  clientId: "alnoor",   title: "Cardamom latte morning shot", contentType: "Photo",    relatedMenuItem: "Cardamom Latte",           stage: "AI Review",          assignedRole: "Media Agent",      status: "Reviewing",         postingWindow: "Mon 8:30 AM",    confidence: 81, notes: "Lighting good — caption next." },
  { id: "cp10", clientId: "alnoor",   title: "Google review highlight",     contentType: "Carousel", relatedMenuItem: "Pistachio Croissant",      stage: "Caption Drafting",   assignedRole: "Caption Agent",    status: "Needs Revision",    postingWindow: "Wed 9:00 AM",    confidence: 78, notes: "Caption flagged as too generic." },
  { id: "cp11", clientId: "alnoor",   title: "Catering announcement",       contentType: "Carousel", relatedMenuItem: "Cardamom Latte",           stage: "Media Received",     assignedRole: "Client",           status: "New",               postingWindow: "Pending",        confidence: 0,  notes: "Awaiting brand-tone review." },
];

export const pipelineStages: PipelineStage[] = [
  "Media Received",
  "AI Review",
  "Caption Drafting",
  "Team Review",
  "Scheduled / Posted",
];

// ── Workflow engine content items — future: posts (full lifecycle) ─
export const demoWorkflowStages = [
  "Media Submitted",
  "Media Review",
  "Content Strategy",
  "Caption Drafting",
  "Brand Review",
  "Scheduling",
  "Ready To Post",
  "Posted",
  "Reporting",
] as const;
export type WorkflowStage = typeof demoWorkflowStages[number];

export type ContentItemStatus = "On Track" | "Blocked" | "Waiting" | "Done";
export type ContentItemType   = "Photo Post" | "Reel" | "Carousel" | "Story";

export interface ContentStageEvent {
  stage:     WorkflowStage;
  timestamp: string;
  actor:     string;
  note?:     string;
}

export interface DemoContentItem {
  id:           string;
  title:        string;
  contentType:  ContentItemType;
  clientId:     string;
  createdDate:  string;
  currentStage: WorkflowStage;
  status:       ContentItemStatus;
  lastUpdated:  string;
  nextAction:   string;
  history:      ContentStageEvent[];
}

const stageIdx = (s: WorkflowStage) => demoWorkflowStages.indexOf(s);
export const progressFromStage = (s: WorkflowStage) =>
  Math.round(((stageIdx(s) + 1) / demoWorkflowStages.length) * 100);
export const previousStageOf = (s: WorkflowStage): WorkflowStage | null => {
  const i = stageIdx(s);
  return i <= 0 ? null : demoWorkflowStages[i - 1];
};
export const nextStageOf = (s: WorkflowStage): WorkflowStage | null => {
  const i = stageIdx(s);
  return i < 0 || i >= demoWorkflowStages.length - 1 ? null : demoWorkflowStages[i + 1];
};

export const demoContentItems: DemoContentItem[] = [
  {
    id: "ci-001", title: "Mixed Grill Platter — hero shot", contentType: "Photo Post",
    clientId: "mamadali", createdDate: "May 22, 2026",
    currentStage: "Caption Drafting", status: "On Track", lastUpdated: "Today, 10:48 AM",
    nextAction: "Caption Agent drafting 3 variants — ETA 30 min.",
    history: [
      { stage: "Media Submitted",  timestamp: "May 22, 9:14 AM",  actor: "Mamadali Kebab House",     note: "Uploaded via client portal." },
      { stage: "Media Review",     timestamp: "May 22, 10:32 AM", actor: "Media Review Agent",       note: "Quality score 94. Approved." },
      { stage: "Content Strategy", timestamp: "Today, 9:00 AM",   actor: "Content Strategist Agent", note: "Slotted for Thursday 7 PM hero post." },
      { stage: "Caption Drafting", timestamp: "Today, 10:48 AM",  actor: "Caption Agent",            note: "Drafting in progress." },
    ],
  },
  {
    id: "ci-002", title: "Friday dinner reel — Mamadali", contentType: "Reel",
    clientId: "mamadali", createdDate: "May 24, 2026",
    currentStage: "Scheduling", status: "On Track", lastUpdated: "Today, 11:00 AM",
    nextAction: "Scheduling Agent locking Thursday 7 PM slot.",
    history: [
      { stage: "Media Submitted",  timestamp: "May 24, 8:00 AM",  actor: "Mamadali Kebab House" },
      { stage: "Media Review",     timestamp: "May 24, 9:12 AM",  actor: "Media Review Agent",       note: "Approved hero reel candidate." },
      { stage: "Content Strategy", timestamp: "May 24, 10:30 AM", actor: "Content Strategist Agent" },
      { stage: "Caption Drafting", timestamp: "May 25, 9:20 AM",  actor: "Caption Agent" },
      { stage: "Brand Review",     timestamp: "May 25, 10:50 AM", actor: "Brand Voice Agent",        note: "Voice match 96%." },
      { stage: "Scheduling",       timestamp: "Today, 11:00 AM",  actor: "Scheduling Agent" },
    ],
  },
  {
    id: "ci-003", title: "Olive oil pour reel — Crescent", contentType: "Reel",
    clientId: "crescent", createdDate: "May 23, 2026",
    currentStage: "Ready To Post", status: "On Track", lastUpdated: "Today, 9:30 AM",
    nextAction: "Awaiting publish window (Sun 11 AM).",
    history: [
      { stage: "Media Submitted",  timestamp: "May 23, 7:30 AM",  actor: "Crescent Grill" },
      { stage: "Media Review",     timestamp: "May 23, 8:45 AM",  actor: "Media Review Agent" },
      { stage: "Content Strategy", timestamp: "May 23, 11:00 AM", actor: "Content Strategist Agent" },
      { stage: "Caption Drafting", timestamp: "May 24, 9:25 AM",  actor: "Caption Agent" },
      { stage: "Brand Review",     timestamp: "May 24, 10:50 AM", actor: "Brand Voice Agent",        note: "Flagged Caption C — rewritten." },
      { stage: "Scheduling",       timestamp: "May 24, 1:00 PM",  actor: "Scheduling Agent" },
      { stage: "Ready To Post",    timestamp: "Today, 9:30 AM",   actor: "Operator",                 note: "Sign-off complete." },
    ],
  },
  {
    id: "ci-004", title: "Lunch special — Urban Tacos", contentType: "Photo Post",
    clientId: "urban", createdDate: "May 20, 2026",
    currentStage: "Brand Review", status: "Blocked", lastUpdated: "Yesterday, 4:12 PM",
    nextAction: "Brand Voice Agent flagged tone — rewrite needed.",
    history: [
      { stage: "Media Submitted",  timestamp: "May 20, 11:00 AM", actor: "Urban Tacos" },
      { stage: "Media Review",     timestamp: "May 20, 1:30 PM",  actor: "Media Review Agent" },
      { stage: "Content Strategy", timestamp: "May 21, 9:00 AM",  actor: "Content Strategist Agent" },
      { stage: "Caption Drafting", timestamp: "May 22, 9:30 AM",  actor: "Caption Agent" },
      { stage: "Brand Review",     timestamp: "Yesterday, 4:12 PM", actor: "Brand Voice Agent",      note: "Caption too promotional — rewrite." },
    ],
  },
  {
    id: "ci-005", title: "Specialty coffee carousel — Al Noor", contentType: "Carousel",
    clientId: "alnoor", createdDate: "May 15, 2026",
    currentStage: "Media Review", status: "Waiting", lastUpdated: "May 16",
    nextAction: "Awaiting fresh media from client — inventory critical.",
    history: [
      { stage: "Media Submitted", timestamp: "May 15, 10:00 AM", actor: "Al Noor Cafe" },
      { stage: "Media Review",    timestamp: "May 16, 11:00 AM", actor: "Media Review Agent",       note: "2 of 4 flagged for reshoot." },
    ],
  },
  {
    id: "ci-006", title: "Weekend brunch reel — Crescent", contentType: "Reel",
    clientId: "crescent", createdDate: "May 18, 2026",
    currentStage: "Posted", status: "Done", lastUpdated: "May 22",
    nextAction: "Awaiting inclusion in weekly report.",
    history: [
      { stage: "Media Submitted",  timestamp: "May 18, 8:00 AM",  actor: "Crescent Grill" },
      { stage: "Media Review",     timestamp: "May 18, 9:15 AM",  actor: "Media Review Agent" },
      { stage: "Content Strategy", timestamp: "May 18, 11:00 AM", actor: "Content Strategist Agent" },
      { stage: "Caption Drafting", timestamp: "May 19, 9:00 AM",  actor: "Caption Agent" },
      { stage: "Brand Review",     timestamp: "May 19, 10:30 AM", actor: "Brand Voice Agent" },
      { stage: "Scheduling",       timestamp: "May 19, 1:00 PM",  actor: "Scheduling Agent" },
      { stage: "Ready To Post",    timestamp: "May 20, 9:00 AM",  actor: "Operator" },
      { stage: "Posted",           timestamp: "May 22, 11:00 AM", actor: "Publishing Stage" },
    ],
  },
  {
    id: "ci-007", title: "Family platter story — Mamadali", contentType: "Story",
    clientId: "mamadali", createdDate: "May 19, 2026",
    currentStage: "Reporting", status: "Done", lastUpdated: "May 23",
    nextAction: "Included in next weekly report.",
    history: [
      { stage: "Media Submitted",  timestamp: "May 19", actor: "Mamadali Kebab House" },
      { stage: "Media Review",     timestamp: "May 19", actor: "Media Review Agent" },
      { stage: "Content Strategy", timestamp: "May 20", actor: "Content Strategist Agent" },
      { stage: "Caption Drafting", timestamp: "May 20", actor: "Caption Agent" },
      { stage: "Brand Review",     timestamp: "May 20", actor: "Brand Voice Agent" },
      { stage: "Scheduling",       timestamp: "May 21", actor: "Scheduling Agent" },
      { stage: "Ready To Post",    timestamp: "May 21", actor: "Operator" },
      { stage: "Posted",           timestamp: "May 22", actor: "Publishing Stage" },
      { stage: "Reporting",        timestamp: "May 23", actor: "Reporting Agent" },
    ],
  },
];

// ── Team tasks — future: tasks (linked to posts + operators) ──────
export type TaskPriority = "Critical" | "High" | "Medium" | "Low";
export type TaskStatus   = "Pending" | "In Progress" | "Waiting" | "Completed";
export type TaskType     =
  | "Review Media"
  | "Review Caption"
  | "Approve Content"
  | "Generate Weekly Report"
  | "Generate Monthly Report"
  | "Review Client Health"
  | "Request More Media";

export interface DemoTaskV2 {
  id:            string;
  type:          TaskType;
  title:         string;
  priority:      TaskPriority;
  dueDate:       string;
  assignedRole:  "Team" | "Operator";
  assignedTo:    string;
  status:        TaskStatus;
  clientId:      string;
  linkedItemId?: string;
}

export const demoTasksV2: DemoTaskV2[] = [
  { id: "t1",  type: "Review Media",           title: "Review 4 new uploads — Al Noor",           priority: "Critical", dueDate: "Today",     assignedRole: "Team",     assignedTo: "Jordan", status: "Pending",     clientId: "alnoor",   linkedItemId: "ci-005" },
  { id: "t2",  type: "Review Caption",         title: "Approve 3 caption variants — Mamadali",     priority: "High",     dueDate: "Today",     assignedRole: "Team",     assignedTo: "Marcus", status: "In Progress", clientId: "mamadali", linkedItemId: "ci-001" },
  { id: "t3",  type: "Approve Content",        title: "Final sign-off — Crescent olive-oil reel",  priority: "High",     dueDate: "Today",     assignedRole: "Operator", assignedTo: "Lina",   status: "Pending",     clientId: "crescent", linkedItemId: "ci-003" },
  { id: "t4",  type: "Generate Weekly Report", title: "Weekly report — Urban Tacos",               priority: "Critical", dueDate: "Overdue",   assignedRole: "Operator", assignedTo: "Daniel", status: "In Progress", clientId: "urban"                            },
  { id: "t5",  type: "Generate Weekly Report", title: "Weekly report — Mamadali",                  priority: "High",     dueDate: "Tomorrow",  assignedRole: "Team",     assignedTo: "Priya",  status: "Pending",     clientId: "mamadali"                         },
  { id: "t6",  type: "Generate Monthly Report",title: "Monthly report — Crescent",                 priority: "Medium",   dueDate: "May 30",    assignedRole: "Team",     assignedTo: "Priya",  status: "Pending",     clientId: "crescent"                         },
  { id: "t7",  type: "Review Client Health",   title: "Health check — Urban Tacos",                priority: "High",     dueDate: "Today",     assignedRole: "Operator", assignedTo: "Daniel", status: "Waiting",     clientId: "urban"                            },
  { id: "t8",  type: "Request More Media",     title: "Reshoot request — Al Noor storefront",      priority: "Critical", dueDate: "Today",     assignedRole: "Operator", assignedTo: "Daniel", status: "Pending",     clientId: "alnoor"                           },
  { id: "t9",  type: "Review Caption",         title: "Rewrite caption — Urban Tacos lunch post",  priority: "Medium",   dueDate: "Tomorrow",  assignedRole: "Team",     assignedTo: "Ava",    status: "In Progress", clientId: "urban",    linkedItemId: "ci-004" },
  { id: "t10", type: "Review Media",           title: "Review BTS clips — Crescent kitchen",       priority: "Low",      dueDate: "May 29",    assignedRole: "Team",     assignedTo: "Jordan", status: "Pending",     clientId: "crescent"                         },
  { id: "t11", type: "Approve Content",        title: "Approve story batch — Mamadali",            priority: "Medium",   dueDate: "Yesterday", assignedRole: "Operator", assignedTo: "Lina",   status: "Completed",   clientId: "mamadali"                         },
  { id: "t12", type: "Generate Weekly Report", title: "Weekly report — Crescent",                  priority: "Medium",   dueDate: "May 24",    assignedRole: "Operator", assignedTo: "Lina",   status: "Completed",   clientId: "crescent"                         },
];
