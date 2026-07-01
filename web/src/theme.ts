import { useEffect, useState } from "react";

const STORAGE_KEY = "cn_theme";

export type Theme = "light" | "dark";
export type ThemeChoice = Theme | "system";

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStored(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {}
  return null;
}

function apply(t: Theme) {
  document.documentElement.setAttribute("data-theme", t);
}

/**
 * Theme state:
 *   - `choice` is what the user picked: "light" | "dark" | "system"
 *   - `resolved` is what is actually applied right now (never "system")
 *
 * "system" tracks OS-level prefers-color-scheme and updates live.
 * "light"/"dark" persist in localStorage and override the OS.
 */
export function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice>(() => readStored() ?? "system");
  const [resolved, setResolved] = useState<Theme>(() => readStored() ?? getSystemTheme());

  useEffect(() => {
    apply(resolved);
  }, [resolved]);

  useEffect(() => {
    if (choice !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setResolved(mql.matches ? "dark" : "light");
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [choice]);

  function setThemeChoice(next: ThemeChoice) {
    setChoice(next);
    if (next === "system") {
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      setResolved(getSystemTheme());
    } else {
      try { localStorage.setItem(STORAGE_KEY, next); } catch {}
      setResolved(next);
    }
  }

  return { choice, resolved, setThemeChoice };
}
