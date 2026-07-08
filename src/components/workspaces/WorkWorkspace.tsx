import Pane from "@/components/Pane";
import WorkExplorer from "@/components/WorkExplorer";
import { getWorkplaces, getWorkRows } from "@/lib/content";


/** "Software Engineer Intern (Internship)" -> "software engineer intern" */
const cleanRole = (role: string) =>
  role.replace(/\s*\([^)]*\)$/, "").toLowerCase();

/** "New York, US (On-site)" -> "new york"; "Princeton, NJ" -> "princeton, nj" */
const shortLoc = (loc: string) =>
  loc
    .replace(/\s*\([^)]*\)$/, "")
    .replace(/,\s*US$/i, "")
    .toLowerCase();

export default function WorkWorkspace() {
  const work = getWorkRows();
  const workplaces = getWorkplaces();
  const current = work.filter((w) => w.current);

  // ps pane column widths, computed from the data
  const starts = current.map((w) => w.period.split(" - ")[0].toLowerCase());
  const startW = starts.reduce(
    (n, s) => Math.max(n, s.length),
    "started".length,
  );

  const total = work.length;
  const places = new Set(work.map((w) => w.workplace)).size;
  const firstYear = work[work.length - 1]?.period.match(/\d{4}/)?.[0] ?? "";

  return (
    <div className="machine fill ws-work" data-acc="work">
      <Pane cmd="ps -u ibraheem" label="current roles" gridArea="ps">
        <pre className="block">
          <span className="faint">
            {"  " + "started".padEnd(startW) + "  proc"}
          </span>
          {"\n"}
          {current.map((w, i) => (
            <span key={w.workplace + w.period}>
              <span className="accent">●</span>{" "}
              {starts[i].padEnd(startW) + "  "}
              {w.workplace.toLowerCase()}
              <span className="dim"> · {shortLoc(w.location)}</span>
              {"\n" + "  " + " ".repeat(startW) + "  "}
              <span className="faint">└─</span> {cleanRole(w.role)}
              {"\n"}
            </span>
          ))}
        </pre>
        <p className="meta" style={{ margin: "14px 0 0" }}>
          {total} roles · {places} workplaces
          {firstYear ? ` · ${firstYear} → present` : null}
        </p>
      </Pane>

      <WorkExplorer rows={work} workplaces={workplaces} />
    </div>
  );
}
