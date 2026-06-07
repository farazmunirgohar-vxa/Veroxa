import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
execFileSync(
  "pnpm",
  ["--filter", "@workspace/veroxa", "exec", "tsx", "src/checks/restaurantMatchingRegression.ts"],
  { cwd: root, stdio: "inherit" },
);
