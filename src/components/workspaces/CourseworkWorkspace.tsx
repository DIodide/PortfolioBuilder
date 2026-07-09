import Pane from "@/components/Pane";
import {
  getCourseSections,
  getCourseworkProjects,
  semesterOrder,
  shortSemester,
  type CourseworkProject,
} from "@/lib/content";


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

function ProjectEntry({
  p,
  registrar,
  first,
}: {
  p: CourseworkProject;
  /** registrar URL for this entry's course, when COURSEWORK.md has one */
  registrar?: string;
  first: boolean;
}) {
  const prose = p.paragraphs[0] ? clampProse(p.paragraphs[0]) : null;
  const meta = [p.courseTitle, p.semester, p.team && `team: ${p.team}`].filter(
    Boolean,
  );
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
        {registrar ? (
          // same chip as the cal pane above — code label doesn't name the
          // registrar host, so the confirm modal guards the jump
          <a
            className="ccode"
            href={registrar}
            title={p.course}
            target="_blank"
            rel="noopener noreferrer"
            data-confirm=""
          >
            {shortCode(p.course)}
          </a>
        ) : (
          <span className="ccode" title={p.course}>
            {shortCode(p.course)}
          </span>
        )}
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
      {/* overflow past the caps truncates silently — no "+n" affordance,
          since there is nowhere to see the hidden items */}
      {p.highlights.slice(0, MAX_HIGHLIGHTS).map((h) => (
        <p key={h} style={{ display: "flex", gap: 6, fontSize: 12, marginTop: 5 }}>
          <span className="accent" style={{ flex: "none" }}>
            ▸
          </span>
          <span className="dim">{h}</span>
        </p>
      ))}
      {p.skills.length > 0 && (
        <div className="chips" style={{ margin: "8px 0 0" }}>
          {p.skills.slice(0, MAX_SKILL_CHIPS).map((s) => (
            <span key={s} className="chip">
              {s}
            </span>
          ))}
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

export default function CourseworkWorkspace() {
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

  // course code → registrar URL, keyed by the full course string
  // ("HIS 387 / ENG 389 / CDH 387") and by its first code token as a
  // fallback, so project entries link out exactly like the cal chips
  const registrar = new Map<string, string>();
  for (const c of courses) {
    if (!c.link || c.code === "TODO") continue;
    if (!registrar.has(c.code)) registrar.set(c.code, c.link);
    const short = shortCode(c.code);
    if (!registrar.has(short)) registrar.set(short, c.link);
  }
  const registrarFor = (course: string) =>
    registrar.get(course) ?? registrar.get(shortCode(course));

  return (
    <>
      <style>{`
        @media (max-width: 860px) {
          /* ccode chips are links (~22px tall); grow the touch target to
             ~40px with invisible hit-slop instead of resizing the chip */
          .ws-course a.ccode { position: relative; }
          .ws-course a.ccode::after { content: ""; position: absolute; inset: -9px -3px; }
          .ws-course .cal-row { gap: 12px 8px; }
          /* repo/demo links are 18px-tall text; same invisible hit-slop
             treatment (16px link gap and 28px entry gap absorb it) */
          .ws-course .links a { position: relative; }
          .ws-course .links a::after { content: ""; position: absolute; inset: -11px -6px; }
          /* todo chips carry full course names; ellipsize instead of
             pushing the page sideways on narrow screens */
          .ws-course .ccode.todo { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
        }
      `}</style>
      <div
        className="machine fill ws-course"
        data-acc="course"
        // the projects pane carries prose now; trade tree width for it
        // (mobile: globals' 1fr !important out-cascades this inline style)
        style={{ gridTemplateColumns: "1fr 1.25fr" }}
      >
        <Pane
          tab="calendar"
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

        <Pane cmd="tree ~/coursework" tab="all courses" label="coursework tree" gridArea="tree">
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
        tab="course projects"
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
              <ProjectEntry
                key={p.course + p.title}
                p={p}
                registrar={registrarFor(p.course)}
                first={i === 0}
              />
            ))
          )}
        </Pane>
      </div>
    </>
  );
}
