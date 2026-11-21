// Runs the AutoDM unit tests without a build step (the project's own `pnpm test` runs them through tsx too).
//   node __tests__/autodm/run-tests.mjs
import { createRequire } from "node:module";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(join(root, "package.json"));
const ts = require("typescript");
const out = mkdtempSync(join(tmpdir(), "autodm-tests-"));

// Pure modules only (no database, no Next.js imports).
const files = [
  "autodm/config.ts", "autodm/settings-defs.ts", "autodm/readiness.ts", "autodm/token-vault.ts", "autodm/crypto-utils.ts", "autodm/windows.ts",
  "autodm/url-safety.ts", "autodm/csv.ts", "autodm/redact.ts", "autodm/throttle.ts", "autodm/types.ts", "autodm/normalizer.ts", "autodm/matcher.ts",
  "autodm/composer.ts", "autodm/guards.ts", "autodm/errors.ts", "autodm/api/match.ts",
  "__tests__/autodm/fixtures/webhooks.ts", "__tests__/autodm/pure.test.ts", "__tests__/autodm/flow.test.ts",
];
for (const f of files) {
  const dest = join(out, f.replace(/\.ts$/, ".js"));
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, ts.transpileModule(readFileSync(join(root, f), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText);
}
const r = spawnSync(process.execPath, ["--test", join(out, "__tests__/autodm/pure.test.js"), join(out, "__tests__/autodm/flow.test.js")], { stdio: "inherit" });
process.exit(r.status ?? 1);
