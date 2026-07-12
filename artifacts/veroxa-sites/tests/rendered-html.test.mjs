import assert from "node:assert/strict";
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

test("renders the Veroxa public and portal route shell", async () => {
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
    ["/login", "Choose a pre-live view"],
    ["/client/dashboard", "Welcome, Momo’s House"],
    ["/client/onboarding", "Setup your growth system"],
    ["/client/media", "Send what is easy"],
    ["/client/reports", "Simple reports"],
    ["/team/momo", "Operating snapshot"],
    ["/team/momo/work", "Momo work queue"],
    ["/team/momo/intelligence", "Verified knowledge"],
    ["/team/momo/content-ai", "Prepared, reviewed, controlled"],
    ["/team/momo/reports", "Evidence before claims"],
    ["/team/momo/readiness", "Activation remains a separate decision"],
  ]) {
    const response = await worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), env, ctx);
    assert.equal(response.status, 200, `${path} should render`);
    const html = await response.text();
    assert.match(html, /VEROXA|Veroxa/i, `${path} should carry Veroxa identity`);
    assert.match(html, new RegExp(expected, "i"), `${path} should server-render its route-specific surface`);
    assert.doesNotMatch(html, /Starter Project|clean starting point/i, `${path} must not expose starter metadata`);
    if (path === "/login") {
      assert.match(html, /public pre-live shells/i, "Login must disclose the public pre-live access state");
      assert.doesNotMatch(html, /SECURE PORTAL ACCESS|owner-restricted|Open the internal operating workspace/i, "Login must not imply unenforced secure/internal access");
    }
    if (path === "/team/momo") {
      assert.match(html, /Public pre-live shell/i, "Team shell must disclose its public pre-live state");
      assert.doesNotMatch(html, />Internal only</i, "Team shell must not claim unenforced internal-only access");
    }
  }
});
