import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const dataModule = new URL("../app/momo-data.ts", import.meta.url).href;

const hydrateInTypescriptRuntime = (raw) => {
  const source = `
    import { hydrateMomoClientSnapshot } from ${JSON.stringify(dataModule)};
    const raw = JSON.parse(process.env.MOMO_SNAPSHOT_FIXTURE);
    const hydrated = hydrateMomoClientSnapshot(raw, "restaurant-fixture");
    console.log(JSON.stringify({
      contentItems: hydrated.contentItems,
      variants: hydrated.variants,
      calendar: hydrated.calendar,
      reports: hydrated.reports,
      connections: hydrated.connections,
      readiness: hydrated.readiness,
      readinessGate: hydrated.readinessGate,
    }));
  `;
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", "--input-type=module", "--eval", source],
    {
      cwd: appRoot,
      encoding: "utf8",
      env: { ...process.env, MOMO_SNAPSHOT_FIXTURE: JSON.stringify(raw) },
    },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
};

test("client calendar hydration never invents content or variant approval", () => {
  const hydrated = hydrateInTypescriptRuntime({
    contentCalendar: [{
      contentItemId: "content-1",
      title: "Client-visible calendar item",
      variantId: "variant-1",
      platform: "instagram",
      caption: "Plain factual caption.",
      calendarStatus: "scheduled",
      scheduledFor: "2026-07-20T18:00:00.000Z",
      timezone: "America/Chicago",
    }],
  });

  assert.equal(hydrated.contentItems[0].status, "unknown");
  assert.equal(hydrated.variants[0].status, "unknown");
  assert.equal(hydrated.calendar[0].status, "scheduled");
});

test("client hydration preserves explicit state and rejects malformed calendar rows", () => {
  const hydrated = hydrateInTypescriptRuntime({
    contentCalendar: [
      {
        contentItemId: "content-1",
        contentItemStatus: "in_review",
        title: "Complete row",
        variantId: "variant-1",
        variantStatus: "pending",
        platform: "facebook",
        caption: "Complete caption.",
        calendarStatus: "scheduled",
      },
      {
        contentItemId: "content-2",
        title: "Missing caption",
        variantId: "variant-2",
        platform: "instagram",
        calendarStatus: "queued",
      },
    ],
  });

  assert.deepEqual(hydrated.contentItems.map((item) => item.status), ["in_review"]);
  assert.deepEqual(hydrated.variants.map((item) => item.status), ["pending"]);
  assert.equal(hydrated.calendar.length, 1);
});

test("client report hydration drops rows whose status is absent instead of approving them", () => {
  const hydrated = hydrateInTypescriptRuntime({
    reports: [
      {
        id: "report-without-state",
        reportType: "weekly",
        periodStart: "2026-07-01",
        periodEnd: "2026-07-07",
        summary: { text: "Must not be treated as approved." },
      },
      {
        id: "report-pending",
        reportType: "weekly",
        periodStart: "2026-07-08",
        periodEnd: "2026-07-14",
        status: "pending",
        summary: { text: "Explicit pending state." },
      },
    ],
  });

  assert.deepEqual(hydrated.reports.map((report) => report.id), ["report-pending"]);
  assert.equal(hydrated.reports[0].status, "pending");
});

test("client hydration ignores provider and technical-readiness blocks entirely", () => {
  const hydrated = hydrateInTypescriptRuntime({
    connections: [{
      provider: "meta",
      status: "connected",
      eligibleCapabilities: ["instagram_publish"],
      ownerAuthorizedAt: "2026-07-13T17:00:00.000Z",
      lastVerifiedAt: "2026-07-13T17:30:00.000Z",
      capabilities: ["must_not_be_hydrated"],
      ownerAuthorizedBy: "must_not_be_hydrated",
    }],
    readiness: {
      dimensions: [{ dimensionKey: "provider_runtime", label: "Provider runtime", status: "blocked" }],
      latestGate: { status: "blocked", requiredCount: 7, blockerCount: 3, canActivate: false },
    },
  });

  assert.deepEqual(hydrated.connections, []);
  assert.deepEqual(hydrated.readiness, []);
  assert.equal(hydrated.readinessGate, null);
});
