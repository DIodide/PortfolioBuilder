import Pane from "@/components/Pane";
import {
  getBio,
  getCertProviders,
  getProjects,
  getSocialLinks,
  getUser,
  getWorkRows,
} from "@/lib/content";

export const metadata = {
  title: "home — Ibraheem Amin",
};

const GLYPH = `██╗ █████╗
██║██╔══██╗
██║███████║
██║██╔══██║
██║██║  ██║
╚═╝╚═╝  ╚═╝`;

export default function Home() {
  const user = getUser();
  const fm = (user?.frontmatter ?? {}) as Record<string, unknown>;
  const bio = getBio();
  const socials = getSocialLinks();
  const work = getWorkRows();
  const current = work.filter((w) => w.current);
  const projects = getProjects();
  const certs = getCertProviders().reduce((n, p) => n + p.count, 0);
  const resume = String(fm.resume ?? "");
  const resumeReady = resume !== "" && !resume.startsWith("TODO");
  const school = socials.find((s) => s.key === "school");

  return (
    <div className="machine fill ws-home" data-acc="home">
      <Pane cmd="neofetch" label="identity" gridArea="neo">
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
            {String(fm.degree ?? "").toLowerCase()} &#39;
            {String(fm.class_year ?? "").slice(-2)}
          </span>
          <span className="k">shell</span>
          <span>zsh</span>
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

      <Pane cmd="cat bio.md" label="bio" gridArea="bio">
        <h1 className="name">
          {String(fm.name ?? "Ibraheem Amin").toLowerCase()}{" "}
          <span className="cursor" aria-hidden="true"></span>
        </h1>
        <p className="meta">
          {String(fm.degree ?? "")} · princeton &#39;
          {String(fm.class_year ?? "").slice(-2)} ·{" "}
          {String(fm.location ?? "").toLowerCase()}
        </p>
        <p className="prose lede">{bio.oneLiner}</p>
        {bio.paragraphs.slice(1).map((p) => (
          <p key={p.slice(0, 24)} className="prose">
            {p}
          </p>
        ))}
      </Pane>

      <Pane cmd="cat socials.yml" label="socials" gridArea="soc">
        <div className="rows">
          {socials.map((s) => {
            const external = s.href.startsWith("http");
            return (
              // label is the handle and the key names the platform, so the
              // destination is evident — no data-confirm needed.
              <a
                key={s.key}
                href={s.href}
                {...(external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                <span className="accent">{s.key}:</span> {s.label}
                {external && <span className="faint"> ↗</span>}
              </a>
            );
          })}
        </div>
      </Pane>

      {resumeReady ? (
        <Pane cmd="open resume.pdf" label="resume" gridArea="res">
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
        <Pane cmd="stat resume.pdf" label="resume" gridArea="res">
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

      <Pane cmd="tail -f now.log" label="current roles" gridArea="now">
        <div className="rows">
          {current.map((w) => (
            <span key={w.workplace + w.role}>
              <span className="accent">
                [{w.period.split(" - ")[0].toLowerCase().replace(" ", "-")}]
              </span>{" "}
              {w.workplace.toLowerCase()} —{" "}
              {w.role.replace(/\s*\(.*\)$/, "").toLowerCase()}
            </span>
          ))}
          <span>
            <span className="accent">[always]</span> building{" "}
            <span className="cursor" style={{ width: "0.45em" }} aria-hidden="true"></span>
          </span>
        </div>
      </Pane>
    </div>
  );
}
