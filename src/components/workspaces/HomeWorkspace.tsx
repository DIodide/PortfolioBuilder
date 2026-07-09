import NowFeed from "@/components/NowFeed";
import Pane from "@/components/Pane";
import {
  getBio,
  getCertProviders,
  getProjects,
  getSocialLinks,
  getUser,
  getWorkRows,
} from "@/lib/content";


const GLYPH = `██╗ █████╗
██║██╔══██╗
██║███████║
██║██╔══██║
██║██║  ██║
╚═╝╚═╝  ╚═╝`;

export default function HomeWorkspace() {
  const user = getUser();
  const fm = (user?.frontmatter ?? {}) as Record<string, unknown>;
  const bio = getBio();
  const socials = getSocialLinks();
  const work = getWorkRows();
  const projects = getProjects();
  const certs = getCertProviders().reduce((n, p) => n + p.count, 0);
  const resume = String(fm.resume ?? "");
  const resumeReady = resume !== "" && !resume.startsWith("TODO");
  const school = socials.find((s) => s.key === "school");

  return (
    <>
      <style>{`
        /* ── the now feed: agent runs as paper slips ─────────────────
           light = slips on the sheet (the approved mock); dark mirrors
           the same slip anatomy in terminal materials. Data lines stay
           mono — no serif italics here. */
        .nfeed { --slip-bg: #fbfdfe; --slip-edge: 0 1px 0 rgba(58, 54, 46, 0.18), 1px 2px 3px rgba(58, 54, 46, 0.10); }
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) .nfeed { --slip-bg: color-mix(in srgb, var(--text) 3%, var(--bg)); --slip-edge: none; }
        }
        :root[data-theme="dark"] .nfeed { --slip-bg: color-mix(in srgb, var(--text) 3%, var(--bg)); --slip-edge: none; }
        .nslips { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px 10px; margin-top: 6px; }
        .nslips + .nslips { margin-top: 16px; }
        .nlive-row .nslip { grid-column: 1 / -1; }
        .nslip { position: relative; background: var(--slip-bg); border: 1px solid var(--border-strong); box-shadow: var(--slip-edge); padding: 13px 12px 9px; min-width: 0; }
        .nslip.live { border-color: color-mix(in srgb, var(--acc) 55%, var(--border-strong)); }
        .nslip.live::after { content: ""; position: absolute; inset: -1px; border: 1px solid color-mix(in srgb, var(--acc) 45%, transparent); pointer-events: none; animation: nslip-breathe 3.2s ease-in-out infinite; }
        @keyframes nslip-breathe { 50% { opacity: 0.15; } }
        @media (prefers-reduced-motion: reduce) { .nslip.live::after { animation: none; } }
        .nslip .ntag { position: absolute; top: 0; left: 8px; transform: translateY(-55%); background: var(--slip-bg); padding: 0 5px; font-size: 9.5px; color: var(--muted); white-space: nowrap; max-width: 55%; overflow: hidden; text-overflow: ellipsis; }
        .nslip .ntag.ntime { left: auto; right: 8px; color: var(--faint); max-width: 38%; }
        .nslip.live .ntag.ntime { color: var(--acc); }
        .nslip .nmain { font-size: 12.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .nslip .nbranch { font-weight: 400; color: var(--muted); }
        .nslip .nfoot { display: flex; align-items: baseline; gap: 7px; margin-top: 9px; font-size: 10.5px; white-space: nowrap; }
        .nslip .nlead { flex: 1 1 auto; min-width: 8px; border-bottom: 1px dotted var(--border-strong); transform: translateY(-3px); }
        .hchip { font-size: 9.5px; padding: 1px 6px; border: 1px solid var(--border-strong); color: var(--muted); }
        .hchip[data-h="claude"] { color: var(--hc-claude, #96502e); border-color: color-mix(in srgb, var(--hc-claude, #96502e) 45%, var(--border-strong)); }
        .hchip[data-h="codex"] { color: var(--hc-codex, #2e6465); border-color: color-mix(in srgb, var(--hc-codex, #2e6465) 45%, var(--border-strong)); }
        .hchip[data-h="herdr"] { color: var(--hc-herdr, #555096); border-color: color-mix(in srgb, var(--hc-herdr, #555096) 45%, var(--border-strong)); }
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) .nfeed { --hc-claude: #e2946a; --hc-codex: #58c2c5; --hc-herdr: #a4a2f2; }
        }
        :root[data-theme="dark"] .nfeed { --hc-claude: #e2946a; --hc-codex: #58c2c5; --hc-herdr: #a4a2f2; }
        .nempty { font-size: 12px; margin-top: 4px; }
        .nstream { font-size: 10.5px; margin-top: 14px; }
        @media (max-width: 860px) {
          /* finger-sized rows: 12px text + 11px padding ≈ 40px tall */
          [data-acc="home"] .rows a { padding: 11px 0; }
          [data-acc="home"] .btn { padding: 10px 16px; }
          .nslips { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
      <div className="machine fill ws-home" data-acc="home">
      <Pane cmd="neofetch" tab="at a glance" label="identity" gridArea="neo">
        <pre className="glyph" aria-hidden="true">
          {GLYPH}
        </pre>
        <div className="kv">
          <span className="k">user</span>
          <span>
            {String(fm.name ?? "ibraheem amin").toLowerCase()}{" "}
            <span className="dim">({String(fm.pronouns ?? "he/him")})</span>
          </span>
          <span className="k">host</span>
          <span>{String(fm.school ?? "").toLowerCase()}</span>
          <span className="k">os</span>
          <span>
            {/* explicit string: JSX text ending a line gets its leading
                space stripped by the compiler ("science'28") */}
            {String(fm.degree ?? "").toLowerCase()}
            {" '"}
            {String(fm.class_year ?? "").slice(-2)}
          </span>
          <span className="k">location</span>
          <span>{String(fm.location ?? "").toLowerCase()}</span>
          <span className="k">uptime</span>
          <span>shipping since 2019</span>
          <span className="k">pkgs</span>
          <span>
            {projects.length} projects · {certs} certs · {work.length} roles
          </span>
        </div>
      </Pane>

      <Pane cmd="cat bio.md" tab="bio" label="bio" gridArea="bio" className="bio-pane">
        <h1 className="name">
          {String(fm.name ?? "Ibraheem Amin").toLowerCase()}{" "}
          <span className="cursor" aria-hidden="true"></span>
        </h1>
        <p className="meta">
          {/* separators as explicit strings — same-line JSX text before a
              newline loses its leading space ("Science· princeton") */}
          {String(fm.degree ?? "")}
          {" · princeton '"}
          {String(fm.class_year ?? "").slice(-2)}
          {" · "}
          {String(fm.location ?? "").toLowerCase()}
        </p>
        <p className="prose lede">{bio.oneLiner}</p>
        {bio.paragraphs.slice(1).map((p) => (
          <p key={p.slice(0, 24)} className="prose">
            {p}
          </p>
        ))}
      </Pane>

      {resumeReady ? (
        <Pane cmd="open resume.pdf" tab="resume" label="resume" gridArea="res">
          {/* "$ open resume.pdf" doesn't name the destination host, so an
              external resume link gets the LinkGuard confirm. */}
          <a
            className="btn"
            href={resume}
            target={resume.startsWith("http") ? "_blank" : undefined}
            rel={resume.startsWith("http") ? "noopener noreferrer" : undefined}
            data-confirm={resume.startsWith("http") ? "" : undefined}
          >
            $ open resume.pdf
          </a>
        </Pane>
      ) : (
        <Pane cmd="stat resume.pdf" tab="resume" label="resume" gridArea="res">
          <p className="red" style={{ fontSize: 12 }}>
            stat: resume.pdf: No such file
            <br />
            or directory
          </p>
          <p className="dim" style={{ fontSize: 12, marginTop: 8 }}>
            resume is being typeset —<br />
            mail me instead.
          </p>
          {school && (
            <a className="btn" href={school.href}>
              $ mail ibraheem
            </a>
          )}
        </Pane>
      )}

      <Pane cmd="tail -f agents.log" tab="now" label="live agent activity" gridArea="now">
        <NowFeed />
      </Pane>
      </div>
    </>
  );
}
