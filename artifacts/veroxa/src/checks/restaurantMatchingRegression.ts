import { matchRestaurantCandidates, type RestaurantMatchReason, type RestaurantMatchState } from "../lib/audit/restaurantNameMatching";

const expectedId = "pilot-momo-house-san-antonio";
const expectedAddress = "4447 De Zavala Rd";
const failures: string[] = [];

type RegressionCase = {
  label: string;
  input: Parameters<typeof matchRestaurantCandidates>[0];
  expectedTopId?: string;
  expectedStates?: RestaurantMatchState[];
  forbiddenStates?: RestaurantMatchState[];
  requiredReasons?: RestaurantMatchReason[];
  forbiddenReasons?: RestaurantMatchReason[];
};

const cases: RegressionCase[] = [
  {
    label: "Momo House + San Antonio TX remains safe exact/likely",
    input: { restaurantName: "Momo House", city: "San Antonio", state: "TX" },
    expectedTopId: expectedId,
    expectedStates: ["exact_match", "likely_match"],
    requiredReasons: ["city/state matched"],
  },
  {
    label: "Momo House + Houston TX must not exact-match San Antonio",
    input: { restaurantName: "Momo House", city: "Houston", state: "TX" },
    expectedTopId: expectedId,
    forbiddenStates: ["exact_match"],
    requiredReasons: ["city mismatch"],
    forbiddenReasons: ["city/state matched"],
  },
  {
    label: "Momo House + Dallas TX must not exact-match San Antonio",
    input: { restaurantName: "Momo House", city: "Dallas", state: "TX" },
    expectedTopId: expectedId,
    forbiddenStates: ["exact_match"],
    requiredReasons: ["city mismatch"],
    forbiddenReasons: ["city/state matched"],
  },
  {
    label: "Momo House + TX only is not location-confirmed",
    input: { restaurantName: "Momo House", state: "TX" },
    expectedTopId: expectedId,
    forbiddenStates: ["exact_match"],
    requiredReasons: ["state provided without city confirmation"],
    forbiddenReasons: ["city/state matched"],
  },
  {
    label: "Momo House + De Zavala address remains strong proof",
    input: { restaurantName: "Momo House", address: "4447 De Zavala" },
    expectedTopId: expectedId,
    expectedStates: ["exact_match"],
    requiredReasons: ["address matched"],
  },
  {
    label: "phone match remains exact proof",
    input: { restaurantName: "Momo House", phone: "(210) 492-1711" },
    expectedTopId: expectedId,
    expectedStates: ["exact_match"],
    requiredReasons: ["phone matched"],
  },
  {
    label: "domain match remains exact proof",
    input: { restaurantName: "Momo House", websiteUrl: "momohousesa.com" },
    expectedTopId: expectedId,
    expectedStates: ["exact_match"],
    requiredReasons: ["domain matched"],
  },
  {
    label: "similar/common taco names stay ambiguous instead of overconfident",
    input: { restaurantName: "El Sol Tacos", city: "San Antonio", state: "TX" },
    expectedStates: ["multiple_possible_matches", "manual_review_needed", "likely_match"],
    forbiddenStates: ["exact_match"],
  },
];

function expect(condition: boolean, message: string) {
  if (!condition) failures.push(message);
}

for (const testCase of cases) {
  const result = matchRestaurantCandidates(testCase.input);
  const top = result.topMatch;
  if (!top) {
    failures.push(`${testCase.label}: no top match returned; result state ${result.state}`);
    continue;
  }

  if (testCase.expectedTopId) {
    expect(top.candidate.id === testCase.expectedTopId, `${testCase.label}: expected top match ${testCase.expectedTopId}, received ${top.candidate.id}`);
  }
  if (top.candidate.id === expectedId) {
    expect(top.candidate.addressLine.includes(expectedAddress), `${testCase.label}: expected Momo House address to include ${expectedAddress}, received ${top.candidate.addressLine}`);
  }
  if (testCase.expectedStates) {
    expect(testCase.expectedStates.includes(result.state), `${testCase.label}: expected state ${testCase.expectedStates.join("/")}, received ${result.state}`);
  }
  if (testCase.forbiddenStates) {
    expect(!testCase.forbiddenStates.includes(result.state), `${testCase.label}: forbidden state ${result.state} was returned`);
  }
  for (const reason of testCase.requiredReasons ?? []) {
    expect(top.reasons.includes(reason), `${testCase.label}: expected reason "${reason}", received ${top.reasons.join(", ")}`);
  }
  for (const reason of testCase.forbiddenReasons ?? []) {
    expect(!top.reasons.includes(reason), `${testCase.label}: forbidden reason "${reason}" was returned (${top.reasons.join(", ")})`);
  }
  if (String((testCase.input as { city?: string }).city ?? "").match(/Houston|Dallas/i)) {
    expect(top.state !== "exact_match" && result.state !== "exact_match", `${testCase.label}: city mismatch must block exact match; match state ${top.state}, result state ${result.state}`);
  }
}

if (failures.length > 0) {
  console.error("Restaurant matching regression failed:\n" + failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log("Restaurant matching regression passed: location conflicts block exact prefill, while phone/domain/address proof still resolves the Momo House pre-live pilot.");
