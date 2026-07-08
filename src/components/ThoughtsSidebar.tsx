"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { thoughtsMain, useThoughts } from "./ThoughtsProvider";

// The terminal remnant of the thoughts surface: recent files, the open
// post's outline (self-hydrated through ThoughtsProvider), tag cloud,
// the drafts contract, and the rsync footer. All build-time truths come
// in as props from the server layout.

export interface SidebarPost {
  slug: string;
  title: string;
  date: string;
  hide: boolean;
  tag: string | null;
}

const prefersReducedMotion = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches;

function jumpTo(id: string) {
  const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";
  if (!id) thoughtsMain()?.scrollTo({ top: 0, behavior });
  else document.getElementById(id)?.scrollIntoView({ behavior, block: "start" });
}

export default function ThoughtsSidebar({
  posts,
  tags,
}: {
  posts: SidebarPost[];
  tags: string[];
}) {
  const pathname = usePathname();
  const { outline, activeId } = useThoughts();

  return (
    <aside
      className="sidebar"
      data-acc="thoughts"
      aria-label="thought sandboxes sidebar"
    >
      <div className="side-head">
        <a className="wordmark" href="/">
          <span className="tilde">[~]</span> ibraheem
        </a>
        <span className="ghosts">
          <button
            className="ghost"
            title="new sandbox"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("mux:toast", {
                  detail:
                    "new post: drop a .md in the obsidian vault — it syncs on push",
                }),
              )
            }
          >
            +
          </button>
          <button className="ghost" data-theme-toggle title="toggle theme (t)">
            ◐
          </button>
        </span>
      </div>

      <div className="side-scroll">
        <div className="ws-section">
          <div className="overline">
            <span>Recent</span>
            <span>{posts.length} md</span>
          </div>
          {posts.length > 0 ? (
            <nav className="cells" aria-label="recent posts">
              {posts.map((p, i) => {
                const href = `/thoughts/${p.slug}`;
                return (
                  <Link
                    key={p.slug}
                    className="cell"
                    href={href}
                    aria-current={pathname === href ? "page" : undefined}
                    data-post-shortcut={i < 4 ? String(i + 1) : undefined}
                  >
                    <span className="grip" aria-hidden="true">
                      ⠿
                    </span>
                    <span className="tt">
                      <span className="t1">{p.title}</span>
                      <span className="t2">
                        {p.date}
                        {p.hide ? " · draft" : ""}
                        {p.tag ? ` · #${p.tag}` : ""}
                      </span>
                    </span>
                    {i < 4 && (
                      <span className="key" aria-hidden="true">
                        {i + 1}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          ) : (
            <div className="overline" style={{ padding: "6px 8px" }}>
              <span>(nothing published)</span>
            </div>
          )}
        </div>

        {outline && outline.entries.length > 0 && (
          <>
            <hr className="sep" />
            <div className="ws-section">
              <div className="overline">
                <span>Outline</span>
                <span>{outline.entries.length}§</span>
              </div>
              <nav className="toc" aria-label="post outline">
                <button
                  className={activeId === "" ? "on" : undefined}
                  onClick={() => jumpTo("")}
                >
                  ¶ {outline.slug}.md
                </button>
                {outline.entries.map((entry) => (
                  <button
                    key={entry.id}
                    className={activeId === entry.id ? "on" : undefined}
                    onClick={() => jumpTo(entry.id)}
                  >
                    {entry.text}
                  </button>
                ))}
              </nav>
            </div>
          </>
        )}

        {tags.length > 0 && (
          <div className="ws-section">
            <div className="overline">
              <span>Tags</span>
              <span>frontmatter</span>
            </div>
            <div className="tagcloud">
              {tags.map((t) => (
                <span key={t} className="side-tag">
                  #{t}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>

    </aside>
  );
}
