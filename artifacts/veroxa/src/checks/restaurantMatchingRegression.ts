import { matchRestaurantCandidates } from "../lib/audit/restaurantNameMatching";

const expectedId = "pilot-momo-house-san-antonio";
const expectedAddress = "4447 De Zavala Rd";

const cases = [
  { label: "name", input: { restaurantName: "Momo House San Antonio" }, states: ["exact_match", "likely_match"] },
  { label: "alias", input: { restaurantName: "Momo House" }, states: ["exact_match", "likely_match"] },
  { label: "de zavala", input: { restaurantName: "Momo House De Zavala" }, states: ["exact_match", "likely_match"] },
  { label: "address name", input: { restaurantName: "Momo House 4447 De Zavala" }, states: ["exact_match", "likely_match"] },
  { label: "domain", input: { restaurantName: "momohousesa.com", websiteUrl: "momohousesa.com" }, states: ["exact_match", "likely_match"], reason: "domain matched" },
  { label: "phone", input: { restaurantName: "(210) 492-1711", phone: "(210) 492-1711" }, states: ["exact_match", "likely_match"], reason: "phone matched" },
] satisfies ReadonlyArray<{ label: string; input: { restaurantName: string; websiteUrl?: string; phone?: string }; states: ReadonlyArray<string>; reason?: string }>;

const failures: string[] = [];

for (const testCase of cases) {
  const result = matchRestaurantCandidates(testCase.input);
  const top = result.topMatch;
  if (!top) {
    failures.push(`${testCase.label}: no top match returned`);
    continue;
  }
  if (top.candidate.id !== expectedId) {
    failures.push(`${testCase.label}: expected ${expectedId}, received ${top.candidate.id}`);
  }
  if (!top.candidate.addressLine.includes(expectedAddress)) {
    failures.push(`${testCase.label}: expected address to include ${expectedAddress}, received ${top.candidate.addressLine}`);
  }
  if (!testCase.states.includes(result.state as never)) {
    failures.push(`${testCase.label}: expected state ${testCase.states.join("/")}, received ${result.state}`);
  }
  if (testCase.reason && !top.reasons.includes(testCase.reason as never)) {
    failures.push(`${testCase.label}: expected reason ${testCase.reason}, received ${top.reasons.join(", ")}`);
  }
}

if (failures.length > 0) {
  console.error("Restaurant matching regression failed:\n" + failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log("Restaurant matching regression passed: Momo House pre-live pilot resolves across name, alias, address, domain, and phone inputs.");
