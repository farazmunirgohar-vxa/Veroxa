import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import {
  getVeroxaPasswordIssue,
  isVeroxaPasswordCompromised,
  pwnedRangeContainsHash,
  sha1Hex,
} from "../app/veroxa-password.mjs";

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
    "/team/momo/content-ai",
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
  assert.match(data, /error\.code === "over_email_send_rate_limit"/, "Magic-link requests must preserve Supabase email-limit meaning");
  assert.doesNotMatch(data, /over_request_rate_limit|normalizedMessage\.includes\("rate limit"\)/, "Magic-link classification must not conflate unrelated request limits or brittle message text");
  assert.match(data, /throw new Error\("magic_link_rate_limited"\)/, "Magic-link requests must return a controlled rate-limit failure");
  assert.match(data, /VEROXA_PRODUCTION_ORIGIN = "https:\/\/veroxasystems\.com"/, "Production magic links must use the canonical Veroxa origin");
  assert.match(data, /emailRedirectTo: `\$\{getAuthCallbackOrigin\(\)\}\/auth\/callback`/, "Magic links must use one exact production callback URL");
  assert.match(data, /veroxa_auth_return_to/, "Magic-link return paths must be preserved outside the callback URL allowlist");
  assert.match(data, /Domain=veroxasystems\.com/, "Recovery return cookie must survive the www-to-apex callback");
  assert.match(data, /signInWithPassword/, "Approved identities must support permanent password sign-in");
  assert.match(data, /updateUser\(\{ password \}\)/, "A freshly authenticated user must be able to replace their password");
  assert.match(data, /signOut\(\{ scope: "local" \}\)/, "Failed post-login authorization must clear the new browser session");
  assert.match(data, /signOut\(\{ scope: "others" \}\)/, "Password replacement must revoke other refresh sessions when available");
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
  assert.match(data, /p_usage_scope:\s*input\.usageScope/, "Media registration RPC must receive the validated JSON token array");
  assert.match(center, /"instagram", "facebook", "google_business", "website"/, "Media rights UI must start from allowed provider tokens");
  assert.match(data, /safety_flags:\s*\["live_provider_not_connected", "human_review_required"\]/, "AI safety flags must be a JSON array");
  assert.match(data, /provider_key:\s*null[\s\S]*?model_key:\s*null/, "AI preparation must remain provider neutral");
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
  assert.match(center, /subjectType:\s*"content_variant"[\s\S]*?approvalKind:\s*"team_review"/, "Pending platform variants must have a reachable Team-review gate");
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
  assert.match(center, /Run final no-go rehearsal/, "Team must be able to persist a final No-Go rehearsal without activation");
  assert.match(center, /Save step review/, "Team must be able to record onboarding evidence through the narrow contract");
  assert.match(center, /Save presence review/, "Team must be able to record presence evidence through the narrow contract");
  assert.match(center, /accessAuthorized/, "Presence connection must require an explicit owner access-authorization decision");
  assert.match(center, /This does not connect or publish anything now/, "Owner access authorization must preserve the no-execution boundary");
  assert.match(center, /resolveLatestMomoPresenceConfirmation/, "Team connected state must use the latest URL-bound owner access resolution");
  assert.match(center, /Immutable content evidence/, "Team must be able to audit content-input provenance");
  assert.match(center, /Immutable go \/ no-go evidence/, "Team must be able to audit activation decisions");
  assert.match(center, /momoLocalDate\(event\.occurred_at\)/, "Report preview counts must use Momo local dates");
  assert.match(center, /Content pillar:/, "Owner content confirmation must display the material pillar context");
  assert.match(center, /"facebook_publish", "instagram_publish"/, "Meta preflight must cover Facebook and Instagram independently");
  assert.match(center, /formatZonedDate\(entry\.scheduled_for, entry\.timezone\)/, "Calendar display must honor the stored IANA timezone");
  assert.match(center, /A current future America\/Chicago schedule is required before publishing approval/, "Publishing approval must bind to a current future Momo-local schedule");
  assert.match(center, /momoCalendarEntryIsCurrentApproved\(entry\)/, "Canceled, failed, draft, or past calendar rows must not unlock publishing approval");
  assert.match(center, /preflight\?\.allowed[\s\S]*?Prepare dormant queue metadata/, "Queue preparation must remain hidden until the no-credential provider preflight passes");
  assert.match(center, /mediaIsCurrentlyUsable\(data, item\.primary_media_asset_id/, "Text-only and stale-media directions must remain outside the public variant workflow");
  assert.match(center, /validateMomoPlatformVariantCaption/, "Manual variants and later review gates must lint sensitive claims against owner truth");
  assert.match(center, /selectedTruth\.map[\s\S]*?selectedMedia\?\.id[\s\S]*?selectedTruth\.map/, "Draft submission must use only the exact currently validated truth and media selections");
  assert.match(center, /presenceResolution\.exactUrlConfirmed/, "Presence activation must use the latest exact URL-bound owner decision");
  assert.match(data, /timezone:\s*String\(item\.timezone \|\| "America\/Chicago"\)/, "Client calendar hydration must preserve the stored IANA timezone");
  assert.match(center, /Revoke future media use/, "Owners must have an immediate media-rights revocation path");
  assert.match(center, /rightsReason\.trim\(\)\.length < 10/, "Media-rights revocation must collect the database-required evidence length");
  assert.match(center, /Reject direction/, "Owners must be able to reject a content direction without confirming it");
  assert.doesNotMatch(center, />\s*Go live\s*</i, "The production workspace must not expose an activation control");
});
