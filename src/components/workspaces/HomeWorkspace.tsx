import NowFeed from "@/components/NowFeed";
import Pane from "@/components/Pane";
import {
  getBio,
  getCertProviders,
  getProfileArt,
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
  const pfp = getProfileArt();

  return (
    <>
      <style>{`
        /* ── the dossier hero: bio left · record right ──────────────
           light = photo print + typed index card on the sheet; dark
           mirrors the anatomy in terminal materials. */
        .hero-pane { --print-paper: #fbfdfe; --print-edge: 0 1px 0 rgba(58, 54, 46, 0.20), 2px 3px 5px rgba(58, 54, 46, 0.13); --card-edge: 0 1px 0 rgba(58, 54, 46, 0.16), 1px 2px 3px rgba(58, 54, 46, 0.09); --print-rule: var(--border); }
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) .hero-pane { --print-paper: color-mix(in srgb, var(--text) 3%, var(--bg)); --print-edge: none; --card-edge: none; --print-rule: var(--border-strong); }
        }
        :root[data-theme="dark"] .hero-pane { --print-paper: color-mix(in srgb, var(--text) 3%, var(--bg)); --print-edge: none; --card-edge: none; --print-rule: var(--border-strong); }
        .hero-pane .scroll { padding: 20px 22px 22px; }
        .dossier { display: flex; gap: 26px; min-height: 100%; }
        .dossier-bio { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; align-items: flex-start; }
        .dossier-bio .prose { align-self: stretch; }
        .dossier-side { flex: none; display: flex; gap: 20px; align-items: flex-start; padding-left: 26px; border-left: 1px solid var(--inner-rule); }
        .photo-print { width: 262px; flex: none; margin: 0; background: var(--print-paper); border: 1px solid var(--border-strong); box-shadow: var(--print-edge); padding: 9px 9px 6px; }
        .print-mat { display: block; border: 1px solid var(--print-rule); }
        .print-mat > img { display: block; width: 100%; aspect-ratio: 4 / 5; height: auto; object-fit: cover; image-rendering: pixelated; }
        .print-cap { font-size: 9.5px; letter-spacing: 0.03em; color: var(--muted); padding: 7px 1px 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        /* theme-matched print: light shows the day scan, dark the night scan */
        .print-mat > img.pfp-d { display: none; }
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) .print-mat > img.pfp-l { display: none; }
          :root:not([data-theme="light"]) .print-mat > img.pfp-d { display: block; }
        }
        :root[data-theme="dark"] .print-mat > img.pfp-l { display: none; }
        :root[data-theme="dark"] .print-mat > img.pfp-d { display: block; }
        .fact-stack { display: flex; flex-direction: column; gap: 16px; width: 218px; flex: none; }
        .fact-card { border: 1px solid var(--border-strong); background: var(--print-paper); box-shadow: var(--card-edge); padding: 5px 13px 10px; }
        .fact-row { display: flex; gap: 10px; align-items: baseline; padding: 7.5px 0; }
        .fact-row + .fact-row { border-top: 1px dotted var(--border-strong); }
        .fk { flex: none; width: 56px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); }
        .fv { font-size: 11.5px; line-height: 1.45; color: var(--text); min-width: 0; }
        /* the neofetch palette strip, printed at the card's foot */
        .palette { display: grid; grid-template-columns: repeat(8, 1fr); gap: 3px; padding-top: 10px; border-top: 1px dotted var(--border-strong); margin-top: 2px; }
        .pchip { height: 9px; display: block; border: 1px solid color-mix(in srgb, var(--border-strong) 55%, transparent); }
        /* the full IA mark, signing the bio's trailing whitespace (from B) */
        .dossier-sig { margin-top: auto; align-self: flex-end; padding-top: 14px; }
        .dossier-sig pre { font-family: var(--mono); font-size: 10px; line-height: 1.15; white-space: pre; color: color-mix(in srgb, var(--acc) 30%, var(--bg)); }
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
        .nslip .ntag { position: absolute; top: 0; left: 8px; transform: translateY(-55%); background: var(--slip-bg); padding: 0 5px; font-size: 9.5px; color: var(--muted); white-space: nowrap; max-width: 58%; overflow: hidden; text-overflow: ellipsis; }
        .nslip .ntag .ntab { color: var(--faint); }
        .nslip .ntag.ntime { left: auto; right: 8px; color: var(--faint); max-width: 38%; }
        .nslip.live .ntag.ntime { color: var(--acc); }
        .nslip .nmain { font-size: 12.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .nslip .nbranch { font-weight: 400; color: var(--muted); }
        .nslip .nrepo { color: inherit; text-decoration: none; }
        .nslip .nrepo:hover { text-decoration: underline; text-decoration-color: var(--acc); }
        .nslip .nfoot { display: flex; align-items: baseline; gap: 7px; margin-top: 9px; font-size: 10.5px; white-space: nowrap; }
        .nslip .nlead { flex: 1 1 auto; min-width: 8px; border-bottom: 1px dotted var(--border-strong); transform: translateY(-3px); }
        .hchip { display: inline-flex; align-items: center; gap: 5px; font-size: 9.5px; padding: 2px 6px; border: 1px solid var(--border-strong); color: var(--muted); }
        .hchip svg { display: block; flex: none; }
        .hchip .hmodel { font-size: 9.5px; letter-spacing: 0.01em; }
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
          .dossier { display: block; }
          .dossier-side { border-left: 0; padding-left: 0; margin-top: 20px; padding-top: 18px; border-top: 1px solid var(--inner-rule); display: flex; flex-direction: column; gap: 16px; }
          .photo-print { order: 0; width: min(212px, 62%); padding: 7px 7px 5px; }
          .fact-stack { order: 1; width: 100%; min-width: 0; }
          .dossier-sig { display: none; }
        }
      `}</style>
      <div className="machine fill ws-home" data-acc="home">
<Pane
        cmd="cat bio.md"
        tab="dossier"
        label="bio and identity"
        gridArea="hero"
        className="hero-pane bio-pane"
      >
        <div className="dossier">
          <div className="dossier-bio">

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
            <div className="dossier-sig" aria-hidden="true">
              <pre>{GLYPH}</pre>
            </div>
          </div>
          <div className="dossier-side">
            <div className="fact-stack">
              <div className="fact-card">
                <div className="fact-row"><span className="fk">user</span><span className="fv">{String(fm.name ?? "ibraheem amin").toLowerCase()} <span className="dim">({String(fm.pronouns ?? "he/him")})</span></span></div>
                <div className="fact-row"><span className="fk">host</span><span className="fv">{String(fm.school ?? "").toLowerCase()}</span></div>
                <div className="fact-row"><span className="fk">os</span><span className="fv">{`b.s.e. computer science '${String(fm.gradYear ?? "28").slice(-2)}`}</span></div>
                <div className="fact-row"><span className="fk">location</span><span className="fv">{String(fm.hometown ?? "lowell, ma").toLowerCase()}</span></div>
                <div className="fact-row"><span className="fk">uptime</span><span className="fv">shipping since 2019</span></div>
                <div className="fact-row"><span className="fk">pkgs</span><span className="fv">7 projects · 36 certs · 13 roles</span></div>
                <div className="palette" aria-hidden="true">
                  {["home", "work", "proj", "cert", "course", "thoughts"].map((a) => (
                    <span key={a} className="pchip" style={{ background: `var(--acc-${a})` }}></span>
                  ))}
                  <span className="pchip" style={{ background: "var(--err)" }}></span>
                  <span className="pchip" style={{ background: "var(--muted)" }}></span>
                  {["home", "work", "proj", "cert", "course", "thoughts"].map((a) => (
                    <span key={`p-${a}`} className="pchip" style={{ background: `var(--pastel-${a})` }}></span>
                  ))}
                  <span className="pchip" style={{ background: "var(--border-strong)" }}></span>
                  <span className="pchip" style={{ background: "var(--faint)" }}></span>
                </div>
              </div>
            </div>
            {pfp && (
              <figure className="photo-print">
                <span className="print-mat">
                  <img className="pfp-l" src={pfp.light} alt="pixel portrait of ibraheem amin" width={640} height={800} />
                  <img className="pfp-d" src={pfp.dark} alt="" aria-hidden="true" width={640} height={800} />
                </span>
                <figcaption className="print-cap">ibraheem amin — princeton, nj</figcaption>
              </figure>
            )}
          </div>
        </div>
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
