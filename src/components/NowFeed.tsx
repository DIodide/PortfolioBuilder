"use client";

import { useEffect, useState } from "react";

// The [now] pane, live: agent runs streamed from the owner's herdr session
// via the herdr-telemetry plugin. Each run is a paper slip — workspace/pane
// on the top edge, repo@branch as the body, harness chip + outcome in the
// foot. Running agents get a full-width fresh slip against the live edge.

interface Slip {
  ts: string;
  ws: string;
  pane: string;
  harness: string;
  repo?: string;
  branch?: string;
  durMs?: number;
  sinceTs?: string;
  state: "running" | "done";
}

interface NowModel {
  live: Slip[];
  runs: Slip[];
  totalRuns: number;
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
        {s.repo ? (
          <>
            {s.repo}
            {s.branch && <span className="nbranch"> @ {s.branch}</span>}
          </>
        ) : (
          s.ws.toLowerCase()
        )}
      </p>
      <p className="nfoot">
        <span className="hchip" data-h={s.harness}>
          {s.harness}
        </span>
        <span className="nlead" aria-hidden="true"></span>
        {running ? (
          <span className="accent">● working · {dur(undefined, s.sinceTs)}</span>
        ) : (
          <span className="dim">✓ done · {dur(s.durMs)}</span>
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
            {model.totalRuns} run{model.totalRuns === 1 ? "" : "s"} in 24h
          </>
        )}{" "}
        <span className="cursor" style={{ width: "0.45em" }} aria-hidden="true"></span>
      </p>
    </div>
  );
}
