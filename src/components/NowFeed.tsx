"use client";

import { useEffect, useState } from "react";

// The [now] pane, live: agent runs streamed from the owner's herdr session
// via the herdr-telemetry plugin. Each run is a paper slip — workspace/pane
// on the top edge, repo@branch as the body, harness chip + outcome in the
// foot. Running agents get a full-width fresh slip against the live edge.

// brand marks (vendored paths: Anthropic via simple-icons, OpenAI via
// LobeHub icons — both 24x24, fill currentColor)
const HARNESS_MARKS: Record<string, { path: string; label: string }> = {
  claude: {
    label: "Anthropic Claude",
    path: "M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z",
  },
  codex: {
    label: "OpenAI Codex",
    path: "M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 004.162 1.713z",
  },
};

function HarnessMark({ harness, model }: { harness: string; model?: string }) {
  const mark = HARNESS_MARKS[harness];
  return (
    <span className="hchip" data-h={harness} title={mark ? mark.label : harness}>
      {mark ? (
        <svg viewBox="0 0 24 24" width="11" height="11" aria-label={mark.label} role="img">
          <path d={mark.path} fill="currentColor" fillRule="evenodd" />
        </svg>
      ) : (
        harness
      )}
      {model && <span className="hmodel">{model}</span>}
    </span>
  );
}

function tok(n?: number): string | null {
  if (!n) return null;
  if (n < 1000) return `${n} tok`;
  if (n < 1_000_000) return `${Math.round(n / 1000)}k tok`;
  return `${(n / 1_000_000).toFixed(1)}M tok`;
}

interface Slip {
  ts: string;
  ws: string;
  pane: string;
  harness: string;
  repo?: string;
  branch?: string;
  remote?: string;
  repoUrl?: string;
  durMs?: number;
  sinceTs?: string;
  count?: number;
  model?: string;
  tok?: number;
  state: "running" | "done";
}

interface NowModel {
  live: Slip[];
  runs: Slip[];
  totalRuns: number;
  totalTokens?: number;
  daemonLive: boolean;
  error?: boolean;
}

function ago(ts: string): string {
  const s = Math.max(0, (Date.now() - Date.parse(ts)) / 1000);
  if (s < 90) return "just now";
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

function dur(ms?: number, sinceTs?: string): string {
  const s = ms != null ? ms / 1000 : sinceTs ? (Date.now() - Date.parse(sinceTs)) / 1000 : 0;
  if (s < 60) return `${Math.round(s)}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  return `${Math.floor(s / 3600)}h${String(Math.round((s % 3600) / 60)).padStart(2, "0")}m`;
}

function SlipCard({ s }: { s: Slip }) {
  const running = s.state === "running";
  return (
    <article className={running ? "nslip live" : "nslip"}>
      <span className="ntag" aria-hidden="true">
        {s.ws.toLowerCase()}/{s.pane.split(":").pop()}
      </span>
      <span className="ntag ntime" aria-hidden="true">
        {running ? "live" : ago(s.ts)}
      </span>
      <p className="nmain">
        {s.remote && s.repoUrl ? (
          <a href={s.repoUrl} target="_blank" rel="noopener noreferrer" className="nrepo">
            {s.remote}
            <span className="nbranch" aria-hidden="true"> ↗</span>
          </a>
        ) : (
          (s.remote || s.repo) ?? s.ws.toLowerCase()
        )}
        {s.branch && <span className="nbranch"> @ {s.branch}</span>}
      </p>
      <p className="nfoot">
        <HarnessMark harness={s.harness} model={s.model} />
        <span className="nlead" aria-hidden="true"></span>
        {running ? (
          <span className="accent">● working · {dur(undefined, s.sinceTs)}</span>
        ) : (
          <span className="dim">
            ✓ done{s.count && s.count > 1 ? ` ×${s.count}` : ""} · {dur(s.durMs)}
            {tok(s.tok) ? ` · ${tok(s.tok)}` : ""}
          </span>
        )}
      </p>
    </article>
  );
}

export default function NowFeed() {
  const [model, setModel] = useState<NowModel | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/now")
        .then((r) => r.json())
        .then((m) => alive && setModel(m))
        .catch(() => {});
    load();
    const t = setInterval(load, 60_000);
    const onVis = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      alive = false;
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const live = model?.live ?? [];
  const runs = model?.runs ?? [];
  const empty = model && live.length === 0 && runs.length === 0;

  return (
    <div className="nfeed">
      {!model && <p className="nempty dim">connecting to the agent stream…</p>}
      {empty && (
        <p className="nempty dim">
          no agent runs in the last 24h — the desk is quiet.
        </p>
      )}
      {live.length > 0 && (
        <div className="nslips nlive-row">
          {live.slice(0, 2).map((s) => (
            <SlipCard key={`live-${s.pane}`} s={s} />
          ))}
        </div>
      )}
      {runs.length > 0 && (
        <div className="nslips">
          {runs.map((s, i) => (
            <SlipCard key={`${s.pane}-${s.ts}-${i}`} s={s} />
          ))}
        </div>
      )}
      <p className="nstream dim">
        <span className="faint">└─</span> streaming from herdr
        {model && (
          <>
            {" · "}
            {model.totalRuns} run{model.totalRuns === 1 ? "" : "s"}
            {tok(model.totalTokens) ? ` · ${tok(model.totalTokens)}` : ""} in 24h
          </>
        )}{" "}
        <span className="cursor" style={{ width: "0.45em" }} aria-hidden="true"></span>
      </p>
    </div>
  );
}
