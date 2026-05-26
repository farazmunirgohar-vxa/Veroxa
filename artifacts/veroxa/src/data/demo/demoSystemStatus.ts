// demoSystemStatus.ts — future: system_config / status reference
// Covers demo control presets and live system status display.

// ── Demo control presets — internal demo tooling ──────────────────
export interface DemoControlPreset {
  id:            string;
  label:         string;
  description:   string;
  exampleClient: string;
}

export const demoControlPresets: DemoControlPreset[] = [
  { id: "healthy",     label: "Healthy client",           description: "Strong health score, on-schedule reporting, full media runway.",     exampleClient: "Crescent Grill" },
  { id: "low-media",   label: "Low-media client",         description: "Inventory dipping below 14-day runway — needs upload request soon.", exampleClient: "Urban Tacos"    },
  { id: "at-risk",     label: "At-risk client",           description: "Critical health, overdue reports, near-empty media supply.",          exampleClient: "Al Noor Cafe"   },
  { id: "onboarding",  label: "Onboarding incomplete",    description: "Missing posting windows + one outstanding profile question.",         exampleClient: "Urban Tacos"    },
  { id: "report-late", label: "Report overdue client",    description: "Weekly report drafted but stuck awaiting validation > 24h.",          exampleClient: "Urban Tacos"    },
  { id: "pipeline",    label: "Pipeline delayed client",  description: "Brand-review backlog, captions sitting flagged, queue under target.", exampleClient: "Al Noor Cafe"   },
];

// ── System status — future: system_health / integration status ────
export type SystemStatusState = "Active" | "Not Connected" | "Placeholder";

export interface DemoSystemStatus {
  label:  string;
  state:  SystemStatusState;
  detail: string;
}

export const demoSystemStatus: DemoSystemStatus[] = [
  { label: "Demo Mode",               state: "Active",        detail: "All data is sample. No production traffic is served."          },
  { label: "Backend / Database",      state: "Not Connected", detail: "No live database. All reads/writes happen client-side."        },
  { label: "Real AI APIs",            state: "Not Connected", detail: "AI agents are static simulations."                             },
  { label: "Media Uploads",           state: "Not Connected", detail: "Upload UI is illustrative — files are not transmitted."        },
  { label: "Publishing Integrations", state: "Not Connected", detail: "No Instagram / TikTok / Google publishing."                    },
  { label: "Scheduling Integrations", state: "Not Connected", detail: "Calendar is illustrative."                                     },
  { label: "Email / SMS",             state: "Not Connected", detail: "No outbound messaging."                                        },
  { label: "Payments / Stripe",       state: "Not Connected", detail: "No checkout, billing, or invoices."                            },
  { label: "Auth",                    state: "Placeholder",   detail: "Internal demo guard only. Production auth not configured."     },
];
