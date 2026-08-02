import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("keeps Direction 1 branding and click-safe visual layers in place", async () => {
  const [page, styles, hero] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../public/brand/veroxa-hospitality-hero.webp", import.meta.url)),
  ]);

  assert.match(page, /<img[\s\S]*?src="\/brand\/veroxa-hospitality-hero\.webp"[\s\S]*?fetchPriority="high"/);
  assert.doesNotMatch(page, /from "next\/image"/);
  assert.match(page, /className="public-hero-media"/);
  assert.ok(hero.byteLength > 20_000, "The hospitality hero asset must not be an empty placeholder");
  assert.ok(hero.byteLength < 500_000, "The public hero must stay lightweight enough for production delivery");

  assert.match(styles, /--forest:\s*#183d32/);
  assert.match(styles, /--paper:\s*#f7f2e8/);
  assert.match(styles, /--lime:\s*#b7d85b/);
  assert.match(styles, /--font-ui:/);
  assert.match(styles, /--font-display:/);

  assert.match(
    styles,
    /\.public-hero-media:after\s*\{[^}]*pointer-events:\s*none/s,
    "The hero treatment must never intercept links or controls",
  );
  assert.match(
    styles,
    /\.toast\s*\{[^}]*pointer-events:\s*none/s,
    "Temporary notices must never block portal clicks",
  );
  assert.doesNotMatch(
    styles,
    /\[aria-disabled=[^\]]+\]\s*\{[^}]*pointer-events:\s*none/s,
    "Safety-locked review controls must remain clickable so they can explain blockers",
  );
});
