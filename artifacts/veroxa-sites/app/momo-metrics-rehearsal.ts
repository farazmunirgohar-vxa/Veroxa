import { momoSha256 } from "./momo-media-workflow.ts";

export type MomoMetricsSource = "facebook" | "instagram" | "google_business" | "website";

export type MomoMetricsRehearsalInput = {
  restaurantId: string;
  source: MomoMetricsSource;
  periodStart: string;
  periodEnd: string;
  metrics: Record<string, number>;
};

export type MomoMetricsSummary = {
  bySource: Partial<Record<MomoMetricsSource, Record<string, number>>>;
  rates: Partial<Record<MomoMetricsSource, { engagementRate: number | null; clickThroughRate: number | null }>>;
  combinedReach: null;
  causalClaim: null;
  roi: null;
};

const ALLOWED: Record<MomoMetricsSource, readonly string[]> = {
  facebook: ["impressions", "reach", "engagements", "clicks"],
  instagram: ["impressions", "reach", "engagements", "clicks"],
  google_business: ["views", "calls", "directions", "website_clicks"],
  website: ["sessions", "engaged_sessions", "conversions"],
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const isCalendarDate = (value: string): boolean => {
  if (!ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

export function validateMomoMetricsRehearsal(input: MomoMetricsRehearsalInput): string[] {
  const problems: string[] = [];
  if (!input.restaurantId) problems.push("restaurant_scope_required");
  if (!ALLOWED[input.source]) problems.push("supported_source_required");
  const start = Date.parse(`${input.periodStart}T00:00:00.000Z`);
  const end = Date.parse(`${input.periodEnd}T00:00:00.000Z`);
  if (!isCalendarDate(input.periodStart) || !isCalendarDate(input.periodEnd)
    || start > end || end - start > 31 * 24 * 60 * 60 * 1000
    || end > Date.now() + 24 * 60 * 60 * 1000) problems.push("valid_period_required");
  const keys = Object.keys(input.metrics);
  if (keys.length === 0 || keys.length > 12) problems.push("bounded_metrics_required");
  if (keys.some((key) => !ALLOWED[input.source]?.includes(key))) problems.push("allowlisted_metrics_required");
  if (Object.values(input.metrics).some((value) => !Number.isFinite(value) || value < 0 || !Number.isInteger(value))) problems.push("nonnegative_integer_metrics_required");
  if (Object.values(input.metrics).some((value) => value > 1_000_000_000)) problems.push("bounded_metric_value_required");
  if (keys.some((key) => /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|\d{7,}/i.test(key))) problems.push("metrics_pii_forbidden");
  return [...new Set(problems)];
}

export async function normalizeMomoMetricsRehearsal(input: MomoMetricsRehearsalInput) {
  const problems = validateMomoMetricsRehearsal(input);
  if (problems.length) throw new Error(problems.join(","));
  const metrics = Object.fromEntries(Object.entries(input.metrics).sort(([left], [right]) => left.localeCompare(right)));
  const snapshot = { schemaVersion: "momo-metrics-rehearsal-v1", ...input, metrics };
  return {
    ...snapshot,
    snapshotSha256: await momoSha256(JSON.stringify(snapshot)),
    evidenceClass: "synthetic" as const,
    executionMode: "rehearsal" as const,
    externalWriteAllowed: false as const,
  };
}

export function summarizeMomoMetrics(inputs: MomoMetricsRehearsalInput[]): MomoMetricsSummary {
  const bySource: MomoMetricsSummary["bySource"] = {};
  const rates: MomoMetricsSummary["rates"] = {};
  const seen = new Set<MomoMetricsSource>();
  for (const input of inputs) {
    const problems = validateMomoMetricsRehearsal(input);
    if (problems.length) throw new Error(problems.join(","));
    if (seen.has(input.source)) throw new Error("duplicate_metric_source_forbidden");
    seen.add(input.source);
    bySource[input.source] = { ...input.metrics };
    const impressions = input.metrics.impressions;
    rates[input.source] = {
      engagementRate: impressions && impressions > 0 && input.metrics.engagements !== undefined
        ? input.metrics.engagements / impressions : null,
      clickThroughRate: impressions && impressions > 0 && input.metrics.clicks !== undefined
        ? input.metrics.clicks / impressions : null,
    };
  }
  return { bySource, rates, combinedReach: null, causalClaim: null, roi: null };
}
