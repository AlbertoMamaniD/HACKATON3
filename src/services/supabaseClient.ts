import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  (import.meta.env?.VITE_SUPABASE_URL as string | undefined) ||
  (typeof process !== "undefined"
    ? process.env?.VITE_SUPABASE_URL
    : undefined);

const SUPABASE_ANON_KEY =
  (import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  (typeof process !== "undefined"
    ? process.env?.VITE_SUPABASE_ANON_KEY
    : undefined);

/**
 * Indica si las variables de entorno de Supabase están debidamente configuradas.
 */
export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    SUPABASE_URL.startsWith("http") &&
    !SUPABASE_URL.includes("tu-proyecto") &&
    !SUPABASE_URL.includes("placeholder"),
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

  temperatura: number;
  humedad: number;

  calidad_aire: number;
  estado_aire: string;

  luz: number;
  luz_pct?: number | null;
  estado_luz: string;
  segundos_luz_continua?: number | null;

  alerta_temp: boolean;
  alerta_humedad: boolean;
  alerta_aire: boolean;
  alerta_luz?: boolean | null;

  bloque: string;
}