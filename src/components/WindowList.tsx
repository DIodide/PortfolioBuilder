"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export const WINDOWS = [
  { acc: "home", href: "/", label: "1:home", short: "1:home" },
  { acc: "work", href: "/work", label: "2:work", short: "2:work" },
  { acc: "proj", href: "/projects", label: "3:projects", short: "3:proj" },
  { acc: "cert", href: "/certifications", label: "4:certs", short: "4:certs" },
  { acc: "course", href: "/coursework", label: "5:coursework", short: "5:courses" },
];

const shortSlug = (s: string, max = 18) =>
  s.length > max ? `${s.slice(0, max - 1)}…` : s;

export function WindowList() {
  const pathname = usePathname();
  if (pathname.startsWith("/thoughts")) {
    // thought-sandboxes surface: buffers, not workspaces — 0:index plus
    // the open post when reading
    const slug = pathname.split("/").filter(Boolean)[1];
    return (
      <>
        <span className="sess" data-acc="thoughts">
          [ibraheem]
        </span>
        <nav className="wlist" aria-label="buffer switcher">
          <Link
            href="/thoughts"
            data-acc="thoughts"
            aria-current={slug ? undefined : "page"}
          >
            0:index{slug ? "" : "*"}
          </Link>
          {slug ? (
            <Link href={pathname} data-acc="thoughts" aria-current="page">
              1:{shortSlug(slug)}*
            </Link>
          ) : null}
        </nav>
      </>
    );
  }
  const active = WINDOWS.find((w) => w.href === pathname) ?? WINDOWS[0];
  return (
    <>
      <span className="sess" data-acc={active.acc}>
        [ibraheem]
      </span>
      <nav className="wlist" aria-label="workspace switcher">
        {WINDOWS.map((w) => (
          <Link
            key={w.href}
            href={w.href}
            data-acc={w.acc}
            aria-current={pathname === w.href ? "page" : undefined}
          >
            <span className="wlbl-full">{w.label}</span>
            <span className="wlbl-short">{w.short}</span>
            {pathname === w.href ? "*" : ""}
          </Link>
        ))}
      </nav>
    </>
  );
}

export function Toast() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const onToast = (e: Event) => {
      setMsg(String((e as CustomEvent).detail));
      clearTimeout(t);
      t = setTimeout(() => setMsg(null), 3000);
    };
    window.addEventListener("mux:toast", onToast);
    return () => {
      window.removeEventListener("mux:toast", onToast);
      clearTimeout(t);
    };
  }, []);
  if (!msg) return null;
  return (
    <span className="toast" role="status">
      {msg}
    </span>
  );
}
