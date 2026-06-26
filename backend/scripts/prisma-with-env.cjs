/**
 * Run Prisma CLI with DATABASE_URL / DIRECT_URL from the monorepo root `.env`
 * (same as server.js / docker-migrate.sh). Derives DIRECT_URL when only DATABASE_URL is set.
 *
 * Usage:
 *   npm run migrate:deploy
 *   npm run prisma -- migrate deploy
 */
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const dotenv = require("dotenv");

const backendDir = path.join(__dirname, "..");
const repoRoot = path.join(backendDir, "..");

const dotenvOpts = { quiet: true };
dotenv.config({ path: path.join(repoRoot, ".env"), ...dotenvOpts });
dotenv.config({ path: path.join(backendDir, ".env"), ...dotenvOpts });

const { ensureDatabaseUrlEnv, DEFAULT_LOCAL_DATABASE_URL } = require("../src/utils/databaseUrl");

const hasEnv = ensureDatabaseUrlEnv({ allowLocalDefault: true });

if (!hasEnv) {
  console.error(
    "ERROR: DATABASE_URL is not set.\n" +
      "Copy .env.docker.example to .env in the project root and set DATABASE_URL,\n" +
      "or start local Postgres with ./scripts/docker-up.sh and run:\n" +
      `  npm run migrate:deploy`
  );
  process.exit(1);
}

if (process.env.DATABASE_URL === DEFAULT_LOCAL_DATABASE_URL) {
  console.warn(
    "Using default local DATABASE_URL (localhost:5435). Set DATABASE_URL in .env to override."
  );
}

const prismaCli = require.resolve("prisma/build/index.js");
const args = process.argv.slice(2);
const result = spawnSync(process.execPath, [prismaCli, ...args], {
  cwd: backendDir,
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
