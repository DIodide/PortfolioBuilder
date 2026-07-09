import { getSocialLinks } from "@/lib/content";
import SidebarNav, { type WorkspaceItem } from "./SidebarNav";

// Server component. Workspace cells are deliberately title-only — no
// aggregate stats or quips (owner request); the counts live in the panes.

const PIN_ICONS: Record<string, string> = {
  // simple-icons brand paths (24x24) + material glyphs for the emails
  github:
    "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
  x: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z",
  linkedin:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z",
  school:
    "M12 2 1 7l11 5 9-4.09V15h2V7L12 2zm-7 9.18v4.32c0 1.93 3.13 3.5 7 3.5s7-1.57 7-3.5v-4.32l-7 3.18-7-3.18z",
  personal:
    "M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z",
};

function PinIcon({ name }: { name: string }) {
  const d = PIN_ICONS[name];
  if (!d) return null;
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path d={d} fill="currentColor" />
    </svg>
  );
}

export default function Sidebar() {
  const socials = getSocialLinks();

  const items: WorkspaceItem[] = [
    { acc: "home", href: "/", title: "home", hotkey: "1" },
    { acc: "work", href: "/work", title: "work", hotkey: "2" },
    { acc: "proj", href: "/projects", title: "projects", hotkey: "3" },
    { acc: "cert", href: "/certifications", title: "certifications", hotkey: "4" },
    { acc: "course", href: "/coursework", title: "coursework", hotkey: "5" },
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
            aria-label={`${s.key}: ${s.label}`}
            {...(s.href.startsWith("http")
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            <span className="k" title={s.key}>
              <PinIcon name={s.key} />
            </span>{" "}
            {s.label}
            {s.href.startsWith("http") ? " ↗" : ""}
          </a>
        ))}
      </div>
    </aside>
  );
}
