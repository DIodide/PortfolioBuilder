"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
// static server-rendered HTML.
export default function MuxController() {
  const router = useRouter();
  const [keysOpen, setKeysOpen] = useState(false);

  useEffect(() => {
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
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= ROUTES.length) {
        unzoomAll();
        router.push(ROUTES[n - 1]);
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
  }, [router, keysOpen]);

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
              <td>1 – 5</td>
              <td>select-window (home · work · projects · certs · coursework)</td>
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
