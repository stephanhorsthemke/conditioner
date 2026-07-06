import { Link } from "react-router-dom";
import SettingsMenu from "./SettingsMenu";
import SearchBox from "./SearchBox";
import Feedback from "./Feedback";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      fontSize: "17px",
      lineHeight: 1.65,
      color: "var(--fg)",
    }}>
      <header style={{
        borderBottom: "1px solid var(--border-soft)",
        padding: "0.5rem 1rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        maxWidth: 680,
        margin: "0 auto",
        width: "100%",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexShrink: 0 }}>
          <Link
            to="/"
            style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--fg-secondary)", letterSpacing: "0.01em", textDecoration: "none", whiteSpace: "nowrap" }}
          >
            Condition Navigator
          </Link>
          <span
            title="Alpha — prototype, expect rough edges and rapid changes"
            style={{
              fontSize: "0.5rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--warn-fg)",
              background: "var(--warn-bg)",
              border: "1px solid var(--warn-border)",
              padding: "0.02rem 0.22rem",
              borderRadius: "0.2rem",
              whiteSpace: "nowrap",
              lineHeight: 1.4,
            }}
          >
            alpha
          </span>
        </div>
        <div style={{ flex: 1, display: "flex", justifyContent: "center", minWidth: 0 }}>
          <SearchBox size="compact" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
          <a
            href="https://flourishinglab.app"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: "0.78rem", lineHeight: 1, color: "var(--fg-faint)", textDecoration: "none", display: "inline-flex", alignItems: "center" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg-muted)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-faint)")}
          >
            About
          </a>
          <Feedback />
          <SettingsMenu />
        </div>
      </header>
      <div style={{ flex: 1 }}>{children}</div>
      <footer style={{
        marginTop: "3rem",
        borderTop: "1px solid var(--border-soft)",
        padding: "1.5rem 1rem",
        textAlign: "center",
        fontSize: "0.75rem",
        color: "var(--fg-faint)",
        lineHeight: 1.5,
      }}>
        AI-generated content, not reviewed by a medical professional. Use it to navigate your research — verify anything important with a qualified practitioner.
        <div style={{ marginTop: "0.6rem" }}>
          <a href="https://flourishinglab.app/impressum" target="_blank" rel="noopener noreferrer" style={{ color: "var(--fg-faint)", textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg-muted)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-faint)")}
          >Impressum</a>
          <span style={{ margin: "0 0.5rem" }}>·</span>
          <a href="https://flourishinglab.app/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--fg-faint)", textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg-muted)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-faint)")}
          >Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
}
