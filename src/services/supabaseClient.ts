import { createClient } from "@supabase/supabase-js";

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

// En entorno de tests unitarios, si no existen credenciales externas se usa un endpoint mock aislado
const isTest =
  typeof process !== "undefined" && process.env?.NODE_ENV === "test";

const targetUrl =
  SUPABASE_URL || (isTest ? "https://placeholder-test.supabase.co" : "");
const targetKey =
  SUPABASE_ANON_KEY || (isTest ? "placeholder-test-anon-key" : "");

if (!targetUrl || !targetKey) {
  throw new Error(
    "Faltan las variables de entorno VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. Configúralas en tu archivo .env o en el panel de Vercel.",
  );
}

export const supabase = createClient(targetUrl, targetKey);

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