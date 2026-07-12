import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders development preview metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  assert.match(await response.text(), developmentPreviewMeta);
});

test("renders public routes and protects portal routes", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("routes", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const env = {
    ASSETS: {
      fetch: async () => new Response("Not found", { status: 404 }),
    },
  };
  const ctx = { waitUntil() {}, passThroughOnException() {} };

  for (const [path, expected] of [
    ["/", "Be easier to find"],
    ["/free-audit", "Start with the truth"],
    ["/login", "Welcome back"],
  ]) {
    const response = await worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), env, ctx);
    assert.equal(response.status, 200, `${path} should render`);
    const html = await response.text();
    assert.match(html, /VEROXA|Veroxa/i, `${path} should carry Veroxa identity`);
    assert.match(html, new RegExp(expected, "i"), `${path} should server-render its route-specific surface`);
    assert.doesNotMatch(html, /Starter Project|clean starting point/i, `${path} must not expose starter metadata`);
    if (path === "/login") {
      assert.match(html, /SECURE PORTAL ACCESS/i, "Login must describe real signed access");
      assert.match(html, /Supabase Auth/i, "Login must disclose its identity boundary");
      assert.doesNotMatch(html, /Choose a pre-live view|Explore the non-sensitive Team shell/i, "Login must not expose role-bypass buttons");
    }
  }

  for (const path of [
    "/client/dashboard",
    "/client/onboarding",
    "/client/media",
    "/client/reports",
    "/team/momo",
    "/team/audits",
    "/team/momo/work",
    "/team/momo/intelligence",
    "/team/momo/content-ai",
    "/team/momo/reports",
    "/team/momo/readiness",
  ]) {
    const response = await worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), env, ctx);
    assert.ok([302, 303, 307, 308].includes(response.status), `${path} should redirect without a verified session`);
    assert.match(response.headers.get("location") || "", /\/login\?return_to=/, `${path} should redirect to secure login`);
    const html = await response.text();
    assert.doesNotMatch(html, /Operating snapshot|Restaurant Audit Center|Momo work queue/i, `${path} must not server-render protected content to a guest`);
  }
});

test("audit intake fails closed when production configuration is absent", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("audit-api", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(new Request("http://localhost/api/audit-requests", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ restaurantName: "Test Restaurant" }),
  }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
  assert.equal(response.status, 503);
  assert.match(response.headers.get("cache-control") || "", /no-store/);
});

test("Momo readiness evidence remains in the protected server bundle", async () => {
  const clientAssets = new URL("../dist/client/assets/", import.meta.url);
  const clientFiles = (await readdir(clientAssets)).filter((name) => name.endsWith(".js"));
  const clientJavascript = (await Promise.all(clientFiles.map((name) => readFile(new URL(name, clientAssets), "utf8")))).join("\n");
  assert.doesNotMatch(clientJavascript, /Six production migrations are applied|The approved Team identity still requires|momo-readiness-tracker/i, "Public JavaScript must not contain the protected readiness record");

  const serverAssets = await readdir(new URL("../dist/server/assets/", import.meta.url));
  assert.ok(serverAssets.some((name) => name.startsWith("momo-readiness-tracker-") && name.endsWith(".js")), "The protected readiness record must compile into a server-only asset");
});

test("audit UI keeps contact, draft-isolation, mutation, and mobile-navigation guardrails", async () => {
  const [page, center, data, protectedRoute] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/audit-center.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/veroxa-supabase.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/[...slug]/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /!contactEmail && !contactPhone/, "Public intake must require email or phone");
  assert.match(page, /state\.kind !== "success" && <form/, "A successful submission must hide the completed form");
  assert.match(page, /setFormStartedAt\(new Date\(\)\.toISOString\(\)\)/, "A new submission must rotate timing state");
  assert.match(page, /refreshExpiredAuditSession/, "An old open audit form must refresh its security timestamp");
  assert.doesNotMatch(page, /activeNav\.slice/, "Mobile Team navigation must not silently drop routes");
  assert.match(page, /signOutBusy \? "Signing out" : "Sign out"/, "Mobile Team navigation must expose sign out");
  assert.match(page, /const handleSignOut = async/, "Sign out controls must share an error-aware handler");
  assert.match(page, /You are still signed in/, "Failed sign out must preserve and explain the signed-in state");
  assert.doesNotMatch(page, /momo-readiness-tracker\.json/, "The public client entry must not bundle the full Team readiness record");
  assert.match(protectedRoute, /if \(access\.role === "team"\)[\s\S]*?await import\("\.\.\/momo-readiness-tracker\.json"\)/, "Only a server-verified Team route may load the readiness record");
  assert.ok(protectedRoute.indexOf("getServerVeroxaAccess()") < protectedRoute.indexOf("momo-readiness-tracker.json"), "Server access verification must precede readiness loading");
  assert.match(page, /No readiness percentage is calculated/, "Team readiness must not invent a completion percentage");
  assert.match(page, /Other restaurants remain Restaurant Audit Center records only/, "Team readiness must preserve the Momo-only operating boundary");
  assert.match(page, /if \(!tracker\)/, "Team readiness must fail closed when the server-authorized record is absent");

  assert.match(center, /confirmDiscardDetail/, "Audit selection must protect unsaved drafts");
  assert.match(center, /beforeunload/, "Leaving the page must protect unsaved drafts");
  assert.match(center, /readOnly=\{report\?\.status === "reviewed"\}/, "Reviewed report fields must be read-only");
  assert.match(center, /saveRunState\("failed"\)/, "Failed runs must have an explicit UI action");
  assert.match(center, /failureReason\.trim\(\)\.length < 10/, "Failed runs must require an actionable reason");
  assert.match(center, /run\.id !== runs\[0\]\?\.id/, "Only the latest reviewed run may close an audit request");

  for (const table of ["audit_requests", "audit_runs"]) {
    assert.match(
      data,
      new RegExp(`\\.from\\("${table}"\\)[\\s\\S]*?\\.update\\(update\\)[\\s\\S]*?\\.select\\("id"\\)[\\s\\S]*?\\.single\\(\\)`),
      `${table} updates must prove one affected row`,
    );
  }
  assert.match(data, /\.upsert\(record,[\s\S]*?\.select\("id, audit_run_id"\)[\s\S]*?\.single\(\)/, "Report saves must prove one affected row");
});
