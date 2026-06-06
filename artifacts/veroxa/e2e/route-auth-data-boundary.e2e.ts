import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const port = 4179;
const baseUrl = `http://127.0.0.1:${port}`;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function waitForServer(): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/`);
      if (response.ok) return;
    } catch {
      // keep polling
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error("Vite dev server did not become ready for route QA.");
}

async function expectRouteOk(path: string): Promise<string> {
  const response = await fetch(`${baseUrl}${path}`);
  assert(response.ok, `${path} returned HTTP ${response.status}`);
  const html = await response.text();
  assert(html.includes("id=\"root\""), `${path} did not return the Veroxa app shell`);
  return html;
}

async function main() {
  const server = spawn(
    "pnpm",
    ["exec", "vite", "--config", "vite.config.ts", "--host", "127.0.0.1", "--port", String(port)],
    { cwd: root, stdio: ["ignore", "pipe", "pipe"] },
  );

  let serverLog = "";
  server.stdout.on("data", (chunk) => { serverLog += String(chunk); });
  server.stderr.on("data", (chunk) => { serverLog += String(chunk); });

  try {
    await waitForServer();
    for (const path of ["/", "/free-audit", "/login", "/demo/client/dashboard", "/client/dashboard", "/team/dashboard"]) {
      await expectRouteOk(path);
    }

    const appSource = readFileSync(resolve(root, "src/App.tsx"), "utf8");
    const clientGuard = readFileSync(resolve(root, "src/components/auth/ClientPortalGuard.tsx"), "utf8");
    const teamGuard = readFileSync(resolve(root, "src/components/auth/InternalDemoGuard.tsx"), "utf8");
    const loginSource = readFileSync(resolve(root, "src/pages/login.tsx"), "utf8");
    const devCredentials = readFileSync(resolve(root, "src/lib/auth/devCredentials.ts"), "utf8");
    const clientDataHook = readFileSync(resolve(root, "src/hooks/useClientPortalData.ts"), "utf8");

    assert(appSource.includes('path="/demo/client/dashboard"'), "Demo client dashboard route is missing.");
    assert(appSource.includes("<ClientPortalGuard>") && appSource.includes('path="/client/dashboard"'), "Client dashboard route is not guarded.");
    assert(appSource.includes("<InternalDemoGuard role=\"team\">") && appSource.includes('path="/team/dashboard"'), "Team dashboard route is not guarded.");

    assert(clientGuard.includes("Login required"), "/client/dashboard unauthenticated state must be login-required/safe blocked.");
    assert(teamGuard.includes("Login required"), "/team/dashboard unauthenticated state must be login-required/safe blocked.");
    assert(clientGuard.includes("Wrong portal for this login") && clientGuard.includes('auth.session?.role === "team"'), "Team sessions must not view client dashboard.");
    assert(teamGuard.includes("Wrong portal for this login") && teamGuard.includes("allowed.includes(currentRole)"), "Client sessions must not view team dashboard.");

    assert(loginSource.includes("validateDevCredentials") && loginSource.includes("setLocation(getDevRouteForRole(role))"), "Placeholder login must route by configured preview credentials.");
    assert(devCredentials.includes('email: "faraz@client.com"') && devCredentials.includes('password: "farazclient"'), "Client preview credential fallback changed unexpectedly.");
    assert(devCredentials.includes('email: "faraz@team.com"') && devCredentials.includes('password: "farazteam"'), "Team preview credential fallback changed unexpectedly.");

    assert(clientDataHook.includes("ZERO_GOOGLE_METRICS"), "Real client empty state must use zero/safe Google metrics.");
    const emptyStateBlock = clientDataHook.slice(clientDataHook.indexOf("!portalDataMode.allowDemoFixtures"), clientDataHook.indexOf("const realClientId"));
    assert(emptyStateBlock.includes("googleMetrics: ZERO_GOOGLE_METRICS"), "Real client empty state still risks demo Google metrics.");
    assert(!emptyStateBlock.includes("demoGoogleMetrics"), "Real client empty state references demo Google metrics.");

    const liveDataBlock = clientDataHook.slice(clientDataHook.indexOf("isReadOnlyLive: true"), clientDataHook.indexOf("} catch (err)", clientDataHook.indexOf("isReadOnlyLive: true")));
    assert(liveDataBlock.includes("googleMetrics: ZERO_GOOGLE_METRICS"), "Authenticated/live client data path must use zero/safe Google metrics until client-safe metrics exist.");
    for (const marker of ["demoGoogleMetrics", "DEMO_MONTHLY_PREVIEW", "DEMO_WEEKLY_UPDATE"]) {
      assert(!liveDataBlock.includes(marker), `Authenticated/live client data path must not reference ${marker}.`);
    }

    const realClientDashboard = readFileSync(resolve(root, "src/pages/client-dashboard.tsx"), "utf8");
    assert(!realClientDashboard.includes("Demo Grill House"), "Real /client/dashboard page must not hard-code demo restaurant names.");
    assert(!realClientDashboard.includes("14,820") && !realClientDashboard.includes("3,240"), "Real /client/dashboard page must not hard-code demo metric values.");

    console.log("Route/auth/data-boundary QA passed.");
  } catch (error) {
    console.error(serverLog);
    throw error;
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
