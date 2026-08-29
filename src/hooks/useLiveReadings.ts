import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../services/supabaseClient";

export interface LecturaEcoAhorro {
  id: number;
  created_at: string;

  temperatura: number | null;
  humedad: number | null;

  calidad_aire: number | null;
  estado_aire: string | null;

  luz: number | null;
  luz_pct: number | null;
  estado_luz: string | null;
  segundos_luz_continua: number | null;

  alerta_temp: boolean | null;
  alerta_humedad: boolean | null;
  alerta_aire: boolean | null;
  alerta_luz: boolean | null;

  bloque: string | null;
}

const POLLING_MS = 5000;
const OFFLINE_AFTER_MS = 60_000;

export function useLiveReadings(limit = 120) {
  const [rows, setRows] = useState<LecturaEcoAhorro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function cargar() {
      try {
        const {
          data,
          error: supabaseError,
        } = await supabase
          .from("lecturas")
          .select("*")
          .order("created_at", {
            ascending: false,
          })
          .limit(limit);

        if (!active) {
          return;
        }

        if (supabaseError) {
          console.error(
            "Error leyendo lecturas:",
            supabaseError,
          );

          setError(supabaseError.message);
          setLoading(false);
          return;
        }

        const lecturas =
          (data ?? []) as unknown as LecturaEcoAhorro[];

        const ordered = [...lecturas].reverse();

        setRows(ordered);
        setError(null);
        setLoading(false);
      } catch (err) {
        console.error(
          "Error inesperado leyendo Supabase:",
          err,
        );

        if (!active) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Error desconocido leyendo Supabase",
        );

        setLoading(false);
      }
    }

    cargar();

    const interval = window.setInterval(
      cargar,
      POLLING_MS,
    );

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [limit]);

  const latest =
    rows.length > 0
      ? rows[rows.length - 1]
      : null;

  const online = useMemo(() => {
    if (!latest) {
      return false;
    }

    const fecha =
      new Date(latest.created_at).getTime();

    if (Number.isNaN(fecha)) {
      return false;
    }

    return (
      Date.now() - fecha <
      OFFLINE_AFTER_MS
    );
  }, [latest, rows]);

  return {
    rows,
    latest,
    online,
    loading,
    error,
  };
}
