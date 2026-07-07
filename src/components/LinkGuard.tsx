"use client";

import { useEffect, useState } from "react";

// Confirm-before-leaving modal for links whose visible text doesn't name
// their destination (course chips, demo links, ...). Opt in per link with
// the data-confirm attribute; obvious links (github, harness.nz, credly.com)
// navigate directly. Confirmed links always open in a new tab.
export default function LinkGuard() {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a[data-confirm]");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || !/^https?:\/\//.test(href)) return;
      e.preventDefault();
      e.stopPropagation();
      setUrl(href);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (!url) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        window.open(url, "_blank", "noopener");
        setUrl(null);
      } else if (e.key === "Escape") {
        setUrl(null);
      } else {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [url]);

  if (!url) return null;
  const host = new URL(url).hostname.replace(/^www\./, "");
  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="external link confirmation"
      onClick={(e) => {
        if (e.target === e.currentTarget) setUrl(null);
      }}
    >
      <div className="modal-panel">
        <span className="notch" aria-hidden="true">
          <span className="sig">❯ </span>open {host}
        </span>
        <p className="dim" style={{ fontSize: 12 }}>
          this link leaves the session:
        </p>
        <p style={{ fontSize: 12, margin: "8px 0 14px", wordBreak: "break-all" }}>
          {url}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn"
            style={{ marginTop: 0 }}
            autoFocus
            onClick={() => {
              window.open(url, "_blank", "noopener");
              setUrl(null);
            }}
          >
            [enter] continue ↗
          </button>
          <button
            className="btn dim"
            style={{ marginTop: 0, borderColor: "var(--border-strong)", color: "var(--muted)" }}
            onClick={() => setUrl(null)}
          >
            [esc] cancel
          </button>
        </div>
      </div>
    </div>
  );
}
