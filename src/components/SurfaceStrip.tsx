"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { WINDOWS } from "./WindowList";

// Session-level surface tabs: the portfolio mux and the thought-sandboxes
// vault are two compile-time surfaces of one session. This strip persists
// across both (it lives in the root layout) so it can remember which
// workspace the portfolio surface was left on.

const shortSlug = (s: string, max = 14) =>
  s.length > max ? `${s.slice(0, max - 1)}…` : s;

export default function SurfaceStrip() {
  const pathname = usePathname();
  const onThoughts = pathname.startsWith("/thoughts");

  // Remember the live workspace while the visitor reads on the other
  // surface (adjust-during-render: no effect lag, deterministic SSR).
  const wsNow = WINDOWS.find((w) => w.href === pathname);
  const [ws, setWs] = useState(wsNow ?? WINDOWS[0]);
  if (wsNow && wsNow !== ws) setWs(wsNow);

  const slug = onThoughts ? pathname.split("/").filter(Boolean)[1] : undefined;
  const sbCtx = slug ? `· reading: ${shortSlug(slug)}` : "· index";

  // the strip is a horizontal scroller on mobile — keep the active tab visible
  const activeRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [onThoughts]);

  return (
    <header className="surface-strip" aria-label="surfaces">
      <span className="lbl">
        <b>surfaces</b> · session-level
      </span>
      <Link
        className="surf-tab"
        href={ws.href}
        scroll={false}
        data-acc="home"
        aria-current={onThoughts ? undefined : "true"}
        ref={onThoughts ? undefined : activeRef}
      >
        {`1:portfolio${onThoughts ? "" : "*"}`}
        <span className="ctx">· ws {ws.label}</span>
      </Link>
      <Link
        className="surf-tab"
        href="/thoughts"
        scroll={false}
        data-acc="thoughts"
        aria-current={onThoughts ? "true" : undefined}
        ref={onThoughts ? activeRef : undefined}
      >
        {`2:thought-sandboxes${onThoughts ? "*" : ""}`}
        <span className="ctx">{sbCtx}</span>
      </Link>
      <button
        type="button"
        className="surf-plus"
        aria-label="add surface"
        onClick={() =>
          window.dispatchEvent(
            new CustomEvent("mux:toast", {
              detail: "surface limit reached (2/2)",
            }),
          )
        }
      >
        +
      </button>
      <span className="rgt hidesm">
        2 surfaces
        <span className="divider">│</span>
        [ / ] cycle
      </span>
    </header>
  );
}
