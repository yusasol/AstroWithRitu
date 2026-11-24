import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const sourceConfigPath = path.join(root, "wrangler.jsonc");
const builtConfigPath = path.join(root, "dist/server/wrangler.json");
const placeholderDatabaseId = "00000000-0000-4000-8000-000000000000";
const wranglerBin = path.join(root, "node_modules/wrangler/bin/wrangler.js");

function readJsonc(filePath) {
  const source = readFileSync(filePath, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  return JSON.parse(source);
}

function databaseConfig(config, label) {
  const database = config.d1_databases?.find((entry) => entry.binding === "DB");
  if (!database?.database_name || !database.database_id) {
    console.error(`${label} must define a D1 database with binding "DB", database_name, and database_id.`);
    process.exit(1);
  }
  return database;
}

function runWrangler(args) {
  const result = spawnSync(process.execPath, [wranglerBin, ...args], { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}

const sourceConfig = readJsonc(sourceConfigPath);
const sourceDatabase = databaseConfig(sourceConfig, "wrangler.jsonc");
const command = process.argv[2];

if (command === "create-db") {
  runWrangler(["d1", "create", sourceDatabase.database_name]);
}

if (command === "apply-remote" || command === "deploy") {
  if (sourceDatabase.database_id === placeholderDatabaseId) {
    console.error("Replace database_id in wrangler.jsonc with the id printed by `npm run db:create` before this command.");
    process.exit(1);
  }
}

if (command === "apply-remote") {
  runWrangler(["d1", "migrations", "apply", "DB", "--remote", "--config", "wrangler.jsonc"]);
}

if (command === "deploy") {
  if (!existsSync(builtConfigPath)) {
    console.error("Build the Worker first with `npm run build`.");
    process.exit(1);
  }
  const builtDatabase = databaseConfig(readJsonc(builtConfigPath), "dist/server/wrangler.json");
  if (builtDatabase.database_id !== sourceDatabase.database_id || builtDatabase.database_name !== sourceDatabase.database_name) {
    console.error("dist/server/wrangler.json does not match wrangler.jsonc. Run `npm run build` after changing the D1 database.");
    process.exit(1);
  }
  runWrangler(["deploy", "--config", "dist/server/wrangler.json"]);
}

console.error("Usage: node scripts/cf-worker.mjs <create-db|apply-remote|deploy>");
process.exit(1);
