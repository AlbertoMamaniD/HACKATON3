import {
  AlertTriangle,
  Bolt,
  Coins,
  Droplets,
  RadioTower,
  WifiOff,
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartFrame } from "../components/ChartFrame";
import { LightingPanel } from "../components/LightingPanel";
import { ErrorState, LoadingState } from "../components/LoadingState";
import { MetricCard } from "../components/MetricCard";
import { SourceBadge, type MetricSource } from "../components/SourceBadge";

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

function StatBar({
  title,
  value,
  unit,
  percent,
  status,
  minLabel,
  maxLabel,
  subtitle,
  source,
}: {
  title: string;
  value: number | null;
  unit: string;
  percent: number;
  status: { label: string; barClass: string; textClass: string };
  minLabel: string;
  maxLabel: string;
  subtitle: string;
  source: MetricSource;
}) {
  return (
    <article className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-sm font-bold text-slate-800">{title}</p>
            <SourceBadge source={source} />
          </div>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="whitespace-nowrap text-2xl font-bold text-slate-900">
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

  // Sin lecturas no se muestra ningún valor de relleno.
  const power = latest?.potencia_w ?? null;
  const waterFlow = latest?.flujo_agua_lpm ?? null;

  const { alerts, config } = useApp();
  const activeAlerts = alerts.filter(
    (alert) => alert.status === "new",
  ).length;

  const powerStatus = getPowerStatus(power);
  const waterStatus = getWaterStatus(waterFlow);

  if (error) {
    return (
      <ErrorState message="No se pudieron obtener las lecturas de Supabase." />
    );
  }

  if (loading && !latest) {
    return <LoadingState />;
  }

  const trend = rows.slice(-60).map((row) => {
    return {
      time: new Intl.DateTimeFormat("es-BO", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(row.created_at)),
      potencia: row.potencia_w ?? 0,
      agua: row.flujo_agua_lpm ?? 0,
    };
  });

  const powerSource: MetricSource = latest?.fuente_metricas ?? "simulado";

  const tooltipStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: "12px",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">El monitor de consumo de tu casa</p>
        <h1 className="page-title mt-2">Dashboard EcoAhorro</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Monitoreo en tiempo real conectado a la base de datos. Potencia y
          agua: datos simulados para la demostración; luces encendidas:
          sensor del ESP32.
        </p>
      </header>

      {/* LUZ Y AGUA: INDICADORES PRINCIPALES */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Potencia eléctrica"
          value={power !== null ? formatNumber(power, 0) : "—"}
          unit="W"
          hint="Consumo de luz en este momento"
          icon={Bolt}
          tone="amber"
          badge={<SourceBadge source={powerSource} />}
        />

        <MetricCard
          label="Caudal de agua"
          value={waterFlow !== null ? formatNumber(waterFlow, 1) : "—"}
          unit="L/min"
          hint={
            waterFlow === null
              ? "Esperando datos"
              : waterFlow > 0.3
                ? "Flujo en curso"
                : "Grifo cerrado"
          }
          icon={Droplets}
          tone="blue"
          badge={<SourceBadge source={powerSource} />}
        />

        <MetricCard
          label="Alertas activas"
          value={activeAlerts}
          unit={activeAlerts === 1 ? "alerta" : "alertas"}
          hint={activeAlerts > 0 ? "Requieren atención" : "Sin pendientes"}
          icon={AlertTriangle}
          tone={activeAlerts > 0 ? "red" : undefined}
        />

        <MetricCard
          label="Estado del nodo"
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

      <section className="grid gap-4 md:grid-cols-2">
        <StatBar
          title="Potencia eléctrica"
          value={power}
          unit="W"
          percent={power !== null ? clampPercent(power, 0, 400) : 0}
          status={powerStatus}
          minLabel="0 W (Reposo)"
          maxLabel="400 W (Pico)"
          subtitle="Carga instantánea del hogar"
          source={powerSource}
        />

        <StatBar
          title="Flujo de agua"
          value={waterFlow}
          unit="L/min"
          percent={waterFlow !== null ? clampPercent(waterFlow, 0, 10) : 0}
          status={waterStatus}
          minLabel="0 L/min"
          maxLabel="10 L/min"
          subtitle="Detección de flujo y fugas"
          source={powerSource}
        />
      </section>

      <ChartFrame
        title="Historial de luz y agua"
        description="Potencia (W) y caudal (L/min) de las últimas lecturas · datos simulados"
        empty={trend.length === 0}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={trend}
            margin={{ top: 10, right: 0, left: -12, bottom: 0 }}
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
            <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} minTickGap={24} />
            <YAxis yAxisId="left" stroke="#f59e0b" unit=" W" tick={{ fontSize: 11 }} width={56} />
            <YAxis yAxisId="right" orientation="right" stroke="#0284c7" unit=" L/m" tick={{ fontSize: 11 }} width={56} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="potencia"
              name="Potencia (W) · simulado"
              stroke="#f59e0b"
              fillOpacity={1}
              fill="url(#colorPotencia)"
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="agua"
              name="Agua (L/min) · simulado"
              stroke="#0284c7"
              fillOpacity={1}
              fill="url(#colorAgua)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartFrame>

      {/* AHORRO Y TARIFAS */}
      <section className="panel p-5 sm:p-6 bg-gradient-to-r from-emerald-950 via-forest-900 to-slate-900 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow text-emerald-300">Control del gasto</span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-500/20 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                <Coins className="h-3 w-3" /> Ahorro en Bs
              </span>
            </div>
            <h2 className="text-xl font-bold mt-2">
              Tarifas usadas para estimar tu recibo
            </h2>
            <p className="text-sm text-emerald-100/80 mt-1 max-w-xl">
              EcoAhorro convierte el consumo de luz y agua en bolivianos para
              que veas el gasto durante el mes, no solo al llegar el recibo.
              Puedes ajustar las tarifas en Configuración.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 shrink-0 min-[400px]:grid-cols-2">
            <div className="rounded-xl bg-white/10 p-3.5 border border-white/15 backdrop-blur">
              <div className="flex items-center gap-1 text-xs font-bold text-amber-300">
                <Bolt className="h-3.5 w-3.5" /> Tarifa eléctrica
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

        <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-1 text-xs text-emerald-200/70 sm:flex-row sm:items-center sm:justify-between">
          <span>Tarifas editables en Configuración</span>
          <span>Consulta a la base de datos cada 5 s</span>
        </div>
      </section>

      {/* LUCES ENCENDIDAS: SENSOR REAL DEL ESP32 */}
      <LightingPanel />
    </div>
  );
}
