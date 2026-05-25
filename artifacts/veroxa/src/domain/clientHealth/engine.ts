/**
 * Client Health Command Center Engine
 *
 * Computes a 4-category health profile for each client from demo data.
 * No real AI, no real backend — demo values only.
 *
 * Health formula (based on content runway):
 *   Healthy  — 14+ days of content (2+ weeks)
 *   Caution  — 7–13 days (1–2 weeks)
 *   Urgent   — 1–6 days  (<1 week)
 *   Broken   — 0 usable media items
 */

import {
  demoRestaurants,
  demoRestaurantProfiles,
  demoMediaRunway,
  demoMediaItems,
  demoContentPipelineItems,
  demoTeamAlerts,
  demoClientHealth,
  demoOwnerCommandItems,
} from "@/data/demoData";

// ── Types ──────────────────────────────────────────────────────────────────

export type CHCHealthCategory = "Healthy" | "Caution" | "Urgent" | "Broken";

export interface CHCClientProfile {
  clientId:              string;
  name:                  string;
  cuisine:               string;
  planType:              string;
  accountStatus:         string;
  weeklyPostingCommit:   number;   // posts/week
  unusedMediaCount:      number;
  weeksOfContentLeft:    number;   // 1 decimal place
  daysOfContentLeft:     number;
  lastUploadDate:        string;
  lastPublishedPost:     string;
  openAlertsCount:       number;
  monthlyReportStatus:   string;
  healthCategory:        CHCHealthCategory;
  healthScore:           number;   // reuse existing score for the meter
  mainIssue:             string;
  recommendedAction:     string;
}

export interface CHCPortfolioSummary {
  totalClients:        number;
  healthy:             number;
  caution:             number;
  urgent:              number;
  broken:              number;
  atRisk:              number;     // urgent + broken
  retentionRiskClients: string[];  // names of at-risk clients
  revenueAtRisk:       number;     // demo estimate: at-risk clients × avg plan price
  growthOpportunities: number;     // healthy clients
}

// ── Health formula ─────────────────────────────────────────────────────────

function categoryFromRunway(totalUnused: number, daysRemaining: number): CHCHealthCategory {
  if (totalUnused === 0)      return "Broken";
  if (daysRemaining < 7)      return "Urgent";
  if (daysRemaining < 14)     return "Caution";
  return "Healthy";
}

// ── Demo price lookup (locked pricing) ────────────────────────────────────

const demoPlanPrice: Record<string, number> = {
  "Lite":       997,
  "Growth":    1097,
  "Premium":   1197,
  "Enterprise": 1497,
};

// ── Engine ─────────────────────────────────────────────────────────────────

export const ClientHealthEngine = {
  /** Build full CHC profile for every client, sorted by risk (Broken → Urgent → Caution → Healthy). */
  profiles(): CHCClientProfile[] {
    const profiles = demoRestaurants.map((r) => {
      const runway   = demoMediaRunway.find((m) => m.clientId === r.id);
      const profile  = demoRestaurantProfiles.find((p) => p.clientId === r.id);
      const existing = demoClientHealth.find((h) => h.clientId === r.id);

      const totalUnused   = runway ? runway.unusedPhotos + runway.unusedVideos : 0;
      const daysRemaining = runway ? runway.daysRemaining : 0;
      const weeksLeft     = Math.round((daysRemaining / 7) * 10) / 10;
      const category      = categoryFromRunway(totalUnused, daysRemaining);

      // Last upload — latest dateAdded from demoMediaItems for this client
      const clientMedia = demoMediaItems.filter((m) => m.clientId === r.id);
      const lastUpload  = clientMedia.length > 0 ? clientMedia[clientMedia.length - 1].dateAdded : "No uploads";

      // Last published post — most recent item in "Scheduled / Posted" or status "Posted"
      const posted = demoContentPipelineItems.filter(
        (p) => p.clientId === r.id && (p.status === "Posted" || p.stage === "Scheduled / Posted"),
      );
      const lastPublished = posted.length > 0 ? (posted[posted.length - 1].title ?? "—") : "None yet";

      // Open alerts
      const openAlerts = demoTeamAlerts.filter((a) => a.clientId === r.id).length;

      // Monthly report status
      const reportStatus = existing?.signals.reportStatus ?? "Unknown";

      return {
        clientId:            r.id,
        name:                r.name,
        cuisine:             r.cuisine,
        planType:            profile?.servicePlan ?? "—",
        accountStatus:       profile?.accountStatus ?? "Active",
        weeklyPostingCommit: runway?.postsPerWeek ?? 0,
        unusedMediaCount:    totalUnused,
        weeksOfContentLeft:  weeksLeft,
        daysOfContentLeft:   daysRemaining,
        lastUploadDate:      lastUpload,
        lastPublishedPost:   lastPublished,
        openAlertsCount:     openAlerts,
        monthlyReportStatus: reportStatus,
        healthCategory:      category,
        healthScore:         existing?.score ?? 0,
        mainIssue:           existing?.mainIssue ?? "—",
        recommendedAction:   existing?.recommendedAction ?? "Monitor",
      } satisfies CHCClientProfile;
    });

    // Sort: Broken → Urgent → Caution → Healthy
    const order: Record<CHCHealthCategory, number> = { Broken: 0, Urgent: 1, Caution: 2, Healthy: 3 };
    return [...profiles].sort((a, b) => order[a.healthCategory] - order[b.healthCategory]);
  },

  /** Portfolio-level owner summary. */
  portfolioSummary(): CHCPortfolioSummary {
    const ps = ClientHealthEngine.profiles();
    const healthy = ps.filter((p) => p.healthCategory === "Healthy").length;
    const caution = ps.filter((p) => p.healthCategory === "Caution").length;
    const urgent  = ps.filter((p) => p.healthCategory === "Urgent").length;
    const broken  = ps.filter((p) => p.healthCategory === "Broken").length;
    const atRisk  = ps.filter((p) => p.healthCategory === "Urgent" || p.healthCategory === "Broken");

    const revenueAtRisk = atRisk.reduce((sum, p) => {
      return sum + (demoPlanPrice[p.planType] ?? 0);
    }, 0);

    return {
      totalClients:         ps.length,
      healthy,
      caution,
      urgent,
      broken,
      atRisk:               atRisk.length,
      retentionRiskClients: atRisk.map((p) => p.name),
      revenueAtRisk,
      growthOpportunities:  healthy,
    };
  },

  /** Clients needing media upload (team view). */
  needingMedia(): CHCClientProfile[] {
    return ClientHealthEngine.profiles().filter(
      (p) => p.healthCategory === "Urgent" || p.healthCategory === "Broken",
    );
  },

  /** Clients with content still in draft stage (team view). */
  awaitingDrafts(): CHCClientProfile[] {
    const clientsWithDrafts = new Set(
      demoContentPipelineItems
        .filter((i) => i.stage === "Caption Drafting" || i.status === "Drafting")
        .map((i) => i.clientId),
    );
    return ClientHealthEngine.profiles().filter((p) => clientsWithDrafts.has(p.clientId));
  },

  /** Clients with content awaiting scheduling (team view). */
  awaitingScheduling(): CHCClientProfile[] {
    const clientsWaiting = new Set(
      demoContentPipelineItems
        .filter((i) => i.stage === "Team Review" || i.status === "Awaiting Approval" || i.status === "Approved")
        .map((i) => i.clientId),
    );
    return ClientHealthEngine.profiles().filter((p) => clientsWaiting.has(p.clientId));
  },

  /** Clients with report pending (team view). */
  awaitingReports(): CHCClientProfile[] {
    return ClientHealthEngine.profiles().filter(
      (p) => p.monthlyReportStatus === "Pending" || p.monthlyReportStatus === "Draft" || p.monthlyReportStatus === "Overdue",
    );
  },

  /** Business-level risks for owner view. */
  ownerRisks() {
    return demoOwnerCommandItems.filter((i) => i.severity === "Critical" || i.severity === "High");
  },
};
