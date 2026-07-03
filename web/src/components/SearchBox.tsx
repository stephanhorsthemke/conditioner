import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface Props {
  size?: "compact" | "hero";
  initialQuery?: string;
  autoFocus?: boolean;
}

/**
 * Reusable global-search input. On submit it navigates to `/search?q=…`,
 * where results are filtered live. Used in the shared header and, at hero
 * size, on the home page.
 */
export default function SearchBox({ size = "compact", initialQuery = "", autoFocus }: Props) {
  const [q, setQ] = useState(initialQuery);
  const navigate = useNavigate();
  const hero = size === "hero";

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = q.trim();
        navigate(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
      }}
      style={{ width: "100%", maxWidth: hero ? 520 : 240 }}
    >
      <input
        type="search"
        value={q}
        autoFocus={autoFocus}
        onChange={(e) => setQ(e.target.value)}
        placeholder={hero ? "Search conditions, symptoms…" : "Search…"}
        aria-label="Search the navigator"
        style={{
          width: "100%",
          padding: hero ? "0.7rem 1.1rem" : "0.32rem 0.85rem",
          fontSize: hero ? "1.05rem" : "0.8rem",
          border: "1px solid var(--border)",
          background: hero ? "var(--bg)" : "var(--surface)",
          color: "var(--fg)",
          borderRadius: "999px",
        }}
      />
    </form>
  );
}
