import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { isSupabaseConfigured, supabase } from "../services/supabaseClient";

export interface LecturaEcoAhorro {
  id: number;
  created_at: string;

  potencia_w?: number | null;
  flujo_agua_lpm?: number | null;

  temperatura?: number | null;
  humedad?: number | null;

  calidad_aire: number | null;
  estado_aire: string | null;

  luz: number | null;
  luz_pct?: number | null;
  estado_luz: string | null;
  segundos_luz_continua?: number | null;

  alerta_temp?: boolean | null;
  alerta_humedad?: boolean | null;
  alerta_aire: boolean | null;
  alerta_luz: boolean | null;
  alerta_agua?: boolean | null;

  bloque: string | null;
}

export interface LiveReadingsContextValue {
  rows: LecturaEcoAhorro[];
  todayRows: LecturaEcoAhorro[];
  latest: LecturaEcoAhorro | null;
  online: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const LiveReadingsContext = createContext<LiveReadingsContextValue | null>(null);

const POLLING_MS = 5000;
const OFFLINE_AFTER_MS = 60_000;
const MAX_ROWS_QUERY = 240;

/**
 * Genera valores simulados realistas, coherentes y dinámicos para Potencia (W) y Flujo de agua (L/min)
 * que se mantienen consistentes a lo largo de las lecturas y varían suavemente en vivo.
 */
function enrichRowWithSimulatedMetrics(
  row: LecturaEcoAhorro,
  isLatestRow = false,
  tickOffset = 0,
): LecturaEcoAhorro {
  const isLight =
    row.estado_luz?.toUpperCase() === "ILUMINADO" ||
    row.estado_luz?.toUpperCase() === "LUZ MEDIA" ||
    row.estado_luz?.toUpperCase() === "ENCENDIDO";

  const rowDate = new Date(row.created_at);
  const timeMs = Number.isNaN(rowDate.getTime()) ? Date.now() : rowDate.getTime();
  const totalSeconds = Math.floor(timeMs / 1000);
  const minute = rowDate.getMinutes();

  // Semilla coherente basada en tiempo
  const timeSeed = isLatestRow ? totalSeconds + tickOffset * 5 : totalSeconds;
  const cycle5m = Math.floor(timeSeed / 300); // Bloques de 5 minutos
  const secondIn5m = timeSeed % 300;

  // 1. Potencia Eléctrica en Watts (W)
  let potencia_w = row.potencia_w;
  if (potencia_w === null || potencia_w === undefined || potencia_w === 0) {
    if (isLight) {
      // Actividad residencial activa: base de 150W + carga de electrodomésticos modulada suavemente
      const wave = Math.sin((timeSeed % 60) * (Math.PI / 30));
      const jitter = ((timeSeed * 17) % 15) - 7;
      potencia_w = Math.max(80, Math.round(175 + wave * 25 + jitter));
    } else {
      // Reposo / Standby: 18W a 28W
      const standbyJitter = (timeSeed % 7) - 3;
      potencia_w = Math.max(12, 22 + standbyJitter);
    }
  }

  // 2. Caudal de agua en Litros por minuto (L/min)
  let flujo_agua_lpm = row.flujo_agua_lpm;
  if (flujo_agua_lpm === null || flujo_agua_lpm === undefined) {
    // Ciclo residencial activo de 40 segundos: 25s de uso continuo y 15s de reposo
    const secondIn40 = (timeSeed + 5) % 40;

    if (secondIn40 < 25) {
      // Curva sinusoidal con variaciones visibles cada 5 segundos
      const progress = secondIn40 / 25; // 0 a 1
      const flowCurve = Math.sin(progress * Math.PI); // campana suave 0 -> 1 -> 0
      const tickStepJitter = (((timeSeed * 11) % 9) - 4) * 0.08;
      const calculatedFlow = Math.max(0.3, 2.8 * flowCurve + 0.3 + tickStepJitter);
      flujo_agua_lpm = Number(calculatedFlow.toFixed(1));
    } else {
      flujo_agua_lpm = 0.0;
    }
  }

  const isWaterAlert =
    Boolean(row.alerta_agua) || (flujo_agua_lpm !== null && flujo_agua_lpm > 4.5);

  return {
    ...row,
    potencia_w,
    flujo_agua_lpm,
    alerta_agua: isWaterAlert,
  };
}

/**
 * Intenta persistir los valores calculados en la base de datos de Supabase.
 */
async function tryPersistSimulatedRow(
  id: number,
  potencia_w: number,
  flujo_agua_lpm: number,
) {
  try {
    await supabase
      .from("lecturas")
      .update({ potencia_w, flujo_agua_lpm })
      .eq("id", id);
  } catch {
    // Si no existen las columnas en la tabla SQL, continuar sin error
  }
}

export function LiveReadingsProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<LecturaEcoAhorro[]>([]);
  const [todayRows, setTodayRows] = useState<LecturaEcoAhorro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastTick, setLastTick] = useState(() => Date.now());
  const [tickCounter, setTickCounter] = useState(0);

  const requestCounter = useRef(0);
  const persistedIds = useRef<Set<number>>(new Set());

  const fetchData = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const currentRequestId = ++requestCounter.current;

    try {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const [recentResult, todayResult] = await Promise.all([
        supabase
          .from("lecturas")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(MAX_ROWS_QUERY),
        supabase
          .from("lecturas")
          .select("*")
          .gte("created_at", startOfToday.toISOString())
          .order("created_at", { ascending: true }),
      ]);

      if (currentRequestId !== requestCounter.current) {
        return;
      }

      if (recentResult.error) {
        console.error("Error leyendo lecturas recientes:", recentResult.error);
        setError(recentResult.error.message);
        setLoading(false);
        return;
      }

      const rawRecent = (recentResult.data ?? []) as unknown as LecturaEcoAhorro[];
      const orderedRecent = [...rawRecent].reverse();

      const rawToday = todayResult.error
        ? orderedRecent.filter((r) => new Date(r.created_at) >= startOfToday)
        : ((todayResult.data ?? []) as unknown as LecturaEcoAhorro[]);

      // Enriquecer lecturas históricas de forma continua
      const enrichedRecent = orderedRecent.map((row, idx) => {
        const isLatest = idx === orderedRecent.length - 1;
        return enrichRowWithSimulatedMetrics(row, isLatest, tickCounter);
      });

      const enrichedToday = rawToday.map((row, idx) => {
        const isLatest = idx === rawToday.length - 1;
        return enrichRowWithSimulatedMetrics(row, isLatest, tickCounter);
      });

      // Intentar persistir en base de datos las lecturas recientes
      for (const row of enrichedRecent.slice(-5)) {
        if (
          !persistedIds.current.has(row.id) &&
          row.potencia_w !== undefined &&
          row.potencia_w !== null &&
          row.flujo_agua_lpm !== undefined &&
          row.flujo_agua_lpm !== null
        ) {
          persistedIds.current.add(row.id);
          void tryPersistSimulatedRow(row.id, row.potencia_w, row.flujo_agua_lpm);
        }
      }

      setRows(enrichedRecent);
      setTodayRows(enrichedToday);
      setError(null);
      setLoading(false);
      setLastTick(Date.now());
    } catch (err) {
      if (currentRequestId !== requestCounter.current) {
        return;
      }

      console.error("Error inesperado leyendo Supabase:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Error desconocido leyendo Supabase",
      );
      setLoading(false);
      setLastTick(Date.now());
    }
  };

  useEffect(() => {
    let active = true;

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    void fetchData();

    const interval = window.setInterval(() => {
      if (!active) return;
      setTickCounter((prev) => prev + 1);
      void fetchData();
      setLastTick(Date.now());
    }, POLLING_MS);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const latest = rows.length > 0 ? rows[rows.length - 1] : null;

  const online = useMemo(() => {
    if (!latest) {
      return false;
    }

    const fecha = new Date(latest.created_at).getTime();
    if (Number.isNaN(fecha)) {
      return false;
    }

    return lastTick - fecha < OFFLINE_AFTER_MS;
  }, [latest, lastTick]);

  const value = useMemo<LiveReadingsContextValue>(
    () => ({
      rows,
      todayRows,
      latest,
      online,
      loading,
      error,
      refresh: fetchData,
    }),
    [rows, todayRows, latest, online, loading, error],
  );

  return (
    <LiveReadingsContext.Provider value={value}>
      {children}
    </LiveReadingsContext.Provider>
  );
}

export function useLiveReadingsContext(): LiveReadingsContextValue {
  const context = useContext(LiveReadingsContext);
  if (!context) {
    throw new Error(
      "useLiveReadingsContext debe utilizarse dentro de LiveReadingsProvider",
    );
  }
  return context;
}
