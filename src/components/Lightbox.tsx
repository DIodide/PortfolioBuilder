"use client";

import { useEffect } from "react";

// Minimal image viewer for pane image strips: fixed overlay, the shot
// centered at fit size — no zoom, no pan, no carousel. Closes on
// backdrop click, the [esc ✕] button, or Escape. The Escape listener
// runs on document in the capture phase with stopPropagation (same
// pattern as LinkGuard) so the global mux controller doesn't also
// treat the keypress as a close/unzoom.

const CSS = `
.lightbox { position: fixed; inset: 0; z-index: 80; display: grid; place-items: center; background: color-mix(in srgb, var(--bg) 85%, transparent); }
.lightbox-frame { position: relative; min-width: min(220px, 80vw); background: var(--bg); border: 1px solid var(--border-strong); }
.lightbox-frame > img { display: block; margin: 0 auto; max-width: 94vw; max-height: 84vh; object-fit: contain; }
.lightbox-frame > .notch { color: var(--text); max-width: calc(100% - 86px); }
.lightbox-close { position: absolute; top: 0; right: 8px; transform: translateY(-50%); z-index: 2; min-width: 44px; min-height: 44px; display: grid; place-items: center; padding: 0; color: var(--muted); font-size: 11px; }
.lightbox-close > span { background: var(--bg); padding: 1px 6px; }
.lightbox-close:hover { color: var(--text); }
`;

/** "…/eval/product-shot%201.png" -> "product-shot 1.png" */
function fileName(src: string): string {
  const raw = src.split("/").pop() ?? src;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export default function Lightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const file = fileName(src);

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`image viewer: ${file}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{CSS}</style>
      <figure className="lightbox-frame">
        <span className="notch" aria-hidden="true">
          <span className="sig">❯ </span>open {file}
        </span>
        <button
          type="button"
          className="lightbox-close"
          aria-label="close image viewer"
          autoFocus
          onClick={onClose}
        >
          <span>[esc ✕]</span>
        </button>
        <img src={src} alt={alt} />
      </figure>
    </div>
  );
}
