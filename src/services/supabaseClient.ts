import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function normalizeUrl(raw?: string): string {
  if (!raw) return "";
  let url = raw.trim();
  // Si el usuario copió la URL del ESP32 con /rest/v1 o /rest/v1/lecturas, remover el path REST
  if (url.includes("/rest/v1")) {
    url = url.split("/rest/v1")[0];
  }
  return url.replace(/\/+$/, "");
}

function normalizeKey(raw?: string): string {
  if (!raw) return "";
  return raw.trim().replace(/^["']|["']$/g, "");
}

const RAW_URL =
  (import.meta.env?.VITE_SUPABASE_URL as string | undefined) ||
  (typeof process !== "undefined"
    ? process.env?.VITE_SUPABASE_URL
    : undefined);

const RAW_KEY =
  (import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  (typeof process !== "undefined"
    ? process.env?.VITE_SUPABASE_ANON_KEY
    : undefined);

const SUPABASE_URL = normalizeUrl(RAW_URL);
const SUPABASE_ANON_KEY = normalizeKey(RAW_KEY);

/**
 * Indica si las variables de entorno de Supabase están debidamente configuradas.
 */
export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    SUPABASE_URL.startsWith("http") &&
    !SUPABASE_URL.includes("tu-proyecto") &&
    !SUPABASE_URL.includes("placeholder") &&
    !SUPABASE_URL.includes("unconfigured"),
);

// Fallbacks seguros para inicialización sin lanzar excepciones en tiempo de importación
const safeUrl =
  SUPABASE_URL && SUPABASE_URL.startsWith("http")
    ? SUPABASE_URL
    : "https://unconfigured.supabase.co";

const safeKey = SUPABASE_ANON_KEY || "unconfigured-anon-key";

export const supabase: SupabaseClient = createClient(safeUrl, safeKey);

// Fila tal cual la guarda el ESP32 en la tabla "lecturas".
export interface LecturaRow {
  id: number;
  created_at: string;

  temperatura?: number | null;
  humedad?: number | null;

  potencia_w?: number | null;
  flujo_agua_lpm?: number | null;

  calidad_aire: number;
  estado_aire: string;

  luz: number;
  luz_pct?: number | null;
  estado_luz: string;
  segundos_luz_continua?: number | null;

  alerta_temp?: boolean | null;
  alerta_humedad?: boolean | null;
  alerta_aire: boolean;
  alerta_luz?: boolean | null;
  alerta_agua?: boolean | null;

  bloque: string;
}