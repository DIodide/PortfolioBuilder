"use client";

import { useState, type KeyboardEvent } from "react";

export interface DeckImage {
  /** site-relative image URL */
  src: string;
  /** real alt text (documented caption or "<name> — <label>") */
  alt: string;
  /** tmux window name, e.g. "landing-hero" */
  label: string;
}

// A project's screenshots as a tiny tmux session: the tab bar is the window
// list ("0:landing-hero 1:chat 2:manage" — digits only in compact mode, the
// active window starred), the current window renders below at a fixed height,
// and the caption is the real filename. Click a tab or press ←/→ while the
// deck has focus to switch windows; arrow events stop propagating so the
// global mux bindings never see them.
export default function ImageDeck({
  images,
  height,
  compact = false,
}: {
  images: DeckImage[];
  height: number;
  compact?: boolean;
}) {
  const [selected, setSelected] = useState(0);

  if (images.length === 0) {
    return (
      <p className="faint" style={{ fontSize: 11 }}>
        no screenshots yet
      </p>
    );
  }

  const active = Math.min(selected, images.length - 1);
  const img = images[active];
  const file = img.src.split("/").pop() ?? img.src;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.stopPropagation();
    e.preventDefault();
    const step = e.key === "ArrowLeft" ? -1 : 1;
    setSelected((active + step + images.length) % images.length);
  };

  return (
    <div
      tabIndex={0}
      role="group"
      aria-label={`screenshots — ${images.length} windows, arrow keys switch`}
      onKeyDown={onKeyDown}
    >
      <div
        className="tabbar"
        role="tablist"
        aria-label="screenshot windows"
        style={{ marginBottom: 8 }}
      >
        {images.map((im, i) => (
          <button
            key={im.src}
            type="button"
            role="tab"
            className="tab"
            tabIndex={-1}
            aria-selected={i === active}
            aria-label={`${i}:${im.label}`}
            title={compact ? `${i}:${im.label}` : undefined}
            onClick={() => setSelected(i)}
          >
            {compact ? i : `${i}:${im.label}`}
            {i === active ? "*" : ""}
          </button>
        ))}
      </div>
      <img className="deck-img" style={{ height }} src={img.src} alt={img.alt} />
      <p className="caption">{file}</p>
    </div>
  );
}
