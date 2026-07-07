// Readers for the DIodide/portfolio content repo.
//
// Reads from the .content/portfolio snapshot that scripts/prepare-content.mjs
// materializes before every dev/build run — never from content/portfolio
// directly (locally that's a symlink out of the repo, which Turbopack rejects).
//
// Everything here is build-time only (server components / SSG). Parsers are
// deliberately tolerant: index files (WORK.md, PROJECTS.md, CERTIFICATIONS.md,
// COURSEWORK.md) have no frontmatter, and several fields are literal "TODO"
// placeholders the site must render as designed states.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), ".content", "portfolio");

export interface ContentDoc {
  /** path relative to the content repo root */
  path: string;
  frontmatter: Record<string, unknown>;
  body: string;
}

export function readDoc(relPath: string): ContentDoc | null {
  const abs = path.join(CONTENT_DIR, relPath);
  if (!fs.existsSync(abs)) return null;
  const { data, content } = matter(fs.readFileSync(abs, "utf8"));
  return { path: relPath, frontmatter: data, body: content.trim() };
}

export const getUser = () => readDoc("USER.md");
export const getSocials = () => readDoc("developer/socials/SOCIALS.md");
export const getWork = () => readDoc("developer/work/WORK.md");
export const getCoursework = () => readDoc("developer/coursework/COURSEWORK.md");
export const getCertifications = () =>
  readDoc("developer/certifications/CERTIFICATIONS.md");

/* ── markdown helpers ─────────────────────────────────────────── */

/** All pipe-table row groups in a markdown body (separator rows removed). */
function parseTables(body: string): string[][][] {
  const tables: string[][][] = [];
  let current: string[][] = [];
  for (const line of body.split("\n")) {
    if (line.trimStart().startsWith("|")) {
      const cells = line
        .trim()
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((c) => c.trim());
      if (cells.every((c) => /^:?-{3,}:?$/.test(c))) continue; // separator
      current.push(cells);
    } else if (current.length) {
      tables.push(current);
      current = [];
    }
  }
  if (current.length) tables.push(current);
  return tables;
}

/** First table's data rows (header row removed). */
function tableRows(body: string): string[][] {
  const t = parseTables(body)[0];
  return t ? t.slice(1) : [];
}

/** `## Heading` sections of a body. */
function sections(body: string): { heading: string; content: string }[] {
  const out: { heading: string; content: string }[] = [];
  const parts = body.split(/^## +/m);
  for (const part of parts.slice(1)) {
    const nl = part.indexOf("\n");
    out.push({
      heading: part.slice(0, nl).trim(),
      content: part.slice(nl + 1).trim(),
    });
  }
  return out;
}

/** Resolve a `[text](url)` cell (or plain text) to its parts. */
function linkCell(cell: string): { text: string; url?: string } {
  const m = cell.match(/\[([^\]]*)\]\(([^)]*)\)/);
  if (m) return { text: m[1], url: m[2] };
  return { text: cell, url: /^https?:\/\//.test(cell) ? cell : undefined };
}

/** Collapse hard-wrapped markdown lines into single-line paragraphs. */
const unwrap = (s: string) => s.replace(/\s*\n\s*/g, " ").trim();

/* ── home / bio ───────────────────────────────────────────────── */

export interface Bio {
  oneLiner: string;
  paragraphs: string[];
  fastFacts: string[];
}

export function getBio(): Bio {
  const doc = getUser();
  const secs = doc ? sections(doc.body) : [];
  const find = (name: string) =>
    secs.find((s) => s.heading.toLowerCase().startsWith(name))?.content ?? "";
  const facts: string[] = [];
  for (const line of find("fast facts").split("\n")) {
    if (line.startsWith("- ")) facts.push(line.slice(2).trim());
    else if (line.trim() && facts.length)
      facts[facts.length - 1] += " " + line.trim();
  }
  return {
    oneLiner: unwrap(find("short bio")),
    paragraphs: find("bio (website-ready)")
      .split(/\n\n+/)
      .map(unwrap)
      .filter(Boolean),
    fastFacts: facts,
  };
}

export interface SocialLink {
  key: string;
  label: string;
  href: string;
}

export function getSocialLinks(): SocialLink[] {
  const fm = (getSocials()?.frontmatter ?? {}) as Record<
    string,
    { handle?: string; url?: string } | string | undefined
  >;
  const out: SocialLink[] = [];
  for (const key of ["github", "x", "linkedin"] as const) {
    const v = fm[key];
    if (v && typeof v === "object" && v.url)
      out.push({ key, label: v.handle ?? v.url, href: v.url });
  }
  if (typeof fm.email_school === "string")
    out.push({ key: "school", label: fm.email_school, href: `mailto:${fm.email_school}` });
  if (typeof fm.email_personal === "string")
    out.push({ key: "personal", label: fm.email_personal, href: `mailto:${fm.email_personal}` });
  return out;
}

/* ── work ─────────────────────────────────────────────────────── */

export interface WorkRow {
  workplace: string;
  role: string;
  period: string;
  location: string;
  dir?: string;
  current: boolean;
}

export function getWorkRows(): WorkRow[] {
  const doc = getWork();
  if (!doc) return [];
  return tableRows(doc.body).map((r) => ({
    workplace: r[0] ?? "",
    role: r[1] ?? "",
    period: r[2] ?? "",
    location: r[3] ?? "",
    dir: linkCell(r[4] ?? "").text.replace(/\/$/, "") || undefined,
    current: /present/i.test(r[2] ?? ""),
  }));
}

/* ── projects ─────────────────────────────────────────────────── */

export interface Project extends ContentDoc {
  dir: string;
  name: string;
  featured: boolean;
  status: string;
  period: string;
  tech: string[];
  github: string[];
  deployed?: string;
  /** first body paragraph, single line */
  oneLiner: string;
  /** site-relative URLs under /content-art for this project's images */
  images: string[];
}

export function getProjects(): Project[] {
  const projectsRoot = path.join(CONTENT_DIR, "developer", "projects");
  if (!fs.existsSync(projectsRoot)) return [];
  return fs
    .readdirSync(projectsRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .flatMap((e) => {
      const rel = path.join("developer", "projects", e.name, "PROJECT_DESCRIPTION.md");
      const doc = readDoc(rel);
      if (!doc) return [];
      const fm = doc.frontmatter as Record<string, unknown>;
      const artDir = path.join(projectsRoot, e.name, "portfolio-art");
      const images = fs.existsSync(artDir)
        ? fs
            .readdirSync(artDir)
            .filter((f) => /\.(png|jpe?g|webp|svg|gif)$/i.test(f))
            .map((f) => `/content-art/developer/projects/${e.name}/portfolio-art/${f}`)
        : [];
      const firstPara = doc.body
        .split(/\n\n+/)
        .find((b) => b.trim() && !b.trimStart().startsWith("#"));
      return [
        {
          ...doc,
          dir: e.name,
          name: String(fm.name ?? e.name),
          featured: fm.featured === true,
          status: String(fm.status ?? ""),
          period: String(fm.period ?? ""),
          tech: Array.isArray(fm.tech) ? fm.tech.map(String) : [],
          github: Array.isArray(fm.github) ? fm.github.map(String) : [],
          deployed: typeof fm.deployed === "string" ? fm.deployed : undefined,
          oneLiner: unwrap(firstPara ?? ""),
          images,
        },
      ];
    })
    .sort((a, b) => Number(b.featured) - Number(a.featured));
}

/* ── certifications ───────────────────────────────────────────── */

export interface Cert {
  name: string;
  semester: string;
  category: string;
  verifyUrl?: string;
}

export interface CertProvider {
  slug: string;
  provider: string;
  count: number;
  certs: Cert[];
}

export function getCertProviders(): CertProvider[] {
  const index = getCertifications();
  if (!index) return [];
  const providers: CertProvider[] = [];
  for (const row of tableRows(index.body)) {
    const file = linkCell(row[1] ?? "");
    if (!file.url) continue;
    const slug = file.url.split("/")[0];
    const doc = readDoc(path.join("developer", "certifications", file.url));
    if (!doc) continue;
    const fm = doc.frontmatter as Record<string, unknown>;
    const certs: Cert[] = tableRows(doc.body).map((r) => {
      const verify = r[4] ?? "";
      return {
        name: r[0] ?? "",
        semester: r[1] ?? "",
        category: r[2] ?? "",
        verifyUrl: /^https?:\/\//.test(verify) ? verify : undefined,
      };
    });
    providers.push({
      slug,
      provider: String(fm.provider ?? row[0] ?? slug),
      count: Number(fm.count ?? certs.length) || certs.length,
      certs,
    });
  }
  return providers.sort((a, b) => b.count - a.count);
}

/* ── coursework ───────────────────────────────────────────────── */

export interface Course {
  code: string;
  name: string;
  semester: string;
  link?: string;
}

export interface CourseSection {
  category: string;
  courses: Course[];
}

export function getCourseSections(): CourseSection[] {
  const doc = getCoursework();
  if (!doc) return [];
  return sections(doc.body).map((s) => ({
    category: s.heading,
    courses: tableRows(s.content).map((r) => ({
      code: r[0] ?? "",
      name: r[1] ?? "",
      semester: r[2] ?? "",
      link: linkCell(r[3] ?? "").url,
    })),
  }));
}

/** Semesters in chronological order, e.g. ["Fall 2024", ..., "Spring 2026"]. */
export function semesterOrder(semesters: string[]): string[] {
  const rank = (s: string) => {
    const m = s.match(/(Spring|Summer|Fall)\s+(\d{4})/i);
    if (!m) return 0;
    const season = { spring: 0, summer: 1, fall: 2 }[m[1].toLowerCase()] ?? 0;
    return Number(m[2]) * 10 + season;
  };
  return [...new Set(semesters)].sort((a, b) => rank(a) - rank(b));
}

export const shortSemester = (s: string) =>
  s.replace(/Fall\s+20(\d\d)/i, "F$1").replace(/Spring\s+20(\d\d)/i, "S$1").replace(/Summer\s+20(\d\d)/i, "Su$1");

/* ── build metadata ───────────────────────────────────────────── */

export function getContentMeta(): { sha: string } {
  try {
    const meta = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), ".content", "meta.json"), "utf8"),
    );
    return { sha: String(meta.sha ?? "dev") };
  } catch {
    return { sha: "dev" };
  }
}
