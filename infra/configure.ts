/**
 * This file is for initial project configuration only.
 * It can be safely removed after running `bun run infra/configure.ts`.
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as crypto from "crypto";
import { createCloudflareApi } from "alchemy/cloudflare";
import { outro, select, text, isCancel, log } from "@clack/prompts";
import pc from "picocolors";
import pkg from "../package.json" assert { type: "json" };

// Prompts user to select or enter a domain
async function getDomain(): Promise<string> {
  const api = await createCloudflareApi({});
  const response = await api.get("/zones?per_page=10");
  const data = (await response.json()) as { result: { name: string }[] };
  const zones = data.result.map((z) => z.name);

  const options = [
    ...zones.map((z) => ({ value: z, label: z })),
    { value: "__other__", label: "Other (enter manually)" },
  ];

  const selected = await select({
    message: "Select a domain:",
    options,
  });

  if (isCancel(selected)) {
    log.error("Configuration cancelled.");
    process.exit(1);
  }

  let domain: string;
  if (selected === "__other__") {
    const entered = await text({ message: "Enter your domain:" });
    if (isCancel(entered)) {
      log.error("Configuration cancelled.");
      process.exit(1);
    }
    domain = entered;
  } else {
    domain = selected;
  }

  const subdomain = await text({
    message: "Enter subdomain (or press Enter for no subdomain):",
    placeholder: `e.g. ${pkg.name} app, api`,
  });

  if (isCancel(subdomain)) {
    log.error("Configuration cancelled.");
    process.exit(1);
  }

  return subdomain ? `${subdomain}.${domain}` : domain;
}

// Run bunx alchemy configure
try {
  execSync("bunx alchemy configure", { stdio: "inherit" });
} catch {
  log.error("Alchemy configuration cancelled or failed.");
  process.exit(1);
}

// Get domain from Cloudflare zones
const domain = await getDomain();

// Generate a random hashed string for the alchemy password
const randomBytes = crypto.randomBytes(32);
const alchemyPassword = crypto
  .createHash("sha256")
  .update(randomBytes)
  .digest("hex");

// Fail if .env already exists
const envPath = ".env";
if (fs.existsSync(envPath)) {
  log.error(
    ".env file already exists. This repo may have already been configured.",
  );
  process.exit(1);
}

// Write .env file
const env = {
  CUSTOM_DOMAIN: domain,
  ALCHEMY_PASSWORD: alchemyPassword,
};
const envContent =
  Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n") + "\n";
fs.writeFileSync(envPath, envContent);

log.info(`CUSTOM_DOMAIN and ALCHEMY_PASSWORD written to .env file.`);
outro(
  `Configuration complete! Run ${pc.cyan("bun run deploy")} to deploy to ${domain}`,
);
