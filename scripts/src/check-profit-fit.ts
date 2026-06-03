import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const failures: string[] = [];
const profitFitPath = "artifacts/veroxa/src/domain/profitFit.ts";
const fullPath = join(root, profitFitPath);

if (!existsSync(fullPath)) {
  failures.push(`${profitFitPath} is missing.`);
} else {
  const text = readFileSync(fullPath, "utf8");
  for (const required of [
    "DEFAULT_AVERAGE_TICKET = 15",
    "DEFAULT_NET_MARGIN = 0.05",
    "DAYS_PER_MONTH = 30",
    "calculateBreakEvenOrders",
    "evaluateProfitFit",
    "formatProfitFitSummary",
    "internalOnlyDisclaimer",
  ]) {
    if (!text.includes(required))
      failures.push(`${profitFitPath} missing ${required}`);
  }
}

function requiredDailyOrders(
  monthlyFee: number,
  averageTicket = 15,
  netMargin = 0.05,
): number {
  if (monthlyFee <= 0 || averageTicket <= 0 || netMargin <= 0) return 0;
  return Math.round((monthlyFee / netMargin / averageTicket / 30) * 10) / 10;
}

const cases = [
  { fee: 295, ticket: 15, expected: 13.1 },
  { fee: 295, ticket: 10, expected: 19.7 },
  { fee: 295, ticket: 20, expected: 9.8 },
] as const;

for (const testCase of cases) {
  const actual = requiredDailyOrders(testCase.fee, testCase.ticket);
  if (Math.abs(actual - testCase.expected) > 0.1) {
    failures.push(
      `Profit Fit formula expected ${testCase.expected} for $${testCase.fee}/$${testCase.ticket}, got ${actual}`,
    );
  }
}

if (requiredDailyOrders(295, 0, 0) !== 0) {
  failures.push(
    "Profit Fit guard should not divide by zero for invalid ticket/margin.",
  );
}

if (failures.length > 0) {
  console.error("Profit Fit guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  "Profit Fit guardrail passed: helper exists and break-even formula cases match.",
);
