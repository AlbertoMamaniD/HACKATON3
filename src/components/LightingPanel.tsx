import {
  AlertTriangle,
  Clock3,
  Lightbulb,
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

function formatDuration(
  totalSeconds: number,
) {
  const seconds =
    Math.max(
      0,
      Math.round(totalSeconds),
    );

  const hours =
    Math.floor(seconds / 3600);

  const minutes =
    Math.floor(
      (seconds % 3600) / 60,
    );

  const rest =
    seconds % 60;

  if (hours > 0) {
    return `${hours} h ${minutes} min`;
  }

  if (minutes > 0) {
    return `${minutes} min ${rest} s`;
  }

  return `${rest} s`;
}

function calculateIlluminatedSecondsToday(
  rows: LecturaEcoAhorro[],
) {
  if (rows.length < 2) {
    return 0;
  }

  const now = new Date();

  const today =
    rows.filter((row) => {
      const date =
        new Date(row.created_at);

      return (
        date.getFullYear() ===
          now.getFullYear() &&
        date.getMonth() ===
          now.getMonth() &&
        date.getDate() ===
          now.getDate()
      );
    });

  let seconds = 0;

  for (
    let i = 1;
    i < today.length;
    i += 1
  ) {
    const previous =
      today[i - 1];

    const current =
      today[i];

    const wasOn = isLightOn(previous.estado_luz);

    if (!wasOn) {
      continue;
    }

    const diff =
      (
        new Date(
          current.created_at,
        ).getTime() -
        new Date(
          previous.created_at,
        ).getTime()
      ) /
      1000;

    // El ESP32 envía cada 15 s.
    // Evitamos sumar huecos grandes por desconexión.
    if (
      diff > 0 &&
      diff <= 30
    ) {
      seconds += diff;
    }
  }

  return seconds;
}

export function LightingPanel() {
  const {
    rows,
    todayRows,
    latest,
    online,
    loading,
    error,
  } = useLiveReadings(240);

  if (loading) {
    return (
      <section className="panel p-6">
        <p className="text-sm text-slate-500">
          Cargando datos de iluminación...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel border-red-200 bg-red-50 p-6">
        <p className="font-bold text-red-700">
          No se pudieron leer los datos de iluminación.
        </p>

        <p className="mt-1 text-sm text-red-600">
          {error}
        </p>
      </section>
    );
  }

  const lightPercent =
    latest?.luz_pct ?? 0;

  const currentSeconds =
    latest?.segundos_luz_continua ??
    0;

  // Calculamos el tiempo iluminado con todas las lecturas de hoy (todayRows)
  const todaySeconds =
    calculateIlluminatedSecondsToday(
      todayRows.length > 0 ? todayRows : rows,
    );

  const lightPowerW =
    Number(
      import.meta.env
        .VITE_LIGHT_POWER_W ??
        "0",
    );

  const estimatedKwh =
    lightPowerW > 0
      ? (
          lightPowerW *
          (todaySeconds / 3600)
        ) /
        1000
      : null;

  const trend =
    rows.slice(-60).map(
      (row) => ({
        time:
          new Intl.DateTimeFormat(
            "es-BO",
            {
              hour: "2-digit",
              minute: "2-digit",
            },
          ).format(
            new Date(
              row.created_at,
            ),
          ),

        luz:
          row.luz_pct ?? 0,
      }),
    );

  const status =
    latest?.estado_luz ??
    "SIN DATOS";

  const alert =
    Boolean(
      latest?.alerta_luz,
    );

  return (
    <section className="space-y-4">
      <div>
        <p className="eyebrow">
          Iluminación
        </p>

        <h2 className="mt-2 text-2xl font-bold">
          Uso de iluminación detectada
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          El KY-018 detecta el nivel de iluminación del ambiente.
          EcoAhorro registra cuánto tiempo permanece iluminado y puede
          generar una alerta cuando la iluminación se mantiene durante
          demasiado tiempo.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="panel p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold">
                Estado actual
              </p>

              <p className="mt-1 text-xs text-slate-500">
                KY-018
              </p>
            </div>

            <Lightbulb className="h-6 w-6 text-amber-600" />
          </div>

          <p className="mt-5 text-2xl font-bold">
            {status}
          </p>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(
                    0,
                    lightPercent,
                  ),
                )}%`,
              }}
            />
          </div>

          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span>Oscuro</span>

            <span>
              {lightPercent.toFixed(1)} %
            </span>

            <span>Iluminado</span>
          </div>
        </article>

        <article className="panel p-5">
          <Clock3 className="h-6 w-6 text-forest-600" />

          <p className="mt-4 text-sm font-bold">
            Iluminación continua
          </p>

          <p className="mt-2 text-2xl font-bold">
            {formatDuration(
              currentSeconds,
            )}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Tiempo desde que se detectó iluminación de forma continua.
          </p>
        </article>

        <article className="panel p-5">
          <Lightbulb className="h-6 w-6 text-tech-700" />

          <p className="mt-4 text-sm font-bold">
            Tiempo iluminado hoy
          </p>

          <p className="mt-2 text-2xl font-bold">
            {formatDuration(
              todaySeconds,
            )}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Calculado usando el historial de lecturas almacenado en Supabase.
          </p>
        </article>

        <article className="panel p-5">
          <Zap className="h-6 w-6 text-amber-700" />

          <p className="mt-4 text-sm font-bold">
            Consumo estimado
          </p>

          {estimatedKwh !== null ? (
            <>
              <p className="mt-2 text-2xl font-bold">
                {estimatedKwh.toFixed(
                  3,
                )}{" "}
                kWh
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Estimación usando una luminaria configurada en{" "}
                {lightPowerW} W.
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-lg font-bold">
                Sin configurar
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                El KY-018 no mide consumo eléctrico. Cuando tengan el
                medidor de potencia se reemplazará esta estimación por
                medición real.
              </p>
            </>
          )}
        </article>
      </div>

      {alert && (
        <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-bold">
              Iluminación prolongada
            </p>

            <p className="mt-1 leading-6">
              El ambiente lleva{" "}
              {formatDuration(
                currentSeconds,
              )}{" "}
              con iluminación detectada.
              Revisa si continúa siendo necesaria.
            </p>
          </div>
        </div>
      )}

      <article className="panel p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold">
              Tendencia de iluminación
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Variación del nivel detectado en las últimas lecturas.
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              online
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {online
              ? "ESP32 conectado"
              : "Sin conexión"}
          </span>
        </div>

        <div className="h-72">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart data={trend}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="time"
                fontSize={11}
                minTickGap={24}
              />

              <YAxis
                domain={[0, 100]}
                unit=" %"
                fontSize={11}
                width={52}
              />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="luz"
                name="Iluminación"
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
