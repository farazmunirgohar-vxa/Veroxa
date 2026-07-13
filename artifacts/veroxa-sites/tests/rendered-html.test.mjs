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
  const [page, center, data, protectedRoute, authCallback] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/audit-center.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/veroxa-supabase.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/[...slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/auth/callback/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /!contactEmail && !contactPhone/, "Public intake must require email or phone");
  assert.match(page, /state\.kind !== "success" && <form/, "A successful submission must hide the completed form");
  assert.match(page, /setFormStartedAt\(new Date\(\)\.toISOString\(\)\)/, "A new submission must rotate timing state");
  assert.match(page, /refreshExpiredAuditSession/, "An old open audit form must refresh its security timestamp");
  assert.doesNotMatch(page, /activeNav\.slice/, "Mobile Team navigation must not silently drop routes");
  assert.match(page, /signOutBusy \? "Signing out" : "Sign out"/, "Mobile Team navigation must expose sign out");
  assert.match(page, /const handleSignOut = async/, "Sign out controls must share an error-aware handler");
  assert.match(page, /You are still signed in/, "Failed sign out must preserve and explain the signed-in state");
  assert.match(data, /error\.status === 429/, "Magic-link requests must classify HTTP rate limits");
  assert.match(data, /error\.code === "over_email_send_rate_limit"/, "Magic-link requests must preserve Supabase email-limit meaning");
  assert.match(data, /throw new Error\("magic_link_rate_limited"\)/, "Magic-link requests must return a controlled rate-limit failure");
  assert.match(data, /VEROXA_PRODUCTION_ORIGIN = "https:\/\/veroxasystems\.com"/, "Production magic links must use the canonical Veroxa origin");
  assert.match(data, /emailRedirectTo: `\$\{getAuthCallbackOrigin\(\)\}\/auth\/callback`/, "Magic links must use one exact production callback URL");
  assert.match(data, /veroxa_auth_return_to/, "Magic-link return paths must be preserved outside the callback URL allowlist");
  assert.match(authCallback, /cookieStore\.get\(AUTH_RETURN_COOKIE\)/, "Auth callback must recover the validated return path from its short-lived cookie");
  assert.match(authCallback, /maxAge: 0/, "Auth callback must clear its short-lived return-path cookie");
  assert.match(page, /Too many secure emails were requested during setup/, "Login must explain a temporary email limit without exposing account existence");
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

test("Momo operating center uses live tenant data and exact production contracts", async () => {
  const [page, center, data] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/momo-operating-center.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/momo-data.ts", import.meta.url), "utf8"),
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
  ]) {
    assert.match(data, new RegExp(`"${table}"`), `${table} must be loaded through the central Momo data contract`);
  }

  for (const field of [
    "identity.display_name", "address.primary", "phone.primary", "hours.regular",
    "menu.primary", "services.active", "claims.dietary", "claims.halal",
    "brand.voice", "goals.primary",
  ]) {
    assert.match(center, new RegExp(field.replace(".", "\\.")), `${field} must use the database field-key contract`);
  }

  assert.doesNotMatch(center + data, /"team_verified"|"google_business_profile"|"content_variants"|"owner_content_approval"|"team_content_approval"|"needs_better_version"|status:\s*"scheduled"|status:\s*"draft"|RLS protected/, "Invalid enum values and implementation jargon must stay out");
  assert.match(data, /usageScope:\s*string\[\]/, "Media rights scope input must be an explicit token array");
  assert.match(data, /p_usage_scope:\s*input\.usageScope/, "Media registration RPC must receive the validated JSON token array");
  assert.match(center, /"instagram", "facebook", "google_business", "website"/, "Media rights UI must start from allowed provider tokens");
  assert.match(data, /safety_flags:\s*\["live_provider_not_connected", "human_review_required"\]/, "AI safety flags must be a JSON array");
  assert.match(data, /provider_key:\s*null[\s\S]*?model_key:\s*null/, "AI preparation must remain provider neutral");
  assert.match(data, /\.rpc\("veroxa_momo_readiness_summary_v1"/, "Final readiness must use the database gate");
  assert.match(data, /\.rpc\("veroxa_momo_client_snapshot_v1"/, "Client reads must use the sanitized snapshot");
  assert.match(data, /\.rpc\("veroxa_apply_confirmation_v1"/, "Team confirmation decisions must be transactional");
  assert.match(data, /\.rpc\("veroxa_apply_approval_v1"/, "Team approval decisions must atomically update their subject");
  assert.match(data, /\.rpc\("veroxa_review_momo_media_v1"/, "Media review replacement and asset state must be atomic");
  assert.match(data, /\.rpc\("veroxa_register_momo_media_v1"/, "Media metadata and rights must be registered atomically");
  assert.match(data, /\.rpc\("veroxa_retry_work_item_v1"/, "Retries must write the bounded attempt ledger transactionally");
  assert.match(data, /\.rpc\("veroxa_register_primary_contact_v1"/, "Initial owner contact must use the narrow bootstrap contract");
  assert.match(data, /source:\s*String\(item\.source\)/, "Client truth mapping must preserve the sanitized provenance");
  assert.match(data, /if \(item\.reviewStatus\) result\.mediaReviews\.push/, "Client media mapping must not invent a pending review");
  assert.match(data, /display_name:\s*String\(item\.displayFileName/, "Client media mapping must use the safe display filename");
  assert.match(data, /storage_path:\s*item\.storagePath/, "Client media mapping must preserve the scoped object name for signed previews");
  assert.match(data, /approved_at:\s*item\.approvedAt/, "Client report mapping must preserve the approval timestamp");
  assert.match(data, /rows\(raw\.pendingContentConfirmations\)/, "Client snapshot must expose only sanitized content directions awaiting owner confirmation");
  assert.match(data, /confirmation_kind:\s*"content_direction"[\s\S]*?decision:\s*"confirm"/, "Owner content confirmation must append a dedicated confirmation record");
  assert.doesNotMatch(data, /from\("veroxa_confirmations"\)\.insert\(\{[^;]+?\}\)\.select/, "Client confirmation inserts must not require table SELECT permission for RETURNING");
  assert.match(center, /Confirm this content direction/, "Clients must be able to submit an owner content-direction confirmation");
  assert.match(center, /subjectType:\s*"content_variant"[\s\S]*?approvalKind:\s*"team_review"/, "Pending platform variants must have a reachable Team-review gate");
  assert.match(center, /subjectType:\s*"report"[\s\S]*?approvalKind:\s*"report_release"/, "Pending reports must have a reachable release review");
  assert.doesNotMatch(center, /approvalKind:\s*item\.requires_owner_confirmation\s*\?\s*"owner_confirmation"/, "Owner content confirmation must not be represented by a Team approval row");
  assert.match(data, /select\("asset_id, tag_id"\)/, "Media tagging must read the join table's real composite key");
  assert.match(data, /input\.role === "client"[\s\S]*?\.from\("veroxa_confirmations"\)/, "Owner truth and contact changes must be append-only confirmations");
  assert.doesNotMatch(data, /from\("veroxa_provider_connections"\)\.update/, "Client UI must not mutate provider connection state");
  assert.match(center, /No readiness percentage is calculated/, "Readiness must remain pass or fail");
  assert.match(center, /Other restaurants remain Restaurant Audit Center records only/, "Runtime readiness must preserve the Momo-only operating boundary");
  assert.match(center, /No cached or sample records are being shown/, "Load failure must fail closed");
  assert.match(center, /No provider is connected/, "Missing integrations must have an honest safe-empty state");
});
