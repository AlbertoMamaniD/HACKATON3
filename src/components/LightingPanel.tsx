import {
  AlertTriangle,
  Clock3,
  Lightbulb,
  WifiOff,
  Zap,
} from "lucide-react";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  useLiveReadings,
  type LecturaEcoAhorro,
} from "../hooks/useLiveReadings";
import { isLightOn } from "../services/ecoahorro-data-source";
import { formatDateTime, formatNumber } from "../utils/format";
import { SourceBadge } from "./SourceBadge";

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${rest}s`;
  }
  return `${rest}s`;
}

function calculateIlluminatedSecondsToday(rows: LecturaEcoAhorro[]) {
  if (rows.length < 2) return 0;
  const now = new Date();

  const today = rows.filter((row) => {
    const date = new Date(row.created_at);
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  });

  let seconds = 0;

  for (let i = 1; i < today.length; i += 1) {
    const previous = today[i - 1];
    const current = today[i];
    const wasOn = isLightOn(previous.estado_luz);

    if (!wasOn) continue;

    const diff =
      (new Date(current.created_at).getTime() -
        new Date(previous.created_at).getTime()) /
      1000;

    if (diff > 0 && diff <= 30) {
      seconds += diff;
    }
  }

  return seconds;
}

export function LightingPanel() {
  const { rows, todayRows, latest, online, loading, error } =
    useLiveReadings(240);

  if (loading) {
    return (
      <section className="panel p-6">
        <p className="text-sm text-slate-500">
          Cargando datos del sensor de luz...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel border-red-200 bg-red-50 p-6">
        <p className="font-bold text-red-700">
          No se pudieron leer los datos del sensor de luz.
        </p>
        <p className="mt-1 text-sm text-red-600">{error}</p>
      </section>
    );
  }

  const lightPercent = latest?.luz_pct ?? 0;
  const currentSeconds = latest?.segundos_luz_continua ?? 0;
  const lightsOn = isLightOn(latest?.estado_luz);
  const lastReadingAt = latest ? formatDateTime(latest.created_at) : null;

  const todaySeconds = calculateIlluminatedSecondsToday(
    todayRows.length > 0 ? todayRows : rows,
  );

  const lightPowerW = Number(import.meta.env.VITE_LIGHT_POWER_W ?? "60");
  const estimatedKwh =
    lightPowerW > 0 ? (lightPowerW * (todaySeconds / 3600)) / 1000 : null;

  const trend = rows.slice(-60).map((row) => ({
    time: new Intl.DateTimeFormat("es-BO", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(row.created_at)),
    luz: row.luz_pct ?? 0,
  }));

  // Con el nodo sin conexión, la última lectura es antigua: no se presenta como actual.
  const alert = online && Boolean(latest?.alerta_luz);

  return (
    <section className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="eyebrow">Luz · sensor del ESP32</p>
          <SourceBadge source="sensor" />
        </div>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          Luces encendidas
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Detecta cuánto tiempo pasan prendidas las luces para avisarte antes
          de que ese consumo llegue al recibo de luz.
        </p>
      </div>

      {!online && (
        <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <WifiOff aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
          <p className="leading-6">
            <strong>Sin lecturas recientes del ESP32.</strong>{" "}
            {lastReadingAt
              ? `La última llegó el ${lastReadingAt}. Los datos se actualizan solos cuando el sensor vuelva a transmitir.`
              : "Todavía no llegó ninguna lectura del sensor."}
          </p>
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Estado de las luces */}
        <article className="panel p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {online ? "Luces ahora" : "Última lectura"}
                </p>
                <p className="text-[11px] text-slate-400">Sensor de luz KY-018</p>
              </div>
              <Lightbulb className="h-5 w-5 text-amber-600 shrink-0" />
            </div>

            <p className="mt-4 text-xl sm:text-2xl font-black tracking-tight text-slate-900 break-words">
              {!latest ? "—" : lightsOn ? "Prendidas" : "Apagadas"}
            </p>
            {!online && lastReadingAt && (
              <p className="mt-1 text-xs text-slate-500">{lastReadingAt}</p>
            )}
          </div>

          <div className="mt-4">
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${online ? "bg-amber-500" : "bg-slate-300"}`}
                style={{
                  width: `${Math.min(100, Math.max(0, lightPercent))}%`,
                }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Oscuro</span>
              <span className="font-bold text-slate-700">
                {latest ? `${formatNumber(lightPercent, 1)} %` : "—"}
              </span>
              <span>Iluminado</span>
            </div>
          </div>
        </article>

        {/* 2. Tiempo prendidas sin interrupción */}
        <article className="panel p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Tiempo prendidas
                </p>
                <p className="text-[11px] text-slate-400">Sin interrupción</p>
              </div>
              <Clock3 className="h-5 w-5 text-forest-600 shrink-0" />
            </div>

            <p className="mt-4 text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              {online && lightsOn ? formatDuration(currentSeconds) : "—"}
            </p>
          </div>

          <p className="mt-3 text-xs leading-4 text-slate-500">
            {online
              ? lightsOn
                ? "Desde que se prendieron por última vez."
                : "Las luces están apagadas."
              : "Disponible cuando el sensor esté en línea."}
          </p>
        </article>

        {/* 3. Tiempo prendidas hoy */}
        <article className="panel p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Prendidas hoy
                </p>
                <p className="text-[11px] text-slate-400">Acumulado del día</p>
              </div>
              <Lightbulb className="h-5 w-5 text-tech-700 shrink-0" />
            </div>

            <p className="mt-4 text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              {formatDuration(todaySeconds)}
            </p>
          </div>

          <p className="mt-3 text-xs leading-4 text-slate-500">
            {todaySeconds > 0
              ? "Suma de las lecturas de hoy con luces prendidas."
              : "Hoy no se registraron lecturas con luces prendidas."}
          </p>
        </article>

        {/* 4. Consumo estimado de las luces */}
        <article className="panel p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Consumo de luces hoy
                </p>
                <p className="text-[11px] text-slate-400">Estimado</p>
              </div>
              <Zap className="h-5 w-5 text-amber-700 shrink-0" />
            </div>

            <p className="mt-4 text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              {estimatedKwh !== null ? `${formatNumber(estimatedKwh, 3)} kWh` : "—"}
            </p>
          </div>

          <p className="mt-3 text-xs leading-4 text-slate-500">
            Supuesto: {lightPowerW} W de iluminación encendida. No es una
            medición de potencia.
          </p>
        </article>
      </div>

      {alert && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-bold text-amber-950">
              Aviso: luces prendidas por mucho tiempo
            </p>
            <p className="mt-1 leading-6 text-amber-800">
              Llevan {formatDuration(currentSeconds)} prendidas. Si nadie las
              usa, apágalas para no pagar de más en el recibo de luz.
            </p>
          </div>
        </div>
      )}

      {/* GRÁFICO DE TENDENCIA DE ILUMINACIÓN */}
      <article className="panel p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Historial del sensor de luz
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Nivel de luz (%) de las últimas lecturas recibidas
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              online
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {online ? "ESP32 conectado" : "Sin conexión"}
          </span>
        </div>

        <div className="h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" fontSize={11} minTickGap={24} />
              <YAxis domain={[0, 100]} unit=" %" fontSize={11} width={48} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="luz"
                name="Nivel de luz (%)"
                stroke="#e5a30f"
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  );
}
