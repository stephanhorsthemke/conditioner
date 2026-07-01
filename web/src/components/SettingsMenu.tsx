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
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        aria-label="Settings"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "none",
          border: "none",
          padding: "0.2rem 0.35rem",
          cursor: "pointer",
          color: "var(--fg-faint)",
          fontSize: "1rem",
          lineHeight: 1,
          borderRadius: "0.25rem",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg-muted)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-faint)")}
      >
        {/* Simple gear glyph — avoids adding an icon library */}
        <span aria-hidden style={{ fontSize: "1.05rem" }}>⚙</span>
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
