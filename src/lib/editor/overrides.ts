export interface NodeOverride {
  label?: string;
  desc?: string;
  deleted?: boolean;
}

export type Overrides = Record<string, NodeOverride>;

const KEY = "smandash_overrides_v1";

let cache: Overrides | null = null;

export function loadOverrides(): Overrides {
  if (cache) return cache;
  if (typeof window === "undefined") return (cache = {});
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Overrides) : {};
  } catch {
    cache = {};
  }
  return cache!;
}

export function saveOverrides(o: Overrides) {
  cache = o;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(o));
  }
}

export function setOverride(id: string, patch: Partial<NodeOverride>) {
  const o = { ...loadOverrides() };
  o[id] = { ...(o[id] || {}), ...patch };
  saveOverrides(o);
}

export function clearOverrides() {
  saveOverrides({});
}

export function exportOverrides(): string {
  return JSON.stringify(loadOverrides(), null, 2);
}

export function validateEditorKey(input: string): boolean {
  const envKey = (import.meta.env.VITE_EDITOR_KEY as string | undefined) || "smandash2026";
  return input.trim() === envKey;
}