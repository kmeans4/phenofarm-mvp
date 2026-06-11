#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const APP_NAME = "PhenoFarm";
const REQUIRED = [
  "DATABASE_URL",
  "NEXTAUTH_URL",
  "AUTH_SECRET",
  "NEXT_PUBLIC_API_URL"
];
const OPTIONAL = [
  "STRIPE_SECRET_KEY",
  "STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRO_PRICE_ID",
  "STRIPE_BUSINESS_PRICE_ID"
];
const ALL_KEYS = [...REQUIRED, ...OPTIONAL];
const PLACEHOLDER_RE = /^(|change-me|change-me-too|replace-with.*|your[-_].*|\[.*\]|postgresql:\/\/\[|postgres:\/\/USER|postgresql:\/\/USER|sk_test_|pk_test_|whsec_|billing@example\.com)$/i;

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const raw of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function loadRuntimeEnv() {
  const cwd = process.cwd();
  const files = [".env", ".env.local", ".env.production"].map((name) => path.join(cwd, name));
  return Object.assign({}, ...files.map(parseEnvFile), process.env);
}

function fail(messages) {
  console.error("[env:check] " + APP_NAME + " failed:");
  for (const message of messages) console.error("- " + message);
  process.exit(1);
}

const mode = process.argv.includes("--runtime") ? "runtime" : "example";
const example = parseEnvFile(path.join(process.cwd(), ".env.example"));
const problems = [];

for (const key of ALL_KEYS) {
  if (!(key in example)) problems.push(".env.example is missing " + key);
}

for (const key of Object.keys(example)) {
  if (!ALL_KEYS.includes(key)) problems.push(".env.example has undocumented key " + key);
}

if (mode === "runtime") {
  const runtime = loadRuntimeEnv();
  for (const key of REQUIRED) {
    const value = String(runtime[key] ?? "").trim();
    if (!value) problems.push("runtime env is missing required " + key);
    else if (PLACEHOLDER_RE.test(value)) problems.push("runtime env " + key + " still looks like a placeholder");
  }
}

if (problems.length) fail(problems);
console.log("[env:check] " + APP_NAME + " " + mode + " ok (" + REQUIRED.length + " required, " + OPTIONAL.length + " optional)");
