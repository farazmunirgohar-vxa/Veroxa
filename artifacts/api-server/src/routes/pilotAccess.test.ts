import { strict as assert } from "node:assert";
import http from "node:http";
import app from "../app";

const CLIENT_PASSWORD_ENV = "VEROXA_PILOT_MOMO_HOUSE_PASSWORD";
const TEAM_PASSWORD_ENV = "VEROXA_PILOT_TEAM_FARAZ_PASSWORD";

async function withServer<T>(run: (baseUrl: string) => Promise<T>): Promise<T> {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert(address && typeof address === "object");
  try {
    return await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
}

async function postPilotAccess(baseUrl: string, body: object, headers: Record<string, string> = {}) {
  const response = await fetch(`${baseUrl}/api/pilot-access`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  return { status: response.status, payload: await response.json() as Record<string, unknown> };
}

async function main() {
  process.env[CLIENT_PASSWORD_ENV] = "local-client-test-secret";
  process.env[TEAM_PASSWORD_ENV] = "local-team-test-secret";
  process.env.VEROXA_PILOT_ACCESS_RATE_LIMIT_MAX = "50";

  await withServer(async (baseUrl) => {
    const client = await postPilotAccess(baseUrl, {
      email: "momo@veroxa.app",
      password: process.env[CLIENT_PASSWORD_ENV],
    });
    assert.equal(client.status, 200);
    assert.equal(client.payload.ok, true);
    assert.equal(client.payload.role, "client");
    assert.equal(client.payload.accountId, "pilot-account-momo-house-san-antonio");
    assert.equal(client.payload.email, "momo@veroxa.app");
    assert(!("password" in client.payload));

    const team = await postPilotAccess(baseUrl, {
      email: "faraz@veroxa.app",
      password: process.env[TEAM_PASSWORD_ENV],
    });
    assert.equal(team.status, 200);
    assert.equal(team.payload.ok, true);
    assert.equal(team.payload.role, "team");
    assert.equal(team.payload.accountId, "pilot-account-team-faraz");

    const invalid = await postPilotAccess(baseUrl, {
      email: "momo@veroxa.app",
      password: "wrong-secret",
    });
    assert.equal(invalid.status, 401);
    assert.equal(invalid.payload.ok, false);
  });

  process.env.VEROXA_PILOT_ACCESS_RATE_LIMIT_MAX = "2";

  await withServer(async (baseUrl) => {
    const firstSpoofedIp = await postPilotAccess(
      baseUrl,
      { email: "unknown-rate-limit@veroxa.app", password: "wrong-secret" },
      { "X-Forwarded-For": "198.51.100.10" },
    );
    assert.equal(firstSpoofedIp.status, 401);

    const secondSpoofedIp = await postPilotAccess(
      baseUrl,
      { email: "unknown-rate-limit@veroxa.app", password: "wrong-secret" },
      { "X-Forwarded-For": "198.51.100.11" },
    );
    assert.equal(secondSpoofedIp.status, 401);

    const thirdSpoofedIp = await postPilotAccess(
      baseUrl,
      { email: "unknown-rate-limit@veroxa.app", password: "wrong-secret" },
      { "X-Forwarded-For": "198.51.100.12" },
    );
    assert.equal(thirdSpoofedIp.status, 429);
    assert.equal(thirdSpoofedIp.payload.mode, "rate_limited");
  });

  console.log("Pilot access endpoint validation passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
