import Pane from "@/components/Pane";
import ImageDeck, { type DeckImage } from "@/components/ImageDeck";
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

const clip = (s: string, n = 50) =>
  s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;

/** First sentence of a project's pitch — cards stay short when squeezed. */
const firstSentence = (s: string) =>
  s.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? clip(s, 120);

const startYear = (p: Project) => Number(p.period.match(/\d{4}/)?.[0] ?? 0);

/** tmux window name: filename minus directory, extension, project prefix. */
function deckLabel(dir: string, url: string): string {
  const base = fileName(url).replace(/\.[^.]+$/, "");
  const stripped = base.toLowerCase().startsWith(dir.toLowerCase())
    ? base.slice(dir.length).replace(/^[-_]+/, "")
    : base;
  return stripped || base;
}

/** Real alt text: the image's documented caption from the project's Art list. */
function artAlt(p: Project, url: string): string {
  const file = fileName(url);
  const lines = p.body.split("\n");
  const i = lines.findIndex((l) => l.includes(`\`portfolio-art/${file}\``));
  if (i === -1) return `${p.name} — ${deckLabel(p.dir, url)}`;
  let caption = lines[i].split("`:")[1]?.trim() ?? "";
  for (let j = i + 1; j < lines.length; j++) {
    const l = lines[j];
    if (!l.trim() || l.trimStart().startsWith("-") || l.startsWith("#")) break;
    caption += " " + l.trim();
  }
  caption = caption.trim();
  return caption
    ? `${p.name} — ${caption}`
    : `${p.name} — ${deckLabel(p.dir, url)}`;
}

/** All of a project's shots, in the order its "## Art" list documents them. */
function deckImages(p: Project): DeckImage[] {
  const pos = (url: string) => {
    const i = p.body.indexOf(`\`portfolio-art/${fileName(url)}\``);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  return [...p.images]
    .sort((a, b) => pos(a) - pos(b))
    .map((src) => ({
      src,
      alt: artAlt(p, src),
      label: deckLabel(p.dir, src),
    }));
}

function ProjectCard({ p }: { p: Project }) {
  const demo =
    typeof p.frontmatter.demo === "string" &&
    p.frontmatter.demo.startsWith("http")
      ? p.frontmatter.demo
      : undefined;

  return (
    <Pane cmd={`cat ${p.dir}.md`} label={p.name.toLowerCase()}>
      <ImageDeck images={deckImages(p)} height={130} compact />
      <h2
        style={{
          fontSize: 13,
          fontWeight: 600,
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
        {firstSentence(p.oneLiner)}
      </p>
      <div className="links">
        {p.deployed && (
          <a href={p.deployed} target="_blank" rel="noopener noreferrer">
            {host(p.deployed)} ↗
          </a>
        )}
        {p.github.map((g) => (
          <a key={g} href={g} target="_blank" rel="noopener noreferrer">
            {repoName(g)} ↗
          </a>
        ))}
        {demo && (
          <a href={demo} target="_blank" rel="noopener noreferrer" data-confirm="">
            demo ↗
          </a>
        )}
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

  /* chronological history, featured (newest) last */
  const chrono = [...projects].sort(
    (a, b) =>
      Number(a.featured) - Number(b.featured) || startYear(a) - startYear(b),
  );

  return (
    <>
      <style>{`
        .proj-split-info { background: var(--bg); padding: 2px 20px 8px 0; min-width: 0; }
        .proj-split-deck { background: var(--bg); padding: 2px 0 0 20px; min-width: 0; }
        @media (max-width: 860px) {
          .proj-split-info { padding: 2px 0 16px; }
          .proj-split-deck { padding: 14px 0 0; }
        }
      `}</style>
      <div className="stack grow" data-acc="proj">
        {featured && (
          <Pane
            cmd={`cat ${featured.dir}/PROJECT.md`}
            sub="· ★ featured"
            label={`featured project: ${featured.name.toLowerCase()}`}
          >
            <div
              className="machine inner"
              style={{ gridTemplateColumns: "1fr 1.4fr" }}
            >
              <div className="proj-split-info">
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
                    <a key={g} href={g} target="_blank" rel="noopener noreferrer">
                      {host(g)} ↗
                    </a>
                  ))}
                  {featured.deployed && (
                    <a
                      href={featured.deployed}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {host(featured.deployed)} ↗
                    </a>
                  )}
                </div>
              </div>
              <div className="proj-split-deck">
                <ImageDeck images={deckImages(featured)} height={280} />
              </div>
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
    </>
  );
}
