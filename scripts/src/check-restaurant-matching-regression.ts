import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const scriptsRoot = resolve(import.meta.dirname, "..");
execFileSync(
  process.execPath,
  ["--import", "tsx", "../artifacts/veroxa/src/checks/restaurantMatchingRegression.ts"],
  { cwd: scriptsRoot, stdio: "inherit" },
);
