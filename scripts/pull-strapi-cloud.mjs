#!/usr/bin/env node
/**
 * Phase 0 — pull everything out of Strapi Cloud over the REST API.
 *
 * Provider-independent escape hatch: it does not care which Strapi version the
 * Cloud instance runs, and it does not touch the local database. Every entry
 * (published *and* draft), every uploaded file (original *and* every generated
 * format) lands in one dated folder with a checksum manifest.
 *
 * Run:  node scripts/pull-strapi-cloud.mjs
 *       node scripts/pull-strapi-cloud.mjs --out backups/manual-run
 *
 * Env:  STRAPI_URL        https://playful-frog-24c9517ccc.strapiapp.com
 *       STRAPI_API_TOKEN  a Full access API token from the Cloud admin panel
 *
 * Safe to re-run: already-downloaded files are skipped, so an interrupted pull
 * resumes where it stopped.
 */

import { createHash } from "crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = join(repoRoot, "strapi", "src", "api");

const PAGE_SIZE = 100;
const RETRIES = 4;

// --- arguments / environment ------------------------------------------------

const args = process.argv.slice(2);
const argOut = args.includes("--out") ? args[args.indexOf("--out") + 1] : null;

await loadEnvFile(join(repoRoot, ".env.production"));
await loadEnvFile(join(repoRoot, ".env"));

const baseUrl = (process.env.STRAPI_URL || "").replace(/\/$/, "");
const token = process.env.STRAPI_API_TOKEN;

if (!baseUrl || !token) {
  console.error(
    "Missing STRAPI_URL / STRAPI_API_TOKEN.\n" +
      "Set them in the environment, or leave them in .env.production and re-run."
  );
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outDir = argOut ? join(repoRoot, argOut) : join(repoRoot, "backups", `strapi-cloud-${stamp}`);
const contentDir = join(outDir, "content");
const uploadsDir = join(outDir, "uploads");

await mkdir(contentDir, { recursive: true });
await mkdir(uploadsDir, { recursive: true });

console.log(`Source: ${baseUrl}`);
console.log(`Target: ${outDir}\n`);

// --- content ----------------------------------------------------------------

// Plural names come from the checked-in schemas, so a content type added later
// is picked up without editing this script.
const collections = await readCollections();
console.log(`Content types: ${collections.map((c) => c.pluralName).join(", ")}\n`);

const contentReport = [];

for (const { singularName, pluralName } of collections) {
  const byStatus = {};
  let total = 0;

  // Strapi 5 keeps a draft and a published version per document. Pulling only
  // one of them silently loses unpublished edits, so pull both.
  for (const status of ["published", "draft"]) {
    const entries = await fetchAll(pluralName, status);
    byStatus[status] = entries;
    total += entries.length;
  }

  await writeJson(join(contentDir, `${pluralName}.json`), {
    singularName,
    pluralName,
    pulledAt: new Date().toISOString(),
    ...byStatus,
  });

  contentReport.push({ pluralName, published: byStatus.published.length, draft: byStatus.draft.length });
  console.log(
    `  ${pluralName.padEnd(22)} ${String(byStatus.published.length).padStart(4)} published  ` +
      `${String(byStatus.draft.length).padStart(4)} draft`
  );
  if (total === 0) {
    console.log(`    ^ empty — check the API token covers "${pluralName}" find/findOne`);
  }
}

// --- media ------------------------------------------------------------------

console.log("\nMedia:");

let files = await fetchMediaLibrary();
let mediaSource = "upload-plugin";

if (!files) {
  // The token lacks the Upload plugin's `find` permission. Every file still
  // referenced by an entry is recoverable from the content we just pulled —
  // orphaned files in the library are not.
  mediaSource = "content-scrape";
  files = await scrapeMediaFromContent();
  console.log(`  /api/upload/files unavailable — recovered ${files.length} file(s) from entry payloads.`);
  console.log("  Grant the API token Upload → find to also capture unreferenced files.");
}

await writeJson(join(outDir, "media.json"), { source: mediaSource, count: files.length, files });

// One media entry can carry several physical files: the original plus the
// thumbnail/small/medium/large derivatives Strapi generated on upload.
const downloads = new Map();
for (const file of files) {
  for (const url of urlsOf(file)) {
    if (url) downloads.set(url, fileNameFor(url));
  }
}

console.log(`  ${files.length} media entr${files.length === 1 ? "y" : "ies"} → ${downloads.size} file(s) to fetch`);

const manifest = [];
let fetched = 0;
let skipped = 0;
const failures = [];

for (const [url, name] of downloads) {
  const dest = join(uploadsDir, name);
  const existing = await sizeOf(dest);

  if (existing > 0) {
    manifest.push({ name, url, bytes: existing, sha256: await sha256(dest), cached: true });
    skipped += 1;
    continue;
  }

  try {
    const bytes = await download(absolute(url), dest);
    manifest.push({ name, url, bytes, sha256: await sha256(dest) });
    fetched += 1;
    process.stdout.write(`\r  downloaded ${fetched}/${downloads.size - skipped}   `);
  } catch (err) {
    failures.push({ url, error: String(err.message || err) });
  }
}

process.stdout.write("\r");
console.log(`  ${fetched} downloaded, ${skipped} already present, ${failures.length} failed`);

// --- manifest ---------------------------------------------------------------

await writeJson(join(outDir, "manifest.json"), {
  pulledAt: new Date().toISOString(),
  source: baseUrl,
  strapiVersion: await fetchVersion(),
  content: contentReport,
  media: { source: mediaSource, entries: files.length, files: manifest.length, failures },
  totalBytes: manifest.reduce((sum, f) => sum + f.bytes, 0),
});

console.log(`\nDone → ${outDir}`);
if (failures.length) {
  console.log(`\n${failures.length} download(s) failed — re-run to retry just those:`);
  for (const f of failures.slice(0, 10)) console.log(`  ${f.url}  (${f.error})`);
  process.exitCode = 1;
}

// --- helpers ----------------------------------------------------------------

async function readCollections() {
  const found = [];
  for (const api of await readdir(apiDir)) {
    const ctDir = join(apiDir, api, "content-types");
    let types = [];
    try {
      types = await readdir(ctDir);
    } catch {
      continue;
    }
    for (const type of types) {
      const schema = JSON.parse(await readFile(join(ctDir, type, "schema.json"), "utf-8"));
      if (schema.kind === "collectionType") {
        found.push({ singularName: schema.info.singularName, pluralName: schema.info.pluralName });
      }
    }
  }
  return found.sort((a, b) => a.pluralName.localeCompare(b.pluralName));
}

async function fetchAll(pluralName, status) {
  const entries = [];
  for (let page = 1; ; page += 1) {
    const url =
      `${baseUrl}/api/${pluralName}?populate=*&status=${status}` +
      `&pagination[page]=${page}&pagination[pageSize]=${PAGE_SIZE}`;
    const res = await request(url);

    if (res.status === 403 || res.status === 404) return entries; // not exposed to this token
    if (!res.ok) throw new Error(`${pluralName} (${status}) → HTTP ${res.status}`);

    const body = await res.json();
    entries.push(...(body.data ?? []));

    const pageCount = body.meta?.pagination?.pageCount ?? 1;
    if (page >= pageCount) return entries;
  }
}

async function fetchMediaLibrary() {
  const res = await request(`${baseUrl}/api/upload/files`);
  if (!res.ok) return null;
  const body = await res.json();
  return Array.isArray(body) ? body : (body.results ?? body.data ?? []);
}

async function scrapeMediaFromContent() {
  const seen = new Map();
  for (const name of await readdir(contentDir)) {
    const payload = JSON.parse(await readFile(join(contentDir, name), "utf-8"));
    walk(payload, (node) => {
      // A media object always carries a url plus the upload metadata.
      if (node && typeof node.url === "string" && (node.hash || node.mime)) {
        seen.set(node.url, node);
      }
    });
  }
  return [...seen.values()];
}

function walk(node, visit) {
  if (Array.isArray(node)) return node.forEach((n) => walk(n, visit));
  if (node && typeof node === "object") {
    visit(node);
    for (const value of Object.values(node)) walk(value, visit);
  }
}

function urlsOf(file) {
  return [file.url, ...Object.values(file.formats ?? {}).map((f) => f?.url)];
}

function absolute(url) {
  return url.startsWith("http") ? url : `${baseUrl}${url}`;
}

function fileNameFor(url) {
  // Strapi's local upload provider stores files flat under public/uploads by
  // their hashed name, so keeping the basename makes this folder drop-in.
  return decodeURIComponent(new URL(absolute(url)).pathname.split("/").pop());
}

async function request(url) {
  let lastError;
  for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status >= 500 || res.status === 429) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      lastError = err;
      if (attempt < RETRIES) await sleep(500 * 2 ** attempt);
    }
  }
  throw lastError;
}

async function download(url, dest) {
  let lastError;
  for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
    try {
      // Media on Strapi Cloud sits on a public CDN host that rejects the API
      // token, so these requests go out unauthenticated.
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length === 0) throw new Error("empty response");
      await writeFile(dest, buffer);
      return buffer.length;
    } catch (err) {
      lastError = err;
      if (attempt < RETRIES) await sleep(500 * 2 ** attempt);
    }
  }
  throw lastError;
}

async function sha256(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

async function sizeOf(path) {
  try {
    return (await stat(path)).size;
  } catch {
    return 0;
  }
}

async function fetchVersion() {
  try {
    const res = await fetch(`${baseUrl}/admin/init`);
    const body = await res.json();
    return body?.data?.strapiVersion ?? null;
  } catch {
    return null;
  }
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

async function loadEnvFile(path) {
  let raw;
  try {
    raw = await readFile(path, "utf-8");
  } catch {
    return;
  }
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
