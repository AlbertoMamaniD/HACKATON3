import {
  AlertTriangle,
  Bolt,
  Coins,
  Droplets,
  Leaf,
  RadioTower,
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
import { ErrorState, LoadingState } from "../components/LoadingState";
import { MetricCard } from "../components/MetricCard";

import { useApp } from "../app/AppProvider";
import { useLiveReadings } from "../hooks/useLiveReadings";
import { formatDateTime, formatNumber } from "../utils/format";

function clampPercent(value: number, min: number, max: number) {
  if (max <= min) return 0;
  const percent = ((value - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, percent));
}

function getPowerStatus(value: number | null) {
  if (value === null) {
    return {
      label: "Sin datos",
      barClass: "bg-slate-300",
      textClass: "text-slate-500",
    };
  }
  if (value >= 250) {
    return {
      label: "Consumo alto",
      barClass: "bg-amber-500",
      textClass: "text-amber-600",
    };
  }
  if (value >= 50) {
    return {
      label: "Consumo normal",
      barClass: "bg-blue-500",
      textClass: "text-blue-600",
    };
  }
  return {
    label: "Eficiente (Standby)",
    barClass: "bg-emerald-500",
    textClass: "text-emerald-600",
  };
}

function getWaterStatus(value: number | null) {
  if (value === null) {
    return {
      label: "Sin datos",
      barClass: "bg-slate-300",
      textClass: "text-slate-500",
    };
  }
  if (value >= 3.0) {
    return {
      label: "Flujo alto / Fuga",
      barClass: "bg-rose-500",
      textClass: "text-rose-600",
    };
  }
  if (value > 0.3) {
    return {
      label: "En uso",
      barClass: "bg-sky-500",
      textClass: "text-sky-600",
    };
  }
  return {
    label: "Cerrado / Sin fugas",
    barClass: "bg-emerald-500",
    textClass: "text-emerald-600",
  };
}

function getAirStatus(value: number | null) {
  if (value === null) {
    return {
      label: "Sin datos",
      barClass: "bg-slate-300",
      textClass: "text-slate-500",
    };
  }
  if (value >= 12) {
    return {
      label: "Malo / Alerta",
      barClass: "bg-rose-500",
      textClass: "text-rose-600",
    };
  }
  if (value >= 5) {
    return {
      label: "Regular",
      barClass: "bg-amber-500",
      textClass: "text-amber-600",
    };
  }
  return {
    label: "Bueno / Limpio",
    barClass: "bg-emerald-500",
    textClass: "text-emerald-600",
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
  status: { label: string; barClass: string; textClass: string };
  minLabel: string;
  maxLabel: string;
  subtitle: string;
}) {
  return (
    <article className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-800">{title}</p>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-slate-900">
            {value !== null ? formatNumber(value, 1) : "—"}
            {value !== null ? ` ${unit}` : ""}
          </p>
          <p className={`text-xs font-bold ${status.textClass}`}>
            {status.label}
          </p>
        </div>
      </div>
      <div className="mt-5">
        <div className="h-4 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${status.barClass}`}
            style={{ width: `${percent}%` }}
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
  const { rows, latest, online, loading, error } = useLiveReadings(240);

  const isLight =
    latest?.estado_luz?.toUpperCase() === "ILUMINADO" ||
    latest?.estado_luz?.toUpperCase() === "LUZ MEDIA";

  const power = latest?.potencia_w ?? (isLight ? 75 : 18);
  const waterFlow = latest?.flujo_agua_lpm ?? 0;
  const air = latest?.calidad_aire ?? null;

  const { alerts, config } = useApp();
  const activeAlerts = alerts.filter(
    (alert) => alert.status !== "closed",
  ).length;

  const powerStatus = getPowerStatus(power);
  const waterStatus = getWaterStatus(waterFlow);
  const airStatus = getAirStatus(air);

  if (error) {
    return (
      <ErrorState message="No se pudieron obtener las lecturas de Supabase." />
    );
  }

  if (loading && !latest) {
    return <LoadingState />;
  }

  const trend = rows.slice(-60).map((row) => {
    const rowLight =
      row.estado_luz?.toUpperCase() === "ILUMINADO" ||
      row.estado_luz?.toUpperCase() === "LUZ MEDIA";
    return {
      time: new Intl.DateTimeFormat("es-BO", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(row.created_at)),
      potencia: row.potencia_w ?? (rowLight ? 75 : 18),
      agua: row.flujo_agua_lpm ?? 0,
      aire: row.calidad_aire ?? 0,
      luzPct: row.luz_pct ?? 0,
    };
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Monitoreo residencial inteligente</p>
        <h1 className="page-title mt-2">Dashboard EcoAhorro</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Telemetría en tiempo real recibida desde el ESP32: medición de
          energía, caudal de agua, gases contaminantes (MQ-135) e iluminación
          eficiente.
        </p>
      </header>

      {/* METRIC CARDS HEADER */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <MetricCard
          label="Potencia eléctrica"
          value={power !== null ? formatNumber(power, 0) : "—"}
          unit="W"
          hint="Consumo activo"
          icon={Bolt}
          tone="amber"
        />

        <MetricCard
          label="Caudal de agua"
          value={formatNumber(waterFlow, 1)}
          unit="L/min"
          hint={waterFlow > 0.3 ? "Flujo en curso" : "Grifo cerrado"}
          icon={Droplets}
          tone="blue"
        />

        <MetricCard
          label="Gases (MQ-135)"
          value={air !== null ? formatNumber(air, 1) : "—"}
          unit="%"
          hint="Variación respecto a línea base"
          icon={Wind}
          tone={air && air >= 12 ? "red" : undefined}
        />

        <MetricCard
          label="Alertas activas"
          value={activeAlerts}
          unit={activeAlerts === 1 ? "alerta" : "alertas"}
          hint="Requieren atención"
          icon={AlertTriangle}
          tone={activeAlerts > 0 ? "red" : undefined}
        />

        <MetricCard
          label="Estado del Nodo"
          value={online ? "En línea" : "Sin conexión"}
          unit=""
          hint={
            latest
              ? `Última lectura ${formatDateTime(latest.created_at)}`
              : "Esperando datos"
          }
          icon={online ? RadioTower : WifiOff}
          tone={online ? undefined : "amber"}
        />
      </section>

      {/* STAT BARS */}
      <section className="grid gap-4 lg:grid-cols-3">
        <StatBar
          title="Potencia eléctrica"
          value={power}
          unit="W"
          percent={clampPercent(power, 0, 400)}
          status={powerStatus}
          minLabel="0 W (Reposo)"
          maxLabel="400 W (Pico)"
          subtitle="Medición de carga instantánea"
        />

        <StatBar
          title="Flujo de agua"
          value={waterFlow}
          unit="L/min"
          percent={clampPercent(waterFlow, 0, 10)}
          status={waterStatus}
          minLabel="0 L/min"
          maxLabel="10 L/min"
          subtitle="Detección de flujo y fugas"
        />

        <StatBar
          title="Calidad del aire (MQ-135)"
          value={air}
          unit="%"
          percent={air !== null ? clampPercent(air, 0, 20) : 0}
          status={airStatus}
          minLabel="0 % (Limpio)"
          maxLabel="20 % (Crítico)"
          subtitle="Concentración de gases y humos"
        />
      </section>

      {/* GRÁFICOS EN TIEMPO REAL */}
      <section className="grid gap-6 lg:grid-cols-2">
        <ChartFrame
          title="Tendencia de Energía y Flujo de Agua"
          description="Evolución de potencia (W) y caudal (L/min) en tiempo real"
          empty={trend.length === 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={trend}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPotencia" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="colorAgua" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" stroke="#f59e0b" unit=" W" />
              <YAxis yAxisId="right" orientation="right" stroke="#0284c7" unit=" L/m" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "12px",
                  boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
                }}
              />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="potencia"
                name="Potencia (W)"
                stroke="#f59e0b"
                fillOpacity={1}
                fill="url(#colorPotencia)"
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="agua"
                name="Agua (L/min)"
                stroke="#0284c7"
                fillOpacity={1}
                fill="url(#colorAgua)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartFrame>

        <ChartFrame
          title="Monitoreo de Gases MQ-135 e Iluminación"
          description="Variación de calidad de aire (%) y porcentaje de luz recibida"
          empty={trend.length === 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trend}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "12px",
                  boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="aire"
                name="Gases MQ-135 (%)"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="luzPct"
                name="Nivel Luz (%)"
                stroke="#6366f1"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartFrame>
      </section>

      {/* BANNER DE SOSTENIBILIDAD */}
      <section className="panel p-5 sm:p-6 bg-gradient-to-r from-emerald-950 via-forest-900 to-slate-900 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="eyebrow text-emerald-300">Sostenibilidad y Ahorro</span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                <Leaf className="h-3 w-3" /> Impacto ecológico
              </span>
            </div>
            <h2 className="text-xl font-bold mt-2">
              Balance de Conservación Residencial
            </h2>
            <p className="text-sm text-emerald-100/80 mt-1 max-w-xl">
              Monitoreo continuo de eficiencia eléctrica e hídrica para mitigar la huella de carbono y optimizar los costos del hogar.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="rounded-xl bg-white/10 p-3.5 border border-white/15 backdrop-blur">
              <div className="flex items-center gap-1 text-xs font-bold text-amber-300">
                <Coins className="h-3.5 w-3.5" /> Tarifa eléctrica
              </div>
              <p className="text-lg font-black text-white mt-1">
                Bs {config.electricityTariffBs.toFixed(2)} / kWh
              </p>
            </div>

            <div className="rounded-xl bg-white/10 p-3.5 border border-white/15 backdrop-blur">
              <div className="flex items-center gap-1 text-xs font-bold text-sky-300">
                <Droplets className="h-3.5 w-3.5" /> Tarifa de agua
              </div>
              <p className="text-lg font-black text-white mt-1">
                Bs {config.waterTariffBsPerM3.toFixed(2)} / m³
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-emerald-200/70">
          <span>Factor de emisión: {config.emissionFactorKgPerKwh} kg CO₂/kWh</span>
          <span>Sincronización en tiempo real</span>
        </div>
      </section>

      {/* PANEL DE ILUMINACIÓN RESPONSIVO */}
      <LightingPanel />
    </div>
  );
}
