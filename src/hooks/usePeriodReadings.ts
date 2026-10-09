import { useEffect, useState } from "react";

import {
  enrichRowWithSimulatedMetrics,
  type LecturaEcoAhorro,
} from "../context/LiveReadingsContext";
import type { PeriodReading } from "../domain/periods";
import { isSupabaseConfigured, supabase } from "../services/supabaseClient";

const PAGE_SIZE = 1000;
/** Tope de lecturas por consulta (~70 h a una lectura cada 5 s). Ver README. */
export const MAX_PERIOD_ROWS = 50_000;
const REFRESH_MS = 60_000;

interface PeriodReadingsState {
  rows: PeriodReading[];
  loading: boolean;
  error: string | null;
  /** true si se alcanzó MAX_PERIOD_ROWS y faltan lecturas antiguas. */
  truncated: boolean;
}

type MinimalRow = Pick<LecturaEcoAhorro, "id" | "created_at" | "estado_luz">;

function toPeriodReading(row: MinimalRow): PeriodReading {
  // Mismo cálculo de potencia y agua simuladas que usa el resto de la app.
  const enriched = enrichRowWithSimulatedMetrics({
    ...row,
    calidad_aire: null,
    estado_aire: null,
    luz: null,
    alerta_aire: null,
    alerta_luz: null,
    bloque: null,
  });
  return {
    created_at: row.created_at,
    potencia_w: enriched.potencia_w ?? 0,
    flujo_agua_lpm: enriched.flujo_agua_lpm ?? 0,
  };
}

/** Lecturas entre `fromMs` y `toMs` para comparar períodos. Se actualiza cada minuto. */
export function usePeriodReadings(fromMs: number, toMs: number): PeriodReadingsState {
  const [state, setState] = useState<PeriodReadingsState>({
    rows: [],
    loading: isSupabaseConfigured,
    error: null,
    truncated: false,
  });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setState({ rows: [], loading: false, error: null, truncated: false });
      return;
    }

    let active = true;

    async function load() {
      const collected: MinimalRow[] = [];
      try {
        // Más recientes primero: si se llega al tope, lo que falta es lo más antiguo.
        for (let from = 0; from < MAX_PERIOD_ROWS; from += PAGE_SIZE) {
          const { data, error } = await supabase
            .from("lecturas")
            .select("id,created_at,estado_luz")
            .gte("created_at", new Date(fromMs).toISOString())
            .lt("created_at", new Date(toMs).toISOString())
            .order("created_at", { ascending: false })
            .range(from, from + PAGE_SIZE - 1);

          if (error) throw new Error(error.message);
          const page = (data ?? []) as MinimalRow[];
          collected.push(...page);
          if (page.length < PAGE_SIZE) break;
        }

        if (!active) return;
        setState({
          rows: collected.reverse().map(toPeriodReading),
          loading: false,
          error: null,
          truncated: collected.length >= MAX_PERIOD_ROWS,
        });
      } catch (err) {
        if (!active) return;
        setState((current) => ({
          ...current,
          loading: false,
          error: err instanceof Error ? err.message : "Error leyendo el historial",
        }));
      }
    }

    setState((current) => ({ ...current, loading: true }));
    void load();
    const interval = window.setInterval(() => void load(), REFRESH_MS);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [fromMs, toMs]);

  return state;
}
