import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as
  | string
  | undefined;

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. Configúralas en .env.local.",
  );
}

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
);

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