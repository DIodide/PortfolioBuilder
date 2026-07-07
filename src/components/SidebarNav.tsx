"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface WorkspaceItem {
  acc: string;
  href: string;
  title: string;
  subtitle: string;
  hotkey: string;
}

export default function SidebarNav({ items }: { items: WorkspaceItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="cells" aria-label="workspaces">
      {items.map((w) => (
        <Link
          key={w.href}
          href={w.href}
          className="cell"
          data-acc={w.acc}
          aria-current={pathname === w.href ? "page" : undefined}
        >
          <span className="grip" aria-hidden="true">
            ⠿
          </span>
          <span className="tt">
            <span className="t1">{w.title}</span>
            <span className="t2">{w.subtitle}</span>
          </span>
          <span className="key" aria-hidden="true">
            {w.hotkey}
          </span>
        </Link>
      ))}
    </nav>
  );
}
