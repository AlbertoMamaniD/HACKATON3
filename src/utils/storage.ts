import type { ZodType } from "zod";

export const readStored = <T>(key: string, schema: ZodType<T>, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = schema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      window.localStorage.removeItem(key);
      return fallback;
    }
    return parsed.data;
  } catch {
    window.localStorage.removeItem(key);
    return fallback;
  }
};

export const writeStored = <T>(key: string, value: T) => {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* El MVP continúa aunque el almacenamiento no esté disponible. */ }
};
