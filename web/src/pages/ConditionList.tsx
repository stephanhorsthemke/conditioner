import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ConditionIndex, Space } from "../types";
import SpaceSwitcher from "../components/SpaceSwitcher";
import SubConditionTable from "../components/SubConditionTable";
import { loadSpaces, resolveMembership } from "../spaces";
import Layout from "../components/Layout";

interface Props {
  spaceId?: string;
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    fontSize: "0.75rem",
    padding: "0.2rem 0.6rem",
    borderRadius: "999px",
    border: `1px solid ${active ? "var(--fg-secondary)" : "var(--border)"}`,
    background: active ? "var(--fg-secondary)" : "var(--bg)",
    color: active ? "var(--bg)" : "var(--fg-secondary)",
    cursor: "pointer",
    whiteSpace: "nowrap",
    fontFamily: "inherit",
  };
}

export default function ConditionList({ spaceId: spaceIdProp }: Props) {
  const params = useParams<{ spaceId: string }>();
  const spaceId = spaceIdProp ?? params.spaceId ?? "main";

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [conditions, setConditions] = useState<ConditionIndex[]>([]);
  const [query, setQuery] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSpaces().then(setSpaces);

    fetch("/generated/index.json")
      .then((r) => {
        if (!r.ok) throw new Error("index.json not found — run `cn index` to generate it");
        return r.json();
      })
      .then(setConditions)
      .catch((e) => setError(e.message));
  }, []);

  const space = useMemo(() => spaces.find((s) => s.id === spaceId), [spaces, spaceId]);
  const unknownSpace = spaces.length > 0 && !space;

  const titlePrefix = space && space.id !== "main" ? space.id.toUpperCase() : "Condition";

  useEffect(() => {
    document.title = `${titlePrefix} Navigator`;
  }, [titlePrefix]);

  useEffect(() => {
    try {
      localStorage.setItem("cn_last_space", spaceId);
    } catch {}
    setSelectedGroups(new Set());
  }, [spaceId]);

  const scoped = space ? resolveMembership(space, conditions) : conditions;
  const q = query.toLowerCase();

  const groupOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const c of scoped) {
      if (!seen.has(c.group_id)) seen.set(c.group_id, c.group_label);
    }
    return Array.from(seen.entries()).map(([id, label]) => ({ id, label }));
  }, [scoped]);

  const filtered = scoped
    .filter((c) => selectedGroups.size === 0 || selectedGroups.has(c.group_id))
    .filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.aliases.some((a) => a.toLowerCase().includes(q))
    );

  return (
    <Layout>
    <div style={{ maxWidth: 880, margin: "1rem auto", padding: "0 1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "0.25rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "var(--fg)" }}>
          {titlePrefix} Navigator
          <span
            title="Alpha — prototype, expect rough edges and rapid changes"
            style={{
              marginLeft: "0.5rem",
              fontSize: "0.65rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--warn-fg)",
              background: "var(--warn-bg)",
              border: "1px solid var(--warn-border)",
              padding: "0.1rem 0.4rem",
              borderRadius: "0.25rem",
              verticalAlign: "middle",
              whiteSpace: "nowrap",
            }}
          >
            alpha
          </span>
        </h1>
        <SpaceSwitcher spaces={spaces} currentId={spaceId} />
      </div>
      <p style={{ color: "var(--fg-muted)", marginBottom: "1.5rem" }}>
        {space?.description ?? "Search conditions to learn more."}
      </p>

      {unknownSpace && (
        <p style={{ color: "var(--danger)", fontSize: "0.875rem" }}>
          Unknown space "{spaceId}". <Link to="/">Go to all conditions</Link>.
        </p>
      )}

      <input
        type="search"
        placeholder="Search conditions…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "100%",
          padding: "0.5rem 0.75rem",
          fontSize: "1rem",
          border: "1px solid var(--border)",
          background: "var(--bg)",
          color: "var(--fg)",
          borderRadius: "0.375rem",
          marginBottom: "0.75rem",
        }}
      />

      {groupOptions.length > 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "1rem", alignItems: "center" }}>
          <button
            onClick={() => setSelectedGroups(new Set())}
            style={chipStyle(selectedGroups.size === 0)}
          >
            All
          </button>
          {groupOptions.map((g) => {
            const active = selectedGroups.has(g.id);
            return (
              <button
                key={g.id}
                onClick={() =>
                  setSelectedGroups((prev) => {
                    const next = new Set(prev);
                    if (next.has(g.id)) next.delete(g.id);
                    else next.add(g.id);
                    return next;
                  })
                }
                style={chipStyle(active)}
              >
                {g.label}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <p style={{ color: "var(--danger)", fontSize: "0.875rem" }}>{error}</p>
      )}

      {!error && !unknownSpace && filtered.length === 0 && scoped.length === 0 && (
        <p style={{ color: "var(--fg-muted)", fontSize: "0.875rem" }}>This space is empty.</p>
      )}

      {!error && !unknownSpace && filtered.length === 0 && scoped.length > 0 && (
        <p style={{ color: "var(--fg-muted)", fontSize: "0.875rem" }}>
          {query ? `No conditions match "${query}".` : "No conditions match the selected filters."}
        </p>
      )}

      {filtered.length > 0 && <SubConditionTable rows={filtered} />}
    </div>
    </Layout>
  );
}
