import {
  getBio,
  getCertProviders,
  getCourseSections,
  getProjects,
  getSocialLinks,
  getWorkRows,
  semesterOrder,
  shortSemester,
} from "@/lib/content";
import SidebarNav, { type WorkspaceItem } from "./SidebarNav";

// Server component: workspace subtitles are build-time truths computed
// straight from the content repo, regenerated on every deploy.
export default function Sidebar() {
  const socials = getSocialLinks();
  const projects = getProjects();
  const work = getWorkRows();
  const providers = getCertProviders();
  const courses = getCourseSections();
  void getBio; // bio renders on the home page

  const certTotal = providers.reduce((n, p) => n + p.count, 0);
  const workplaces = new Set(work.map((w) => w.workplace)).size;
  const courseTotal = courses.reduce((n, s) => n + s.courses.length, 0);
  const semesters = semesterOrder(
    courses.flatMap((s) => s.courses.map((c) => c.semester)),
  );
  const semSpan = semesters.length
    ? `${shortSemester(semesters[0])}–${shortSemester(semesters[semesters.length - 1])}`
    : "";
  const featured = projects.find((p) => p.featured);

  const items: WorkspaceItem[] = [
    {
      acc: "home",
      href: "/",
      title: "home",
      subtitle: `bio · ${socials.length} socials · resume: soon`,
      hotkey: "1",
    },
    {
      acc: "work",
      href: "/work",
      title: "work",
      subtitle: `${work.length} roles · ${workplaces} workplaces`,
      hotkey: "2",
    },
    {
      acc: "proj",
      href: "/projects",
      title: "projects",
      subtitle: `${projects.length} repos · 1 featured${featured?.deployed ? ` · ${featured.deployed.replace(/^https?:\/\//, "")}` : ""}`,
      hotkey: "3",
    },
    {
      acc: "cert",
      href: "/certifications",
      title: "certifications",
      subtitle: `${certTotal} certs · ${providers.length} issuers · GLTHS`,
      hotkey: "4",
    },
    {
      acc: "course",
      href: "/coursework",
      title: "coursework",
      subtitle: `${courseTotal} courses · ${semSpan} · princeton`,
      hotkey: "5",
    },
  ];

  return (
    <aside className="sidebar" aria-label="workspaces sidebar">
      <div className="side-head">
        <a className="wordmark" href="/">
          <span className="tilde">[~]</span> ibraheem
        </a>
        <span className="ghosts">
          <button className="ghost" data-add-ws title="new workspace">
            +
          </button>
          <button className="ghost" data-theme-toggle title="toggle theme (t)">
            ◐
          </button>
        </span>
      </div>
      <div className="ws-section">
        <div className="overline">
          <span>Workspaces</span>
          <span>5/5</span>
        </div>
        <SidebarNav items={items} />
      </div>
      <hr className="sep" />
      <div className="pinned">
        <div className="overline">
          <span>Pinned</span>
        </div>
        {socials.map((s) => (
          <a
            key={s.key}
            className="pin-row"
            href={s.href}
            {...(s.href.startsWith("http")
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            <span className="k">{s.key}</span> {s.label}
            {s.href.startsWith("http") ? " ↗" : ""}
          </a>
        ))}
      </div>
    </aside>
  );
}
