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
  tab_label?: string;
  pane_id?: string;
  terminal_id?: string;
  harness?: string;
  status?: string;
  prev_status?: string;
  cwd?: string;
  run_started_at?: string;
  run_duration_ms?: number;
  detail?: string;
  repo?: { repo_root?: string; repo_name?: string; branch?: string; remote?: string; is_worktree?: boolean };
  model?: string;
  tokens_in?: number;
  tokens_out?: number;
  tokens_cache_read?: number;
  tokens_cache_write?: number;
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
    host?: string;
    ws: string;
    pane: string;
    harness: string;
    repo?: string;
    branch?: string;
    remote?: string;
    repoUrl?: string;
    tab?: string;
    durMs?: number;
    sinceTs?: string;
    count?: number;
    model?: string;
    tok?: number;
    state: "running" | "done";
  }

  // walk forward: track open runs per (host, pane); run.finished emits a
  // done slip. Keyed by host+pane so two machines with the same pane id
  // (e.g. w6:p1) never clobber each other.
  const paneKey = (e: TelemetryEvent) => `${e.host ?? ""}|${e.pane_id ?? ""}`;
  // herdr defaults tab labels to the tab number — numeric means unnamed
  const namedTab = (e: TelemetryEvent) =>
    e.tab_label && !/^\d+$/.test(e.tab_label) ? e.tab_label : undefined;
  const open = new Map<string, TelemetryEvent>();
  const runs: Slip[] = [];
  let lastSnapshot: TelemetryEvent | null = null;
  let daemonLive = false;

  for (const { kind, payload: e } of rows) {
    switch (kind) {
      case "run.started":
        if (e.pane_id) open.set(paneKey(e), e);
        daemonLive = true;
        break;
      case "run.finished":
        if (e.pane_id) open.delete(paneKey(e));
        runs.push({
          ts: e.ts,
          host: e.host,
          ws: e.workspace_label || e.workspace_id || "?",
          pane: e.pane_id || "?",
          harness: e.harness || "agent",
          repo: e.repo?.repo_name,
          branch: e.repo?.branch,
          remote: e.repo?.remote,
          tab: namedTab(e),
          durMs: e.run_duration_ms,
          count: 1,
          model: e.model,
          tok: (e.tokens_in ?? 0) + (e.tokens_out ?? 0) || undefined,
          state: "done",
        });
        daemonLive = true;
        break;
      case "agent.gone":
        if (e.pane_id) open.delete(paneKey(e));
        break;
      case "snapshot":
        lastSnapshot = e;
        daemonLive = true;
        break;
      case "daemon.stopped": {
        // only THIS host's open runs end — other machines keep streaming
        const prefix = `${e.host ?? ""}|`;
        for (const k of open.keys()) if (k.startsWith(prefix)) open.delete(k);
        break;
      }
      case "agent.status_changed":
        if (e.pane_id && e.status !== "working" && e.status !== "blocked") {
          open.delete(paneKey(e));
        }
        break;
    }
  }

  const live: Slip[] = [...open.values()].map((e) => ({
    ts: e.ts,
    host: e.host,
    ws: e.workspace_label || e.workspace_id || "?",
    pane: e.pane_id || "?",
    harness: e.harness || "agent",
    repo: e.repo?.repo_name,
    branch: e.repo?.branch,
    remote: e.repo?.remote,
    tab: namedTab(e),
    model: e.model,
    sinceTs: e.run_started_at || e.ts,
    state: "running" as const,
  }));

  runs.reverse(); // newest first

  // dedupe: fold runs of the same identity within a 6h window of the
  // group's newest run into one slip (count + summed duration)
  const identity = (s: Slip) =>
    [s.host || "", s.ws, s.pane, s.tab || "", s.harness, s.remote || s.repo || "", s.branch || ""].join("|");
  const WINDOW_MS = 6 * 3600 * 1000;
  const merged: Slip[] = [];
  const groups = new Map<string, Slip>();
  for (const r of runs) {
    const key = identity(r);
    const g = groups.get(key);
    if (g && Date.parse(g.ts) - Date.parse(r.ts) <= WINDOW_MS) {
      g.count = (g.count ?? 1) + 1;
      g.durMs = (g.durMs ?? 0) + (r.durMs ?? 0);
      if (r.tok) g.tok = (g.tok ?? 0) + r.tok;
      if (!g.model && r.model) g.model = r.model;
    } else {
      const slip = { ...r };
      groups.set(key, slip);
      merged.push(slip);
    }
  }

  const shown = merged.slice(0, 12);
  await Promise.all(
    [...live, ...shown].map(async (s) => {
      if (s.remote) s.repoUrl = await publicRepoUrl(s.remote);
    }),
  );

  const totalTokens = runs.reduce((n, r) => n + (r.tok ?? 0), 0);

  return {
    live,
    runs: shown,
    totalRuns: runs.length,
    totalTokens,
    snapshotTs: lastSnapshot?.ts ?? null,
    daemonLive,
    updated: new Date().toISOString(),
  };
}

// ── public-repo link resolution ──────────────────────────────────────
// A remote becomes a link only when github confirms the repo is public.
// Cached per lambda instance (6h TTL); failures cache as private so an
// unreachable API can't add latency to every panel read.

const repoVis = new Map<string, { url?: string; exp: number }>();

async function publicRepoUrl(remote: string): Promise<string | undefined> {
  if (!/^[\w.-]+\/[\w.-]+$/.test(remote)) return undefined;
  const hit = repoVis.get(remote);
  if (hit && hit.exp > Date.now()) return hit.url;
  let url: string | undefined;
  try {
    const res = await fetch(`https://api.github.com/repos/${remote}`, {
      headers: { "User-Agent": "portfolio-now-panel" },
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      const meta = (await res.json()) as { private?: boolean; html_url?: string };
      if (meta.private === false && meta.html_url) url = meta.html_url;
    }
  } catch {
    // treat as private; retried after the TTL
  }
  repoVis.set(remote, { url, exp: Date.now() + 6 * 3600 * 1000 });
  return url;
}
