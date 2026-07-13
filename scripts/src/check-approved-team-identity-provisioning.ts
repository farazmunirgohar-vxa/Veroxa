import assert from "node:assert/strict";
import type { User } from "@supabase/supabase-js";
import {
  MOMO_OPERATIONAL_RESTAURANT,
  type ApprovedTeamAccess,
  type ApprovedTeamIdentityGateway,
  provisionApprovedTeamIdentity,
  validateSupabaseUrl,
} from "./approved-team-identity";

const user = (id: string, email: string): User =>
  ({ id, email } as User);

const validAccess = (userId: string): ApprovedTeamAccess => ({
  profile: { user_id: userId, role: "team", status: "active" },
  membership: { restaurant_id: "momo", role: "team", status: "active" },
  restaurant: { id: "momo", name: MOMO_OPERATIONAL_RESTAURANT, status: "active" },
});

function fakeGateway(input: {
  existing?: User | null;
  created?: User;
  access?: ApprovedTeamAccess | null;
  accessSequence?: Array<ApprovedTeamAccess | null>;
}) {
  const calls = { create: 0, refresh: 0, remove: 0, requestedEmail: "" };
  const gateway: ApprovedTeamIdentityGateway = {
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
    async readApprovedTeamAccess() {
      if (input.accessSequence?.length) return input.accessSequence.shift() ?? null;
      return input.access ?? null;
    },
  };
  return { gateway, calls };
}

const existing = user("existing", "team@example.test");
const idempotent = fakeGateway({ existing, access: validAccess(existing.id) });
const existingResult = await provisionApprovedTeamIdentity(
  idempotent.gateway,
  " TEAM@EXAMPLE.TEST ",
);
assert.equal(existingResult.outcome, "already_exists");
assert.equal(idempotent.calls.create, 0);
assert.equal(idempotent.calls.refresh, 0);
assert.equal(idempotent.calls.remove, 0);
assert.equal(idempotent.calls.requestedEmail, "team@example.test");

const created = fakeGateway({
  created: user("new", "team@example.test"),
  access: validAccess("new"),
});
const createdResult = await provisionApprovedTeamIdentity(
  created.gateway,
  "team@example.test",
);
assert.equal(createdResult.outcome, "created");
assert.equal(created.calls.create, 1);
assert.equal(created.calls.remove, 0);

const refreshed = fakeGateway({
  existing: user("preexisting", "team@example.test"),
  accessSequence: [null, validAccess("preexisting")],
});
const refreshedResult = await provisionApprovedTeamIdentity(
  refreshed.gateway,
  "team@example.test",
);
assert.equal(refreshedResult.outcome, "already_exists");
assert.equal(refreshed.calls.create, 0);
assert.equal(refreshed.calls.refresh, 1);
assert.equal(refreshed.calls.remove, 0);

const rejected = fakeGateway({
  created: user("rejected", "not-allowlisted@example.test"),
  access: null,
});
await assert.rejects(
  provisionApprovedTeamIdentity(rejected.gateway, "not-allowlisted@example.test"),
  /rolled back/,
);
assert.equal(rejected.calls.create, 1);
assert.equal(rejected.calls.remove, 1);

await assert.rejects(
  provisionApprovedTeamIdentity(rejected.gateway, "not-an-email"),
  /valid email/,
);

assert.equal(
  validateSupabaseUrl("https://project-ref.supabase.co"),
  "https://project-ref.supabase.co",
);
assert.throws(
  () => validateSupabaseUrl("https://example.test/collect"),
  /hosted Supabase project/,
);

console.log("Approved Team identity provisioning contract passed.");
