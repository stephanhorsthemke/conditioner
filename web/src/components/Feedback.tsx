import { useEffect, useRef, useState } from "react";

const EMAIL = "stephan.horsthemke@proton.me";

/** Small header affordance: reveals an email address so people can send feedback. */
export default function Feedback() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — the address is still shown to copy manually */
    }
  };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <button
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          color: "var(--fg-faint)",
          fontSize: "0.78rem",
          lineHeight: 1,
          fontFamily: "inherit",
          display: "inline-flex",
          alignItems: "center",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg-muted)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-faint)")}
      >
        Feedback
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Send feedback"
          style={{
            position: "absolute",
            top: "calc(100% + 0.4rem)",
            right: 0,
            zIndex: 40,
            width: 260,
            maxWidth: "80vw",
            background: "var(--tooltip-bg)",
            border: "1px solid var(--tooltip-border)",
            borderRadius: "0.5rem",
            padding: "0.75rem 0.85rem",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.12)",
            textAlign: "left",
          }}
        >
          <p style={{ margin: "0 0 0.6rem", fontSize: "0.85rem", lineHeight: 1.5, color: "var(--fg-secondary)" }}>
            Got feedback or an idea? I'd love to hear it — just email me:
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
            <a
              href={`mailto:${EMAIL}`}
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--link)",
                textDecoration: "none",
                wordBreak: "break-all",
                userSelect: "text",
              }}
            >
              {EMAIL}
            </a>
            <button
              onClick={copy}
              style={{
                fontSize: "0.7rem",
                padding: "0.15rem 0.45rem",
                border: "1px solid var(--border)",
                borderRadius: "0.25rem",
                background: "var(--surface)",
                color: "var(--fg-muted)",
                cursor: "pointer",
                fontFamily: "inherit",
                flexShrink: 0,
              }}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
