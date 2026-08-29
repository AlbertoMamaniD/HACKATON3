import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
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

export function LiveReadingsProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<LecturaEcoAhorro[]>([]);
  const [todayRows, setTodayRows] = useState<LecturaEcoAhorro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastTick, setLastTick] = useState(() => Date.now());

  // Contador para evitar race conditions en peticiones concurrentes / fuera de orden
  const requestCounter = useRef(0);

  const fetchData = async () => {
    const currentRequestId = ++requestCounter.current;

    try {
      // 1. Obtener las últimas filas para gráficos y métricas en vivo
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

      // Si otra petición terminó después de iniciar esta, descartar respuesta desactualizada
      if (currentRequestId !== requestCounter.current) {
        return;
      }

      if (recentResult.error) {
        console.error("Error leyendo lecturas recientes:", recentResult.error);
        setError(recentResult.error.message);
        setLoading(false);
        return;
      }

      const recentData = (recentResult.data ?? []) as unknown as LecturaEcoAhorro[];
      const orderedRecent = [...recentData].reverse();

      const todayData = todayResult.error
        ? orderedRecent.filter((r) => new Date(r.created_at) >= startOfToday)
        : ((todayResult.data ?? []) as unknown as LecturaEcoAhorro[]);

      setRows(orderedRecent);
      setTodayRows(todayData);
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

    void fetchData();

    const interval = window.setInterval(() => {
      if (!active) return;
      void fetchData();
      setLastTick(Date.now());
    }, POLLING_MS);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const latest = rows.length > 0 ? rows[rows.length - 1] : null;

  // Cálculo reactivo de conexión: se evalúa con cada tick y respeta OFFLINE_AFTER_MS
  const online = useMemo(() => {
    if (!latest) {
      return false;
    }

    const fecha = new Date(latest.created_at).getTime();
    if (Number.isNaN(fecha)) {
      return false;
    }

    // Si pasaron más de 60 s desde la última lectura válida, se considera desconectado
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
