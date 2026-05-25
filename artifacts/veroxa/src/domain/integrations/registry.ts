import type { Integration } from "./types";

export const integrationRegistry: Integration[] = [
  // AI
  { id: "int-openai",     category: "AI", name: "OpenAI",            description: "GPT models for captions, summaries, briefings.", status: "Planned" },
  { id: "int-anthropic",  category: "AI", name: "Anthropic Claude",  description: "Long-context reasoning for reports + strategy.",  status: "Planned" },
  { id: "int-gemini",     category: "AI", name: "Google Gemini",     description: "Vision + multimodal media review.",               status: "Future"  },
  // Social
  { id: "int-instagram",  category: "Social", name: "Instagram Graph API", description: "Publishing, insights, comment sync.",       status: "Planned" },
  { id: "int-facebook",   category: "Social", name: "Facebook Pages",      description: "Page posting + insights.",                  status: "Planned" },
  { id: "int-tiktok",     category: "Social", name: "TikTok Business",     description: "Video publishing + analytics.",             status: "Future"  },
  // Google
  { id: "int-gbp",        category: "Google", name: "Google Business Profile", description: "Hours, posts, reviews, insights.",      status: "Planned" },
  { id: "int-ganalytics", category: "Google", name: "Google Analytics 4",      description: "Web + funnel attribution.",             status: "Future"  },
  // Communication
  { id: "int-resend",     category: "Communication", name: "Resend",   description: "Transactional email + digests.",                status: "Planned" },
  { id: "int-twilio",     category: "Communication", name: "Twilio",   description: "SMS notifications + 2FA.",                      status: "Future"  },
  { id: "int-slack",      category: "Communication", name: "Slack",    description: "Operator alerts + team handoffs.",              status: "Future"  },
  // Analytics
  { id: "int-posthog",    category: "Analytics", name: "PostHog",      description: "Product analytics + feature flags.",            status: "Future"  },
  // Storage
  { id: "int-s3",         category: "Storage",   name: "Object Storage", description: "Signed-URL media uploads.",                   status: "Planned" },
  // Payments
  { id: "int-stripe",     category: "Payments",  name: "Stripe Billing", description: "Subscriptions + dunning + invoices.",         status: "Future"  },
];
