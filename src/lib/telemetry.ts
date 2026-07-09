import "server-only";
import postgres from "postgres";

// Telemetry storage for the herdr-telemetry plugin stream (the [now] pane).
// One table, 24h retention enforced on every ingest. The postgres client is
// cached on globalThis so dev hot-reload and warm lambdas reuse the pool.

const globalForSql = globalThis as unknown as { __telemetrySql?: ReturnType<typeof postgres> };

export function sql() {
  if (!globalForSql.__telemetrySql) {
    globalForSql.__telemetrySql = postgres(process.env.POSTGRES_URL!, {
      ssl: "require",
      max: 1,
      idle_timeout: 20,
    });
  }
  return globalForSql.__telemetrySql;
}

/** Event kinds the site keeps — everything else the plugin sends is
 *  acknowledged but not stored (lifecycle noise the panel never shows). */
export const KEPT_KINDS = new Set([
  "run.started",
  "run.finished",
  "agent.status_changed",
  "agent.seen",
  "agent.gone",
  "snapshot",
  "daemon.started",
  "daemon.stopped",
  "collector.degraded",
  "collector.recovered",
  "focus.interval",
  "test",
]);

export interface TelemetryEvent {
  v: number;
  kind: string;
  ts: string;
  host?: string;
  workspace_id?: string;
  workspace_label?: string;
  workspace_number?: number;
  tab_id?: string;
  pane_id?: string;
  terminal_id?: string;
  harness?: string;
  status?: string;
  prev_status?: string;
  cwd?: string;
  run_started_at?: string;
  run_duration_ms?: number;
  detail?: string;
  repo?: { repo_root?: string; repo_name?: string; branch?: string; is_worktree?: boolean };
}

export async function insertEvents(events: TelemetryEvent[]) {
  if (events.length === 0) return 0;
  const db = sql();
  // db.json() marks the value for jsonb serialization — pre-stringifying
  // would double-encode (a jsonb string, not an object)
  const rows = events.map((e) => ({
    ts: e.ts,
    kind: e.kind,
    payload: db.json(e as never),
  }));
  await db`insert into herdr_events ${db(rows, "ts", "kind", "payload")}`;
  // 24h retention, enforced inline — the table stays tiny
  await db`delete from herdr_events where ts < now() - interval '24 hours'`;
  return events.length;
}

/** Everything the now panel needs, shaped server-side. */
export async function nowModel() {
  const db = sql();
  const raw = await db<{ kind: string; payload: TelemetryEvent | string }[]>`
    select kind, payload from herdr_events
    where ts > now() - interval '24 hours'
      and kind in ('run.started','run.finished','agent.status_changed','snapshot','agent.gone','daemon.stopped')
    order by ts asc`;
  // tolerate double-encoded rows from any older writer
  const rows = raw.map((r) => ({
    kind: r.kind,
    payload: (typeof r.payload === "string" ? JSON.parse(r.payload) : r.payload) as TelemetryEvent,
  }));

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

  // walk forward: track open runs per pane; run.finished emits a done slip
  const open = new Map<string, TelemetryEvent>(); // pane_id -> run.started
  const runs: Slip[] = [];
  let lastSnapshot: TelemetryEvent | null = null;
  let daemonLive = false;

  for (const { kind, payload: e } of rows) {
    switch (kind) {
      case "run.started":
        if (e.pane_id) open.set(e.pane_id, e);
        daemonLive = true;
        break;
      case "run.finished":
        if (e.pane_id) open.delete(e.pane_id);
        runs.push({
          ts: e.ts,
          ws: e.workspace_label || e.workspace_id || "?",
          pane: e.pane_id || "?",
          harness: e.harness || "agent",
          repo: e.repo?.repo_name,
          branch: e.repo?.branch,
          durMs: e.run_duration_ms,
          state: "done",
        });
        daemonLive = true;
        break;
      case "agent.gone":
        if (e.pane_id) open.delete(e.pane_id);
        break;
      case "snapshot":
        lastSnapshot = e;
        daemonLive = true;
        break;
      case "daemon.stopped":
        // anything still open when the daemon died isn't live anymore
        open.clear();
        daemonLive = false;
        break;
      case "agent.status_changed":
        if (e.pane_id && e.status !== "working" && e.status !== "blocked") {
          open.delete(e.pane_id);
        }
        break;
    }
  }

  const live: Slip[] = [...open.values()].map((e) => ({
    ts: e.ts,
    ws: e.workspace_label || e.workspace_id || "?",
    pane: e.pane_id || "?",
    harness: e.harness || "agent",
    repo: e.repo?.repo_name,
    branch: e.repo?.branch,
    sinceTs: e.run_started_at || e.ts,
    state: "running" as const,
  }));

  runs.reverse(); // newest first
  return {
    live,
    runs: runs.slice(0, 12),
    totalRuns: runs.length,
    snapshotTs: lastSnapshot?.ts ?? null,
    daemonLive,
    updated: new Date().toISOString(),
  };
}
