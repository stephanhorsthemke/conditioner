import yaml from "js-yaml";
import { ConditionIndex, Space, SpacesConfig } from "./types";

const FALLBACK_MAIN: Space = {
  id: "main",
  label: "All conditions",
  description: "Every condition in the navigator.",
  include: "all",
};

export async function loadSpaces(): Promise<Space[]> {
  try {
    const r = await fetch("/spaces.yaml");
    if (!r.ok) return [FALLBACK_MAIN];
    const text = await r.text();
    const parsed = yaml.load(text) as SpacesConfig | null;
    const spaces = parsed?.spaces ?? [];
    if (spaces.length === 0) return [FALLBACK_MAIN];
    return spaces;
  } catch {
    return [FALLBACK_MAIN];
  }
}

export function resolveMembership(space: Space, index: ConditionIndex[]): ConditionIndex[] {
  if (space.id === "main") {
    if (space.include !== "all" || space.exclude?.length) {
      console.warn("`main` space ignores include/exclude — it always contains every condition");
    }
    return index;
  }

  let included: ConditionIndex[];
  if (space.include === "all") {
    included = index;
  } else if (Array.isArray(space.include)) {
    const ids = new Set(space.include);
    included = index.filter((c) => ids.has(c.id));
  } else if (space.include && "groups" in space.include) {
    const groups = new Set(space.include.groups);
    included = index.filter((c) => groups.has(c.group_id));
  } else {
    included = [];
  }

  if (space.exclude?.length) {
    const excluded = new Set(space.exclude);
    // Subtypes follow their parent: if any parent is excluded, the subtype is too.
    included = included.filter(
      (c) => !excluded.has(c.id) && !c.parents.some((p) => excluded.has(p))
    );
  }

  return included;
}
