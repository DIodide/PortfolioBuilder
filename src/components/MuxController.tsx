"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { jumpToSection } from "./DeckController";

const ROUTE_IDS = ["home", "work", "projects", "certifications", "coursework"];

const ROUTES = ["/", "/work", "/projects", "/certifications", "/coursework"];

function toast(msg: string) {
  window.dispatchEvent(new CustomEvent("mux:toast", { detail: msg }));
}

function toggleTheme() {
  const root = document.documentElement;
  const dark =
    root.dataset.theme === "dark" ||
    (root.dataset.theme !== "light" &&
      matchMedia("(prefers-color-scheme: dark)").matches);
  const next = dark ? "light" : "dark";
  root.dataset.theme = next;
  try {
    localStorage.setItem("theme", next);
  } catch {}
}

function unzoomAll() {
  document
    .querySelectorAll(".pane.zoom")
    .forEach((p) => p.classList.remove("zoom"));
}

// out-of-bounds: a subtle directional rubber-band on the whole session
function shake(dir: "up" | "down" | "left" | "right") {
  const b = document.body;
  b.classList.remove("oob-up", "oob-down", "oob-left", "oob-right");
  void b.offsetWidth; // restart the animation if we're already shaking
  b.classList.add(`oob-${dir}`);
  b.addEventListener(
    "animationend",
    () => b.classList.remove(`oob-${dir}`),
    { once: true },
  );
}

function toggleZoom(pane: Element) {
  const wasZoomed = pane.classList.contains("zoom");
  unzoomAll();
  if (!wasZoomed) {
    pane.classList.add("zoom");
    (pane as HTMLElement).focus();
  }
}

// One client island for the whole session: keyboard bindings, pane zoom,
// theme toggle, easter eggs, and the ? overlay. Everything else ships as
// static server-rendered HTML. Keys are surface-aware: digits mean
// workspaces on the portfolio surface and posts on thought-sandboxes,
// while [ / ] cycle between the two surfaces from anywhere. (The thoughts
// reader owns Escape in the capture phase — it never reaches us there.)
export default function MuxController() {
  const router = useRouter();
  const pathname = usePathname();
  const [keysOpen, setKeysOpen] = useState(false);

  useEffect(() => {
    const onThoughts = pathname.startsWith("/thoughts");
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (/^(input|textarea|select)$/i.test(target.tagName)) return;
      if (e.key === "Escape") {
        setKeysOpen(false);
        unzoomAll();
        return;
      }
      if (keysOpen) return;
      if (e.key.startsWith("Arrow")) {
        if (e.shiftKey) return;
        e.preventDefault();
        unzoomAll();
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          // surfaces are ordered 1:portfolio · 2:thought-sandboxes — arrows
          // don't wrap; the edge rubber-bands
          if (e.key === "ArrowRight") {
            if (onThoughts) shake("right");
            else router.push("/thoughts", { scroll: false });
          } else if (!onThoughts) {
            shake("left");
          } else {
            // return to the workspace the portfolio surface was left on
            // (the strip's portfolio tab already remembers it)
            const back =
              document
                .querySelector('.surf-tab[data-acc="home"]')
                ?.getAttribute("href") ?? "/";
            router.push(back, { scroll: false });
          }
          return;
        }
        const delta = e.key === "ArrowDown" ? 1 : -1;
        if (onThoughts) {
          // buffers: 0:index then the sidebar's recent posts, in order
          const posts = Array.from(
            document.querySelectorAll<HTMLAnchorElement>(
              'nav[aria-label="recent posts"] a[href^="/thoughts/"]',
            ),
          ).map((a) => a.getAttribute("href")!);
          const buffers = ["/thoughts", ...posts];
          const i = Math.max(0, buffers.indexOf(pathname));
          const j = i + delta;
          if (j < 0 || j >= buffers.length) {
            shake(delta > 0 ? "down" : "up");
          } else {
            router.push(buffers[j], { scroll: false });
          }
        } else {
          const i = Math.max(0, ROUTES.indexOf(pathname));
          const j = i + delta;
          if (j < 0 || j >= ROUTES.length) {
            shake(delta > 0 ? "down" : "up");
          } else if (document.getElementById(`ws-${ROUTE_IDS[j]}`)) {
            jumpToSection(ROUTE_IDS[j], ROUTES[j]);
          } else {
            router.push(ROUTES[j], { scroll: false });
          }
        }
        return;
      }
      if (e.key === "[" || e.key === "]") {
        // two surfaces, so prev and next are the same toggle
        unzoomAll();
        router.push(onThoughts ? "/" : "/thoughts", { scroll: false });
        return;
      }
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 9) {
        if (onThoughts) {
          // digits open posts here, never workspaces — the index page
          // tags its post links with data-post-shortcut
          document
            .querySelector<HTMLElement>(`[data-post-shortcut="${n}"]`)
            ?.click();
        } else if (n <= ROUTES.length) {
          unzoomAll();
          // inside the deck: instant snap, exactly like the pre-deck cut
          if (document.getElementById(`ws-${ROUTE_IDS[n - 1]}`)) {
            jumpToSection(ROUTE_IDS[n - 1], ROUTES[n - 1]);
          } else {
            router.push(ROUTES[n - 1], { scroll: false });
          }
        }
        return;
      }
      if (e.key === "z") {
        const pane = (document.activeElement as HTMLElement | null)?.closest(
          ".pane",
        );
        if (pane) toggleZoom(pane);
        return;
      }
      if (e.key === "t") {
        toggleTheme();
        return;
      }
      if (e.key === "?") setKeysOpen(true);
    };

    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("[data-zoom]")) {
        e.preventDefault();
        const pane = el.closest(".pane");
        if (pane) toggleZoom(pane);
      } else if (el.closest("[data-theme-toggle]")) {
        toggleTheme();
      } else if (el.closest("[data-add-ws]")) {
        toast("create workspace failed: session is read-only (5/5)");
      } else if (el.closest("[data-keys-open]")) {
        setKeysOpen(true);
      }
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [router, pathname, keysOpen]);

  if (!keysOpen) return null;
  return (
    <div
      className="keys-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="keybindings"
      onClick={(e) => {
        if (e.target === e.currentTarget) setKeysOpen(false);
      }}
    >
      <div className="keys-panel">
        <span className="notch" aria-hidden="true">
          <span className="sig">❯ </span>tmux list-keys
        </span>
        <table>
          <tbody>
            <tr>
              <td>[ / ]</td>
              <td>cycle surfaces (portfolio · thought-sandboxes)</td>
            </tr>
            <tr>
              <td>← / →</td>
              <td>previous / next surface</td>
            </tr>
            <tr>
              <td>↑ / ↓</td>
              <td>
                previous / next window (workspaces on portfolio · posts on
                thought-sandboxes)
              </td>
            </tr>
            <tr>
              <td>1 – 5</td>
              <td>
                select-window — digits follow the surface (workspaces on
                portfolio · posts on thought-sandboxes)
              </td>
            </tr>
            <tr>
              <td>z</td>
              <td>zoom / unzoom focused pane</td>
            </tr>
            <tr>
              <td>t</td>
              <td>toggle theme (terminal dark ⇄ harness pastels)</td>
            </tr>
            <tr>
              <td>?</td>
              <td>this overlay</td>
            </tr>
            <tr>
              <td>esc</td>
              <td>close · unzoom</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
