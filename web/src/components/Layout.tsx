export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <header style={{
        borderBottom: "1px solid #f3f4f6",
        padding: "0.6rem 1rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        maxWidth: 680,
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}>
        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#374151", letterSpacing: "0.01em" }}>
          Condition Navigator
        </span>
        <a
          href="https://flourishinglab.app"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: "0.78rem", color: "#9ca3af", textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#6b7280")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
        >
          About
        </a>
      </header>
      <div style={{ flex: 1 }}>{children}</div>
      <footer style={{
        marginTop: "3rem",
        borderTop: "1px solid #f3f4f6",
        padding: "1.5rem 1rem",
        textAlign: "center",
        fontSize: "0.75rem",
        color: "#9ca3af",
        lineHeight: 1.5,
      }}>
        AI-generated content, not reviewed by a medical professional. Use it to navigate your research — verify anything important with a qualified practitioner.
        <div style={{ marginTop: "0.6rem" }}>
          <a href="https://flourishinglab.app/impressum" target="_blank" rel="noopener noreferrer" style={{ color: "#9ca3af", textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#6b7280")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
          >Impressum</a>
          <span style={{ margin: "0 0.5rem" }}>·</span>
          <a href="https://flourishinglab.app/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#9ca3af", textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#6b7280")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
          >Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
}
