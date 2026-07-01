import { useNavigate } from "react-router-dom";
import { Space } from "../types";

interface Props {
  spaces: Space[];
  currentId: string;
}

export default function SpaceSwitcher({ spaces, currentId }: Props) {
  const navigate = useNavigate();

  if (spaces.length <= 1) return null;

  return (
    <select
      value={currentId}
      onChange={(e) => {
        const id = e.target.value;
        navigate(id === "main" ? "/" : `/space/${id}`);
      }}
      style={{
        padding: "0.3rem 0.5rem",
        fontSize: "0.85rem",
        border: "1px solid var(--border)",
        borderRadius: "0.375rem",
        background: "var(--bg)",
        color: "var(--fg-secondary)",
        cursor: "pointer",
      }}
    >
      {spaces.map((s) => (
        <option key={s.id} value={s.id}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
