/**
 * This file is for initial project configuration only.
 * It can be safely removed after running `bun run infra/configure.ts`.
 */

import { execSync } from "child_process";
import * as readline from "readline";
import * as fs from "fs";
import * as crypto from "crypto";
import { createCloudflareApi } from "alchemy/cloudflare";

function prompt(question: string, options?: string[]): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  if (options) {
    console.log(question);
    options.forEach((opt, i) => console.log(`  ${i + 1}. ${opt}`));
    question = "Enter number: ";
  }

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      if (options) {
        const index = parseInt(answer, 10) - 1;
        resolve(
          index >= 0 && index < options.length ? options[index] : options[0],
        );
      } else {
        resolve(answer);
      }
    });
  });
}

// Prompts user to select or enter a domain
async function getDomain(): Promise<string> {
  const api = await createCloudflareApi({});
  const response = await api.get("/zones?per_page=50");
  const data = (await response.json()) as { result: { name: string }[] };
  const zones = data.result.map((z) => z.name);

  const options = [...zones, "Other (enter manually)"];
  const selected = await prompt("Select a domain:", options);

  let domain: string;
  if (selected === "Other (enter manually)") {
    domain = await prompt("Enter your domain: ");
  } else {
    domain = selected;
  }

  const subdomainOptions = ["None (use root domain)", "Enter subdomain"];
  const subdomainChoice = await prompt("Subdomain?", subdomainOptions);

  if (subdomainChoice === "Enter subdomain") {
    const subdomain = await prompt("Enter subdomain (without the domain): ");
    return `${subdomain}.${domain}`;
  }

  return domain;
}

// Run bunx alchemy configure
try {
  execSync("bunx alchemy configure", { stdio: "inherit" });
} catch {
  console.log("Alchemy configuration cancelled or failed.");
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
  throw new Error(
    ".env file already exists. This repo may have already been configured.",
  );
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

console.log("\n✓ Configuration complete!");
console.log(`  Domain: ${domain}`);
console.log(`  Alchemy password has been generated and saved to .env`);
