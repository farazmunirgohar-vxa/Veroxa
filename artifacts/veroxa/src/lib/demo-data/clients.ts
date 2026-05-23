import type { Client } from "../database/models";
import { ClientStatus, PlanType, ServicePackage, ContentHealthStatus, RiskStatus } from "../database/enums";

// ── Primary demo client ───────────────────────────────────────────────────────

export const mamadaliClient: Client = {
  id: "client-mamadali-001",
  businessName: "Mamadali Kebab House",
  legalName: null,
  primaryContactName: "Demo Owner",
  primaryContactPhone: "+1-555-0100",
  primaryContactEmail: "demo@mamadali.example.com",
  planType: PlanType.six_month,
  servicePackage: ServicePackage.presence,
  postingFrequencyWeekly: 4,
  preferredPostDays: null,
  preferredPostTimes: null,
  timezone: "America/Chicago",
  reusePermission: true,
  contentHealthStatus: ContentHealthStatus.caution,
  riskStatus: RiskStatus.risk,
  accountStatus: ClientStatus.active,
  onboardingComplete: true,
  createdAt: "2026-01-15T09:00:00Z",
  updatedAt: "2026-05-23T08:00:00Z",
};

// ── Client Portal — Google metrics display ────────────────────────────────────

export const googleMetrics = [
  { label: "Search Impressions", value: "14,820", change: "+18%", positive: true },
  { label: "Profile Views",      value: "3,240",  change: "+27%", positive: true },
  { label: "Direction Requests", value: "412",    change: "+9%",  positive: true },
  { label: "Review Score",       value: "4.7 / 5", change: "+0.2", positive: true },
] as const;

// ── Client Portal — Content supply bars ──────────────────────────────────────

export const contentSupply = [
  { label: "Photos uploaded this month",  value: 24, max: 30 },
  { label: "Posts scheduled this month",  value: 16, max: 20 },
  { label: "Stories published this week", value: 5,  max: 7  },
] as const;

// ── Operator Portal — Client health table ────────────────────────────────────

export const clientHealthDisplay = [
  { name: "Mamadali Kebab House", score: 58, postsThisMonth: 6,  scheduled: 0,  lastShoot: "12 days ago", status: "At Risk"  },
  { name: "Bayleaf Indian Kitchen", score: 71, postsThisMonth: 14, scheduled: 4,  lastShoot: "8 days ago",  status: "Warning"  },
  { name: "Rosso Trattoria",      score: 44, postsThisMonth: 3,  scheduled: 2,  lastShoot: "18 days ago", status: "At Risk"  },
  { name: "Sushi Nori Shoreditch", score: 89, postsThisMonth: 19, scheduled: 8,  lastShoot: "3 days ago",  status: "Healthy"  },
  { name: "The Grill House",      score: 35, postsThisMonth: 2,  scheduled: 0,  lastShoot: "24 days ago", status: "Critical" },
  { name: "Cafe Levant",          score: 94, postsThisMonth: 22, scheduled: 10, lastShoot: "1 day ago",   status: "Healthy"  },
] as const;

// ── Operator Portal — Active alerts ──────────────────────────────────────────

export const operatorAlerts = [
  { severity: "Critical", client: "Mamadali Kebab House",  message: "0 posts scheduled for next week — content pipeline empty.",       time: "2 hours ago" },
  { severity: "Warning",  client: "Bayleaf Indian Kitchen", message: "Instagram post failed to publish — account token expired.",         time: "4 hours ago" },
  { severity: "Warning",  client: "Rosso Trattoria",        message: "No media uploaded in 18 days — shoot overdue.",                     time: "Yesterday"   },
  { severity: "Info",     client: "Sushi Nori Shoreditch",  message: "Monthly report ready — awaiting operator approval.",               time: "Yesterday"   },
  { severity: "Critical", client: "The Grill House",        message: "Google Business Profile disconnected — visibility data paused.",    time: "2 days ago"  },
] as const;

// ── Owner Portal — Client health distribution bands ───────────────────────────

export const clientHealthBands = [
  { band: "Healthy (80–100)", count: 18, pct: 53 },
  { band: "Warning (60–79)",  count: 10, pct: 29 },
  { band: "At Risk (40–59)",  count: 4,  pct: 12 },
  { band: "Critical (0–39)",  count: 2,  pct: 6  },
] as const;
