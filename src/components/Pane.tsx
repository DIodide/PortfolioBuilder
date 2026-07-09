import type { CSSProperties, ReactNode } from "react";

// A terminal pane. Sits inside a .machine grid / .stack / .collage-row —
// the container paints the shared 1px border lines, the pane is opaque.
// The notch is the title embedded in the border line, styled as the shell
// command this pane pretends to be the output of.
export default function Pane({
  cmd,
  tab,
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
  /** typed paper-tab label for the light (ledger) theme, e.g. `bio` —
   *  omit to keep the shell command in both themes */
  tab?: string;
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
      <span className={`notch${tab ? " has-tab" : ""}`} aria-hidden="true">
        <span className="n-cmd">
          <span className="sig">❯ </span>
          {cmd}
          {sub && <span className="accent"> {sub}</span>}
        </span>
        {tab && (
          <span className="n-tab">
            {tab}
            {sub && <span className="accent"> {sub}</span>}
          </span>
        )}
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
