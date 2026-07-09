"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";

export const DECK_SECTIONS = [
  { id: "home", href: "/" },
  { id: "work", href: "/work" },
  { id: "projects", href: "/projects" },
  { id: "certifications", href: "/certifications" },
  { id: "coursework", href: "/coursework" },
] as const;

// Client half of the snap deck: keeps the URL in sync with the visible
// section (history.replaceState — Next's router tracks it, so every
// pathname-driven highlight updates for free), squares up landings on tall
// sections, and renders the right-edge dot rail. Explicit jumps (digits,
// cells, dots) are INSTANT via jumpToSection.
export function jumpToSection(id: string, href: string) {
  document
    .querySelectorAll(".pane.zoom")
    .forEach((p) => p.classList.remove("zoom"));
  document
    .getElementById(`ws-${id}`)
    ?.scrollIntoView({ behavior: "instant", block: "start" });
  if (window.location.pathname !== href) window.history.replaceState(null, "", href);
}

export default function DeckController({ initial }: { initial: string }) {
  const pathname = usePathname();

  // Align to this route's section before paint. Document loads already
  // aligned via the parse-time script in Deck (this is then a no-op), but
  // CLIENT-side navigations never execute innerHTML <script>s — without
  // this, arriving from the thoughts surface always landed on 1:home and
  // the observer rewrote the URL to "/".
  useLayoutEffect(() => {
    document
      .getElementById(`ws-${initial}`)
      ?.scrollIntoView({ behavior: "instant", block: "start" });
  }, [initial]);

  useEffect(() => {
    const main = document.querySelector("main.main");
    if (!main) return;

    // live URL + highlight sync as sections cross the viewport midline
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.id.replace(/^ws-/, "");
          const section = DECK_SECTIONS.find((s) => s.id === id);
          if (section && window.location.pathname !== section.href) {
            window.history.replaceState(null, "", section.href);
          }
        }
      },
      { root: main, rootMargin: "-50% 0px -50% 0px" },
    );
    main.querySelectorAll(".ws-slide").forEach((s) => observer.observe(s));

    // entry assist: mandatory snap can settle a hair past a tall section's
    // top when arriving from a neighbor — square it up, never inside
    let lastTop = main.scrollTop;
    const onScrollEnd = () => {
      const from = lastTop;
      lastTop = main.scrollTop;
      for (const slide of main.querySelectorAll<HTMLElement>(".ws-slide")) {
        const delta = main.scrollTop - slide.offsetTop;
        if (delta > 8 && delta < 150 && from < slide.offsetTop) {
          main.scrollTo({ top: slide.offsetTop, behavior: "instant" });
          break;
        }
      }
    };
    if ("onscrollend" in window) main.addEventListener("scrollend", onScrollEnd);

    return () => {
      observer.disconnect();
      if ("onscrollend" in window) main.removeEventListener("scrollend", onScrollEnd);
    };
  }, [initial]);

  return (
    <nav className="dotrail" aria-label="workspace position">
      {DECK_SECTIONS.map((s) => (
        <a
          key={s.id}
          href={s.href}
          className="dot"
          data-acc={s.id === "projects" ? "proj" : s.id === "certifications" ? "cert" : s.id === "coursework" ? "course" : s.id}
          title={s.id}
          aria-current={pathname === s.href ? "page" : undefined}
          onClick={(e) => {
            e.preventDefault();
            jumpToSection(s.id, s.href);
          }}
        />
      ))}
    </nav>
  );
}
