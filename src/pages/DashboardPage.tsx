import {
  AlertTriangle,
  Droplets,
  RadioTower,
  Thermometer,
  WifiOff,
  Wind,
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartFrame } from "../components/ChartFrame";
import { LightingPanel } from "../components/LightingPanel";
import {
  ErrorState,
  LoadingState,
} from "../components/LoadingState";
import { MetricCard } from "../components/MetricCard";

import {
  useLiveReadings,
} from "../hooks/useLiveReadings";

import {
  formatDateTime,
  formatNumber,
} from "../utils/format";

function clampPercent(
  value: number,
  min: number,
  max: number,
) {
  if (max <= min) {
    return 0;
  }

  const percent =
    (
      (value - min) /
      (max - min)
    ) *
    100;

  return Math.max(
    0,
    Math.min(
      100,
      percent,
    ),
  );
}

function countActiveAlerts(
  latest: ReturnType<
    typeof useLiveReadings
  >["latest"],
) {
  if (!latest) {
    return 0;
  }

  return [
    latest.alerta_temp,
    latest.alerta_humedad,
    latest.alerta_aire,
    latest.alerta_luz,
  ].filter(Boolean).length;
}

function getTemperatureStatus(
  value: number | null,
) {
  if (value === null) {
    return {
      label: "Sin datos",
      barClass:
        "bg-slate-300",
      textClass:
        "text-slate-500",
    };
  }

  if (value >= 30) {
    return {
      label: "Alta",
      barClass:
        "bg-red-500",
      textClass:
        "text-red-600",
    };
  }

  if (value >= 25) {
    return {
      label: "Cálida",
      barClass:
        "bg-amber-500",
      textClass:
        "text-amber-600",
    };
  }

  return {
    label: "Normal",
    barClass:
      "bg-emerald-500",
    textClass:
      "text-emerald-600",
  };
}

function getHumidityStatus(
  value: number | null,
) {
  if (value === null) {
    return {
      label: "Sin datos",
      barClass:
        "bg-slate-300",
      textClass:
        "text-slate-500",
    };
  }

  if (value >= 70) {
    return {
      label: "Alta",
      barClass:
        "bg-red-500",
      textClass:
        "text-red-600",
    };
  }

  if (value >= 55) {
    return {
      label: "Media",
      barClass:
        "bg-blue-500",
      textClass:
        "text-blue-600",
    };
  }

  return {
    label: "Normal",
    barClass:
      "bg-sky-500",
    textClass:
      "text-sky-600",
  };
}

function getAirStatus(
  value: number | null,
) {
  if (value === null) {
    return {
      label: "Sin datos",
      barClass:
        "bg-slate-300",
      textClass:
        "text-slate-500",
    };
  }

  if (value >= 12) {
    return {
      label: "Malo",
      barClass:
        "bg-red-500",
      textClass:
        "text-red-600",
    };
  }

  if (value >= 5) {
    return {
      label: "Regular",
      barClass:
        "bg-amber-500",
      textClass:
        "text-amber-600",
    };
  }

  return {
    label: "Bueno",
    barClass:
      "bg-emerald-500",
    textClass:
      "text-emerald-600",
  };
}

function StatBar({
  title,
  value,
  unit,
  percent,
  status,
  minLabel,
  maxLabel,
  subtitle,
}: {
  title: string;
  value: number | null;
  unit: string;
  percent: number;
  status: {
    label: string;
    barClass: string;
    textClass: string;
  };
  minLabel: string;
  maxLabel: string;
  subtitle: string;
}) {
  return (
    <article className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-800">
            {title}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {subtitle}
          </p>
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold text-slate-900">
            {value !== null
              ? formatNumber(
                  value,
                  1,
                )
              : "—"}

            {value !== null
              ? ` ${unit}`
              : ""}
          </p>

          <p
            className={`text-xs font-bold ${status.textClass}`}
          >
            {status.label}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="h-4 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${status.barClass}`}
            style={{
              width: `${percent}%`,
            }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      </div>
    </article>
  );
}

export function DashboardPage() {
  const {
    rows,
    latest,
    online,
    loading,
    error,
  } = useLiveReadings(240);

  if (error) {
    return (
      <ErrorState message="No se pudieron obtener las lecturas de Supabase." />
    );
  }

  if (
    loading &&
    !latest
  ) {
    return <LoadingState />;
  }

  const temperature =
    latest?.temperatura ??
    null;

  const humidity =
    latest?.humedad ??
    null;

  const air =
    latest?.calidad_aire ??
    null;

  const activeAlerts =
    countActiveAlerts(
      latest,
    );

  const temperatureStatus =
    getTemperatureStatus(
      temperature,
    );

  const humidityStatus =
    getHumidityStatus(
      humidity,
    );

  const airStatus =
    getAirStatus(
      air,
    );

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

        temperatura:
          row.temperatura,

        humedad:
          row.humedad,

        aire:
          row.calidad_aire,
      }),
    );

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">
          Monitoreo ambiental
        </p>

        <h1 className="page-title mt-2">
          Dashboard EcoAhorro
        </h1>

        <p className="mt-3 max-w-3xl text-slate-600">
          Lecturas reales recibidas desde el ESP32 y almacenadas en
          Supabase. El dashboard consulta automáticamente cada cinco
          segundos, sin necesidad de refrescar la página.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <MetricCard
          label="Temperatura"
          value={
            temperature !== null
              ? formatNumber(
                  temperature,
                  1,
                )
              : "—"
          }
          unit="°C"
          hint="DHT22"
          icon={Thermometer}
          tone="amber"
        />

        <MetricCard
          label="Humedad"
          value={
            humidity !== null
              ? formatNumber(
                  humidity,
                  1,
                )
              : "—"
          }
          unit="%"
          hint="Humedad relativa"
          icon={Droplets}
          tone="blue"
        />

        <MetricCard
          label="Cambio del aire"
          value={
            air !== null
              ? formatNumber(
                  air,
                  1,
                )
              : "—"
          }
          unit="%"
          hint="Respecto a línea base MQ-135"
          icon={Wind}
        />

        <MetricCard
          label="Alertas activas"
          value={activeAlerts}
          unit={
            activeAlerts === 1
              ? "alerta"
              : "alertas"
          }
          hint="Condiciones que requieren revisión"
          icon={AlertTriangle}
          tone={
            activeAlerts > 0
              ? "red"
              : undefined
          }
        />

        <MetricCard
          label="Nodo"
          value={
            online
              ? "En línea"
              : "Sin conexión"
          }
          unit=""
          hint={
            latest
              ? `Última lectura ${formatDateTime(
                  latest.created_at,
                )}`
              : "Esperando datos"
          }
          icon={
            online
              ? RadioTower
              : WifiOff
          }
          tone={
            online
              ? undefined
              : "amber"
          }
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <StatBar
          title="Temperatura actual"
          value={temperature}
          unit="°C"
          percent={
            temperature !== null
              ? clampPercent(
                  temperature,
                  0,
                  40,
                )
              : 0
          }
          status={
            temperatureStatus
          }
          minLabel="0 °C"
          maxLabel="40 °C"
          subtitle="Valor instantáneo del DHT22"
        />

        <StatBar
          title="Humedad actual"
          value={humidity}
          unit="%"
          percent={
            humidity !== null
              ? clampPercent(
                  humidity,
                  0,
                  100,
                )
              : 0
          }
          status={
            humidityStatus
          }
          minLabel="0 %"
          maxLabel="100 %"
          subtitle="Humedad relativa del ambiente"
        />

        <StatBar
          title="Cambio del aire"
          value={air}
          unit="%"
          percent={
            air !== null
              ? clampPercent(
                  air,
                  0,
                  20,
                )
              : 0
          }
          status={airStatus}
          minLabel="0 %"
          maxLabel="20 %"
          subtitle="Variación respecto a la línea base del MQ-135"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartFrame
          title="Tendencia de temperatura y humedad"
          description="Evolución de las últimas lecturas recibidas"
          empty={
            trend.length === 0
          }
        >
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
                fontSize={12}
              />

              <Tooltip />

              <Legend />

              <Line
                isAnimationActive={false}
                type="monotone"
                dataKey="temperatura"
                name="Temperatura °C"
                stroke="#e5a30f"
                strokeWidth={3}
                dot={false}
              />

              <Line
                isAnimationActive={false}
                type="monotone"
                dataKey="humedad"
                name="Humedad %"
                stroke="#2a84c6"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartFrame>

        <ChartFrame
          title="Tendencia de calidad del aire"
          description="Cambio porcentual del MQ-135 respecto a su línea base"
          empty={
            trend.length === 0
          }
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <AreaChart data={trend}>
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
                fontSize={12}
                unit=" %"
              />

              <Tooltip />

              <Area
                isAnimationActive={false}
                type="monotone"
                dataKey="aire"
                name="Cambio del aire %"
                stroke="#16815f"
                fill="#16815f33"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartFrame>
      </section>

      <LightingPanel />

      <section className="panel p-5">
        <h2 className="font-bold">
          Última lectura recibida
        </h2>

        {latest ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">
                Ambiente
              </p>

              <p className="mt-1 font-bold">
                {latest.bloque ??
                  "Mi Casa"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">
                Estado del aire
              </p>

              <p className="mt-1 font-bold">
                {latest.estado_aire ??
                  "—"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">
                Estado de luz
              </p>

              <p className="mt-1 font-bold">
                {latest.estado_luz ??
                  "—"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">
                Actualización
              </p>

              <p className="mt-1 font-bold">
                {formatDateTime(
                  latest.created_at,
                )}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">
            Todavía no existen lecturas en Supabase.
          </p>
        )}
      </section>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
        <strong className="text-slate-800">
          Estado actual del MVP:
        </strong>{" "}
        temperatura, humedad, iluminación y cambio relativo del aire son
        datos disponibles. El consumo real en W, kWh, costo y CO₂ se
        incorporará cuando se conecte el medidor eléctrico que falta.
      </div>
    </div>
  );
}
