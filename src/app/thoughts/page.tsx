import type { Metadata } from "next";
import Link from "next/link";
import { getPosts, getThoughtsMeta } from "@/lib/content";

export const metadata: Metadata = {
  title: "thought sandboxes — Ibraheem Amin",
  description:
    "quick, unpolished thinking — synced from an Obsidian vault, published when a draft earns it.",
};

// Day-one production truth: 0 published posts. The empty state is the
// design, not a fallback — box-drawing frame, serif italic aside.
const EMPTY_FRAME = `┌─╴ thought-sandboxes ╶─┐
│                       │
│      0 published      │
│                       │
└───────────────────────┘`;

const dot = <span className="dot">·</span>;

export default function ThoughtsIndex() {
  const posts = getPosts();
  const { published, drafts } = getThoughtsMeta();
  const draftsVisible = process.env.SHOW_DRAFTS === "1";
  const empty = posts.length === 0;

  return (
    <div className="machine grow ws-thoughts">
      <section className="pane tpane" tabIndex={0} aria-label="thought sandboxes">
        <span className="notch" aria-hidden="true">
          <span className="sig">❯ </span>obsidian --vault ~/thought-sandboxes
        </span>
        <span className="notch nr">
          <span className="faint">
            {posts.length} {posts.length === 1 ? "file" : "files"}
          </span>
        </span>

        <div className="sheet">
          <header className="idx-mast">
            <h1 className="idx-title">thought sandboxes</h1>
            <p className="idx-sub">
              quick, unpolished thinking — synced from an Obsidian vault,
              published when a draft earns it.
            </p>
            <div className="idx-meta">
              {draftsVisible ? (
                <>
                  <span>
                    <span className="accent">{posts.length}</span>{" "}
                    {posts.length === 1 ? "file" : "files"}
                  </span>
                  {dot}
                  <span>{published} published</span>
                  {dot}
                  <span>{drafts} drafts</span>
                  {dot}
                  <span>newest first</span>
                </>
              ) : empty ? (
                <>
                  <span>
                    <span className="accent">0</span> published
                  </span>
                  {dot}
                  <span>
                    {drafts} {drafts === 1 ? "draft" : "drafts"} in the vault
                  </span>
                </>
              ) : (
                <>
                  <span>
                    <span className="accent">{published}</span> published
                  </span>
                  {dot}
                  <span>drafts stay in the vault</span>
                </>
              )}
            </div>
          </header>

          {empty ? (
            <div className="empty">
              <pre className="eg" aria-hidden="true">
                {EMPTY_FRAME}
              </pre>
              <p className="e1">
                Nothing published yet — the sandbox is warming up.
              </p>
              <p className="e2">
                {drafts} {drafts === 1 ? "draft sits" : "drafts sit"} behind{" "}
                <span className="accent">hide: true</span> — published when
                they earn it.
              </p>
            </div>
          ) : (
            <>
              <nav className="post-list" aria-label="posts">
                {posts.map((p, i) => (
                  <Link
                    key={p.slug}
                    className="post-row"
                    href={`/thoughts/${p.slug}`}
                  >
                    <span className="pr-line1">
                      <span className="pr-n" aria-hidden="true">
                        {i + 1}
                      </span>
                      <span className="pr-title">{p.title}</span>
                      {p.hide && (
                        <span className="pr-chip">
                          <span className="draft-chip">draft</span>
                        </span>
                      )}
                    </span>
                    {p.description && (
                      <span className="pr-desc">{p.description}</span>
                    )}
                    <span className="pr-meta">
                      <span className="d">{p.date}</span>
                      <span className="dot">·</span>
                      {p.tags.map((t, ti) => (
                        <span key={t}>
                          {ti > 0 && " "}
                          <span className="tg">#{t}</span>
                        </span>
                      ))}
                      {p.tags.length > 0 && <span className="dot">·</span>}
                      <span>{p.words} words</span>
                    </span>
                  </Link>
                ))}
              </nav>
              {draftsVisible && (
                <p className="idx-foot">
                  <span className="accent">SHOW_DRAFTS=1</span> — drafts render
                  in this build · the public site hides hide: true
                </p>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
