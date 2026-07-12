# Now Panel Redesign Notes

## Scope

This exploration changes only the home workspace's `now` pane. The existing
surface strip, workspace sidebar, pane machine, ledger-light material, and
terminal-dark material remain the frame.

The hard privacy rule from `for-codex-1` also remains in force:

- Never read or publish prompts, responses, pane contents, transcripts,
  terminal previews, tool names, or OSC titles.
- A readable activity title may only come from explicit opt-in public metadata
  or an allowlisted public Git repository signal.
- Private workspaces remain useful as presence and timing signals while their
  repo, branch, title, and output stay redacted.

## What Is Wrong With The Current Pane

The current slip grid repeats repo, branch, harness, model, state, duration,
and tokens inside equal containers. That creates several problems:

1. It answers "where and with which model?" before "what workstream is active?"
2. Live and historical runs have nearly identical visual weight.
3. Only the first two live agents render, even when the API returns more.
4. A blocked agent is kept open by the read model but rendered as `working`.
5. Six-hour dedupe folds separate runs into one `xN` slip and hides timing.
6. Host, blocked status, cache counters, focus intervals, snapshot freshness,
   collector health, and full agent presence already exist but are not used.
7. Fetch failures and stream outages are visually indistinguishable from a
   quiet desk.
8. Workspace/tab/time labels are hidden from assistive technology, and the
   forced two-column mobile layout can overflow.

## Four Information Architectures

### 1. Live Ledger

Primary question: "Which agents are active, and what state is each in?"

- Uncapped active roster first.
- Selected agent gets one unboxed headline and a compact fact line.
- History becomes a semantic table with expandable detail rows.
- Best low-risk replacement because it can ship mostly on current data.

### 2. Workstreams

Primary question: "What projects are moving today?"

- Group runs by public repo or privacy-shaped workspace.
- Show one aggregate band per project: active agents, agent time, runs, user
  focus, and tangible public output.
- Repeated agent runs become marks within the workstream instead of repeated
  cards.
- Best portfolio-facing direction because it presents work before machinery.

### 3. Day Score

Primary question: "How did activity move across the day?"

- Every workstream shares one clock.
- Agent runs are intervals; waiting and interrupted spans are visually honest.
- Existing opt-in focus intervals become a separate thin line, never conflated
  with agent runtime.
- Mobile uses a chronological list rather than a squeezed chart.

### 4. Herdr Map

Primary question: "Where are my current agents across machines and tabs?"

- Render the actual host > workspace > named tab > agent hierarchy.
- Host freshness and collector degradation are first-class.
- Selecting an agent opens an unboxed inspector and recent event trail.
- Strongest owner/operator view; more technical for a general portfolio visitor.

## Data Plan

### Phase 1: Use What Already Exists

- Preserve and render `status`, including `blocked`.
- Show all live agents, sorted by current state and freshness.
- Expose privacy-shaped host identity and snapshot/collector freshness.
- Query stored `focus.interval` events for optional time-by-workstream views.
- Preserve full input/output/cache token counters in drill-down detail instead
  of using token volume as the primary accomplishment.
- Reconcile live state from snapshots rather than merely recording their time.

### Phase 2: Fix Correctness

- Add `event_id` and `run_id`; make ingest idempotent.
- Add explicit `started_at`, `ended_at`, `status_since`, and `last_seen_at`.
- Split wall time into working and waiting/blocked intervals.
- Add a structured finish reason: `finished`, `cancelled`, `interrupted`,
  `agent_gone`, `daemon_stop`, or `unknown`. Do not label every ending a
  success.
- Make daemon health mean recent heartbeat/snapshot state, not "an event existed
  sometime in the last 24 hours."

### Phase 3: Add Privacy-Safe Meaning

- `public_title`, `role`, and `phase` from explicit opt-in
  `pane report-metadata` or a dedicated hook. Include a TTL and a per-workspace
  publish allowlist.
- Friendly `host_alias` as an opt-in label while retaining the hashed host ID
  for identity.
- Optional allowlisted Git snapshot counters: short HEAD, commit count,
  dirty/clean state, files changed, additions, and deletions. No file paths or
  contents.
- Public GitHub commit metadata can be enriched server-side only after the
  repository is confirmed public.

## Standards Check

The current OpenTelemetry GenAI registry includes agent identity, provider,
model, operation name, workflow name, and separate input/output/cache usage
fields. Those are useful naming references for the Herdr event contract. The
same registry explicitly warns that input and output message attributes are
likely to contain sensitive information. This project should stay counters-
only and never adopt message-content attributes.

References:

- [OpenTelemetry GenAI attributes](https://opentelemetry.io/docs/specs/semconv/registry/attributes/gen-ai/)
- [OpenTelemetry GenAI semantic conventions repository](https://github.com/open-telemetry/semantic-conventions-genai)
- [W3C accessible tables tutorial](https://www.w3.org/WAI/tutorials/tables/)
- [W3C responsive table guidance](https://www.w3.org/WAI/tutorials/tables/tips/)

## Recommendation

Use **Workstreams** as the portfolio-facing direction, with the **Live Ledger**
active roster placed above it. That hierarchy answers "what is moving?" first,
then "which agent is doing it?" Day Score is a useful optional detail view once
focus intervals and stable run IDs are reliable. Herdr Map is the strongest
debug/owner view but should not be the default public presentation.

