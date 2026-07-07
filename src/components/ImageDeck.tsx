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
// list ("0:landing-hero 1:chat 2:manage" — digits only in compact mode on
// desktop, where collage panes get squeezed; on mobile every pane is
// full-width and the tabbar scrolls sideways, so compact decks show the full
// window names too, the active window starred), the current window renders
// below in a frame that scales with the pane's width (CSS aspect-ratio,
// never a fixed height), and the caption is the real filename. object-fit:
// contain + a letterbox tint means no screenshot is ever cropped — non-16:9
// shots letterbox gracefully. Click a tab or press ←/→ while the deck has
// focus to switch windows; arrow events stop propagating so the global mux
// bindings never see them.
export default function ImageDeck({
  images,
  aspectRatio = "16 / 9",
  maxHeight,
  compact = false,
}: {
  images: DeckImage[];
  /** CSS aspect-ratio of the image frame; it scales with available width */
  aspectRatio?: string;
  /** optional cap on the frame's height, e.g. "60vh" */
  maxHeight?: number | string;
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
      <style>{`
        .deck-lbl-full { display: none; }
        @media (max-width: 860px) {
          /* full-width mobile panes: real window names beat bare digits;
             the global .tabbar rule scrolls sideways instead of wrapping */
          .deck-lbl-digit { display: none; }
          .deck-lbl-full { display: inline; }
          /* finger-sized tabs: 10px text + 12px padding ≈ 41px tall */
          .deck-tabs .tab { padding: 12px; }
        }
      `}</style>
      <div
        className="tabbar deck-tabs"
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
            {compact ? (
              <>
                <span className="deck-lbl-digit">{i}</span>
                <span className="deck-lbl-full">
                  {i}:{im.label}
                </span>
              </>
            ) : (
              `${i}:${im.label}`
            )}
            {i === active ? "*" : ""}
          </button>
        ))}
      </div>
      <img
        className="deck-img"
        style={{
          aspectRatio,
          // overrides .deck-img's object-fit: cover — never crop a screenshot
          objectFit: "contain",
          // subtle letterbox tint so non-16:9 shots frame instead of chop
          background: "color-mix(in srgb, var(--border) 40%, var(--bg))",
          ...(maxHeight !== undefined
            ? { maxHeight, margin: "0 auto" }
            : undefined),
        }}
        src={img.src}
        alt={img.alt}
      />
      {/* long filenames wrap instead of pushing a narrow pane sideways */}
      <p className="caption" style={{ overflowWrap: "anywhere" }}>
        {file}
      </p>
    </div>
  );
}
