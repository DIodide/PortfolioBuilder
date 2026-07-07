import Pane from "@/components/Pane";
import {
  getCourseSections,
  semesterOrder,
  shortSemester,
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

  return (
    <div className="machine fill ws-course" data-acc="course">
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
        cmd="ls coursework/projects/"
        label="course projects"
        gridArea="proj"
      >
        <p className="dim">total 0</p>
        <p className="faint" style={{ marginTop: 8 }}>
          nothing here yet — course-adjacent builds land here after finals.
        </p>
      </Pane>
    </div>
  );
}
