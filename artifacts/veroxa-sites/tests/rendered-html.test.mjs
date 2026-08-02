import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import {
  getVeroxaPasswordIssue,
  isVeroxaPasswordCompromised,
  pwnedRangeContainsHash,
  sha1Hex,
} from "../app/veroxa-password.mjs";
import { updateHardenedVeroxaPassword } from "../app/veroxa-password-update.ts";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("enforces the temporary Free-plan password policy", () => {
  assert.equal(getVeroxaPasswordIssue("Unique-Portal-Key-47!"), null);
  assert.match(getVeroxaPasswordIssue("Short1!") || "", /12 characters/);
  assert.match(getVeroxaPasswordIssue("NOLOWERCASE-47!") || "", /lowercase/);
  assert.match(getVeroxaPasswordIssue("nouppercase-47!") || "", /uppercase/);
  assert.match(getVeroxaPasswordIssue("NoNumber-Needed!") || "", /number/);
  assert.match(getVeroxaPasswordIssue("NoSymbolNeeded47") || "", /symbol/);
  assert.match(getVeroxaPasswordIssue("Has a Space 47!") || "", /spaces/);
  assert.match(getVeroxaPasswordIssue("Unicode-Portal-47!é") || "", /supported symbols/);
});

test("checks leaked passwords with only a padded five-character hash prefix", async () => {
  assert.equal(await sha1Hex("password"), "5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8");
  const candidate = "Unit-Test-Only-Key-47!";
  const fullHash = await sha1Hex(candidate);
  let requestUrl = "";
  let requestOptions;
  const compromised = await isVeroxaPasswordCompromised(candidate, async (url, options) => {
    requestUrl = String(url);
    requestOptions = options;
    return new Response(`${fullHash.slice(5)}:3\n${"0".repeat(35)}:0`, { status: 200 });
  });
  assert.equal(compromised, true);
  assert.equal(requestUrl, `https://api.pwnedpasswords.com/range/${fullHash.slice(0, 5)}`);
  assert.equal(requestOptions.headers["Add-Padding"], "true");
  assert.ok(requestOptions.signal instanceof AbortSignal);
  assert.doesNotMatch(requestUrl, new RegExp(fullHash.slice(5), "i"));
  assert.equal(pwnedRangeContainsHash(`${fullHash.slice(5)}:0`, fullHash), false);
  assert.equal(await isVeroxaPasswordCompromised(candidate, async () => new Response(`${"F".repeat(35)}:9`, { status: 200 })), false);
  await assert.rejects(
    isVeroxaPasswordCompromised(candidate, async () => new Response("unavailable", { status: 503 })),
    /password_check_unavailable/,
  );
});

test("reports a thrown refresh-session revocation as incomplete after changing the password", async () => {
  const originalFetch = globalThis.fetch;
  let passwordUpdated = false;
  globalThis.fetch = async () => new Response("", { status: 200 });
  try {
    const result = await updateHardenedVeroxaPassword({
      auth: {
        getUser: async () => ({
          data: { user: { last_sign_in_at: new Date().toISOString() } },
          error: null,
        }),
        updateUser: async () => {
          passwordUpdated = true;
          return { error: null };
        },
        signOut: async () => {
          throw new Error("network_unavailable");
        },
      },
    }, "Unit-Test-Only-Key-47!");
    assert.equal(passwordUpdated, true);
    assert.deepEqual(result, { otherRefreshSessionsRevoked: false });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

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

test("injects validated runtime Supabase public config only into the login route", async () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://runtime-config.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_runtime_config_contract";

  try {
    const workerUrl = new URL("../dist/server/index.js", import.meta.url);
    workerUrl.searchParams.set("runtime-auth-config", `${process.pid}-${Date.now()}`);
    const { default: worker } = await import(workerUrl.href);
    const response = await worker.fetch(
      new Request("http://localhost/login", {
        headers: { accept: "text/html" },
      }),
      {
        ASSETS: {
          fetch: async () => new Response("Not found", { status: 404 }),
        },
      },
      { waitUntil() {}, passThroughOnException() {} },
    );
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /https:\/\/runtime-config\.supabase\.co/);
    assert.match(html, /sb_publishable_runtime_config_contract/);
    assert.match(response.headers.get("cache-control") || "", /no-store/);

    for (const path of ["/", "/free-audit"]) {
      const publicResponse = await worker.fetch(
        new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
        {
          ASSETS: {
            fetch: async () => new Response("Not found", { status: 404 }),
          },
        },
        { waitUntil() {}, passThroughOnException() {} },
      );
      const publicHtml = await publicResponse.text();
      assert.doesNotMatch(publicHtml, /runtime-config\.supabase\.co/);
      assert.doesNotMatch(publicHtml, /sb_publishable_runtime_config_contract/);
    }
  } finally {
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = previousKey;
  }
});

test("rejects unsafe or incomplete runtime Supabase public config", async () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const cases = [
    ["http://unsafe-runtime.supabase.co", "sb_publishable_unsafe_http"],
    ["https://unsafe-runtime.example.com", "sb_publishable_unsafe_host"],
    ["https://unsafe-path.supabase.co/auth", "sb_publishable_unsafe_path"],
    ["https://unsafe-secret.supabase.co", "sb_secret_must_not_reach_browser"],
    ["https://missing-key.supabase.co", ""],
  ];

  try {
    for (const [url, key] of cases) {
      process.env.NEXT_PUBLIC_SUPABASE_URL = url;
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = key;
      const workerUrl = new URL("../dist/server/index.js", import.meta.url);
      workerUrl.searchParams.set("invalid-runtime-auth-config", `${process.pid}-${Date.now()}-${url}`);
      const { default: worker } = await import(workerUrl.href);
      const response = await worker.fetch(
        new Request("http://localhost/login", { headers: { accept: "text/html" } }),
        { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
        { waitUntil() {}, passThroughOnException() {} },
      );
      const html = await response.text();
      assert.equal(response.status, 200);
      assert.doesNotMatch(html, new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      if (key) {
        assert.doesNotMatch(html, new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      }
      assert.match(response.headers.get("cache-control") || "", /no-store/);
    }
  } finally {
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = previousKey;
  }
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
      assert.match(html, /Password/i, "Login must offer password sign-in");
      assert.match(html, /Email link/i, "Login must preserve secure email-link access");
      assert.match(html, /autocomplete="current-password"/i, "Password sign-in must use password-manager semantics");
    }
  }

  for (const path of [
    "/client/dashboard",
    "/client/onboarding",
    "/client/media",
    "/client/content",
    "/client/reports",
    "/team/momo",
    "/team/audits",
    "/team/momo/work",
    "/team/momo/intelligence",
    "/team/momo/media",
    "/team/momo/content",
    "/team/momo/content-ai",
    "/team/momo/presence",
    "/team/momo/reports",
    "/team/momo/readiness",
    "/account/security",
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
  const [page, center, data, protectedRoute, authCallback, accountSecurity, clientData, passwordUpdate] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/audit-center.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/veroxa-supabase.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/[...slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/auth/callback/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/account-security.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/momo-client-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/veroxa-password-update.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /!contactEmail && !contactPhone/, "Public intake must require email or phone");
  assert.doesNotMatch(page, /from "next\/image"/, "The public hero must not use the unsupported production image optimizer");
  assert.match(page, /<img[\s\S]*?src="\/brand\/veroxa-hospitality-hero\.webp"/, "The public hero must load its bundled image directly");
  assert.match(page, /state\.kind !== "success" && <form/, "A successful submission must hide the completed form");
  assert.match(page, /setFormStartedAt\(new Date\(\)\.toISOString\(\)\)/, "A new submission must rotate timing state");
  assert.match(page, /refreshExpiredAuditSession/, "An old open audit form must refresh its security timestamp");
  assert.doesNotMatch(page, /activeNav\.slice/, "Mobile Team navigation must not silently drop routes");
  assert.match(page, /signOutBusy \? "Signing out" : "Sign out"/, "Mobile Team navigation must expose sign out");
  assert.match(page, /const handleSignOut = async/, "Sign out controls must share an error-aware handler");
  assert.match(page, /You are still signed in/, "Failed sign out must preserve and explain the signed-in state");
  assert.match(data, /error\.code === "over_email_send_rate_limit"/, "Magic-link requests must preserve Supabase email-limit meaning");
  assert.doesNotMatch(data, /over_request_rate_limit|normalizedMessage\.includes\("rate limit"\)/, "Magic-link classification must not conflate unrelated request limits or brittle message text");
  assert.match(data, /throw new Error\("magic_link_rate_limited"\)/, "Magic-link requests must return a controlled rate-limit failure");
  assert.match(data, /VEROXA_PRODUCTION_ORIGIN = "https:\/\/veroxasystems\.com"/, "Production magic links must use the canonical Veroxa origin");
  assert.match(data, /emailRedirectTo: `\$\{getAuthCallbackOrigin\(\)\}\/auth\/callback`/, "Magic links must use one exact production callback URL");
  assert.match(data, /veroxa_auth_return_to/, "Magic-link return paths must be preserved outside the callback URL allowlist");
  assert.match(data, /Domain=veroxasystems\.com/, "Recovery return cookie must survive the www-to-apex callback");
  assert.match(data, /signInWithPassword/, "Approved identities must support permanent password sign-in");
  assert.match(passwordUpdate, /getUser\(\)[\s\S]*?last_sign_in_at[\s\S]*?isVeroxaPasswordCompromised[\s\S]*?updateUser\(\{ password \}\)/, "Every account password replacement must use recent-sign-in and compromised-password checks");
  assert.match(data, /signOut\(\{ scope: "local" \}\)/, "Failed post-login authorization must clear the new browser session");
  assert.match(passwordUpdate, /signOut\(\{ scope: "others" \}\)/, "Password replacement must revoke other refresh sessions when available");
  assert.match(passwordUpdate, /otherRefreshSessionsRevoked: !revocationError/, "Password replacement must report whether other refresh sessions were actually revoked");
  assert.match(data, /updateHardenedVeroxaPassword\(client, password\)/, "The legacy account surface must use the shared hardened password path");
  assert.match(clientData, /updateHardenedVeroxaPassword\(requiredClient\(\), password\)/, "The protected Account route must use the same hardened password path without importing Team modules");
  assert.match(accountSecurity, /updateMomoClientPassword/, "The protected Account route must call its role-neutral hardened adapter");
  assert.match(accountSecurity, /existing access can remain until its current token expires/, "Password success copy must not overclaim immediate access-token revocation");
  assert.match(accountSecurity, /could not revoke other refresh sessions/, "A revocation failure must remain visible after a successful password change");
  assert.doesNotMatch(clientData, /auth\.updateUser|signOut\(\{ scope: "others" \}\)/, "Client data must not retain a weaker duplicate password implementation");
  assert.doesNotMatch(data, /resetPasswordForEmail|\.auth\.signUp/, "Password recovery must reuse the existing approved-user email-link path without enabling public signup");
  assert.match(page, /name="password"[\s\S]*?autocomplete="new-password"/i, "Account security must use a non-prefilled new-password field");
  assert.match(page, /email or password is incorrect, or this account is not approved/i, "Password failures must use one non-enumerating message");
  assert.match(page, /setEmailLinkReturnTo\(recovery \? "\/account\/security" : null\)/, "Recovery mode must target the protected replacement screen");
  assert.match(page, /switchMode\("magic-link", true\)/, "Forgot-password control must enable recovery mode");
  assert.match(authCallback, /cookieStore\.get\(AUTH_RETURN_COOKIE\)/, "Auth callback must recover the validated return path from its short-lived cookie");
  assert.match(authCallback, /maxAge: 0/, "Auth callback must clear its short-lived return-path cookie");
  assert.match(page, /secure sign-in link may have been sent/, "Login must use one neutral, non-promissory delivery posture for non-configuration Auth outcomes");
  assert.doesNotMatch(page, /will be delivered when available/, "Login must not imply that failed Auth requests are queued for later delivery");
  assert.doesNotMatch(page, /Too many secure emails were requested during setup/, "Login must not reveal a distinct approved-account rate-limit state");
  assert.doesNotMatch(page, /momo-readiness-tracker\.json/, "The public client entry must not bundle the full Team readiness record");
  assert.match(protectedRoute, /if \(access\.role === "team"\)[\s\S]*?await import\("\.\.\/momo-readiness-tracker\.json"\)/, "Only a server-verified Team route may load the readiness record");
  assert.ok(protectedRoute.indexOf("getServerVeroxaAccess()") < protectedRoute.indexOf("momo-readiness-tracker.json"), "Server access verification must precede readiness loading");
  assert.match(page, /MomoOperatingCenter/, "Protected Team/client routes must use the database-backed operating center");

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

test("Team stays Momo-focused and generated audits preview before atomic save", async () => {
  const [page, center, data, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/audit-center.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/veroxa-supabase.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  for (const marker of [
    "Momo’s House",
    "Upload → ready to post",
    "Today",
    "Work",
    "Media",
    "Content",
    "Momo profile",
    "READY-TO-POST MODE",
    "External posting is off",
    '"/team/momo/media"',
  ]) {
    assert.match(page, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Team navigation missing ${marker}`);
  }
  assert.doesNotMatch(page, /More workspace tools/, "Inactive and advanced destinations must not crowd Team navigation");
  assert.doesNotMatch(page, /const teamNav[\s\S]{0,350}Dashboard[\s\S]{0,350}Audit Center[\s\S]{0,350}Work[\s\S]{0,350}Intelligence/, "Team navigation must not return to the scattered flat list");

  for (const marker of [
    "GENERATE → PREVIEW → SAVE OR DISCARD",
    "Generate audit preview",
    "UNSAVED PREVIEW",
    "Room to improve:",
    "0–30 days",
    "31–60 days",
    "61–90 days",
    "Save audit",
    "Discard",
    "discardGeneratedPreview",
    "parseRestaurantAuditSnapshot",
    "SAVED GAPS + VERIFICATION NEEDS",
    "savedSnapshot.honestyNote",
    "Create pending restaurant profile",
    "AUDIT_ONBOARDING_CONSENT_TEXT",
  ]) {
    assert.match(center, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Generated audit UI missing ${marker}`);
  }
  const discardBody = center.match(/function discardGeneratedPreview\(\)[\s\S]*?\n  }/i)?.[0] || "";
  assert.doesNotMatch(discardBody, /await|\.rpc\(|saveGenerated/i, "Discard must remain local and write nothing");
  assert.match(center, /onboardingTargetKey === currentOnboardingTargetKey/, "Onboarding consent must be bound to the selected request and latest run");
  assert.match(center, /run\.id !== runs\[0\]\?\.id/, "Generated audits must target only the latest run");
  assert.match(center, /builderTargetMatchesCurrentSelection/, "Generated saves must remain bound to the selected restaurant and latest run");
  assert.match(center, /hasSavedSnapshotEvidence/, "A positive evidence-backed generated audit must remain reviewable without an invented negative finding");
  assert.match(center, /resetGeneratedAuditDraft\(false\);[\s\S]{0,100}resetOnboardingDraft\(\);[\s\S]{0,100}setSelectedId\(item\.id\)/, "Changing restaurants must clear generator and onboarding drafts");
  assert.match(css, /conic-gradient\(var\(--lime\) 0 var\(--audit-score,0%\)/, "The score ring must reflect the actual audit score");
  assert.doesNotMatch(css, /conic-gradient\(var\(--lime\) 0 75%/, "The score ring must not be hard-coded to 75 percent");
  assert.match(css, /\.audit-signal-card input,[^\n]*font-size: 16px/, "Mobile audit controls must avoid tiny text and focus zoom");
  assert.match(css, /\.audit-consent-check input \{ width: 22px; height: 22px;/, "Mobile consent control must have a usable target");

  for (const rpc of [
    "save_team_generated_audit_v2",
    "complete_team_generated_audit_run_v2",
    "save_team_generated_audit_rerun_v2",
    "veroxa_convert_reviewed_audit_to_pending_profile_v1",
  ]) {
    assert.match(data, new RegExp(rpc), `Sites data adapter missing ${rpc}`);
  }
  assert.match(data, /This does not activate services, connect accounts, authorize publishing, or create charges\./, "Onboarding conversion must use the exact non-activation consent");
});

test("Team navigation exposes only live daily work while focused routes remain reachable from real tasks", async () => {
  const [page, center] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/momo-operating-center.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /const momoPrimaryNav[\s\S]*?label: "Today"[\s\S]*?label: "Work"[\s\S]*?label: "Media"[\s\S]*?label: "Content"[\s\S]*?label: "Momo profile"/, "The daily map must stay limited to five useful destinations");
  assert.match(page, /const teamPrimaryParent/, "Focused routes must return to a stable daily parent on mobile");
  assert.match(page, /value=\{teamPrimaryParent\[view\] \?\? view\}/, "Mobile navigation must remain valid on a focused task route");
  assert.doesNotMatch(page, /More workspace tools/, "The daily map must not expose advanced navigation");
  assert.match(center, /title="Today"/, "Team home must open as a calm daily workspace");
  assert.match(center, /VEROXA IS WORKING ON/, "Team home must show active work");
  assert.match(center, /COMPLETED RECENTLY/, "Team home must show recent outcomes");
  assert.match(center, /External posting off/, "The release boundary must remain unmistakable");
  assert.doesNotMatch(center, /Six clear stages/, "Detailed readiness must not crowd Team home");
  assert.doesNotMatch(center, /Math\.round\([^\n]*verified_count/, "Team readiness must not imply false percentage precision");

  assert.match(center, /const waitingForApproval = item\.status === "waiting_approval"/, "Waiting-approval work must have an explicit UI state");
  assert.match(center, /waitingForApproval[\s\S]{0,900}targetStatus: "in_progress", reason[\s\S]{0,250}Resume after approval/, "Approved work must be resumable with recorded evidence");
  assert.match(center, /waitingForApproval[\s\S]{0,1300}targetStatus: "blocked", reason[\s\S]{0,250}Block work/, "Waiting work must remain blockable with a reason");
  assert.match(center, /\["queued", "in_progress", "waiting_approval", "retrying", "blocked"\]\.includes\(item\.status\)/, "Waiting work must remain cancellable");

  assert.match(center, /useState<ContentWorkspaceSection>\("attention"\)/, "Content must open on the action-first section");
  assert.match(center, /id="content-tab-attention"[\s\S]{0,500}Needs attention/, "Content must expose a Needs attention tab");
  assert.doesNotMatch(center, /id="content-tab-create"|<span>Create<\/span>/, "The retired manual-create branch must not return to the daily portal");
  assert.doesNotMatch(center, /id="content-tab-library"/, "The duplicate legacy content library must remain removed");
  assert.match(center, /id="content-tab-ready"[\s\S]{0,500}Veroxa Ready/, "Validated v2 packages must stay reachable behind one unscheduled Veroxa Ready tab");
  assert.match(center, /hidden=\{activeSection !== "attention"\}/, "Inactive content panels must use progressive disclosure");
  assert.match(center, /openIncidents\.map\(\(incident\)/, "Only unresolved consolidated v2 incidents must enter the visible Team attention queue");
  assert.match(center, /legacyReviewRuns\.map\(\(item\) => <ContentPackageReviewCard/, "Legacy manual review controls must remain available only inside history and recovery");
  assert.match(center, /VEROXA READY · UNSCHEDULED/, "Veroxa Ready must explicitly exclude scheduling and posting");
});

test("Momo operating center uses live tenant data and exact production contracts", async () => {
  const [page, center, data, migration] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/momo-operating-center.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/momo-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/20260716035027_momo_preconnection_foundation.sql", import.meta.url), "utf8"),
  ]);

  assert.match(page, /<MomoOperatingCenter/, "Protected routes must use the database-backed operating center");
  assert.match(page, /"\/client\/content": "content"/, "Client navigation must expose owner content confirmation");
  assert.doesNotMatch(page, /const mediaItems|const setupSteps|Momo close-up photo|Setup progress saved for this session/, "Protected fixture content must be removed");

  for (const table of [
    "veroxa_restaurant_truth_fields", "veroxa_restaurant_contacts", "veroxa_onboarding_steps",
    "veroxa_presence_profiles", "veroxa_readiness_dimensions", "veroxa_media_assets",
    "veroxa_media_rights", "veroxa_media_reviews", "veroxa_ai_jobs",
    "veroxa_content_strategies", "veroxa_content_items", "veroxa_content_variants",
    "veroxa_approvals", "veroxa_content_calendar", "veroxa_provider_connections",
    "veroxa_publish_queue", "veroxa_local_presence_checks", "veroxa_review_records",
    "veroxa_visibility_snapshots", "veroxa_work_items", "veroxa_activity_events",
    "veroxa_reports", "veroxa_monitor_checks", "veroxa_alerts", "veroxa_recovery_runs",
    "veroxa_momo_exception_incidents_v2", "veroxa_momo_ready_packages_v2", "veroxa_momo_ready_variants_v2",
  ]) {
    assert.match(data, new RegExp(`"${table}"`), `${table} must be loaded through the central Momo data contract`);
  }

  for (const field of [
    "identity.display_name", "identity.legal_name", "identity.cuisine",
    "address.primary", "phone.primary", "hours.regular", "hours.special",
    "menu.primary", "services.active", "services.delivery", "services.catering",
    "claims.dietary", "claims.halal", "brand.voice", "brand.positioning",
    "goals.primary", "goals.audience", "goals.customer_action",
  ]) {
    assert.match(center, new RegExp(field.replace(".", "\\.")), `${field} must use the database field-key contract`);
  }

  assert.doesNotMatch(center + data, /"team_verified"|"google_business_profile"|"content_variants"|"owner_content_approval"|"team_content_approval"|"needs_better_version"|status:\s*"scheduled"|status:\s*"draft"|RLS protected/, "Invalid enum values and implementation jargon must stay out");
  assert.match(data, /usageScope:\s*string\[\]/, "Media rights scope input must be an explicit token array");
  assert.match(data, /const usageScope = \[\.\.\.new Set\(input\.usageScope\)\]/, "Media rights tokens must be deduplicated before registration");
  assert.match(data, /usageScope\.some\(\(scope\) => !\["facebook", "instagram", "google_business"\]\.includes\(scope\)\)/, "Media rights tokens must be allowlisted before registration");
  assert.match(data, /p_usage_scope:\s*usageScope/, "Media registration RPC must receive only the validated token array");
  assert.match(center, /"instagram", "facebook", "google_business"/, "Media rights UI must start from the three supported ready-package providers");
  assert.doesNotMatch(center, /"instagram", "facebook", "google_business", "website"/, "Website rights must not appear in the upload-to-ready release");
  assert.match(data, /\.rpc\("veroxa_prepare_momo_ai_job_v1"/, "AI preparation must use the server-validated contract");
  assert.doesNotMatch(data, /from\("veroxa_ai_jobs"\)[\s\S]{0,200}\.insert\(/, "Team code must not insert forgeable AI fixtures directly");
  assert.match(migration, /'\["live_provider_not_connected","human_review_required"\]'::jsonb/, "AI safety flags must be an exact JSON array");
  assert.match(migration, /p_restaurant_id, p_job_kind, p_subject_type, p_subject_id, 'blocked',[\s\S]{0,180}?null, null, 'v1-provider-neutral'/, "AI preparation must remain provider neutral and blocked");
  assert.match(data, /\.rpc\("veroxa_momo_readiness_summary_v1"/, "Final readiness must use the database gate");
  assert.match(data, /\.rpc\("veroxa_momo_client_snapshot_v1"/, "Client reads must use the sanitized snapshot");
  assert.match(data, /\.rpc\("veroxa_apply_confirmation_v1"/, "Team confirmation decisions must be transactional");
  assert.match(data, /\.rpc\("veroxa_apply_approval_v1"/, "Team approval decisions must atomically update their subject");
  assert.match(data, /\.rpc\("veroxa_review_momo_media_v1"/, "Media review replacement and asset state must be atomic");
  assert.match(data, /\.rpc\("veroxa_register_momo_media_v2"/, "Media metadata, rights, and Momo-local expiry must be registered atomically");
  assert.match(data, /p_expires_on:\s*input\.expiresAt \|\| null/, "Rights expiry must be sent as a Momo-local calendar date, not browser-local timestamp");
  assert.match(data, /\.rpc\("veroxa_retry_work_item_v1"/, "Retries must write the bounded attempt ledger transactionally");
  assert.match(data, /\.rpc\("veroxa_submit_momo_confirmation_v1"/, "Owner decisions must use the subject-validating transactional contract");
  assert.match(data, /\.rpc\("veroxa_create_manual_content_draft_v1"/, "Manual drafts must validate owner-confirmed truth and media inputs transactionally");
  assert.match(data, /\.rpc\("veroxa_schedule_momo_variant_v1"/, "Scheduling must convert Momo local time in the database");
  assert.match(data, /\.rpc\("veroxa_transition_work_item_v1"/, "Work completion and failure must emit activity transactionally");
  assert.match(data, /\.rpc\("veroxa_record_monitor_check_v1"/, "Monitoring and alerts must share one transactional contract");
  assert.match(data, /\.rpc\("veroxa_start_recovery_run_v1"/, "Recovery must stay linked to a failed or blocked work item");
  assert.match(data, /\.rpc\("veroxa_complete_recovery_run_v1"/, "Recovery completion must emit evidence transactionally");
  assert.match(data, /\.rpc\("veroxa_provider_preflight_v1"/, "Meta and Google must expose a no-credential fail-closed preflight");
  assert.match(data, /\.rpc\("veroxa_run_momo_readiness_gate_v1"/, "Final readiness must persist a database-derived snapshot");
  assert.match(data, /\.rpc\("veroxa_record_momo_no_go_v1"/, "The rehearsal must persist No-Go without activation");
  assert.match(data, /\.rpc\("veroxa_run_momo_no_go_rehearsal_v1"/, "The final rehearsal must derive its gate and No-Go atomically");
  assert.match(data, /\.rpc\("veroxa_create_momo_report_draft_v1"/, "Report evidence and Momo-local periods must be validated transactionally");
  assert.match(data, /\.rpc\("veroxa_record_momo_media_reuse_v1"/, "Approved media reuse must revalidate current rights and review state transactionally");
  assert.match(data, /\.rpc\("veroxa_queue_momo_publication_v1"/, "Publication queueing must copy the approved database schedule transactionally");
  assert.match(data, /\.rpc\("veroxa_create_truth_revisions_v1"/, "Multi-field Team truth saves must be atomic");
  assert.match(data, /\.rpc\("veroxa_revoke_momo_media_rights_v1"/, "Owners must be able to revoke future media use immediately");
  assert.match(data, /\.rpc\("veroxa_update_momo_onboarding_step_v1"/, "Team onboarding state must use the evidence-validating RPC");
  assert.match(data, /\.rpc\("veroxa_update_momo_presence_v1"/, "Team presence state must use the confirmation-aware RPC");
  assert.match(data, /table:\s*"veroxa_content_input_ledger"/, "Team content reads must include immutable input provenance");
  assert.match(data, /table:\s*"veroxa_activation_decisions"/, "Team readiness reads must include immutable activation decisions");
  assert.match(data, /\.rpc\("veroxa_register_primary_contact_v1"/, "Initial owner contact must use the narrow bootstrap contract");
  assert.match(data, /source:\s*String\(item\.source\)/, "Client truth mapping must preserve the sanitized provenance");
  assert.match(data, /if \(item\.reviewStatus\) result\.mediaReviews\.push/, "Client media mapping must not invent a pending review");
  assert.match(data, /display_name:\s*String\(item\.displayFileName/, "Client media mapping must use the safe display filename");
  assert.match(data, /storage_path:\s*item\.storagePath/, "Client media mapping must preserve the scoped object name for signed previews");
  assert.match(data, /approved_at:\s*item\.approvedAt/, "Client report mapping must preserve the approval timestamp");
  assert.match(data, /rows\(raw\.pendingContentConfirmations\)/, "Client snapshot must expose only sanitized content directions awaiting owner confirmation");
  assert.match(data, /media_display_file_name:\s*item\.mediaDisplayFileName/, "Owner content confirmation must preserve the sanitized attached-media label");
  assert.match(data, /attestation_version:\s*item\.attestationVersion/, "Owner media history must preserve the safe attestation version");
  assert.match(data, /attestation_sha256/, "Team media reads must use the canonical attestation fingerprint column");
  assert.doesNotMatch(data, /attestation_text_sha256/, "Team media reads must not request a non-existent attestation column");
  assert.match(data, /confirmationKind:\s*"content_direction"[\s\S]*?decision:\s*"confirm"/, "Owner content confirmation must append a dedicated confirmation record");
  assert.doesNotMatch(data, /from\("veroxa_confirmations"\)\.insert/, "Client confirmation submissions must not bypass the subject-validating RPC");
  assert.match(center, /Confirm this content direction/, "Clients must be able to submit an owner content-direction confirmation");
  assert.match(center, /function ContentPackageReviewCard[\s\S]*?approveMomoContentPackage/, "The exact generated package must have a reachable Team-review gate");
  assert.match(center, /mediaRendered[\s\S]*?mediaInspected[\s\S]*?Approve exact package and save plan/, "Team approval must require the exact media to render and be inspected");
  assert.match(center, /packageInspected[\s\S]*?factual claims, every platform caption, SEO phrases, hashtags, alt text, calls to action[\s\S]*?!packageInspected/, "Team approval must require explicit inspection of every public package component");
  assert.match(center, /const postText = \[variant\.caption, variant\.call_to_action\.text, variant\.hashtags\.join/, "Ready copy must include the reviewed CTA between caption and hashtags");
  assert.match(center, /subjectType:\s*"report"[\s\S]*?approvalKind:\s*"report_release"/, "Pending reports must have a reachable release review");
  assert.doesNotMatch(center, /approvalKind:\s*item\.requires_owner_confirmation\s*\?\s*"owner_confirmation"/, "Owner content confirmation must not be represented by a Team approval row");
  assert.match(data, /rpc\("veroxa_add_momo_media_tag_v1"/, "Media tagging must preserve provenance through the protected RPC");
  assert.match(data, /rpc\("veroxa_create_manual_variant_v1"/, "Manual variants must use the actor-bound provenance RPC");
  assert.match(data, /rpc\("veroxa_revise_momo_report_draft_v1"/, "Rejected or changes-requested reports must use the validated revision RPC");
  assert.match(data, /rpc\("veroxa_transition_momo_alert_v1"/, "Monitoring alerts must use the audited lifecycle RPC");
  assert.doesNotMatch(data, /from\("veroxa_media_(?:asset_)?tags"\)\.upsert/, "Media tagging must not mutate provenance tables directly");
  assert.doesNotMatch(data, /from\("veroxa_content_variants"\)\.insert/, "Manual variants must not bypass their protected RPC");
  assert.match(data, /input\.role === "client"[\s\S]*?submitMomoConfirmation/, "Owner truth and contact changes must use append-only subject-validating confirmations");
  assert.doesNotMatch(data, /from\("veroxa_provider_connections"\)\.update/, "Client UI must not mutate provider connection state");
  assert.doesNotMatch(data, /from\("veroxa_reports"\)\.insert/, "Report creation must not bypass server-side evidence-period validation");
  assert.doesNotMatch(data, /from\("veroxa_media_usage"\)\.insert/, "Approved reuse must not bypass the rights/review gate");
  assert.doesNotMatch(data, /from\("veroxa_publish_queue"\)\.insert/, "Publication queueing must not bypass approval, provider, and calendar validation");
  assert.match(center, /No readiness percentage is calculated/, "Readiness must remain pass or fail");
  assert.match(center, /Other restaurants remain Restaurant Audit Center records only/, "Runtime readiness must preserve the Momo-only operating boundary");
  assert.match(center, /No cached or sample records are being shown/, "Load failure must fail closed");
  assert.match(center, /No provider is connected/, "Missing integrations must have an honest safe-empty state");
  assert.match(center, /Confirm as shown/, "Owners must be able to confirm an unchanged Team prefill");
  assert.match(center, /Run no-credential preflight/, "Team must be able to prove Meta and Google fail closed without credentials");
  assert.match(center, /Recheck readiness/, "Team must be able to persist a final No-Go rehearsal without activation");
  assert.match(center, /Save step review/, "Team must be able to record onboarding evidence through the narrow contract");
  assert.match(center, /Save presence review/, "Team must be able to record presence evidence through the narrow contract");
  assert.match(center, /accessAuthorized/, "Presence connection must require an explicit owner access-authorization decision");
  assert.match(center, /This does not connect or publish anything now/, "Owner access authorization must preserve the no-execution boundary");
  assert.match(center, /resolveLatestMomoPresenceConfirmation/, "Team connected state must use the latest URL-bound owner access resolution");
  assert.match(center, /Immutable source \{packageRun\.source_content_sha256\.slice/, "Team must see the exact media fingerprint bound to a generated package");
  assert.match(center, /Model \{packageRun\.model\} · prompt \{packageRun\.prompt_version\} · immutable output/, "Provider and immutable output provenance must stay reachable in audit details");
  assert.match(center, /Immutable go \/ no-go evidence/, "Team must be able to audit activation decisions");
  assert.match(center, /momoLocalDate\(event\.occurred_at\)/, "Report preview counts must use Momo local dates");
  assert.match(center, /Content pillar:/, "Owner content confirmation must display the material pillar context");
  assert.match(center, /"facebook_publish", "instagram_publish"/, "Meta preflight must cover Facebook and Instagram independently");
  assert.match(center, /formatZonedDate\(variant\.scheduled_for, variant\.timezone\)/, "Ready-package display must honor the stored IANA timezone");
  assert.match(center, /resolveMomoContentPackageReadiness\(data, item\.id\)/, "Ready must be recomputed from current rights, media, package, and schedule evidence");
  assert.match(center, /\.filter\(\(entry\) => entry\.readiness\.ready\)/, "Blocked or stale packages must not appear as Ready");
  assert.match(center, /const workspaceLoadSequence = useRef\(0\)/, "Workspace refreshes must have a monotonic sequence guard");
  assert.match(center, /requestSequence === workspaceLoadSequence\.current/, "An older Ready response must never overwrite a newer blocked readback");
  assert.match(center, /window\.addEventListener\("focus", refreshVisibleWorkspace\)/, "Ready evidence must refresh when the portal regains focus");
  assert.match(center, /document\.addEventListener\("visibilitychange", refreshVisibleWorkspace\)/, "Ready evidence must refresh when the tab becomes visible");
  assert.match(center, /window\.setInterval\(refreshVisibleWorkspace, 45_000\)/, "An open Ready tab must periodically refresh expiring evidence");
  assert.match(center, /getMomoReadyPackageStatus\(readyPackage\.id\) !== "ready_to_post"[\s\S]*?await reloadWorkspace\(\)/, "Copy and download must recheck authoritative Ready status immediately before use");
  assert.match(center, /runFreshReadyAction\(\(\) => \{[\s\S]*?link\.click\(\)/, "Exact-media download must use the fresh Ready gate");
  assert.match(center, /runFreshReadyAction\(async \(\) => \{[\s\S]*?navigator\.clipboard\.writeText\(postText\)/, "Post-text copy must use the fresh Ready gate");
  assert.match(center, /Plans no longer Ready/, "A latest blocked Ready package must remain visible as a Team action");
  assert.match(center, /Open Media to rebuild/, "A blocked immutable package must have a reachable replacement workflow");
  assert.match(center, /replacementContentNeeded/, "A blocked materialized run must not deadlock media regeneration");
  assert.match(center, /mediaQualityPassed/, "The approval control must independently enforce the strict media-quality gate");
  assert.match(await readFile(new URL("../app/api/team/content-ai/approve/core.ts", import.meta.url), "utf8"), /loadReadyStatus\(readyPackageId\)/, "Approval and replay must recompute authoritative Ready status before responding");
  assert.match(center, /No provider queue or external post exists/, "Ready must explicitly stop before provider execution");
  assert.doesNotMatch(center, /Prepare dormant queue metadata|queueMomoPublication|Request publishing approval/, "Daily content work must not expose posting or dormant provider-queue controls");
  assert.match(center, /getMomoVerifiedMediaPreviewObjectUrl\([\s\S]*?contentSha256: packageRun\.source_content_sha256/, "Package review must open the exact hash-verified private image");
  assert.match(center, /approved_payload\.masterCaption/, "Ready must render the exact approved package rather than regenerating copy");
  assert.match(center, /presenceResolution\.exactUrlConfirmed/, "Presence activation must use the latest exact URL-bound owner decision");
  assert.match(data, /timezone:\s*String\(item\.timezone \|\| "America\/Chicago"\)/, "Client calendar hydration must preserve the stored IANA timezone");
  assert.match(center, /Revoke future media use/, "Owners must have an immediate media-rights revocation path");
  assert.match(center, /rightsReason\.trim\(\)\.length < 10/, "Media-rights revocation must collect the database-required evidence length");
  assert.match(center, /Reject direction/, "Owners must be able to reject a content direction without confirming it");
  assert.doesNotMatch(center, />\s*Go live\s*</i, "The production workspace must not expose an activation control");
});
