import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import SearchBox from "../components/SearchBox";
import { StartingPointIndex } from "../types";

export default function HomePage() {
  const [startingPoints, setStartingPoints] = useState<StartingPointIndex[]>([]);

  useEffect(() => {
    document.title = "Condition Navigator";
    fetch("/generated/starting_points/index.json")
      .then((r) => (r.ok ? r.json() : []))
      .then(setStartingPoints)
      .catch(() => setStartingPoints([]));
  }, []);

  return (
    <Layout>
      <div style={{ maxWidth: 680, margin: "2.5rem auto", padding: "0 1rem" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, margin: "0 0 1.25rem", color: "var(--fg)", lineHeight: 1.3, textWrap: "balance" }}>
          Navigating chronic illness shouldn't come down to luck.
        </h1>
        <p style={{ color: "var(--fg-body)", fontSize: "1.1rem", lineHeight: 1.7, margin: "0 0 1rem", maxWidth: "56ch" }}>
          Finding conditions relevant to you in the myriad of conditions can take
          ages. Educating yourself for hours about the wrong condition sucks.
          Reading countless success stories of people on Reddit with shady tips
          is frustrating. Hitting yet another expensive paywall from a content
          creator who might be able to help feels debilitating. But what is the
          alternative?
        </p>
        <p style={{ color: "var(--fg-body)", fontSize: "1.1rem", lineHeight: 1.7, margin: "0 0 2rem", maxWidth: "56ch" }}>
          Condition Navigator wants to help you navigate your path to living a
          better life with whatever you're suffering from. It helps you
          investigate with structure. Find relevant conditions for you and get
          the information you need.
        </p>

        {startingPoints.length > 0 && (
          <section style={{ margin: "0 0 2.5rem" }}>
            <h2 style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--fg-secondary)", margin: "0 0 1rem" }}>
              Current starting points
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
              {startingPoints.map((sp) => (
                <Link
                  key={sp.id}
                  to={`/start/${sp.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    minHeight: "3.5rem",
                    padding: "1rem 1.1rem",
                    border: "1px solid var(--border)",
                    borderRadius: "0.6rem",
                    background: "var(--surface)",
                    textDecoration: "none",
                    color: "var(--fg)",
                    fontSize: "1.05rem",
                    fontWeight: 600,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--fg-muted)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  {sp.label}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section style={{ margin: "0 0 2.5rem" }}>
          <p style={{ fontSize: "0.95rem", color: "var(--fg-muted)", margin: "0 0 0.6rem" }}>
            Already have something in mind?
          </p>
          <SearchBox size="hero" />
        </section>

        <section style={{ margin: "0 0 2rem", maxWidth: "60ch" }}>
          <h2 style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--fg-secondary)", margin: "0 0 0.6rem" }}>
            Work in progress
          </h2>
          <p style={{ fontSize: "0.95rem", color: "var(--fg-muted)", lineHeight: 1.65, margin: 0 }}>
            Currently this tool is in alpha and covers just a few starting points, it's a
            prototype. Let us know what you think and what might level this
            experience up! We're actively adding more conditions and making the
            condition pages more helpful and on point.
          </p>
        </section>

        <p style={{ fontSize: "0.85rem", color: "var(--fg-muted)", lineHeight: 1.6, margin: 0, borderTop: "1px solid var(--border-soft)", paddingTop: "1.25rem", maxWidth: "60ch" }}>
          Condition Navigator is for information and research — it doesn't
          diagnose you or replace medical care.
        </p>
      </div>
    </Layout>
  );
}
