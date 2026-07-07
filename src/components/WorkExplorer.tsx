"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Pane from "@/components/Pane";
import type { Workplace, WorkRow } from "@/lib/content";

// Brief + log split for the work workspace: every `tail -f work.log` entry
// is a selector, and the brief pane cats the selected workplace's
// WORK_DESCRIPTION.md (logo, roles, highlights, tech, art). All strings come
// from the rows/workplaces props — nothing is invented here.
//
// Until the user touches the explorer, the selection auto-rotates through
// the log's workplaces every 6s (skipped for reduced-motion, paused in
// hidden tabs). The first interaction hands ownership to the user for good.

/* ── helpers mirrored from work/page.tsx (lib/content is server-only) ── */

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

/** hostname of a link, e.g. "evalgaming.com" */
const host = (url: string) =>
  url.replace(/^https?:\/\//, "").split("/")[0].replace(/^www\./, "");

/* ── WORK_DESCRIPTION.md section cleanup ─────────────────────────
   Role sections usually open with a location boilerplate line
   ("New York, United States. On-site.") that duplicates frontmatter —
   drop it. TODO stubs and "no description" filler count as absent. */

interface Block {
  kind: "p" | "li";
  text: string;
}

const LOC_LINE = /^[a-z .,'()-]+\.\s*(on-site|remote|hybrid)\.?$/i;
const PLACEHOLDER = /^(todo\b|no further description\b)/i;

/** markdown-lite: hard-wrapped paragraphs + `- ` bullets -> blocks */
function parseBlocks(content: string): Block[] {
  const blocks: Block[] = [];
  let open: Block | null = null;
  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (!line) {
      open = null;
    } else if (line.startsWith("- ")) {
      open = { kind: "li", text: line.slice(2).trim() };
      blocks.push(open);
    } else if (open) {
      open.text += " " + line;
    } else {
      open = { kind: "p", text: line };
      blocks.push(open);
    }
  }
  return blocks;
}

function cleanSection(content: string): Block[] {
  const blocks = parseBlocks(content);
  if (blocks[0]?.kind === "p" && LOC_LINE.test(blocks[0].text)) blocks.shift();
  return blocks.filter((b) => !PLACEHOLDER.test(b.text));
}

/** consecutive bullets group into one list; paragraphs stay .prose */
function renderBlocks(blocks: Block[]): ReactNode[] {
  const out: ReactNode[] = [];
  let items: string[] = [];
  const flush = () => {
    if (!items.length) return;
    out.push(
      <ul
        key={`ul-${out.length}`}
        className="prose"
        style={{
          fontSize: 12.5,
          listStyle: "none",
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {items.map((text, i) => (
          <li key={i} style={{ position: "relative", paddingLeft: 15 }}>
            <span
              className="accent"
              aria-hidden="true"
              style={{ position: "absolute", left: 0 }}
            >
              ▸
            </span>
            {text}
          </li>
        ))}
      </ul>,
    );
    items = [];
  };
  for (const b of blocks) {
    if (b.kind === "li") {
      items.push(b.text);
    } else {
      flush();
      out.push(
        <p key={`p-${out.length}`} className="prose" style={{ fontSize: 12.5 }}>
          {b.text}
        </p>,
      );
    }
  }
  flush();
  return out;
}

/* ── brief pane (gridArea: hi) ───────────────────────────────── */

function Brief({ wp, onOwn }: { wp: Workplace; onOwn: () => void }) {
  const secs = wp.sections
    .map((s) => ({ heading: s.heading, blocks: cleanSection(s.content) }))
    .filter((s) => s.blocks.length > 0);

  return (
    <Pane
      cmd={`cat ${wp.dir}/WORK_DESCRIPTION.md`}
      label={`workplace brief: ${wp.company.toLowerCase()}`}
      gridArea="hi"
    >
      {/* display:contents wrapper: any click in the brief content hands
          rotation ownership to the user without touching layout */}
      <div style={{ display: "contents" }} onClickCapture={onOwn}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {wp.logoUrl ? (
          <img
            src={wp.logoUrl}
            alt={`${wp.company} logo`}
            width={36}
            height={36}
            style={{
              width: 36,
              height: 36,
              flex: "none",
              objectFit: "cover",
              border: "1px solid var(--border-strong)",
            }}
          />
        ) : (
          <span
            aria-hidden="true"
            style={{
              width: 36,
              height: 36,
              flex: "none",
              border: "1px dashed var(--border-strong)",
              display: "grid",
              placeItems: "center",
              fontSize: 11,
              color: "var(--faint)",
            }}
          >
            ∅
          </span>
        )}
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>
            {wp.company.toLowerCase()}
          </p>
          {wp.website && (
            <div className="links" style={{ marginTop: 2, fontSize: 11 }}>
              <a
                href={wp.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                {host(wp.website)} ↗
              </a>
            </div>
          )}
        </div>
      </div>

      {wp.roles.length > 0 && (
        <div
          style={{
            marginTop: 12,
            fontSize: 12,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          {wp.roles.map((r) => (
            <span key={r.title + r.period}>
              <span className="faint">└─</span> {r.title.toLowerCase()}
              <span className="dim"> · {stamp(r.period)}</span>
            </span>
          ))}
        </div>
      )}

      {secs.length > 0 ? (
        secs.map((s) => (
          <div key={s.heading} style={{ marginTop: 14 }}>
            {secs.length > 1 && (
              <p className="meta" style={{ margin: "0 0 8px" }}>
                <span className="faint">## </span>
                {s.heading.toLowerCase()}
              </p>
            )}
            {renderBlocks(s.blocks)}
          </div>
        ))
      ) : (
        <p style={{ marginTop: 14, fontSize: 12 }}>
          <span className="dim">cat: no highlights logged yet — check back.</span>
        </p>
      )}

      {wp.tech.length > 0 && (
        <div className="chips" style={{ margin: "14px 0 0" }}>
          {wp.tech.map((t) => (
            <span key={t} className="chip">
              {t}
            </span>
          ))}
        </div>
      )}

      {wp.images.length > 0 && (
        <div className="strip" style={{ marginTop: 14 }}>
          {wp.images.map((src) => {
            const file = src.split("/").pop() ?? src;
            const base = file.replace(/\.[^.]+$/, "");
            return (
              <figure key={src} style={{ flex: "0 0 120px" }}>
                <img src={src} alt={`${wp.company} — ${base}`} loading="lazy" />
                <figcaption>{file}</figcaption>
              </figure>
            );
          })}
        </div>
      )}
      </div>
    </Pane>
  );
}

/* ── log pane rows: selectable buttons keeping the tail -f look ── */

const ROW_CSS = `
.wlog-row { display: block; text-align: left; font-size: 12px; padding: 2px 8px 2px 10px; margin: 0 -8px 0 -10px; }
button.wlog-row:hover { background: color-mix(in srgb, var(--acc) 8%, transparent); }
.wlog-row[aria-pressed="true"] { box-shadow: inset 2px 0 0 0 var(--acc); background: color-mix(in srgb, var(--acc) 6%, transparent); }
`;

export default function WorkExplorer({
  rows,
  workplaces,
}: {
  rows: WorkRow[];
  workplaces: Workplace[];
}) {
  const byDir = useMemo(
    () => new Map(workplaces.map((w) => [w.dir, w])),
    [workplaces],
  );
  const [selectedDir, setSelectedDir] = useState<string>(() => {
    const first =
      rows.find((r) => r.current && r.dir && byDir.has(r.dir)) ??
      rows.find((r) => r.dir && byDir.has(r.dir));
    return first?.dir ?? workplaces[0]?.dir ?? "";
  });
  const selected = byDir.get(selectedDir);

  /* auto-rotation: distinct workplace dirs in log-row order */
  const rotation = useMemo(() => {
    const seen = new Set<string>();
    const dirs: string[] = [];
    for (const r of rows) {
      if (r.dir && byDir.has(r.dir) && !seen.has(r.dir)) {
        seen.add(r.dir);
        dirs.push(r.dir);
      }
    }
    return dirs;
  }, [rows, byDir]);

  // once the user interacts anywhere in the explorer they own the
  // selection for the session — rotation stops and never restarts
  const owned = useRef(false);
  const own = () => {
    owned.current = true;
  };

  useEffect(() => {
    if (rotation.length < 2 || owned.current) return;
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return; // reduced motion: keep the default selection until a click

    let id: number | undefined;
    const stop = () => {
      if (id !== undefined) {
        window.clearInterval(id);
        id = undefined;
      }
    };
    const tick = () => {
      if (owned.current) {
        stop();
        return;
      }
      // same setter the row clicks use, so the brief updates identically
      setSelectedDir((dir) => {
        const i = rotation.indexOf(dir);
        return rotation[(i + 1) % rotation.length];
      });
    };
    const start = () => {
      if (id === undefined && !owned.current) id = window.setInterval(tick, 6000);
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener("visibilitychange", onVisibility);
    if (!document.hidden) start();
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [rotation]);

  return (
    <>
      {selected ? (
        <Brief wp={selected} onOwn={own} />
      ) : (
        <Pane
          cmd="cat work/WORK_DESCRIPTION.md"
          label="workplace brief"
          gridArea="hi"
        >
          <p className="red" style={{ fontSize: 12 }}>
            cat: work/WORK_DESCRIPTION.md: no such file or directory
          </p>
        </Pane>
      )}

      <Pane
        cmd="tail -f work.log"
        sub={`· ${rows.length} entries`}
        label="work log"
        gridArea="log"
      >
        <style>{ROW_CSS}</style>
        <div className="rows" style={{ gap: 2 }}>
          {rows.map((w, i) => {
            const repeat = i > 0 && rows[i - 1].workplace === w.workplace;
            const wp = w.dir ? byDir.get(w.dir) : undefined;
            const content = (
              <>
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
              </>
            );
            const key = (w.dir ?? w.workplace) + w.period;
            return wp ? (
              <button
                key={key}
                type="button"
                className="wlog-row"
                aria-pressed={wp.dir === selectedDir}
                onClick={() => {
                  own(); // ownership first: this selection is the user's
                  setSelectedDir(wp.dir);
                }}
              >
                {content}
              </button>
            ) : (
              <span key={key} className="wlog-row">
                {content}
              </span>
            );
          })}
          <span aria-hidden="true">
            <span className="cursor" style={{ width: "0.45em" }}></span>
          </span>
        </div>
      </Pane>
    </>
  );
}
