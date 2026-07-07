"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { useThoughts, type OutlineEntry } from "./ThoughtsProvider";

// Client wrapper for a thought-sandboxes post. Owns the src ⇄ read toggle
// (chip + `e`), the esc back-to-index shortcut, the scroll-spy that feeds
// the sidebar outline, and the reading-progress meter docked above the
// status bar. Everything it renders arrived fully-formed from the server:
// `html` from renderPost, `body` as the vault's raw markdown.

export interface ReaderPost {
  slug: string;
  file: string;
  title: string;
  description: string;
  tags: string[];
  date: string;
  author: string;
  hide: boolean;
  image?: string;
  words: number;
  /** raw markdown body (source mode) */
  body: string;
  /** rendered body (reading mode) */
  html: string;
  outline: OutlineEntry[];
}

/** frontmatter reconstruction for source mode — same key order the vault
 *  writes (title, description, tags, hide, image, author, date) */
function SrcView({ post }: { post: ReaderPost }) {
  return (
    <div>
      <p className="src-note">
        <span className="accent">-- source mode</span> · what the vault
        actually holds · <span className="accent">e</span> flips back to
        reading
      </p>
      <pre className="srcmd">
        <span className="y">{"---"}</span>
        {"\n"}
        <span className="y">title:</span>{" "}
        <span className="yv">{post.title}</span>
        {"\n"}
        <span className="y">description:</span>{" "}
        <span className="yv">{post.description}</span>
        {"\n"}
        <span className="y">tags:</span>
        {"\n"}
        {post.tags.map((t) => (
          <Fragment key={t}>
            {"  - "}
            <span className="yv">{t}</span>
            {"\n"}
          </Fragment>
        ))}
        {post.hide && (
          <>
            <span className="hot">hide: true</span>
            {"\n"}
          </>
        )}
        {post.image !== undefined && (
          <>
            <span className="y">image:</span>{" "}
            <span className="yv">{post.image}</span>
            {"\n"}
          </>
        )}
        <span className="y">author:</span>{" "}
        <span className="yv">{post.author}</span>
        {"\n"}
        <span className="y">date:</span> <span className="yv">{post.date}</span>
        {"\n"}
        <span className="y">{"---"}</span>
        {"\n\n"}
        {post.body}
      </pre>
    </div>
  );
}

export default function PostReader({ post }: { post: ReaderPost }) {
  const router = useRouter();
  const [mode, setMode] = useState<"read" | "src">("read");
  const [pct, setPct] = useState(0);
  const [section, setSection] = useState("");
  const paneRef = useRef<HTMLElement>(null);
  const { register, clear, setActiveId } = useThoughts();

  // hand the outline to the sidebar for the life of this post
  useEffect(() => {
    register({ slug: post.slug, file: post.file, entries: post.outline });
    return () => clear();
  }, [register, clear, post.slug, post.file, post.outline]);

  // esc → index, e → src ⇄ read. Capture phase + stopPropagation so the
  // global MuxController's esc handling doesn't fight the reader.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && /^(input|textarea|select)$/i.test(target.tagName)) return;
      if (e.key === "Escape") {
        // an open overlay (keys, link-confirm) owns esc — let it close
        if (document.querySelector(".keys-overlay, .modal-overlay")) return;
        e.stopPropagation();
        router.push("/thoughts");
      } else if (e.key === "e") {
        e.stopPropagation();
        setMode((m) => (m === "read" ? "src" : "read"));
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [router]);

  // scroll-spy on the surface's scroll container (<main>): reading
  // progress for the meter, active h2 for the sidebar outline. src mode
  // has no meter — reattach when the reading view returns.
  useEffect(() => {
    if (mode !== "read") return;
    const main = paneRef.current?.closest("main");
    if (!main) return;
    const onScroll = () => {
      const max = main.scrollHeight - main.clientHeight;
      setPct(max > 0 ? Math.min(100, Math.round((main.scrollTop / max) * 100)) : 100);
      let active = "";
      let label = "";
      const line = main.getBoundingClientRect().top + 120;
      paneRef.current
        ?.querySelectorAll<HTMLElement>(".md h2[id], .md h3[id]")
        .forEach((h) => {
          if (h.getBoundingClientRect().top <= line) {
            active = h.id;
            label = h.textContent ?? "";
          }
        });
      setSection(label);
      setActiveId(active);
    };
    onScroll();
    main.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      main.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [mode, setActiveId]);

  const author = post.author.toLowerCase();

  return (
    <div className="machine grow ws-thoughts">
      <section
        ref={paneRef}
        className="pane tpane"
        tabIndex={0}
        aria-label={`post: ${post.title}`}
      >
        <span className="notch" aria-hidden="true">
          <span className="sig">❯ </span>obsidian &quot;{post.file}&quot;{" "}
          <span className="dim">--mode={mode}</span>
        </span>
        <span className="notch nr">
          <button
            className="mode-chip"
            data-mode={mode}
            title="toggle source ⇄ reading (e)"
            aria-label={`view mode: ${mode} — toggle source and reading`}
            onClick={() => setMode((m) => (m === "read" ? "src" : "read"))}
          >
            <span className="mc mc-src">src</span>
            <span className="arr">⇄</span>
            <span className="mc mc-read">read</span>
          </button>
          <Link href="/thoughts" title="close (esc)" aria-label="back to index">
            ✕
          </Link>
        </span>

        <div className={`sheet${mode === "src" ? " src" : ""}`}>
          <div className="reader-top">
            <Link className="reader-back" href="/thoughts">
              <span className="accent">←</span> index{" "}
              <span className="faint">(esc)</span>
            </Link>
            <span className="reader-file">~/thought-sandboxes/{post.file}</span>
          </div>

          {mode === "read" ? (
            <article aria-label={post.title}>
              {post.hide && (
                <div className="draft-rib">
                  <span>draft · hide: true</span>
                  <span className="rn">
                    renders in draft-preview builds only
                  </span>
                </div>
              )}
              <h1 className="post-title">{post.title}</h1>
              <p className="post-deck">{post.description}</p>
              <div className="post-meta">
                <span>{post.date}</span>
                <span className="sepdot">·</span>
                <span>{author}</span>
                <span className="sepdot">·</span>
                <span>{post.words} words</span>
                {post.tags.length > 0 && <span className="sepdot">·</span>}
                {post.tags.map((t) => (
                  <span key={t} className="mtag">
                    #{t}
                  </span>
                ))}
              </div>
              <div
                className="md"
                dangerouslySetInnerHTML={{ __html: post.html }}
              />
              <p className="endmark">
                <span className="accent">--</span> {author} · {post.words}{" "}
                words <span className="accent">--</span>
              </p>
            </article>
          ) : (
            <SrcView post={post} />
          )}
        </div>
      </section>

      {mode === "read" && (
        <div className="readprog" aria-hidden="true">
          <span className="sec">
            {section ? `§ ${section.toLowerCase()}` : "¶ top"}
          </span>
          <span className="rp-bar">
            <span className="rp-fill" style={{ width: `${pct}%` }} />
          </span>
          <span className="rp-pct">{pct}%</span>
        </div>
      )}
    </div>
  );
}
