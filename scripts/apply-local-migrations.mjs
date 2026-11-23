import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const outputConfig = path.join(root, "dist/server/wrangler.json");
const migrationDirectory = path.join(root, "drizzle");
const stateDirectory = path.join(root, ".wrangler");
const statePath = path.join(stateDirectory, "applied-migrations.json");
if (!existsSync(outputConfig)) {
  console.error("Build the Worker first with `npm run build` so the local D1 binding is configured.");
  process.exit(1);
}
mkdirSync(stateDirectory, { recursive: true });
const applied = existsSync(statePath) ? JSON.parse(readFileSync(statePath, "utf8")) : [];
const files = readdirSync(migrationDirectory).filter((file) => /^\d+_.+\.sql$/.test(file)).sort();
for (const file of files) {
  if (applied.includes(file)) continue;
  console.log(`Applying local D1 migration ${file}`);
  const result = spawnSync(process.execPath, [
    "--import", "./scripts/sites-env.mjs", "./node_modules/wrangler/bin/wrangler.js",
    "d1", "execute", "DB", "--local", "--config", "dist/server/wrangler.json",
    "--persist-to", ".wrangler/state", "--file", path.join("drizzle", file),
  ], { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
  applied.push(file);
  writeFileSync(statePath, `${JSON.stringify(applied, null, 2)}\n`);
}
if (!files.length) console.log("No SQL migrations found.");
