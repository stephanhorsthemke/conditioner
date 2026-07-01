import SettingsMenu from "./SettingsMenu";

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
        padding: "0.6rem 1rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        maxWidth: 680,
        margin: "0 auto",
        width: "100%",
      }}>
        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--fg-secondary)", letterSpacing: "0.01em" }}>
          Condition Navigator
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <a
            href="https://flourishinglab.app"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: "0.78rem", color: "var(--fg-faint)", textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg-muted)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-faint)")}
          >
            About
          </a>
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
