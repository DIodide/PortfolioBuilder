// Materializes portfolio content into .content/portfolio (real files) and
// mirrors its portfolio-art images into public/content-art.
//
// Why a snapshot instead of reading content/portfolio directly: locally that
// path is a symlink pointing outside the repo, which Turbopack refuses to
// trace; and on Vercel the private submodule is never fetched at all. A plain
// directory of real files sidesteps both, and makes local and CI builds
// identical.
//
// Source resolution:
//   1. CONTENT_SOURCE_DIR env var, else content/portfolio (symlink or
//      submodule checkout) when it has content.
//   2. Otherwise shallow-clone DIodide/portfolio@main using CONTENT_REPO_TOKEN
//      (fine-grained PAT, read-only Contents on that one repo). Deploys always
//      build the latest content on main — the submodule pointer is a dev
//      convenience, not the source of truth for deploys.
//
// The nested code/ submodules (project source checkouts) are never copied.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SOURCE_DIR = process.env.CONTENT_SOURCE_DIR ?? path.join(ROOT, "content", "portfolio");
const CONTENT_REPO = process.env.CONTENT_REPO ?? "github.com/DIodide/portfolio.git";
const CONTENT_BRANCH = process.env.CONTENT_BRANCH ?? "main";
const SNAPSHOT_DIR = path.join(ROOT, ".content", "portfolio");
const ART_DEST = path.join(ROOT, "public", "content-art");

const EXCLUDE = new Set([".git", "node_modules", "code"]);

const hasContent = (dir) => fs.existsSync(path.join(dir, "developer"));

function gitSha(dir) {
  try {
    return execFileSync("git", ["-C", dir, "rev-parse", "--short", "HEAD"], {
      encoding: "utf8",
    }).trim();
  } catch {
    return "unknown";
  }
}
let contentSha = "unknown";

function snapshot(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (EXCLUDE.has(entry.name)) continue;
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    if (entry.isDirectory()) snapshot(src, dest);
    else if (entry.isFile()) fs.copyFileSync(src, dest);
  }
}

fs.rmSync(SNAPSHOT_DIR, { recursive: true, force: true });

if (hasContent(SOURCE_DIR)) {
  console.log(`Snapshotting content from ${SOURCE_DIR}`);
  contentSha = gitSha(SOURCE_DIR);
  snapshot(SOURCE_DIR, SNAPSHOT_DIR);
} else {
  const token = process.env.CONTENT_REPO_TOKEN;
  if (!token) {
    console.error(
      `No content at ${SOURCE_DIR} and CONTENT_REPO_TOKEN is not set.\n` +
        `Locally: run scripts/dev-setup.sh. On Vercel: add the CONTENT_REPO_TOKEN env var.`,
    );
    process.exit(1);
  }
  const cloneDir = path.join(ROOT, ".content", ".clone");
  fs.rmSync(cloneDir, { recursive: true, force: true });
  console.log(`Cloning ${CONTENT_REPO}@${CONTENT_BRANCH} (shallow, no nested submodules)...`);
  execFileSync(
    "git",
    [
      "clone",
      "--depth", "1",
      "--branch", CONTENT_BRANCH,
      "--no-recurse-submodules",
      `https://x-access-token:${token}@${CONTENT_REPO}`,
      cloneDir,
    ],
    { stdio: ["ignore", "inherit", "inherit"] }, // token stays in argv, never echoed
  );
  contentSha = gitSha(cloneDir);
  snapshot(cloneDir, SNAPSHOT_DIR);
  fs.rmSync(cloneDir, { recursive: true, force: true });
}

// ── thoughts (blog posts) — second content submodule ─────────────────
// Same pattern as portfolio, but a missing/uncloneable repo must NEVER fail
// the build: the site renders a designed empty state instead.
const THOUGHTS_SOURCE = process.env.THOUGHTS_SOURCE_DIR ?? path.join(ROOT, "content", "thoughts");
const THOUGHTS_REPO = process.env.THOUGHTS_REPO ?? "github.com/DIodide/thoughts.git";
const THOUGHTS_SNAP = path.join(ROOT, ".content", "thoughts");
let thoughtsSha = "unknown";
fs.rmSync(THOUGHTS_SNAP, { recursive: true, force: true });
const hasThoughts = (dir) => fs.existsSync(path.join(dir, "posts"));

if (hasThoughts(THOUGHTS_SOURCE)) {
  console.log(`Snapshotting thoughts from ${THOUGHTS_SOURCE}`);
  thoughtsSha = gitSha(THOUGHTS_SOURCE);
  snapshot(THOUGHTS_SOURCE, THOUGHTS_SNAP);
} else if (process.env.CONTENT_REPO_TOKEN) {
  const cloneDir = path.join(ROOT, ".content", ".clone-thoughts");
  fs.rmSync(cloneDir, { recursive: true, force: true });
  try {
    // token via header (not URL) so a failed clone can't echo it in logs
    const basic = Buffer.from(`x-access-token:${process.env.CONTENT_REPO_TOKEN}`).toString("base64");
    execFileSync(
      "git",
      [
        "-c", `http.extraHeader=Authorization: Basic ${basic}`,
        "clone", "--depth", "1", "--no-recurse-submodules",
        `https://${THOUGHTS_REPO}`, cloneDir,
      ],
      { stdio: ["ignore", "inherit", "inherit"] },
    );
    thoughtsSha = gitSha(cloneDir);
    snapshot(cloneDir, THOUGHTS_SNAP);
  } catch {
    console.warn(
      "WARN: could not clone the thoughts repo — building with no posts. " +
        "If this is Vercel, make sure CONTENT_REPO_TOKEN's fine-grained PAT also covers DIodide/thoughts.",
    );
  } finally {
    fs.rmSync(cloneDir, { recursive: true, force: true });
  }
}
fs.mkdirSync(path.join(THOUGHTS_SNAP, "posts"), { recursive: true });

fs.writeFileSync(
  path.join(ROOT, ".content", "meta.json"),
  JSON.stringify({ sha: contentSha, thoughtsSha, preparedAt: new Date().toISOString() }),
);

// Mirror every **/portfolio-art/* file to public/content-art/<same relative path>.
fs.rmSync(ART_DEST, { recursive: true, force: true });
let copied = 0;
function mirrorArt(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (!entry.isDirectory()) continue;
    if (entry.name === "portfolio-art") {
      for (const f of fs.readdirSync(abs, { withFileTypes: true })) {
        if (!f.isFile()) continue;
        const rel = path.relative(SNAPSHOT_DIR, path.join(abs, f.name));
        const dest = path.join(ART_DEST, rel);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(path.join(abs, f.name), dest);
        copied++;
      }
    } else {
      mirrorArt(abs);
    }
  }
}
mirrorArt(SNAPSHOT_DIR);

// Mirror certification assets too (badge icons, provider logos, certificate
// scans) — they live under assets/ dirs, not portfolio-art/.
function mirrorImages(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) mirrorImages(abs);
    else if (/\.(png|jpe?g|webp|svg|gif)$/i.test(entry.name)) {
      const rel = path.relative(SNAPSHOT_DIR, abs);
      const dest = path.join(ART_DEST, rel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(abs, dest);
      copied++;
    }
  }
}
mirrorImages(path.join(SNAPSHOT_DIR, "developer", "certifications"));

// Mirror thought-post attachments LAST — the ART_DEST reset above would wipe
// anything mirrored earlier.
const attSrc = path.join(THOUGHTS_SNAP, "attachments");
const attDest = path.join(ART_DEST, "thoughts", "attachments");
if (fs.existsSync(attSrc)) {
  fs.mkdirSync(attDest, { recursive: true });
  for (const f of fs.readdirSync(attSrc)) {
    if (/\.(png|jpe?g|webp|svg|gif)$/i.test(f)) {
      fs.copyFileSync(path.join(attSrc, f), path.join(attDest, f));
      copied++;
    }
  }
}
console.log(`Snapshot ready at .content/portfolio; ${copied} image file(s) mirrored to public/content-art.`);
