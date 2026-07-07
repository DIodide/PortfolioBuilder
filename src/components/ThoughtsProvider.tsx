"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// Tiny client store for the thoughts surface. Layouts can't receive page
// data, so the open post's outline self-hydrates: PostReader registers its
// outline here on mount and ThoughtsSidebar consumes it. The provider also
// resets the surface's scroll container (<main>) on route changes — Next
// only scrolls the window, and our scroll happens inside main.

export interface OutlineEntry {
  id: string;
  text: string;
}

export interface OpenPostOutline {
  slug: string;
  file: string;
  entries: OutlineEntry[];
}

interface ThoughtsStore {
  /** outline of the currently open post, null on the index */
  outline: OpenPostOutline | null;
  /** id of the h2 the reader has scrolled past ("" = top) */
  activeId: string;
  register: (outline: OpenPostOutline) => void;
  clear: () => void;
  setActiveId: (id: string) => void;
}

const ThoughtsContext = createContext<ThoughtsStore | null>(null);

/** The thoughts surface's scroll container. */
export function thoughtsMain(): HTMLElement | null {
  return document.querySelector<HTMLElement>('main[data-acc="thoughts"]');
}

export function ThoughtsProvider({ children }: { children: ReactNode }) {
  const [outline, setOutline] = useState<OpenPostOutline | null>(null);
  const [activeId, setActiveId] = useState("");

  const register = useCallback((o: OpenPostOutline) => {
    setOutline(o);
    setActiveId("");
  }, []);
  const clear = useCallback(() => {
    setOutline(null);
    setActiveId("");
  }, []);

  const pathname = usePathname();
  useEffect(() => {
    thoughtsMain()?.scrollTo({ top: 0 });
  }, [pathname]);

  const value = useMemo(
    () => ({ outline, activeId, register, clear, setActiveId }),
    [outline, activeId, register, clear],
  );
  return (
    <ThoughtsContext.Provider value={value}>
      {children}
    </ThoughtsContext.Provider>
  );
}

export function useThoughts(): ThoughtsStore {
  const ctx = useContext(ThoughtsContext);
  if (!ctx) throw new Error("useThoughts requires <ThoughtsProvider>");
  return ctx;
}
