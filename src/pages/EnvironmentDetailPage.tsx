import { useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Bolt,
  Clock3,
  Droplets,
  Lightbulb,
  RadioTower,
  Wind,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link, useParams } from "react-router-dom";

import { useApp } from "../app/AppProvider";
import { ChartFrame } from "../components/ChartFrame";
import { ErrorState, LoadingState } from "../components/LoadingState";
import { SourceBadge } from "../components/SourceBadge";
import { MetricCard } from "../components/MetricCard";
import { StatusBadge } from "../components/StatusBadge";
import { useEnvironmentData } from "../hooks/useEcoData";
import { formatDateTime, formatNumber } from "../utils/format";

export function EnvironmentDetailPage() {
  const { environmentId } = useParams();
  const { data, notFound, error } = useEnvironmentData(environmentId);
  const { alerts, config } = useApp();

  const [period, setPeriod] = useState<"today" | "7" | "30">("7");

  const filteredHistory = useMemo(() => {
    if (!data || !data.history.length) return [];

    const now = Date.now();
    let cutoffMs: number;

    if (period === "today") {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      cutoffMs = startOfToday.getTime();
    } else if (period === "7") {
      cutoffMs = now - 7 * 24 * 60 * 60 * 1000;
    } else {
      cutoffMs = now - 30 * 24 * 60 * 60 * 1000;
    }

    const filtered = data.history.filter((item) => {
      if (!item.recordedAt) return false;
      const time = new Date(item.recordedAt).getTime();
      return !Number.isNaN(time) && time >= cutoffMs;
    });

    return filtered;
  }, [data, period]);

  if (notFound) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="max-w-lg text-center">
          <p className="eyebrow">Ambiente no encontrado</p>
          <h1 className="page-title mt-2">No existen datos para esta ruta</h1>
          <p className="mt-3 text-slate-600">
            Comprueba el ambiente o regresa al dashboard principal.
          </p>
          <Link to="/dashboard" className="button-primary mt-6">
            <ArrowLeft className="h-4 w-4" /> Volver al dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState message="No se pudo obtener la información del ambiente." />
    );
  }

  if (!data) {
    return <LoadingState />;
  }

  const { environment, snapshot } = data;

  const environmentAlerts = alerts.filter(
    (alert) => alert.environmentId === environment.id,
  );
  const activeEnvironmentAlerts = environmentAlerts.filter(
    (alert) => alert.status !== "closed",
  );

  const chartData = filteredHistory.map((item) => ({
    time: new Intl.DateTimeFormat("es-BO", {
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(item.recordedAt)),
    potencia: item.powerWatts,
    agua: item.waterFlowLpm,
    aire: item.airChangePercent,
  }));

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm font-bold text-forest-700 hover:underline"
        to="/dashboard"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al dashboard
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Detalle de la zona del hogar</p>
          <h1 className="page-title mt-2">{environment.name}</h1>
          <p className="mt-2 text-slate-600">
            {environment.type}
            {environment.occupancyCapacity
              ? ` · Capacidad ${environment.occupancyCapacity} personas`
              : ""}
          </p>
        </div>
        <StatusBadge
          status={environment.status}
          className="self-start sm:self-auto"
        />
      </header>

      {/* METRICS */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Potencia eléctrica"
          value={snapshot.nodeOnline ? formatNumber(snapshot.powerWatts, 0) : "—"}
          unit="W"
          hint="Consumo activo"
          icon={Bolt}
          tone="amber"
          badge={<SourceBadge source="simulado" />}
        />

        <MetricCard
          label="Caudal de agua"
          value={snapshot.nodeOnline ? formatNumber(snapshot.waterFlowLpm, 1) : "—"}
          unit="L/min"
          hint="Flujo instantáneo"
          icon={Droplets}
          tone="blue"
          badge={<SourceBadge source="simulado" />}
        />

        <MetricCard
          label="Gases MQ-135"
          value={snapshot.nodeOnline ? `${formatNumber(snapshot.airChangePercent, 1)}%` : "—"}
          unit=""
          hint="Variación respecto a línea base"
          icon={Wind}
          tone={snapshot.airChangePercent >= 12 ? "red" : undefined}
          badge={<SourceBadge source="sensor" />}
        />

        <MetricCard
          label="Alertas activas"
          value={activeEnvironmentAlerts.length}
          unit="alertas"
          hint="Requieren seguimiento"
          icon={Activity}
          tone={activeEnvironmentAlerts.length > 0 ? "red" : undefined}
        />
      </section>

      {/* CHART & SIDEBAR */}
      <section className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Historial de telemetría</h2>
              <p className="text-xs text-slate-500">
                Evolución de consumo eléctrico (W) y flujo de agua (L/min)
              </p>
            </div>

            <div
              className="flex rounded-xl border border-slate-200 bg-white p-1"
              role="group"
              aria-label="Periodo del historial"
            >
              {[
                ["today", "Hoy"],
                ["7", "7 días"],
                ["30", "30 días"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={`rounded-lg px-3 py-2 text-xs font-bold ${
                    period === value
                      ? "bg-forest-600 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                  onClick={() => setPeriod(value as typeof period)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <ChartFrame
            title="Consumo de Energía y Agua"
            description="Historial registrado por el concentrador EcoAhorro"
            empty={chartData.length === 0}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" fontSize={10} minTickGap={28} />
                <YAxis yAxisId="left" stroke="#f59e0b" unit=" W" />
                <YAxis yAxisId="right" orientation="right" stroke="#0284c7" unit=" L/m" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  isAnimationActive={false}
                  dataKey="potencia"
                  name="Potencia (W) · simulado"
                  stroke="#f59e0b"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  isAnimationActive={false}
                  dataKey="agua"
                  name="Agua (L/min) · simulado"
                  stroke="#0284c7"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartFrame>
        </div>

        <aside className="space-y-4">
          <article className="panel p-5">
            <div className="flex items-center gap-2">
              <RadioTower className="h-5 w-5 text-forest-700" />
              <h3 className="font-bold">Estado del ambiente</h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Nodo {snapshot.nodeOnline ? "en línea y transmitiendo" : "sin conexión reciente"}.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {snapshot.recordedAt ? `Última sincronización: ${formatDateTime(snapshot.recordedAt)}` : "Esperando datos"}
            </p>
          </article>

          <article className="panel p-5">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-600" />
              <h3 className="font-bold">Iluminación (KY-018)</h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Estado actual: <strong>{snapshot.lightOn ? "Luz Encendida" : "Apagada / Oscuro"}</strong>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Nivel analógico: {snapshot.lightRaw}
            </p>
          </article>
        </aside>
      </section>
    </div>
  );
}
