import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { User } from "@supabase/supabase-js";
import {
  MOMO_OPERATIONAL_RESTAURANT,
  type ApprovedMomoClientAccess,
  type ApprovedMomoClientIdentityGateway,
  provisionApprovedMomoClientIdentity,
  validateSupabaseUrl,
} from "./approved-momo-client-identity";

const user = (id: string, email: string): User => ({ id, email }) as User;

const validAccess = (userId: string): ApprovedMomoClientAccess => ({
  profile: { user_id: userId, role: "client", status: "active" },
  membership: { restaurant_id: "momo", role: "client", status: "active" },
  restaurant: {
    id: "momo",
    name: MOMO_OPERATIONAL_RESTAURANT,
    status: "active",
  },
  is_operational_restaurant: true,
});

function fakeGateway(input: {
  existing?: User | null;
  created?: User;
  access?: ApprovedMomoClientAccess | null;
  accessSequence?: Array<ApprovedMomoClientAccess | null>;
}) {
  const calls = {
    create: 0,
    refresh: 0,
    remove: 0,
    requestedEmail: "",
  };
  const gateway: ApprovedMomoClientIdentityGateway = {
    async findUserByEmail(email) {
      calls.requestedEmail = email;
      return input.existing ?? null;
    },
    async createUser(email) {
      calls.create += 1;
      calls.requestedEmail = email;
      return input.created ?? user("created", email);
    },
    async refreshUserEmail(_userId, email) {
      calls.refresh += 1;
      calls.requestedEmail = email;
      return input.existing ?? user("refreshed", email);
    },
    async deleteUser() {
      calls.remove += 1;
    },
    async readApprovedMomoClientAccess() {
      if (input.accessSequence?.length) {
        return input.accessSequence.shift() ?? null;
      }
      return input.access ?? null;
    },
  };
  return { gateway, calls };
}

const existing = user("existing-client", "owner@momo.invalid");
const idempotent = fakeGateway({
  existing,
  access: validAccess(existing.id),
});
const existingResult = await provisionApprovedMomoClientIdentity(
  idempotent.gateway,
  " OWNER@MOMO.INVALID ",
);
assert.equal(existingResult.outcome, "already_exists");
assert.equal(idempotent.calls.create, 0);
assert.equal(idempotent.calls.refresh, 0);
assert.equal(idempotent.calls.remove, 0);
assert.equal(idempotent.calls.requestedEmail, "owner@momo.invalid");

const created = fakeGateway({
  created: user("new-client", "owner@momo.invalid"),
  access: validAccess("new-client"),
});
const createdResult = await provisionApprovedMomoClientIdentity(
  created.gateway,
  "owner@momo.invalid",
);
assert.equal(createdResult.outcome, "created");
assert.equal(created.calls.create, 1);
assert.equal(created.calls.refresh, 0);
assert.equal(created.calls.remove, 0);

const refreshed = fakeGateway({
  existing: user("preexisting-client", "owner@momo.invalid"),
  accessSequence: [null, validAccess("preexisting-client")],
});
const refreshedResult = await provisionApprovedMomoClientIdentity(
  refreshed.gateway,
  "owner@momo.invalid",
);
assert.equal(refreshedResult.outcome, "already_exists");
assert.equal(refreshed.calls.create, 0);
assert.equal(refreshed.calls.refresh, 1);
assert.equal(refreshed.calls.remove, 0);

const unaccepted = fakeGateway({
  created: user("unaccepted-client", "not-allowlisted@momo.invalid"),
  access: null,
});
await assert.rejects(
  provisionApprovedMomoClientIdentity(
    unaccepted.gateway,
    "not-allowlisted@momo.invalid",
  ),
  /rolled back/,
);
assert.equal(unaccepted.calls.create, 1);
assert.equal(unaccepted.calls.remove, 1);

const teamRole = fakeGateway({
  created: user("wrong-role", "wrong-role@momo.invalid"),
  access: {
    profile: { user_id: "wrong-role", role: "team", status: "active" },
    membership: { restaurant_id: "momo", role: "team", status: "active" },
    restaurant: {
      id: "momo",
      name: MOMO_OPERATIONAL_RESTAURANT,
      status: "active",
    },
    is_operational_restaurant: true,
  },
});
await assert.rejects(
  provisionApprovedMomoClientIdentity(
    teamRole.gateway,
    "wrong-role@momo.invalid",
  ),
  /rolled back/,
);
assert.equal(teamRole.calls.remove, 1);

const wrongTenant = fakeGateway({
  created: user("wrong-tenant", "wrong-tenant@momo.invalid"),
  access: {
    profile: { user_id: "wrong-tenant", role: "client", status: "active" },
    membership: { restaurant_id: "other", role: "client", status: "active" },
    restaurant: { id: "other", name: "Other Restaurant", status: "active" },
    is_operational_restaurant: false,
  },
});
await assert.rejects(
  provisionApprovedMomoClientIdentity(
    wrongTenant.gateway,
    "wrong-tenant@momo.invalid",
  ),
  /rolled back/,
);
assert.equal(wrongTenant.calls.remove, 1);

const inactive = fakeGateway({
  created: user("inactive-client", "inactive@momo.invalid"),
  access: {
    ...validAccess("inactive-client"),
    profile: {
      user_id: "inactive-client",
      role: "client",
      status: "disabled",
    },
  },
});
await assert.rejects(
  provisionApprovedMomoClientIdentity(
    inactive.gateway,
    "inactive@momo.invalid",
  ),
  /rolled back/,
);
assert.equal(inactive.calls.remove, 1);

const duplicateNameOutsideScope = fakeGateway({
  created: user("duplicate-name", "duplicate@momo.invalid"),
  access: {
    ...validAccess("duplicate-name"),
    is_operational_restaurant: false,
  },
});
await assert.rejects(
  provisionApprovedMomoClientIdentity(
    duplicateNameOutsideScope.gateway,
    "duplicate@momo.invalid",
  ),
  /rolled back/,
);
assert.equal(duplicateNameOutsideScope.calls.remove, 1);

await assert.rejects(
  provisionApprovedMomoClientIdentity(unaccepted.gateway, "not-an-email"),
  /valid email/,
);

assert.equal(
  validateSupabaseUrl("https://project-ref.supabase.co"),
  "https://project-ref.supabase.co",
);
assert.throws(
  () => validateSupabaseUrl("https://example.invalid/collect"),
  /hosted Supabase project/,
);

const helperSource = readFileSync(
  new URL("./approved-momo-client-identity.ts", import.meta.url),
  "utf8",
);
const commandSource = readFileSync(
  new URL("./provision-approved-momo-client-identity.ts", import.meta.url),
  "utf8",
);
assert.match(helperSource, /page <= 100/);
assert.match(helperSource, /perPage:\s*100/);
assert.match(helperSource, /veroxa_is_momo_operational_restaurant_v1/);
assert.match(helperSource, /is_operational_restaurant:\s*isOperationalRestaurant === true/);
assert.match(commandSource, /VEROXA_PROVISION_APPROVED_MOMO_CLIENT_IDENTITY/);
assert.match(commandSource, /SUPABASE_SERVICE_ROLE_KEY/);
assert.match(commandSource, /VEROXA_APPROVED_MOMO_CLIENT_EMAIL/);
assert.doesNotMatch(
  commandSource,
  /(?:inviteUserByEmail|generateLink|signInWithOtp|password\s*:|magic[_ -]?link)/i,
);
assert.doesNotMatch(
  commandSource,
  /console\.(?:log|error)\([^)]*(?:requiredEnv\(|VEROXA_APPROVED_MOMO_CLIENT_EMAIL|SUPABASE_SERVICE_ROLE_KEY|userId)/s,
);

console.log("Approved Momo client identity provisioning contract passed.");
