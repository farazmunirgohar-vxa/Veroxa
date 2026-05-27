// demoAgents.ts — future: ai_agents configuration / audit log
// Covers AI agent definitions (v1 and v2), workflow steps, and AI suggestions.

// ── DemoAgent v1 — simplified agent cards ────────────────────────
export interface DemoAgent {
  id: string;
  name: string;
  purpose: string;
  exampleOutput: string;
  confidence: number;
  lastActivity: string;
  relatedClientId?: string;
  workflowStage: string;
}

export const demoAgents: DemoAgent[] = [
  { id: "media-review",       name: "Media Review Agent",       purpose: "Scores uploaded media for lighting, blur, food visibility, and duplicate risk.",                exampleOutput: "Reviewed 12 uploaded photos. 8 approved, 2 blurry, 2 duplicates.",               confidence: 94, lastActivity: "Today, 9:15 AM",     relatedClientId: "demo-a", workflowStage: "Media intake"      },
  { id: "content-strategist", name: "Content Strategist Agent", purpose: "Suggests content angles — product spotlight, family meal, behind-the-scenes, review highlight.", exampleOutput: "Recommended 4 content angles for Demo Mediterranean Grill weekend coverage.",                 confidence: 88, lastActivity: "Today, 8:20 AM",     relatedClientId: "demo-c", workflowStage: "Planning"          },
  { id: "caption",            name: "Caption Agent",            purpose: "Creates Safe, Engagement, and Sales caption options for the selected concept.",                  exampleOutput: "Generated 3 caption options for Chicken Shawarma lunch promotion.",                confidence: 91, lastActivity: "Yesterday, 6:30 PM", relatedClientId: "demo-a", workflowStage: "Drafting"          },
  { id: "brand-voice",        name: "Brand Voice Agent",        purpose: "Checks captions sound premium, clear, restaurant-focused, and not too generic.",                 exampleOutput: "Tone check passed on 5 of 6 drafts. 1 flagged as too generic.",                   confidence: 90, lastActivity: "Yesterday, 6:35 PM", relatedClientId: "demo-b",    workflowStage: "Quality check"     },
  { id: "scheduling",         name: "Scheduling Agent",         purpose: "Suggests posting slots based on the client's preferred windows and content balance.",             exampleOutput: "Recommended Tuesday 6:30 PM based on dinner engagement patterns.",                  confidence: 86, lastActivity: "Today, 10:48 AM",    relatedClientId: "demo-a", workflowStage: "Scheduling"        },
  { id: "publishing",         name: "Publishing Agent",         purpose: "Coordinates the publish queue and handles retry suggestions for failed posts.",                  exampleOutput: "4 posts queued for publication. 1 post recommended for reschedule.",              confidence: 82, lastActivity: "Today, 11:00 AM",    relatedClientId: "demo-c", workflowStage: "Publishing"        },
  { id: "reporting",          name: "Reporting Agent",          purpose: "Compiles weekly and monthly client reports from demo signals.",                                   exampleOutput: "Weekly visibility improved by an estimated 8.4%.",                                  confidence: 89, lastActivity: "Today, 11:02 AM",    relatedClientId: "demo-b",    workflowStage: "Reporting"         },
  { id: "alert-risk",         name: "Alert & Risk Agent",       purpose: "Flags low content supply, failed posts, or client health risks before they escalate.",           exampleOutput: "Client has fewer than 3 approved media items remaining.",                           confidence: 96, lastActivity: "Today, 8:42 AM",     relatedClientId: "demo-d",   workflowStage: "Risk monitoring"   },
  { id: "operator-assistant", name: "Operator Assistant",       purpose: "Surfaces what the operator should review next across the portfolio.",                            exampleOutput: "2 reports awaiting your approval. 1 critical media risk to confirm.",             confidence: 87, lastActivity: "Today, 7:55 AM",                               workflowStage: "Operator workflow" },
  { id: "owner-assistant",    name: "Owner Assistant",          purpose: "Summarises portfolio health for the owner in plain language.",                                    exampleOutput: "3 clients healthy, 1 client needs attention because media inventory is low.",      confidence: 93, lastActivity: "Today, 8:00 AM",                               workflowStage: "Executive summary" },
];

// ── AI agent summary widget ───────────────────────────────────────
export const demoAiAgentSummary = {
  agentsInDemoMode:     10,
  recentPreviewOutputs: 6,
  alertsGenerated:      2,
};

// ── AI suggestions (pipeline-linked) ─────────────────────────────
export type SuggestionAgent =
  | "Media Review Agent"
  | "Content Strategist Agent"
  | "Caption Agent"
  | "Brand Voice Agent"
  | "Scheduling Agent"
  | "Reporting Agent";

export interface DemoAiSuggestion {
  id:                 string;
  agent:              SuggestionAgent;
  clientId:           string;
  suggestion:         string;
  confidence:         number;
  relatedPipelineId?: string;
}

export const demoAiSuggestions: DemoAiSuggestion[] = [
  { id: "as1",  agent: "Media Review Agent",       clientId: "demo-a", suggestion: "Use this chicken platter image for a dinner promotion — strong lighting and composition.", confidence: 94, relatedPipelineId: "cp1"  },
  { id: "as2",  agent: "Content Strategist Agent", clientId: "demo-a", suggestion: "Recommend a family-platter weekend angle leveraging current charcoal-grill media.",        confidence: 88, relatedPipelineId: "cp2"  },
  { id: "as3",  agent: "Caption Agent",            clientId: "demo-a", suggestion: "Caption tone should be warm, family-focused, and rooted in local community.",              confidence: 91, relatedPipelineId: "cp3"  },
  { id: "as4",  agent: "Scheduling Agent",         clientId: "demo-a", suggestion: "Best posting window: Friday 5:30 PM based on dinner-traffic engagement pattern.",          confidence: 87, relatedPipelineId: "cp2"  },
  { id: "as5",  agent: "Brand Voice Agent",        clientId: "demo-b",    suggestion: "Keep captions punchy — current draft is 60 words. Reduce to 1–2 lines.",                   confidence: 89, relatedPipelineId: "cp4"  },
  { id: "as6",  agent: "Media Review Agent",       clientId: "demo-b",    suggestion: "Client has low unused video inventory this week — recommend a shoot before Friday.",      confidence: 92                             },
  { id: "as7",  agent: "Content Strategist Agent", clientId: "demo-c", suggestion: "Olive-oil reels series should continue — engagement +18% over previous concept.",          confidence: 93, relatedPipelineId: "cp7"  },
  { id: "as8",  agent: "Reporting Agent",          clientId: "demo-c", suggestion: "Visibility trending +5% — surface in next weekly client report.",                          confidence: 90                             },
  { id: "as9",  agent: "Brand Voice Agent",        clientId: "demo-d",   suggestion: "Caption flagged as too generic — rewrite with neighborhood-cafe warmth.",                  confidence: 84, relatedPipelineId: "cp10" },
  { id: "as10", agent: "Media Review Agent",       clientId: "demo-d",   suggestion: "Media supply critical — request 5 new food photos this week.",                             confidence: 96                             },
  { id: "as11", agent: "Scheduling Agent",         clientId: "demo-d",   suggestion: "Pause scheduling until media supply recovers above 8 approved items.",                     confidence: 88                             },
  { id: "as12", agent: "Caption Agent",            clientId: "demo-c", suggestion: "Editorial caption draft passes brand-tone check on first review.",                         confidence: 92, relatedPipelineId: "cp7"  },
];

// ── DemoAgentDetail v2 — full agent library (9 agents) ────────────
export interface DemoAgentDetail {
  id:                    string;
  name:                  string;
  shortName:             string;
  category:              "Content" | "Operations" | "Intelligence" | "Executive";
  purpose:               string;
  inputs:                string[];
  outputs:               string[];
  sampleRecommendations: string[];
  recentActivity:        { time: string; event: string }[];
  sampleDecisions:       string[];
}

export const demoAiAgentsV2: DemoAgentDetail[] = [
  {
    id: "media-review", name: "Media Review Agent", shortName: "Media Review", category: "Content",
    purpose: "Reviews uploaded media for technical quality, brand fit, and capture-plan alignment before it enters the pipeline.",
    inputs:  ["Raw client uploads", "Brand guidelines", "Capture plan", "Restaurant profile"],
    outputs: ["Quality score", "Approve / reshoot / crop verdict", "Reason notes", "Auto-tags"],
    sampleRecommendations: [
      "Storefront shot underexposed — recommend reshoot at golden hour.",
      "Dessert tray detail strong — crop to 4:5 for Instagram.",
      "Family platter on-brand — surface for weekend promo slot.",
    ],
    recentActivity: [
      { time: "Today, 10:32 AM", event: "Reviewed 8 items for Demo Grill House" },
      { time: "Today, 8:15 AM",  event: "Flagged 2 items for reshoot — Demo Taco Bar" },
      { time: "Yesterday",        event: "Reviewed 5 items for Demo Mediterranean Grill — all approved" },
    ],
    sampleDecisions: [
      "Approved 6 of 8 items (75%).",
      "Flagged 2 items with 'needs reshoot' tag.",
      "Auto-tagged 4 items as 'hero' candidates.",
    ],
  },
  {
    id: "content-strategist", name: "Content Strategist Agent", shortName: "Content Strategist", category: "Content",
    purpose: "Plans the content calendar across clients, balancing post types, posting cadence, and growth objectives.",
    inputs:  ["Approved media inventory", "Client growth goals", "Historical performance", "Posting cadence targets"],
    outputs: ["Weekly content plan", "Post-mix recommendations", "Cadence adjustments"],
    sampleRecommendations: [
      "Increase reel-to-photo ratio for Demo Grill House — reels outperforming by 2.1x.",
      "Schedule olive-oil reel for Thursday 7 PM window — peak engagement.",
      "Front-load Friday content for Demo Taco Bar before weekend rush.",
    ],
    recentActivity: [
      { time: "Today, 9:00 AM",  event: "Drafted 5-post plan for Demo Grill House — week of May 26" },
      { time: "Today, 8:42 AM",  event: "Recommended cadence boost for Demo Mediterranean Grill" },
      { time: "Yesterday",        event: "Surfaced under-utilised BTS clips for Demo Taco Bar" },
    ],
    sampleDecisions: [
      "Planned 22 posts across the portfolio this week.",
      "Recommended 3 cadence adjustments.",
      "Identified 6 underused assets for reactivation.",
    ],
  },
  {
    id: "caption", name: "Caption Agent", shortName: "Caption", category: "Content",
    purpose: "Generates 3 caption variants per post in the client's brand voice, optimised for engagement and CTA.",
    inputs:  ["Post media", "Brand voice profile", "Restaurant context", "CTA goals"],
    outputs: ["3 caption variants", "Hashtag suggestions", "Emoji style hints"],
    sampleRecommendations: [
      "Use warmer, story-first tone for Demo Cafe — premium positioning.",
      "Lead with action verb for Demo Taco Bar — high-energy brand voice.",
      "Lead with occasion-based angle for Demo Grill House — drives weekend reservation intent.",
    ],
    recentActivity: [
      { time: "Today, 10:48 AM", event: "Drafted 3 captions for Demo Grill House dinner reel" },
      { time: "Today, 9:20 AM",  event: "Drafted 3 captions for Crescent olive-oil reel" },
      { time: "Yesterday",        event: "Drafted 3 captions for Demo Taco Bar lunch special" },
    ],
    sampleDecisions: [
      "Generated 18 caption variants this week.",
      "Brand voice match score: 94% average.",
      "Recommended hashtag pools updated for 3 clients.",
    ],
  },
  {
    id: "brand-voice", name: "Brand Voice Agent", shortName: "Brand Voice", category: "Content",
    purpose: "Validates that every caption, post, and reply matches the documented brand voice for the client.",
    inputs:  ["Draft captions", "Brand voice profile", "Tone examples", "Restricted phrases"],
    outputs: ["Voice match score", "Tone-deviation flags", "Suggested rewrites"],
    sampleRecommendations: [
      "Caption B too generic — rewrite with sensory language.",
      "Avoid corporate phrasing for Demo Cafe — family-owned brand voice.",
      "Consider community-language tone variant for Demo Grill House to improve local reach.",
    ],
    recentActivity: [
      { time: "Today, 10:50 AM", event: "Approved 2 of 3 Demo Grill House captions — voice match 96%" },
      { time: "Today, 9:25 AM",  event: "Flagged Caption C for Crescent — too promotional" },
      { time: "Yesterday",        event: "Updated brand voice profile for Demo Taco Bar" },
    ],
    sampleDecisions: [
      "Approved 14 captions; flagged 4 for rewrite.",
      "Maintained 90%+ brand voice match across portfolio.",
      "Suggested 6 voice-profile refinements.",
    ],
  },
  {
    id: "scheduling", name: "Scheduling Agent", shortName: "Scheduling", category: "Operations",
    purpose: "Selects the optimal posting window and platform for each approved post based on audience and engagement data.",
    inputs:  ["Approved post", "Platform analytics", "Audience timezone", "Posting cadence rules"],
    outputs: ["Recommended slot", "Platform priority", "Conflict warnings"],
    sampleRecommendations: [
      "Thursday 7 PM is peak window for Demo Grill House — schedule dinner reel.",
      "Avoid Friday morning for Demo Taco Bar — competing local event.",
      "Push Crescent olive-oil reel to Sunday brunch window — higher engagement.",
    ],
    recentActivity: [
      { time: "Today, 11:00 AM", event: "Scheduled 4 posts for Demo Grill House this week" },
      { time: "Today, 9:30 AM",  event: "Reshuffled Crescent calendar — peak-window optimisation" },
      { time: "Yesterday",        event: "Flagged scheduling conflict for Demo Taco Bar Sunday slot" },
    ],
    sampleDecisions: [
      "Locked 18 posting windows this cycle.",
      "Avoided 3 conflicts based on local events.",
      "Recommended 2 cadence rebalances.",
    ],
  },
  {
    id: "reporting", name: "Reporting Agent", shortName: "Reporting", category: "Operations",
    purpose: "Assembles weekly and monthly reports, validates metrics, and prepares them for operator sign-off.",
    inputs:  ["Posting log", "Engagement metrics", "Client goals", "Prior period baseline"],
    outputs: ["Weekly report draft", "Monthly report draft", "Highlight + concern callouts"],
    sampleRecommendations: [
      "Highlight Demo Grill House 2.1x reel engagement week-over-week.",
      "Flag Demo Taco Bar posting consistency drop in monthly report.",
      "Surface Crescent menu launch as a 'win of the month' story.",
    ],
    recentActivity: [
      { time: "Today, 7:15 AM",  event: "Drafted weekly report for Demo Grill House" },
      { time: "Yesterday",        event: "Drafted weekly report for Demo Taco Bar — pending validation" },
      { time: "2 days ago",       event: "Published monthly report for Demo Mediterranean Grill" },
    ],
    sampleDecisions: [
      "Drafted 8 reports this week.",
      "Auto-validated 6; routed 2 to operator review.",
      "Surfaced 12 highlight moments across the portfolio.",
    ],
  },
  {
    id: "risk", name: "Risk Monitoring Agent", shortName: "Risk Monitoring", category: "Intelligence",
    purpose: "Watches every client signal — media supply, onboarding, posting cadence, client activity — and flags risks early.",
    inputs:  ["All client metrics", "Inventory levels", "Activity logs", "Health thresholds"],
    outputs: ["Risk score per client", "Severity-ranked alerts", "Forecast warnings"],
    sampleRecommendations: [
      "Demo Cafe will run out of media in 5 days at current pace.",
      "Demo Taco Bar posting consistency below 70% target — intervene.",
      "Demo Grill House onboarding 100% — ready for service expansion conversation.",
    ],
    recentActivity: [
      { time: "Today, 8:42 AM",  event: "Raised CRITICAL alert — Demo Cafe media inventory" },
      { time: "Today, 7:30 AM",  event: "Raised CRITICAL alert — Demo Cafe onboarding stalled" },
      { time: "Yesterday",        event: "Raised HIGH alert — Demo Taco Bar report overdue" },
    ],
    sampleDecisions: [
      "Raised 8 risk alerts this week (2 critical, 3 high, 3 medium).",
      "Forecast 1 likely churn event within 30 days if no action.",
      "Recommended 4 portfolio-level interventions.",
    ],
  },
  {
    id: "operator-assistant", name: "Operator Assistant", shortName: "Operator Asst.", category: "Executive",
    purpose: "Synthesises all agent outputs into a daily operator briefing with prioritised actions.",
    inputs:  ["All agent outputs", "Risk alerts", "Team workload", "Daily SLAs"],
    outputs: ["Prioritised action list", "Daily digest", "Bottleneck warnings"],
    sampleRecommendations: [
      "Validate Demo Taco Bar report first — 28 hours overdue.",
      "Approve Demo Grill House dinner reel by noon — Thursday slot.",
      "Contact Demo Cafe today — media emergency.",
    ],
    recentActivity: [
      { time: "Today, 6:00 AM",     event: "Generated operator daily digest" },
      { time: "Today, 5:55 AM",     event: "Compiled 7 recommended actions for today" },
      { time: "Yesterday, 6:00 AM", event: "Generated operator daily digest" },
    ],
    sampleDecisions: [
      "Surfaced 4 immediate actions and 3 same-week actions today.",
      "Identified 2 team-workload bottlenecks.",
      "Flagged 1 SLA breach risk.",
    ],
  },
  {
    id: "owner-assistant", name: "Owner Assistant", shortName: "Owner Asst.", category: "Executive",
    purpose: "Generates the owner's daily executive briefing — business health, revenue trends, top risks, top opportunities.",
    inputs:  ["Operator digest", "Revenue & client metrics", "Risk forecast", "Growth opportunities"],
    outputs: ["Owner daily briefing", "Strategic recommendations", "Weekly business pulse"],
    sampleRecommendations: [
      "Revenue up 12% MoM — celebrate with team.",
      "Demo Cafe rescue call this week — $1,097 MRR at risk.",
      "3 qualified leads close to signing — prepare proposals.",
    ],
    recentActivity: [
      { time: "Today, 5:30 AM",     event: "Generated owner daily briefing" },
      { time: "Yesterday, 5:30 AM", event: "Generated owner daily briefing" },
      { time: "Monday, 5:30 AM",    event: "Generated weekly business pulse" },
    ],
    sampleDecisions: [
      "Identified 2 strategic risks and 3 growth opportunities.",
      "Flagged $1,097 MRR-at-risk client for immediate attention.",
      "Surfaced potential $3,291 expansion in next 30 days.",
    ],
  },
];

// ── Agent workflow steps ──────────────────────────────────────────
export interface DemoWorkflowStep {
  step:        number;
  label:       string;
  description: string;
  type:        "client" | "agent" | "stage" | "team";
}

export const demoAgentWorkflow: DemoWorkflowStep[] = [
  { step: 1,  type: "client", label: "Client uploads media",     description: "Photos and videos arrive via client portal."                             },
  { step: 2,  type: "agent",  label: "Media Review Agent",       description: "Scores quality, matches capture plan, approves or flags reshoots."       },
  { step: 3,  type: "agent",  label: "Content Strategist Agent", description: "Plans post-mix and cadence across the week."                             },
  { step: 4,  type: "agent",  label: "Caption Agent",            description: "Drafts 3 caption variants in the client's brand voice."                  },
  { step: 5,  type: "agent",  label: "Brand Voice Agent",        description: "Validates tone, flags deviations, suggests rewrites."                    },
  { step: 6,  type: "team",   label: "Team / Operator Approval", description: "Human-in-the-loop sign-off before content is scheduled."                 },
  { step: 7,  type: "agent",  label: "Scheduling Agent",         description: "Selects optimal posting window for each platform."                       },
  { step: 8,  type: "stage",  label: "Publishing Stage",         description: "Posts are queued and (in production) published to social channels."      },
  { step: 9,  type: "agent",  label: "Reporting Agent",          description: "Assembles weekly and monthly reports with highlights and callouts."      },
  { step: 10, type: "agent",  label: "Risk Monitoring Agent",    description: "Watches every signal and raises early-warning alerts."                   },
  { step: 11, type: "agent",  label: "Operator Assistant",       description: "Synthesises agent outputs into the operator daily digest."               },
  { step: 12, type: "agent",  label: "Owner Assistant",          description: "Generates the owner executive briefing every morning."                   },
];
