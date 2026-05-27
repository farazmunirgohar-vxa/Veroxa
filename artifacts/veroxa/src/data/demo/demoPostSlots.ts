// demoPostSlots.ts — future: post_slots table
// Covers the content calendar — scheduled, published, planned, and open slots.

export type CalendarSlotKind = "scheduled" | "published" | "planned" | "open";

export interface DemoCalendarSlot {
  date:      string;   // YYYY-MM-DD
  time:      string;   // HH:MM
  kind:      CalendarSlotKind;
  clientId?: string;
  title?:    string;
  itemId?:   string;
}

export const demoCalendarSlots: DemoCalendarSlot[] = [
  { date: "2026-05-25", time: "11:00", kind: "published", clientId: "demo-c", title: "Weekend brunch reel",  itemId: "ci-006" },
  { date: "2026-05-26", time: "12:00", kind: "scheduled", clientId: "demo-b",    title: "Lunch special",        itemId: "ci-004" },
  { date: "2026-05-26", time: "19:00", kind: "planned",   clientId: "demo-a", title: "Mixed grill hero"                       },
  { date: "2026-05-27", time: "10:00", kind: "open"                                                                              },
  { date: "2026-05-28", time: "19:00", kind: "scheduled", clientId: "demo-a", title: "Friday dinner reel",   itemId: "ci-002" },
  { date: "2026-05-29", time: "11:00", kind: "open"                                                                              },
  { date: "2026-05-30", time: "10:00", kind: "scheduled", clientId: "demo-c", title: "Olive-oil reel",       itemId: "ci-003" },
  { date: "2026-05-30", time: "16:00", kind: "planned",   clientId: "demo-a", title: "Family platter story"                   },
  { date: "2026-05-31", time: "11:00", kind: "open"                                                                              },
  { date: "2026-06-01", time: "12:00", kind: "open"                                                                              },
  { date: "2026-06-02", time: "19:00", kind: "planned",   clientId: "demo-b",    title: "Taco Tuesday reel"                      },
];
