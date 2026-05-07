import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ConditionIndex, SymptomPattern, SubConditionAffinity } from "../types";

interface Props {
  rows: ConditionIndex[];
  probabilityById?: Record<string, number>;
  symptomPatterns?: SymptomPattern[];
  subConditionAffinities?: SubConditionAffinity[];
  signalsByConditionId?: Record<string, string>;
}

function renderSignal(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+?\*\*)/g);
  return parts.map((part, i) =>
    /^\*\*[^*]+\*\*$/.test(part) ? <strong key={i}>{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>
  );
}

function HeaderTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      tabIndex={0}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 4, cursor: "help", outline: "none" }}
    >
      {label}
      <span aria-hidden style={{ fontSize: "0.75rem", color: "#d1d5db", textTransform: "none", letterSpacing: 0 }}>ⓘ</span>
      {open && (
        <div
          role="tooltip"
          style={{
            position: "absolute",
            top: "calc(100% + 0.4rem)",
            left: 0,
            zIndex: 20,
            width: 300,
            maxWidth: "min(300px, 90vw)",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "0.5rem",
            padding: "0.75rem 0.9rem",
            color: "#374151",
            fontSize: "0.8rem",
            fontWeight: 400,
            textTransform: "none",
            letterSpacing: 0,
            lineHeight: 1.5,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            whiteSpace: "normal",
          }}
        >
          <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#92400e", fontWeight: 700, marginBottom: "0.4rem" }}>
            Best effort — just a first overview
          </div>
          {children}
        </div>
      )}
    </span>
  );
}

const headerCellStyle: React.CSSProperties = {
  padding: "0.35rem 0.5rem",
  fontSize: "0.7rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#9ca3af",
  borderBottom: "1px solid #e5e7eb",
  paddingBottom: "0.4rem",
  verticalAlign: "middle",
};

const cellStyle: React.CSSProperties = {
  padding: "0.35rem 0.5rem",
  verticalAlign: "top",
};

export default function SubConditionTable({ rows, probabilityById, symptomPatterns, subConditionAffinities, signalsByConditionId }: Props) {
  const navigate = useNavigate();
  const hasProbability = !!probabilityById && Object.keys(probabilityById).length > 0;
  const hasSignals = !!signalsByConditionId && Object.keys(signalsByConditionId).length > 0;

  const [patternFilter, setPatternFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const affinityMap = new Map<string, Set<string>>();
  for (const a of subConditionAffinities ?? []) {
    affinityMap.set(a.sub_condition_id, new Set(a.patterns));
  }

  const hasPatternFilters = !!symptomPatterns && symptomPatterns.length > 0;

  const sorted = hasProbability
    ? [...rows].sort((a, b) => (probabilityById![b.id] ?? 1) - (probabilityById![a.id] ?? 1))
    : rows;

  function matchesPattern(id: string, selected: string): boolean {
    const af = affinityMap.get(id);
    if (!af) return false;
    if (af.has(selected)) return true;
    if (selected === "ibs-m") return af.has("ibs-d") || af.has("ibs-c");
    return false;
  }

  const searchTerm = search.trim().toLowerCase();

  function matchesSearch(c: ConditionIndex): boolean {
    if (!searchTerm) return true;
    if (c.name.toLowerCase().includes(searchTerm)) return true;
    return c.aliases.some((a) => a.toLowerCase().includes(searchTerm));
  }

  function isGreyed(c: ConditionIndex): boolean {
    return patternFilter !== null && !matchesPattern(c.id, patternFilter);
  }

  const visible = sorted.filter(matchesSearch);

  return (
    <div>
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          style={{
            width: "140px",
            flexShrink: 0,
            padding: "0.22rem 0.55rem",
            fontSize: "0.8rem",
            border: "1px solid #e5e7eb",
            borderRadius: "999px",
            outline: "none",
            color: "#111827",
            background: "#fff",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#9ca3af")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
        />
        {hasPatternFilters && symptomPatterns!.map((p) => {
          const active = patternFilter === p.id;
          return (
            <button
              key={p.id}
              title={p.description}
              onClick={() => setPatternFilter(active ? null : p.id)}
              style={{
                fontSize: "0.75rem",
                padding: "0.18rem 0.55rem",
                borderRadius: "999px",
                border: active ? "1.5px solid #374151" : "1.5px solid #e5e7eb",
                background: active ? "#374151" : "#fff",
                color: active ? "#fff" : "#6b7280",
                cursor: "pointer",
                fontWeight: active ? 600 : 400,
                transition: "all 0.12s",
                whiteSpace: "nowrap",
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: hasSignals ? "38%" : "100%" }} />
          {hasSignals && <col />}
        </colgroup>
        <thead>
          <tr>
            <th style={{ ...headerCellStyle, textAlign: "left" }}>Condition</th>
            {hasSignals && (
              <th style={{ ...headerCellStyle, textAlign: "left" }}>
                <HeaderTooltip label="Relevant if…">
                  <p style={{ margin: 0 }}>
                    A short pointer at the <strong>distinguishing pattern</strong> that separates this condition from the others — not generic symptoms.
                  </p>
                  <p style={{ margin: "0.4rem 0 0", color: "#6b7280", fontSize: "0.75rem" }}>
                    AI-assisted summary. Use it to decide whether to read more, not as a diagnostic check.
                  </p>
                </HeaderTooltip>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {visible.map((c) => {
            const greyed = isGreyed(c);
            const clickable = !greyed && c.has_data;
            const signal = signalsByConditionId?.[c.id];
            return (
              <tr
                key={c.id}
                onClick={() => clickable && navigate(`/condition/${c.id}`)}
                onMouseEnter={(e) => { if (clickable) e.currentTarget.style.background = "#f9fafb"; }}
                onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                style={{
                  cursor: clickable ? "pointer" : "default",
                  opacity: greyed ? 0.25 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                <td style={{ ...cellStyle, paddingTop: "0.45rem" }}>
                  {clickable ? (
                    <Link
                      to={`/condition/${c.id}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{ textDecoration: "none", color: "#111827", fontSize: "0.875rem", fontWeight: 600, display: "block" }}
                    >
                      {c.name}
                    </Link>
                  ) : (
                    <span style={{ color: "#9ca3af", fontSize: "0.875rem", fontWeight: 600, display: "block" }}>{c.name}</span>
                  )}
                  {c.group_label && (
                    <span style={{ display: "block", fontSize: "0.68rem", color: "#9ca3af", marginTop: "0.1rem" }}>
                      {c.group_label}
                    </span>
                  )}
                </td>
                {hasSignals && (
                  <td style={{ ...cellStyle, fontSize: "0.82rem", color: signal ? "#4b5563" : "#d1d5db", lineHeight: 1.45, paddingTop: "0.45rem" }}>
                    {signal ? renderSignal(signal) : "—"}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
