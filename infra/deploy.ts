import { $ } from "bun";
import { join } from "path";
import alchemy from "alchemy";
import { D1Database, Worker, Assets } from "alchemy/cloudflare";
import { RandomString } from "alchemy/random";
import pkg from "../package.json" assert { type: "json" };

if (!process.env.CUSTOM_DOMAIN) {
  console.error("ERROR: CUSTOM_DOMAIN environment variable is not set.");
  process.exit(1);
} else if (!process.env.ALCHEMY_PASSWORD) {
  console.error("ERROR: ALCHEMY_PASSWORD environment variable is not set.");
  process.exit(1);
}

const customDomain = process.env.CUSTOM_DOMAIN;

// Resolve paths
const infraDir = import.meta.dir;
const rootDir = join(infraDir, "..");

// Initialize alchemy
const app = await alchemy(pkg.name, {
  phase: process.argv.includes("--destroy") ? "destroy" : "up",
  password: process.env.ALCHEMY_PASSWORD,
});

// Build frontend first
console.log("🔄 Building frontend...");
await Bun.build({
  entrypoints: [join(rootDir, "frontend/index.html")],
  outdir: join(rootDir, "dist"),
  sourcemap: "external",
  target: "browser",
  minify: true,
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});

// Generate migrations from schema
console.log("🔄 Generating migrations from schema...");
await $`drizzle-kit generate --dialect=sqlite --schema=./auth/db-schema.ts --out=./infra/migrations`.cwd(
  rootDir
);

// Create D1 Database with migrations
const db = await D1Database("db", {
  adopt: true,
  migrationsDir: join(infraDir, "migrations"),
});

// Create assets binding
const assets = await Assets({
  path: join(rootDir, "dist"),
});

// Generate auth secret (persisted in alchemy state, uploaded as secret_text binding)
const authSecret = await RandomString("auth-secret", {
  length: 32,
  encoding: "base64",
});

// Create the worker
const worker = await Worker("worker", {
  entrypoint: join(infraDir, "index.ts"),
  compatibility: "node",
  bindings: {
    DB: db,
    ASSETS: assets,
    BETTER_AUTH_SECRET: authSecret.value,
  },
  domains: [customDomain],
  url: true,
  adopt: true,
  assets: {
    not_found_handling: "single-page-application",
  },
  observability: {
    enabled: true,
    headSamplingRate: 1,
    logs: {
      invocationLogs: true,
    },
  },
});

console.log(`✅ Deployed to: https://${customDomain}`);
if (worker.url) {
  console.log(`✅ Workers.dev URL: ${worker.url}`);
}

await app.finalize();
