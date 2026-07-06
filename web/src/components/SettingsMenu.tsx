import { useEffect, useRef, useState } from "react";
import { useTheme, ThemeChoice } from "../theme";

const CHOICES: { id: ThemeChoice; label: string }[] = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

export default function SettingsMenu() {
  const { choice, setThemeChoice } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <button
        aria-label="Settings"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "none",
          border: "none",
          padding: "0.2rem",
          cursor: "pointer",
          color: "var(--fg-faint)",
          lineHeight: 0,
          borderRadius: "0.25rem",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg-muted)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-faint)")}
      >
        {/* Inline gear icon — centers by its box (no icon library) */}
        <svg
          aria-hidden
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ display: "block" }}
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 0.4rem)",
            right: 0,
            zIndex: 40,
            minWidth: 200,
            background: "var(--tooltip-bg)",
            border: "1px solid var(--tooltip-border)",
            borderRadius: "0.5rem",
            padding: "0.65rem 0.75rem",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.12)",
          }}
        >
          <div
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--fg-faint)",
              marginBottom: "0.4rem",
            }}
          >
            Theme
          </div>
          <div
            role="group"
            aria-label="Theme"
            style={{
              display: "flex",
              gap: "0.25rem",
              background: "var(--surface-2)",
              border: "1px solid var(--border-soft)",
              borderRadius: "0.375rem",
              padding: "0.15rem",
            }}
          >
            {CHOICES.map((c) => {
              const active = choice === c.id;
              return (
                <button
                  key={c.id}
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => setThemeChoice(c.id)}
                  style={{
                    flex: 1,
                    fontSize: "0.8rem",
                    fontWeight: active ? 600 : 500,
                    padding: "0.3rem 0.4rem",
                    border: "none",
                    borderRadius: "0.25rem",
                    background: active ? "var(--bg)" : "transparent",
                    color: active ? "var(--fg)" : "var(--fg-muted)",
                    cursor: "pointer",
                    boxShadow: active ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                    transition: "background 0.12s, color 0.12s",
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
