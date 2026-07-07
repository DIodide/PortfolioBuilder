import Pane from "@/components/Pane";
import { getWorkRows } from "@/lib/content";

export const metadata = {
  title: "work — Ibraheem Amin",
};

/** "Software Engineer Intern (Internship)" -> "software engineer intern" */
const cleanRole = (role: string) =>
  role.replace(/\s*\([^)]*\)$/, "").toLowerCase();

/** "New York, US (On-site)" -> "new york"; "Princeton, NJ" -> "princeton, nj" */
const shortLoc = (loc: string) =>
  loc
    .replace(/\s*\([^)]*\)$/, "")
    .replace(/,\s*US$/i, "")
    .toLowerCase();

/** "Jun 2026 - Present" -> "jun 2026 → now"; "Jan 2026" -> "jan 2026" */
function stamp(period: string): string {
  const [from, to] = period.split(" - ");
  if (!to) return from.toLowerCase();
  return `${from.toLowerCase()} → ${/present/i.test(to) ? "now" : to.toLowerCase()}`;
}

export default function Work() {
  const work = getWorkRows();
  const current = work.filter((w) => w.current);

  // ps pane column widths, computed from the data
  const starts = current.map((w) => w.period.split(" - ")[0].toLowerCase());
  const startW = starts.reduce(
    (n, s) => Math.max(n, s.length),
    "started".length,
  );

  const total = work.length;
  const workplaces = new Set(work.map((w) => w.workplace)).size;
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
      </Pane>

      <Pane cmd="wc -l work.log" label="work summary" gridArea="hi">
        <pre className="block dim">{String(total).padStart(8) + " work.log"}</pre>
        <div className="kv" style={{ marginTop: 12 }}>
          <span className="k">entries</span>
          <span>{total} roles</span>
          <span className="k">workplaces</span>
          <span>{workplaces} unique</span>
          <span className="k">span</span>
          <span>{firstYear} → present</span>
        </div>
      </Pane>

      <Pane
        cmd="tail -f work.log"
        sub={`· ${total} entries`}
        label="work log"
        gridArea="log"
      >
        <div className="rows">
          {work.map((w, i) => {
            const repeat = i > 0 && work[i - 1].workplace === w.workplace;
            return (
              <span key={w.workplace + w.period}>
                <span className={w.current ? "accent" : "faint"}>
                  [{stamp(w.period)}]
                </span>{" "}
                <span className={w.current ? undefined : "dim"}>
                  <span className={repeat ? "faint" : undefined}>
                    {w.workplace.toLowerCase()}
                  </span>{" "}
                  — {cleanRole(w.role)}
                  <span className="faint"> · {shortLoc(w.location)}</span>
                </span>
              </span>
            );
          })}
          <span aria-hidden="true">
            <span className="cursor" style={{ width: "0.45em" }}></span>
          </span>
        </div>
      </Pane>
    </div>
  );
}
