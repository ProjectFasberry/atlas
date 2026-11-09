#!/usr/bin/env node
/**
 * Collects compressed build output sizes for the atlas apps and writes the
 * payload consumed by the glaux build-metrics endpoint.
 *
 *   node scripts/build-size.mjs --app minotaur --stage prod --out build-metrics.json
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const APPS = {
  minotaur: { dir: "apps/minotaur/dist", client: "client", server: "server" },
  taurus: { dir: "apps/taurus/dist", client: "client", server: "server" },
  wiki: { dir: "apps/wiki/.next", client: "static", server: "server" },
};

const FONTS = new Set([".woff", ".woff2", ".ttf", ".otf"]);
const IMAGES = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".ico"]);
const JS = new Set([".js", ".mjs", ".cjs"]);
const CSS = new Set([".css"]);

function argument(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

function git(...args) {
  try {
    return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function sizeOf(path) {
  return statSync(path).size;
}

function gzipSizeOf(path) {
  return gzipSync(readFileSync(path)).length;
}

function collect(app) {
  const config = APPS[app];
  if (!config) throw new Error(`Unknown app "${app}"`);

  const root = join(repoRoot, config.dir);
  const clientRoot = join(root, config.client);
  const serverRoot = join(root, config.server);

  const metrics = {
    clientJsBytes: 0,
    clientCssBytes: 0,
    clientFontsBytes: 0,
    clientImagesBytes: 0,
    clientOtherBytes: 0,
    serverJsBytes: 0,
  };

  for (const path of walk(root)) {
    const ext = extname(path).toLowerCase();
    const isClient = path.startsWith(`${clientRoot}/`);
    const isServer = path.startsWith(`${serverRoot}/`);

    if (!isClient && !isServer) continue;

    if (isClient && JS.has(ext)) metrics.clientJsBytes += gzipSizeOf(path);
    else if (isClient && CSS.has(ext)) metrics.clientCssBytes += gzipSizeOf(path);
    else if (isClient && FONTS.has(ext)) metrics.clientFontsBytes += sizeOf(path);
    else if (isClient && IMAGES.has(ext)) metrics.clientImagesBytes += sizeOf(path);
    else if (isClient) metrics.clientOtherBytes += sizeOf(path);
    else if (isServer && JS.has(ext)) metrics.serverJsBytes += gzipSizeOf(path);
  }

  const totalBytes = Object.values(metrics).reduce((sum, value) => sum + value, 0);

  return { ...metrics, totalBytes };
}

function format(bytes) {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

const app = argument("app");
if (!app) {
  console.error("Usage: node scripts/build-size.mjs --app <minotaur|wiki|taurus> [--stage prod] [--out file]");
  process.exit(1);
}

const metrics = collect(app);
const payload = {
  app,
  stage: argument("stage", "prod"),
  branch: argument("branch", process.env.GITHUB_REF_NAME ?? git("rev-parse", "--abbrev-ref", "HEAD")),
  commitSha: argument("commit", process.env.GITHUB_SHA ?? git("rev-parse", "HEAD")),
  createdAt: new Date().toISOString(),
  metrics,
};

console.log(`${app} build size:`);
for (const [key, value] of Object.entries(metrics)) {
  console.log(`  ${key.replace(/Bytes$/, "").padEnd(18)} ${format(value)}`);
}

const out = argument("out");
if (out) writeFileSync(resolve(out), `${JSON.stringify(payload)}\n`);
