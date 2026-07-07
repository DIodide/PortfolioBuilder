"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export const WINDOWS = [
  { acc: "home", href: "/", label: "1:home" },
  { acc: "work", href: "/work", label: "2:work" },
  { acc: "proj", href: "/projects", label: "3:projects" },
  { acc: "cert", href: "/certifications", label: "4:certs" },
  { acc: "course", href: "/coursework", label: "5:coursework" },
];

export function WindowList() {
  const pathname = usePathname();
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
            {w.label}
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
