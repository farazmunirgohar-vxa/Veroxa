// demoRequests.ts — future: client_requests table
// Covers active requests sent to clients (upload requests, confirmations, approvals).

export type RequestStatus   = "Pending" | "In Progress" | "Completed";
export type RequestPriority = "High" | "Normal" | "Low";

export interface DemoClientRequest {
  id:          string;
  clientId:    string;
  title:       string;
  description: string;
  status:      RequestStatus;
  priority:    RequestPriority;
  dueDate:     string;
}

export const demoClientRequests: DemoClientRequest[] = [
  { id: "r1", clientId: "mamadali", title: "Upload 6 new food photos",          description: "Hero shots of the new mixed-grill platter + signature kebabs.",  status: "Pending",     priority: "Normal", dueDate: "May 28" },
  { id: "r2", clientId: "mamadali", title: "Confirm Father's Day special",      description: "Send us the dish name, photo, price (or 'no price'), dates.",    status: "In Progress", priority: "Normal", dueDate: "May 30" },
  { id: "r3", clientId: "urban",    title: "Upload 8 photos + 2 short reels",   description: "Lunch rush footage, taco close-ups, kitchen action.",             status: "Pending",     priority: "High",   dueDate: "Today"  },
  { id: "r4", clientId: "urban",    title: "Confirm preferred posting windows", description: "Best 3 post times per week based on your foot-traffic data.",    status: "Pending",     priority: "Normal", dueDate: "May 29" },
  { id: "r5", clientId: "crescent", title: "Review restaurant profile",         description: "Quick sign-off on updated bio + opening hours on Google.",        status: "Completed",   priority: "Low",    dueDate: "May 20" },
  { id: "r6", clientId: "crescent", title: "Confirm 3 menu item details",       description: "Ingredients + allergens for spring lamb, sea bass, mezze.",       status: "In Progress", priority: "Normal", dueDate: "May 31" },
  { id: "r7", clientId: "alnoor",   title: "Reshoot storefront photo",          description: "Daytime exterior with the new awning. Landscape orientation.",    status: "Pending",     priority: "High",   dueDate: "Today"  },
  { id: "r8", clientId: "alnoor",   title: "Send seasonal coffee specials",     description: "List of specials with names, prices, and key ingredients.",       status: "Pending",     priority: "High",   dueDate: "May 27" },
];

export const requestStatusColor: Record<RequestStatus, string> = {
  Pending:       "border-amber-500/40 text-amber-300 bg-amber-500/10",
  "In Progress": "border-sky-500/40 text-sky-300 bg-sky-500/10",
  Completed:     "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
};

export const requestPriorityColor: Record<RequestPriority, string> = {
  High:   "border-rose-500/40 text-rose-300 bg-rose-500/10",
  Normal: "border-sky-500/40 text-sky-300 bg-sky-500/10",
  Low:    "border-muted-foreground/40 text-muted-foreground bg-muted/30",
};
