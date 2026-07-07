// Minimal proof-of-concept readers for the DIodide/portfolio content repo.
// Every file there is markdown with YAML frontmatter; this module surfaces
// frontmatter + raw body and leaves interpretation/shaping for later.
//
// Reads from the .content/portfolio snapshot that scripts/prepare-content.mjs
// materializes before every dev/build run — never from content/portfolio
// directly (locally that's a symlink out of the repo, which Turbopack rejects).
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

export interface Project extends ContentDoc {
  dir: string;
  /** site-relative URLs under /content-art for this project's images */
  images: string[];
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
      const artDir = path.join(projectsRoot, e.name, "portfolio-art");
      const images = fs.existsSync(artDir)
        ? fs
            .readdirSync(artDir)
            .map((f) => `/content-art/developer/projects/${e.name}/portfolio-art/${f}`)
        : [];
      return [{ ...doc, dir: e.name, images }];
    });
}
