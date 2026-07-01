import { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
  isEmpty: boolean;
  defaultOpen?: boolean;
}

export default function AccordionSection({ title, children, isEmpty, defaultOpen }: Props) {
  if (isEmpty) return null;
  return (
    <details open={defaultOpen} style={{ marginBottom: "0.75rem", borderBottom: "1px solid var(--border-soft)", paddingBottom: "0.5rem" }}>
      <summary style={{
        cursor: "pointer",
        fontWeight: 600,
        fontSize: "1.05rem",
        color: "var(--fg-secondary)",
        padding: "0.75rem 0",
        userSelect: "none",
      }}>
        {title}
      </summary>
      <div style={{ padding: "0.5rem 0 0.5rem 0", color: "var(--fg-secondary)" }}>
        {children}
      </div>
    </details>
  );
}

export function AccordionSubsection({ title, children, isEmpty, defaultOpen }: Props) {
  if (isEmpty) return null;
  return (
    <details
      open={defaultOpen}
      style={{
        margin: "0.75rem 0",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "0.375rem",
      }}
    >
      <summary
        style={{
          cursor: "pointer",
          fontWeight: 700,
          fontSize: "0.85rem",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "var(--fg-secondary)",
          padding: "0.5rem 0.75rem",
          userSelect: "none",
        }}
      >
        {title}
      </summary>
      <div style={{ padding: "0.5rem 0.75rem 0.75rem", color: "var(--fg-secondary)" }}>
        {children}
      </div>
    </details>
  );
}
