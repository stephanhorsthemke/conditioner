import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import { ConditionIndex, StartingPointIndex } from "../types";

type Kind = "starting_point" | "condition";

interface Entry {
  id: string;
  name: string;
  aliases: string[];
  kind: Kind;
  route: string;
  hint: string;
}

const KIND_LABEL: Record<Kind, string> = {
  starting_point: "Starting points",
  condition: "Conditions",
};

// Order groups are shown in: curated entries first, then the full graph.
const KIND_ORDER: Kind[] = ["starting_point", "condition"];

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const urlQ = params.get("q") ?? "";
  const [q, setQ] = useState(urlQ);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Keep the input in sync when the URL query changes externally (e.g. the
  // header search box while already on this page).
  useEffect(() => setQ(urlQ), [urlQ]);

  useEffect(() => {
    document.title = q ? `${q} · Search · Condition Navigator` : "Search · Condition Navigator";
  }, [q]);

  useEffect(() => {
    Promise.all([
      fetch("/generated/index.json").then((r) => (r.ok ? r.json() : [])) as Promise<ConditionIndex[]>,
      fetch("/generated/starting_points/index.json").then((r) => (r.ok ? r.json() : [])) as Promise<StartingPointIndex[]>,
    ])
      .then(([conditions, startingPoints]) => {
        const merged: Entry[] = [
          ...startingPoints.map((sp) => ({
            id: sp.id,
            name: sp.label,
            aliases: sp.full_label && sp.full_label !== sp.label ? [sp.full_label] : [],
            kind: "starting_point" as const,
            route: `/start/${sp.id}`,
            hint: sp.kind === "syndrome" ? "Syndrome — start here" : "Symptom — start here",
          })),
          ...conditions.map((c) => ({
            id: c.id,
            name: c.full_name || c.name,
            aliases: c.aliases,
            kind: "condition" as const,
            route: `/condition/${c.id}`,
            hint: c.group_label,
          })),
        ];
        setEntries(merged);
      })
      .catch(() => setEntries([]))
      .finally(() => setLoaded(true));
  }, []);

  const onChange = (value: string) => {
    setQ(value);
    setParams(value ? { q: value } : {}, { replace: true });
  };

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter(
      (e) =>
        e.name.toLowerCase().includes(needle) ||
        e.aliases.some((a) => a.toLowerCase().includes(needle))
    );
  }, [entries, q]);

  const grouped = useMemo(() => {
    return KIND_ORDER.map((kind) => ({
      kind,
      rows: results.filter((e) => e.kind === kind),
    })).filter((g) => g.rows.length > 0);
  }, [results]);

  return (
    <Layout>
      <div style={{ maxWidth: 680, margin: "1.5rem auto", padding: "0 1rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 1rem", color: "var(--fg)" }}>
          Search
        </h1>

        <input
          type="search"
          value={q}
          autoFocus
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search conditions, symptoms…"
          aria-label="Search the navigator"
          style={{
            width: "100%",
            padding: "0.7rem 1rem",
            fontSize: "1.05rem",
            border: "1px solid var(--border)",
            background: "var(--bg)",
            color: "var(--fg)",
            borderRadius: "0.6rem",
            marginBottom: "1.5rem",
          }}
        />

        {loaded && results.length === 0 && (
          <p style={{ color: "var(--fg-muted)", fontSize: "0.95rem", lineHeight: 1.6 }}>
            {q.trim()
              ? `Nothing matches “${q.trim()}”.`
              : "Nothing to show yet."}{" "}
            If you think something's missing,{" "}
            <a href="https://flourishinglab.app" target="_blank" rel="noopener noreferrer" style={{ color: "var(--link)" }}>
              let us know
            </a>
            .
          </p>
        )}

        {grouped.map((group) => (
          <section key={group.kind} style={{ margin: "0 0 2rem" }}>
            <h2 style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--fg-secondary)", margin: "0 0 0.75rem" }}>
              {KIND_LABEL[group.kind]}
            </h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {group.rows.map((row) => (
                <li key={`${row.kind}:${row.id}`}>
                  <Link
                    to={row.route}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: "1rem",
                      padding: "0.6rem 0.75rem",
                      border: "1px solid var(--border-soft)",
                      borderRadius: "0.5rem",
                      textDecoration: "none",
                      color: "var(--fg)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--row-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ fontWeight: 500 }}>{row.name}</span>
                    <span style={{ fontSize: "0.78rem", color: "var(--fg-muted)", whiteSpace: "nowrap" }}>
                      {row.hint}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Layout>
  );
}
