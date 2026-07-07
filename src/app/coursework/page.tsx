import Pane from "@/components/Pane";
import {
  getCourseSections,
  getCourseworkProjects,
  semesterOrder,
  shortSemester,
  type CourseworkProject,
} from "@/lib/content";

export const metadata = {
  title: "coursework — Ibraheem Amin",
};

// section heading → unix dir name in the tree pane; unknown future
// sections derive a 3-letter dir instead of breaking the listing.
const DIRS: Record<string, string> = {
  "computer science": "cos",
  mathematics: "mat",
  sciences: "phy",
  economics: "eco",
  "liberal arts": "hum",
};
const dirName = (category: string) =>
  DIRS[category.toLowerCase()] ??
  category.toLowerCase().replace(/[^a-z]/g, "").slice(0, 3);

/** cross-listed codes ("HIS 387 / ENG 389 / CDH 387") shorten to the first */
const shortCode = (code: string) => code.split("/")[0].trim();
/** tree leaf name: lowercase, subtitle after ":" dropped */
const shortName = (name: string) => name.split(":")[0].trim().toLowerCase();

/** "Fall 2024" → "2024"; unknown formats yield "" */
const year = (sem: string) => sem.match(/\d{4}/)?.[0] ?? "";

/* ── project entry helpers ─────────────────────────────────────── */

const MAX_HIGHLIGHTS = 2;
const MAX_SKILL_CHIPS = 4;
const PROSE_BUDGET = 260;

/** long first paragraphs cut at a sentence boundary — full text waits
    for a zoomed read; a mid-word cut only as a last resort */
function clampProse(text: string): { text: string; cut: boolean } {
  if (text.length <= PROSE_BUDGET) return { text, cut: false };
  const head = text.slice(0, PROSE_BUDGET);
  const end = head.lastIndexOf(". ");
  return end > 60
    ? { text: head.slice(0, end + 1), cut: true }
    : { text: head.replace(/\s+\S*$/, "") + "…", cut: true };
}

/** the visible label already names the destination when it is the host
    ("harness.nz"); repo-name labels ("lab-1-mapreduce") do not */
const namesHost = (label: string, url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "") === label.toLowerCase();
  } catch {
    return false;
  }
};

function ProjectEntry({ p, first }: { p: CourseworkProject; first: boolean }) {
  const prose = p.paragraphs[0] ? clampProse(p.paragraphs[0]) : null;
  const meta = [p.courseTitle, p.semester, p.team && `team: ${p.team}`].filter(
    Boolean,
  );
  const hidden = p.highlights.length - MAX_HIGHLIGHTS;
  return (
    <article
      style={
        first
          ? undefined
          : { borderTop: "1px solid var(--border)", marginTop: 14, paddingTop: 14 }
      }
    >
      <div
        style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}
      >
        <span className="ccode" title={p.course}>
          {shortCode(p.course)}
        </span>
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{p.title}</span>
      </div>
      {meta.length > 0 && (
        <p className="dim" style={{ fontSize: 11, marginTop: 3 }}>
          {meta.join(" · ")}
        </p>
      )}
      {prose ? (
        <p className="prose" style={{ fontSize: 12.5, marginTop: 6 }}>
          {prose.text}
          {prose.cut && <span className="faint"> …</span>}
        </p>
      ) : (
        p.placeholder && (
          <p className="dim" style={{ fontSize: 12, marginTop: 6 }}>
            description pending
          </p>
        )
      )}
      {p.highlights.slice(0, MAX_HIGHLIGHTS).map((h) => (
        <p key={h} style={{ display: "flex", gap: 6, fontSize: 12, marginTop: 5 }}>
          <span className="accent" style={{ flex: "none" }}>
            ▸
          </span>
          <span className="dim">{h}</span>
        </p>
      ))}
      {hidden > 0 && (
        <p className="faint" style={{ fontSize: 11, marginTop: 3, paddingLeft: 14 }}>
          +{hidden} more
        </p>
      )}
      {p.skills.length > 0 && (
        <div className="chips" style={{ margin: "8px 0 0" }}>
          {p.skills.slice(0, MAX_SKILL_CHIPS).map((s) => (
            <span key={s} className="chip">
              {s}
            </span>
          ))}
          {p.skills.length > MAX_SKILL_CHIPS && (
            <span
              className="chip"
              // .chip's color wins the cascade over .faint; force the tint
              style={{ color: "var(--faint)" }}
              title={p.skills.slice(MAX_SKILL_CHIPS).join(", ")}
            >
              +{p.skills.length - MAX_SKILL_CHIPS}
            </span>
          )}
        </div>
      )}
      {p.links.length > 0 && (
        <p className="links" style={{ marginTop: 8 }}>
          {p.links.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              data-confirm={namesHost(l.label, l.url) ? undefined : ""}
            >
              {l.label} ↗
            </a>
          ))}
        </p>
      )}
    </article>
  );
}

export default function Coursework() {
  const sections = getCourseSections();
  const courses = sections.flatMap((s) => s.courses);
  const semesters = semesterOrder(courses.map((c) => c.semester));
  const firstYear = year(semesters[0] ?? "");
  const lastYear = year(semesters[semesters.length - 1] ?? "");
  const span =
    firstYear && lastYear && firstYear !== lastYear
      ? `${firstYear}-${lastYear}`
      : firstYear;

  // real write-ups lead; "(todo)" stubs sink to the bottom of the listing
  const all = getCourseworkProjects();
  const projects = [
    ...all.filter((p) => !p.placeholder),
    ...all.filter((p) => p.placeholder),
  ];

  return (
    <div
      className="machine fill ws-course"
      data-acc="course"
      // the projects pane carries prose now; trade tree width for it
      style={{ gridTemplateColumns: "1fr 1.25fr" }}
    >
      <Pane
        cmd={span ? `cal ${span}` : "cal"}
        sub={`· ${semesters.length} semesters · ${courses.length} courses`}
        label="semester calendar"
        gridArea="cal"
      >
        {semesters.map((sem) => (
          <div key={sem} className="cal-row">
            <span className="sem">{shortSemester(sem)} ▸</span>
            {courses
              .filter((c) => c.semester === sem)
              .map((c) =>
                c.code === "TODO" ? (
                  <span key={c.name} className="ccode todo" title={c.name}>
                    ——— {c.name.toLowerCase()}
                  </span>
                ) : c.link ? (
                  <a
                    key={c.code}
                    className="ccode"
                    href={c.link}
                    title={c.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-confirm=""
                  >
                    {c.code}
                  </a>
                ) : (
                  <span key={c.code} className="ccode" title={c.name}>
                    {c.code}
                  </span>
                ),
              )}
          </div>
        ))}
      </Pane>

      <Pane cmd="tree ~/coursework" label="coursework tree" gridArea="tree">
        <pre className="block">
          {"~/coursework\n"}
          {sections.map((sec, i) => {
            const lastDir = i === sections.length - 1;
            const stem = lastDir ? "    " : "│   ";
            return (
              <span key={sec.category}>
                {lastDir ? "└── " : "├── "}
                <span className="accent">{dirName(sec.category)}/</span>
                {"\n"}
                {sec.courses.map((c, j) => {
                  const branch = j === sec.courses.length - 1 ? "└── " : "├── ";
                  const todo = c.code === "TODO";
                  return (
                    <span
                      key={c.code + c.name}
                      className={todo ? "faint" : "dim"}
                    >
                      {stem + branch}
                      {(todo ? "———" : shortCode(c.code)).padEnd(9)}
                      {shortName(c.name)}
                      {"\n"}
                    </span>
                  );
                })}
              </span>
            );
          })}
          {"\n"}
          <span className="dim">
            {sections.length} directories, {courses.length} courses
          </span>
        </pre>
      </Pane>

      <Pane
        cmd="cat COURSEWORK_PROJECTS.md"
        sub={
          projects.length
            ? `· ${projects.length} project${projects.length === 1 ? "" : "s"}`
            : undefined
        }
        label="course projects"
        gridArea="proj"
      >
        {projects.length === 0 ? (
          <p className="red">
            cat: COURSEWORK_PROJECTS.md: no such file or directory
          </p>
        ) : (
          projects.map((p, i) => (
            <ProjectEntry key={p.course + p.title} p={p} first={i === 0} />
          ))
        )}
      </Pane>
    </div>
  );
}
