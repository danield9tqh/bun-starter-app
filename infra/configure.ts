import { execSync } from "child_process";
import * as readline from "readline";
import * as fs from "fs";
import * as crypto from "crypto";

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Run bunx alchemy configure
console.log("Running alchemy configure...");
execSync("bunx alchemy configure", { stdio: "inherit" });

// Ask for Cloudflare domain
const domain = await prompt("Enter your Cloudflare domain to deploy to: ");

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
  CLOUDFLARE_DOMAIN: domain,
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
