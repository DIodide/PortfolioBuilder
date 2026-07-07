import type { CSSProperties, ReactNode } from "react";

// A terminal pane. Sits inside a .machine grid / .stack / .collage-row —
// the container paints the shared 1px border lines, the pane is opaque.
// The notch is the title embedded in the border line, styled as the shell
// command this pane pretends to be the output of.
export default function Pane({
  cmd,
  sub,
  label,
  gridArea,
  className,
  style,
  zoomable = true,
  children,
}: {
  /** fake shell command shown in the border notch, e.g. `cat bio.md` */
  cmd: string;
  /** optional accent-colored suffix in the notch, e.g. `· ★ featured` */
  sub?: string;
  /** accessible name for the pane */
  label: string;
  gridArea?: string;
  className?: string;
  style?: CSSProperties;
  zoomable?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={`pane${className ? ` ${className}` : ""}`}
      style={gridArea ? { gridArea, ...style } : style}
      tabIndex={0}
      aria-label={label}
    >
      <span className="notch" aria-hidden="true">
        <span className="sig">❯ </span>
        {cmd}
        {sub && <span className="accent"> {sub}</span>}
      </span>
      <span className="flag" aria-hidden="true">
        [Z]
      </span>
      {zoomable && (
        <span className="notch nr">
          <button data-zoom title="zoom (z)" aria-label={`zoom: ${label}`}>
            ⛶
          </button>
        </span>
      )}
      <div className="scroll">{children}</div>
    </section>
  );
}
