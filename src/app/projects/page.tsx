import Pane from "@/components/Pane";
import { getProjects, type Project } from "@/lib/content";

export const metadata = {
  title: "projects — Ibraheem Amin",
};

/* row layout for the non-featured six, reverse-chronological */
const ROWS: string[][] = [
  ["yonder", "dillydally", "mindbridge"],
  ["blockwarriors", "wildfires", "zbot"],
];

const GLYPHS: Record<string, string> = {
  active: "●",
  hackathon: "◐",
  archived: "○",
};
const glyph = (status: string) => GLYPHS[status] ?? "○";

const fileName = (url: string) => url.split("/").pop() ?? url;

const host = (url: string) =>
  url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");

const repoName = (url: string) => url.replace(/\/$/, "").split("/").pop() ?? url;

const raster = (url?: string) =>
  Boolean(url && /\.(png|jpe?g|webp|gif)$/i.test(url));

const clip = (s: string, n = 50) =>
  s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;

const startYear = (p: Project) => Number(p.period.match(/\d{4}/)?.[0] ?? 0);

/** Real alt text: the image's documented caption from the project's Art list. */
function artAlt(p: Project, url: string): string {
  const file = fileName(url);
  const lines = p.body.split("\n");
  const i = lines.findIndex((l) => l.includes(`\`portfolio-art/${file}\``));
  if (i === -1) return `${p.name} screenshot`;
  let caption = lines[i].split("`:")[1]?.trim() ?? "";
  for (let j = i + 1; j < lines.length; j++) {
    const l = lines[j];
    if (!l.trim() || l.trimStart().startsWith("-") || l.startsWith("#")) break;
    caption += " " + l.trim();
  }
  caption = caption.trim();
  return caption ? `${p.name} — ${caption}` : `${p.name} screenshot`;
}

function ProjectCard({ p }: { p: Project }) {
  const thumb = raster(p.images[0]) ? p.images[0] : undefined;
  const demo =
    typeof p.frontmatter.demo === "string" &&
    p.frontmatter.demo.startsWith("http")
      ? p.frontmatter.demo
      : undefined;

  return (
    <Pane cmd={`cat ${p.dir}.md`} label={p.name.toLowerCase()}>
      {thumb ? (
        <img
          className="thumb"
          style={{ height: 110 }}
          src={thumb}
          alt={artAlt(p, thumb)}
        />
      ) : (
        <p className="faint" style={{ fontSize: 11 }}>
          no screenshots yet
        </p>
      )}
      <h2
        style={{
          fontSize: 13,
          fontWeight: 600,
          marginTop: 12,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {p.name.toLowerCase()}
      </h2>
      <p
        className="meta"
        style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
      >
        <span className="accent">{glyph(p.status)}</span> {p.status} ·{" "}
        {p.period.toLowerCase()}
      </p>
      <p className="prose" style={{ fontSize: 12.5 }}>
        {p.oneLiner}
      </p>
      <div className="links">
        {p.deployed && (
          <a href={p.deployed}>{host(p.deployed)} ↗</a>
        )}
        {p.github.map((g) => (
          <a key={g} href={g}>
            {repoName(g)} ↗
          </a>
        ))}
        {demo && <a href={demo}>demo ↗</a>}
        {p.dir === "wildfires" && <span className="red">repo: lost</span>}
        {p.dir === "zbot" && <span className="dim">repo: unpublished</span>}
      </div>
    </Pane>
  );
}

export default function Projects() {
  const projects = getProjects();
  const byDir = new Map(projects.map((p) => [p.dir, p]));
  const featured = projects.find((p) => p.featured);
  const hero =
    featured &&
    (featured.images.find((i) => /hero/i.test(fileName(i))) ??
      featured.images[0]);

  /* chronological history, featured (newest) last */
  const chrono = [...projects].sort(
    (a, b) =>
      Number(a.featured) - Number(b.featured) || startYear(a) - startYear(b),
  );

  return (
    <div className="stack grow" data-acc="proj">
      {featured && (
        <Pane
          cmd={`cat ${featured.dir}/PROJECT.md`}
          sub="· ★ featured"
          label={`featured project: ${featured.name.toLowerCase()}`}
        >
          {hero && (
            <img className="feat-img" src={hero} alt={artAlt(featured, hero)} />
          )}
          {hero && <p className="caption">{fileName(hero)}</p>}
          <h1 className="name" style={{ fontSize: 18 }}>
            {featured.name.toLowerCase()}
          </h1>
          <p className="meta">
            <span className="accent">{glyph(featured.status)}</span>{" "}
            {featured.status} · {featured.period.toLowerCase()}
          </p>
          <p className="prose">{featured.oneLiner}</p>
          <div className="chips">
            {featured.tech.map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
          </div>
          <div className="links">
            {featured.github.map((g) => (
              <a key={g} href={g}>
                {host(g)} ↗
              </a>
            ))}
            {featured.deployed && (
              <a href={featured.deployed}>{host(featured.deployed)} ↗</a>
            )}
          </div>
        </Pane>
      )}

      {ROWS.map((row) => (
        <div key={row.join("-")} className="collage-row">
          {row.map((dir) => {
            const p = byDir.get(dir);
            return p ? <ProjectCard key={dir} p={p} /> : null;
          })}
        </div>
      ))}

      <Pane cmd="git log --oneline --reverse" label="project history">
        <pre className="block">
          {chrono.map((p, i) => (
            <span key={p.dir}>
              <span className="accent">*</span> {startYear(p)}{"  "}
              {p.name.toLowerCase()} — {clip(p.oneLiner)}
              {p.featured && <span className="dim">{" (HEAD -> main)"}</span>}
              {i < chrono.length - 1 ? "\n" : ""}
            </span>
          ))}
        </pre>
      </Pane>
    </div>
  );
}
