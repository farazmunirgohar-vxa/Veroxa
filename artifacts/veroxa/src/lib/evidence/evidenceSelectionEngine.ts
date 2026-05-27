/**
 * evidenceSelectionEngine.ts
 *
 * Evidence-Based Selection Engine V1 — demo-only deterministic rule engine.
 *
 * HARD INVARIANTS:
 * - Does NOT call any AI API (no OpenAI / Anthropic / Gemini).
 * - Does NOT call any external API.
 * - Does NOT read from or write to any database.
 * - Computes purely from demo fixture data in demoEvidenceMemory.ts.
 * - demoOnly: true is enforced on every recommendation output.
 *
 * Purpose:
 * Demonstrate that Veroxa can make smarter content and operations
 * recommendations based on past performance, media quality, posting
 * schedule, client health, and reporting state — without real AI.
 */

import {
  demoEvidencePastPosts,
  demoEvidenceMediaSignals,
  demoEvidenceClientContexts,
  type EvidenceClientContext,
  type EvidenceMediaSignal,
  type EvidencePastPost,
} from "@/data/demo/demoEvidenceMemory";

// ─── Output Types ─────────────────────────────────────────────────────────────

export type EvidenceDecisionType =
  | "choose_next_media"
  | "best_posting_time"
  | "content_angle"
  | "platform_choice"
  | "client_action_needed"
  | "operator_attention"
  | "team_review_priority";

export type EvidenceReasonType = "performance" | "media" | "schedule" | "health" | "risk";

export interface EvidenceReason {
  text: string;
  type: EvidenceReasonType;
}

export interface EvidenceRecommendation {
  recommendationTitle: string;
  confidenceScore: number;
  decisionType: EvidenceDecisionType;
  selectedItem: string;
  recommendedAction: string;
  evidenceReasons: EvidenceReason[];
  riskNotes: string[];
  nextStep: string;
  demoOnly: true;
}

export interface EvidenceProfile {
  context: EvidenceClientContext;
  bestMedia: EvidenceMediaSignal | null;
  topPosts: EvidencePastPost[];
  recommendation: EvidenceRecommendation;
}

export interface EvidenceTimelineEvent {
  date: string;
  event: string;
  type: "post" | "media" | "report" | "risk" | "milestone";
  metric?: string;
}

export type EvidenceUrgency = "Critical" | "High" | "Medium" | "Low";

export interface EvidenceAction {
  action: string;
  reason: string;
  urgency: EvidenceUrgency;
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function getContext(clientId: string): EvidenceClientContext {
  return demoEvidenceClientContexts.find((c) => c.clientId === clientId)
    ?? demoEvidenceClientContexts[0];
}

function getPastPosts(clientId: string): EvidencePastPost[] {
  return demoEvidencePastPosts.filter((p) => p.clientId === clientId);
}

function getMediaSignals(clientId: string): EvidenceMediaSignal[] {
  return demoEvidenceMediaSignals.filter((m) => m.clientId === clientId);
}

function computeMediaScore(signal: EvidenceMediaSignal): number {
  let score = signal.qualityScore * 0.5;
  if (signal.uploadedToday) score += 20;
  if (signal.lighting === "Excellent")       score += 20;
  else if (signal.lighting === "Good")       score += 12;
  else if (signal.lighting === "Fair")       score += 4;
  if (signal.foodClarity === "Sharp")        score += 15;
  else if (signal.foodClarity === "Acceptable") score += 6;
  if (signal.riskFlag)                       score -= 25;
  return Math.min(100, Math.round(score));
}

// ─── Exported Engine Functions ────────────────────────────────────────────────

/**
 * Returns the full evidence profile for a client: context, best media,
 * top-performing posts, and the primary recommendation.
 */
export function getEvidenceProfile(clientId: string): EvidenceProfile {
  const context = getContext(clientId);
  const signals = getMediaSignals(clientId);
  const pastPosts = getPastPosts(clientId);

  const goodSignals = signals.filter((m) => !m.riskFlag);
  const candidatePool = goodSignals.length > 0 ? goodSignals : signals;
  const bestMedia = candidatePool.sort((a, b) => computeMediaScore(b) - computeMediaScore(a))[0] ?? null;

  const topPosts = [...pastPosts]
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, 3);

  const recommendation = recommendNextPost(clientId);

  return { context, bestMedia, topPosts, recommendation };
}

/**
 * Scores all media signals for a client and returns them ranked by
 * composite quality score (quality + freshness + lighting + clarity − risk).
 */
export function scoreMediaForNextPost(
  clientId: string,
): Array<{ signal: EvidenceMediaSignal; score: number }> {
  return getMediaSignals(clientId)
    .map((m) => ({ signal: m, score: computeMediaScore(m) }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Primary recommendation: choose the best media item for the next post,
 * explain why, and return a confidence score.
 */
export function recommendNextPost(clientId: string): EvidenceRecommendation {
  const context = getContext(clientId);
  const pastPosts = getPastPosts(clientId);
  const mediaScores = scoreMediaForNextPost(clientId);
  const bestMedia = mediaScores[0]?.signal ?? null;

  const sortedPosts = [...pastPosts].sort((a, b) => b.engagementRate - a.engagementRate);
  const topPost = sortedPosts[0] ?? null;

  const reasons: EvidenceReason[] = [];
  const riskNotes: string[] = [];

  // Performance evidence
  if (topPost) {
    reasons.push({
      text: `"${topPost.contentAngle}" posts had ${topPost.engagementRate}% engagement — your strongest performing angle.`,
      type: "performance",
    });
    const lesson = pastPosts.find((p) => p.resultLabel === "Top performer")?.lessonLearned;
    if (lesson) {
      reasons.push({ text: lesson, type: "performance" });
    }
  }

  // Media evidence
  if (bestMedia) {
    reasons.push({
      text: `"${bestMedia.mediaTitle}" scores ${bestMedia.qualityScore}/100 quality — ${bestMedia.lighting.toLowerCase()} lighting, ${bestMedia.foodClarity.toLowerCase()} food clarity.`,
      type: "media",
    });
    if (bestMedia.uploadedToday) {
      reasons.push({
        text: "This item was uploaded today — freshness adds 20 points to selection priority.",
        type: "media",
      });
    }
  }

  // Schedule evidence
  const bestWindow = context.preferredPostingWindows[0];
  if (bestWindow) {
    reasons.push({
      text: `${bestWindow} matches your best-performing posting window based on historical data.`,
      type: "schedule",
    });
  }
  if (context.scheduledPostsCount < 3) {
    reasons.push({
      text: `Only ${context.scheduledPostsCount} posts currently scheduled — room to add high-impact content this week.`,
      type: "schedule",
    });
  }

  // Runway / health evidence
  if (context.contentRunwayDays <= 7) {
    reasons.push({
      text: `Content runway is ${context.contentRunwayDays} days — publishing usable media now prevents a supply gap.`,
      type: "health",
    });
  }

  // Risk notes
  for (const m of getMediaSignals(clientId).filter((m) => m.riskFlag).slice(0, 2)) {
    riskNotes.push(`"${m.mediaTitle}": ${m.riskFlag}`);
  }
  if (context.recentRisk === "Critical") {
    riskNotes.push("Client is in critical risk state — prioritise media request and report delivery.");
  } else if (context.recentRisk === "High") {
    riskNotes.push("Client risk is elevated — monitor runway and report overdue status closely.");
  }

  // Confidence: base 60, signals add up to 37
  let confidence = 60;
  if (bestMedia && bestMedia.qualityScore >= 80) confidence += 12;
  if (topPost?.resultLabel === "Top performer")  confidence += 10;
  if (bestMedia?.uploadedToday)                  confidence += 8;
  if (context.contentRunwayDays >= 6)            confidence += 5;
  if (context.scheduledPostsCount < 3)           confidence += 5;
  if (context.recentRisk === "None" || context.recentRisk === "Low") confidence += 2;
  confidence = Math.min(97, confidence);

  const platform   = context.platformStrengths[0] ?? "Instagram";
  const mediaLabel = bestMedia ? bestMedia.mediaTitle : "best available media";
  const windowLabel = bestWindow ?? "optimal window";

  return {
    recommendationTitle: `Use "${mediaLabel}" for ${windowLabel} on ${platform}`,
    confidenceScore: confidence,
    decisionType: "choose_next_media",
    selectedItem: bestMedia
      ? `${bestMedia.mediaTitle} (${bestMedia.mediaType})`
      : "No media available",
    recommendedAction: `Post "${mediaLabel}" on ${platform} at ${windowLabel}`,
    evidenceReasons: reasons.slice(0, 5),
    riskNotes,
    nextStep:
      context.recentRisk === "Critical" || context.recentRisk === "High"
        ? "Operator action required before scheduling."
        : "Send to Team for caption drafting.",
    demoOnly: true,
  };
}

/**
 * Returns the best posting time window and the reason it was selected.
 */
export function recommendPostingTime(clientId: string): {
  window: string;
  reason: string;
} {
  const context = getContext(clientId);
  const topPost = [...getPastPosts(clientId)]
    .sort((a, b) => b.engagementRate - a.engagementRate)[0];
  return {
    window: context.preferredPostingWindows[0] ?? "Weekday 12:00 PM",
    reason: topPost
      ? `Based on top-performing post "${topPost.postTitle}" — same window, same audience pattern.`
      : "Derived from historical posting cadence for this account.",
  };
}

/**
 * Returns the client-facing action recommendation.
 */
export function recommendClientAction(clientId: string): EvidenceAction {
  const ctx = getContext(clientId);
  if (ctx.contentRunwayDays <= 3) {
    return {
      action: "Upload 5 or more food photos to prevent a posting gap next week.",
      reason: `Only ${ctx.contentRunwayDays} days of content runway remaining.`,
      urgency: "Critical",
    };
  }
  if (ctx.lastReportStatus === "Draft" || ctx.lastReportStatus === "Overdue") {
    return {
      action: "Review and sign off on your latest performance report.",
      reason: `Your report is currently "${ctx.lastReportStatus}" — your team is waiting.`,
      urgency: "High",
    };
  }
  if (ctx.unusedMediaCount <= 2) {
    return {
      action: "Schedule a quick photo session to replenish content supply.",
      reason: `Only ${ctx.unusedMediaCount} usable media items remain in your library.`,
      urgency: "Medium",
    };
  }
  return {
    action: "Review your upcoming content schedule and confirm any posting preferences.",
    reason: "Account is in good health — a quick check keeps momentum going.",
    urgency: "Low",
  };
}

/**
 * Returns the operator-facing action recommendation.
 */
export function recommendOperatorAction(clientId: string): EvidenceAction {
  const ctx = getContext(clientId);
  if (ctx.recentRisk === "Critical") {
    return {
      action: `Contact ${ctx.clientName} immediately — request emergency media upload and schedule a rescue call.`,
      reason: `Content runway is ${ctx.contentRunwayDays} days. Missing next week's posting schedule is likely without intervention.`,
      urgency: "Critical",
    };
  }
  if (ctx.lastReportStatus === "Overdue") {
    return {
      action: `Validate and publish the ${ctx.clientName} weekly report — it is overdue.`,
      reason: "Report has been in the queue for more than 24 hours without operator review.",
      urgency: "High",
    };
  }
  if (ctx.lastReportStatus === "Pending validation") {
    return {
      action: `Review the draft report for ${ctx.clientName} and approve for delivery.`,
      reason: "Report is ready — pending final operator sign-off.",
      urgency: "Medium",
    };
  }
  if (ctx.contentRunwayDays <= 6) {
    return {
      action: `Ask Team to request new media from ${ctx.clientName} this week.`,
      reason: `Runway is ${ctx.contentRunwayDays} days — order new content before supply dips below 7 days.`,
      urgency: "Medium",
    };
  }
  return {
    action: `${ctx.clientName} account is healthy — no immediate action required.`,
    reason: "All metrics within normal range.",
    urgency: "Low",
  };
}

/**
 * Returns the evidence reasons list for a client (same as in the recommendation).
 */
export function getEvidenceReasons(clientId: string): EvidenceReason[] {
  return recommendNextPost(clientId).evidenceReasons;
}

/**
 * Returns a timeline of evidence events that shaped the current recommendation.
 */
export function getEvidenceTimeline(clientId: string): EvidenceTimelineEvent[] {
  const pastPosts = getPastPosts(clientId).slice(0, 4);
  const signals = getMediaSignals(clientId);
  const context = getContext(clientId);

  const events: EvidenceTimelineEvent[] = [];

  for (const p of pastPosts) {
    events.push({
      date: p.postedAtLabel,
      event: `Posted: "${p.postTitle}" — ${p.resultLabel}`,
      type: "post",
      metric: `${p.engagementRate}% engagement · ${p.reach.toLocaleString()} reach`,
    });
  }

  for (const s of signals.filter((s) => s.uploadedToday)) {
    events.push({
      date: "Today",
      event: `Media uploaded: "${s.mediaTitle}" — quality ${s.qualityScore}/100`,
      type: "media",
      metric: s.suggestedUse ?? undefined,
    });
  }

  const runwayLabel =
    context.contentRunwayDays <= 4
      ? "LOW — action needed"
      : context.contentRunwayDays <= 7
      ? "Moderate"
      : "Healthy";
  events.push({
    date: "Today",
    event: `Content runway: ${context.contentRunwayDays} days — ${runwayLabel}`,
    type: context.contentRunwayDays <= 4 ? "risk" : "milestone",
  });

  if (context.lastReportStatus !== "Delivered") {
    events.push({
      date: "This week",
      event: `Report status: ${context.lastReportStatus}`,
      type: "report",
    });
  }

  return events;
}
