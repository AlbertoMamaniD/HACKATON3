import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://tlxjgkutgyiwdccyrntl.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRseGpna3V0Z3lpd2RjY3lybnRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NzI4ODEsImV4cCI6MjEwMzU0ODg4MX0.Ow0O1w4UVQz49YWEfQQC09ZqOkXhttzxraA-ofvID0w";

const SUPABASE_URL =
  (import.meta.env?.VITE_SUPABASE_URL as string | undefined) ||
  DEFAULT_SUPABASE_URL;

const SUPABASE_ANON_KEY =
  (import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  DEFAULT_SUPABASE_ANON_KEY;

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