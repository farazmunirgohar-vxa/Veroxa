import type { Integration } from "./types";

export const integrationRegistry: Integration[] = [
  // AI
  { id: "int-openai",     category: "AI", name: "OpenAI",            description: "GPT models for captions, summaries, briefings.", status: "Planned", lastSyncAt: "Never — demo only" },
  { id: "int-anthropic",  category: "AI", name: "Anthropic Claude",  description: "Long-context reasoning for reports + strategy.", status: "Planned", lastSyncAt: "Never — demo only" },
  { id: "int-gemini",     category: "AI", name: "Google Gemini",     description: "Vision + multimodal media review.",              status: "Future",  lastSyncAt: "Never — demo only" },
  // Social
  { id: "int-instagram",  category: "Social", name: "Instagram Graph API", description: "Publishing, insights, comment sync.",      status: "Planned", lastSyncAt: "Never — demo only" },
  { id: "int-facebook",   category: "Social", name: "Facebook Pages",      description: "Page posting + insights.",                 status: "Planned", lastSyncAt: "Never — demo only" },
  { id: "int-tiktok",     category: "Social", name: "TikTok Business",     description: "Video publishing + analytics.",            status: "Future",  lastSyncAt: "Never — demo only" },
  // Google
  { id: "int-gbp",        category: "Google", name: "Google Business Profile", description: "Hours, posts, reviews, insights.",     status: "Planned", lastSyncAt: "Never — demo only" },
  { id: "int-ganalytics", category: "Google", name: "Google Analytics 4",      description: "Web + funnel attribution.",            status: "Future",  lastSyncAt: "Never — demo only" },
  // Communication
  { id: "int-resend",     category: "Communication", name: "Resend",   description: "Transactional email + digests.",               status: "Planned", lastSyncAt: "Never — demo only" },
  { id: "int-twilio",     category: "Communication", name: "Twilio",   description: "SMS notifications + 2FA.",                     status: "Future",  lastSyncAt: "Never — demo only" },
  { id: "int-slack",      category: "Communication", name: "Slack",    description: "Operator alerts + team handoffs.",             status: "Future",  lastSyncAt: "Never — demo only" },
  // Analytics
  { id: "int-posthog",    category: "Analytics", name: "PostHog",      description: "Product analytics + feature flags.",           status: "Future",  lastSyncAt: "Never — demo only" },
  // Storage
  { id: "int-s3",         category: "Storage",   name: "Object Storage", description: "Signed-URL media uploads.",                  status: "Planned", lastSyncAt: "Never — demo only" },
  // Payments
  { id: "int-stripe",     category: "Payments",  name: "Stripe Billing", description: "Subscriptions + dunning + invoices.",        status: "Future",  lastSyncAt: "Never — demo only" },
  // Scheduling + Reporting providers (Batch B spec)
  { id: "int-buffer",     category: "Social",    name: "Scheduling Provider (Buffer / Later)", description: "Post scheduling + queue management.",        status: "Planned", lastSyncAt: "Never — demo only" },
  { id: "int-warehouse",  category: "Analytics", name: "Reporting Data Provider",              description: "Warehouse for cross-client reporting rollups.", status: "Future",  lastSyncAt: "Never — demo only" },
];
