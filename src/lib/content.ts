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

/** HTML comments are the content repo's annotation channel — Obsidian hides
 *  them in reading view and the site guarantees they never render. Strip them
 *  before ANY parsing so editors can write notes anywhere (except inside a
 *  pipe table, where a comment line would split the table). */
const stripHtmlComments = (s: string) => s.replace(/<!--[\s\S]*?-->/g, "");

export function readDoc(relPath: string): ContentDoc | null {
  const abs = path.join(CONTENT_DIR, relPath);
  if (!fs.existsSync(abs)) return null;
  const { data, content } = matter(fs.readFileSync(abs, "utf8"));
  return { path: relPath, frontmatter: data, body: stripHtmlComments(content).trim() };
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

/** Width/height from a PNG's IHDR header, or null for non-PNG/unreadable. */
function pngSize(abs: string): { w: number; h: number } | null {
  try {
    const buf = Buffer.alloc(24);
    const fd = fs.openSync(abs, "r");
    fs.readSync(fd, buf, 0, 24, 0);
    fs.closeSync(fd);
    if (buf.readUInt32BE(0) !== 0x89504e47) return null; // not a PNG
    if (buf.readUInt32BE(12) !== 0x49484452) return null; // no IHDR
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  } catch {
    return null;
  }
}

/** Some assets/certificates/ files are just badge icons (small squares),
 *  not scans of the actual certificate document. Only wide, high-res
 *  landscape images count as real certificates. */
function isCertificateScan(abs: string): boolean {
  const size = pngSize(abs);
  if (!size) return false;
  return size.w >= 1000 && size.w > size.h;
}

export interface Cert {
  name: string;
  semester: string;
  category: string;
  verifyUrl?: string;
  /** badge icon, site-relative /content-art URL */
  logoUrl?: string;
  /** full certificate scan, site-relative /content-art URL */
  scanUrl?: string;
}

export interface CertProvider {
  slug: string;
  provider: string;
  count: number;
  /** provider wordmark/logo if one exists in assets/ */
  logoUrl?: string;
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
    const providerDir = path.join(CONTENT_DIR, "developer", "certifications", slug);
    const artUrl = (rel: string) =>
      fs.existsSync(path.join(providerDir, rel))
        ? `/content-art/developer/certifications/${slug}/${rel}`
        : undefined;
    const scanArtUrl = (rel: string) =>
      isCertificateScan(path.join(providerDir, rel)) ? artUrl(rel) : undefined;
    const certs: Cert[] = tableRows(doc.body).map((r) => {
      const verify = r[4] ?? "";
      const logoRel = (r[3] ?? "").startsWith("assets/") ? (r[3] ?? "") : "";
      const base = logoRel ? path.basename(logoRel).replace(/\.[^.]+$/, "") : "";
      return {
        name: r[0] ?? "",
        semester: r[1] ?? "",
        category: r[2] ?? "",
        verifyUrl: /^https?:\/\//.test(verify) ? verify : undefined,
        logoUrl: logoRel ? artUrl(logoRel) : undefined,
        scanUrl: base ? scanArtUrl(`assets/certificates/${base}-1.png`) : undefined,
      };
    });
    const assetsDir = path.join(providerDir, "assets");
    const providerLogo = fs.existsSync(assetsDir)
      ? fs.readdirSync(assetsDir).find((f) => /provider-logo/.test(f))
      : undefined;
    providers.push({
      slug,
      provider: String(fm.provider ?? row[0] ?? slug),
      count: Number(fm.count ?? certs.length) || certs.length,
      logoUrl: providerLogo ? artUrl(`assets/${providerLogo}`) : undefined,
      certs,
    });
  }
  return providers.sort((a, b) => b.count - a.count);
}

/* ── workplaces (per-company briefs) ──────────────────────────── */

export interface WorkplaceRole {
  title: string;
  period: string;
  location: string;
}

export interface Workplace {
  dir: string;
  company: string;
  website?: string;
  tech: string[];
  /** company logo, site-relative /content-art URL */
  logoUrl?: string;
  /** portfolio-art images other than the logo */
  images: string[];
  roles: WorkplaceRole[];
  /** body H2 sections, with repo-maintenance sections (Art, Code) excluded */
  sections: { heading: string; content: string }[];
}

export function getWorkplaces(): Workplace[] {
  const workRoot = path.join(CONTENT_DIR, "developer", "work");
  if (!fs.existsSync(workRoot)) return [];
  return fs
    .readdirSync(workRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .flatMap((e) => {
      const doc = readDoc(path.join("developer", "work", e.name, "WORK_DESCRIPTION.md"));
      if (!doc) return [];
      const fm = doc.frontmatter as Record<string, unknown>;
      const logoRel = typeof fm.logo === "string" ? fm.logo : "";
      const artDir = path.join(workRoot, e.name, "portfolio-art");
      const images = fs.existsSync(artDir)
        ? fs
            .readdirSync(artDir)
            .filter(
              (f) =>
                /\.(png|jpe?g|webp|svg|gif)$/i.test(f) &&
                `portfolio-art/${f}` !== logoRel,
            )
            .map((f) => `/content-art/developer/work/${e.name}/portfolio-art/${f}`)
        : [];
      const roles = Array.isArray(fm.roles)
        ? (fm.roles as Record<string, unknown>[]).map((r) => ({
            title: String(r.title ?? ""),
            period: String(r.period ?? ""),
            location: String(r.location ?? ""),
          }))
        : [];
      return [
        {
          dir: e.name,
          company: String(fm.company ?? e.name),
          website: typeof fm.website === "string" ? fm.website : undefined,
          tech: Array.isArray(fm.tech) ? fm.tech.map(String) : [],
          logoUrl:
            logoRel &&
            fs.existsSync(path.join(workRoot, e.name, logoRel))
              ? `/content-art/developer/work/${e.name}/${logoRel}`
              : undefined,
          images,
          roles,
          sections: sections(doc.body).filter(
            (s) => !/^(art|code)$/i.test(s.heading.trim()),
          ),
        },
      ];
    });
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

/* ── coursework projects ──────────────────────────────────────── */

export interface CourseworkProject {
  /** course code(s), e.g. "COS 418" or "HIS 387 / ENG 389 / CDH 387" */
  course: string;
  courseTitle: string;
  semester: string;
  title: string;
  team?: string;
  links: { label: string; url: string }[];
  paragraphs: string[];
  highlights: string[];
  skills: string[];
  /** content repo still says "(todo ...)" for this one */
  placeholder: boolean;
}

const stripMd = (s: string) =>
  s
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();

const COURSE_HEADING = /^(.+?)\s+—\s+(.+?)\s*\(([^)]+)\)\s*$/;

/** Links from a line, skipping anything the repo marks private/do-not-link. */
function lineLinks(line: string): { label: string; url: string }[] {
  if (/private|do not link/i.test(line)) return [];
  const out: { label: string; url: string }[] = [];
  for (const m of line.matchAll(/\[([^\]]+)\]\((https?:[^)]+)\)/g)) {
    out.push({ label: stripMd(m[1]), url: m[2] });
  }
  return out;
}

function parseProjectBlock(
  courseHeading: string,
  title: string,
  block: string,
): CourseworkProject | null {
  const m = courseHeading.match(COURSE_HEADING);
  const project: CourseworkProject = {
    course: m?.[1].trim() ?? courseHeading,
    courseTitle: m?.[2].trim() ?? "",
    semester: m?.[3].trim() ?? "",
    title: stripMd(title),
    links: [],
    paragraphs: [],
    highlights: [],
    skills: [],
    placeholder: false,
  };
  // Line-based state machine over the block. Bullets under "Highlights:"
  // (or any top-level "- " list) may hard-wrap across lines; prose lines in
  // the same paragraph get joined.
  let bullet: string | null = null;
  let prose: string | null = null;
  let skillsBuf: string | null = null;
  const flush = () => {
    if (bullet) project.highlights.push(stripMd(bullet));
    if (prose) project.paragraphs.push(stripMd(prose));
    if (skillsBuf)
      project.skills.push(
        ...stripMd(skillsBuf)
          .split(/,\s*/)
          .map((s) => s.replace(/\.$/, "").trim())
          .filter(Boolean),
      );
    bullet = null;
    prose = null;
    skillsBuf = null;
  };
  for (const line of block.split("\n")) {
    const t = line.trim();
    if (!t || t === "---") {
      flush();
    } else if (/^\(?todo/i.test(t)) {
      flush();
      project.placeholder = true;
    } else if (/^(repos?|course notebook|links?|deployed|demo|site):/i.test(t)) {
      flush();
      project.links.push(...lineLinks(t));
    } else if (/^team:/i.test(t)) {
      flush();
      project.team = stripMd(t.replace(/^team:\s*/i, ""));
    } else if (/^(\*\*)?skills:/i.test(t)) {
      flush();
      skillsBuf = stripMd(t).replace(/^skills:\s*/i, "");
    } else if (/^highlights:\s*$/i.test(t)) {
      flush();
    } else if (t.startsWith("- ")) {
      flush();
      bullet = t.slice(2);
    } else if (bullet !== null) {
      bullet += " " + t;
    } else if (skillsBuf !== null) {
      skillsBuf += " " + t;
    } else if (prose !== null) {
      prose += " " + t;
    } else {
      prose = t;
    }
  }
  flush();
  project.paragraphs = project.paragraphs.filter(Boolean);
  // an H3 with no real content at all isn't a project yet
  if (
    !project.placeholder &&
    !project.paragraphs.length &&
    !project.highlights.length &&
    !project.links.length
  )
    return null;
  return project;
}

export function getCourseworkProjects(): CourseworkProject[] {
  const doc = readDoc("developer/coursework/COURSEWORK_PROJECTS.md");
  if (!doc) return [];
  const projects: CourseworkProject[] = [];
  for (const sec of sections(doc.body)) {
    const subs = sec.content.split(/^### +/m);
    if (/^additional/i.test(sec.heading)) {
      // H3s here are course headings; the bolded first line is the title
      for (const sub of subs.slice(1)) {
        const nl = sub.indexOf("\n");
        const courseHeading = nl === -1 ? sub.trim() : sub.slice(0, nl).trim();
        const body = nl === -1 ? "" : sub.slice(nl + 1).trim();
        if (!body) continue;
        const firstLine = body.split("\n")[0];
        const titleMatch = firstLine.match(/^\*\*([^*]+)\*\*/);
        const title = titleMatch ? titleMatch[1] : courseHeading;
        const rest = titleMatch
          ? ("links: " + firstLine.slice(titleMatch[0].length) + "\n" + body.split("\n").slice(1).join("\n")).trim()
          : body;
        const p = parseProjectBlock(courseHeading, title, rest);
        if (p) projects.push(p);
      }
    } else if (COURSE_HEADING.test(sec.heading)) {
      for (const sub of subs.slice(1)) {
        const nl = sub.indexOf("\n");
        const title = nl === -1 ? sub.trim() : sub.slice(0, nl).trim();
        const body = nl === -1 ? "" : sub.slice(nl + 1).trim();
        const p = parseProjectBlock(sec.heading, title, body);
        if (p) projects.push(p);
      }
    }
  }
  return projects;
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
