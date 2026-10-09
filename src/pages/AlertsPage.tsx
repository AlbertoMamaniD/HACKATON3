import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Bolt,
  CheckCircle2,
  Clock,
  Droplets,
  Lightbulb,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useApp } from "../app/AppProvider";
import { LIVE_ALERT_THRESHOLDS } from "../domain/config";
import { SourceBadge, type MetricSource } from "../components/SourceBadge";
import type { AlertStatus } from "../domain/types";
import { useLiveReadings } from "../hooks/useLiveReadings";

interface CurrentAlert {
  id: string;
  title: string;
  description: string;
  value: string;
  icon: LucideIcon;
  tone: "red" | "amber";
  source: MetricSource;
}

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  if (minutes > 0) {
    return `${minutes} min ${rest} s`;
  }

  return `${rest} s`;
}

export function AlertsPage() {
  const { alerts, setAlertStatus } = useApp();
  const [filter, setFilter] = useState<"all" | AlertStatus>("all");

  const { latest, rows, online, loading, error } = useLiveReadings(120);

  if (loading && !latest && alerts.length === 0) {
    return (
      <div className="panel p-6 text-sm text-slate-500">
        Cargando alertas...
      </div>
    );
  }

  if (error && alerts.length === 0) {
    return (
      <div className="panel border-red-200 bg-red-50 p-6">
        <p className="font-bold text-red-700">
          No se pudieron consultar las alertas de Supabase.
        </p>
        <p className="mt-1 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  const currentAlerts: CurrentAlert[] = [];
  const metricsSource: MetricSource = latest?.fuente_metricas ?? "simulado";
  // Sin conexión la última lectura es antigua: no se evalúan alertas instantáneas.
  const reading = online ? latest : null;

  // alerta_agua: caudal anormal (ver LiveReadingsContext); el uso normal de agua no es una fuga.
  const isWaterAlert = Boolean(reading?.alerta_agua);

  if (isWaterAlert) {
    currentAlerts.push({
      id: "agua",
      title: "Posible fuga o grifo abierto",
      description:
        "Se detecta un caudal continuo de agua. Revisa grifos, tuberías o artefactos sanitarios.",
      value: `${reading?.flujo_agua_lpm?.toFixed(1) ?? "—"} L/min`,
      icon: Droplets,
      tone: "red",
      source: metricsSource,
    });
  }

  const isEnergyAlert =
    reading?.potencia_w !== undefined &&
    reading?.potencia_w !== null &&
    reading.potencia_w > LIVE_ALERT_THRESHOLDS.powerW;

  if (isEnergyAlert) {
    currentAlerts.push({
      id: "energia",
      title: "Consumo eléctrico elevado",
      description:
        "La potencia eléctrica instantánea superó el umbral de funcionamiento habitual.",
      value: `${reading?.potencia_w?.toFixed(0)} W`,
      icon: Bolt,
      tone: "amber",
      source: metricsSource,
    });
  }

  if (reading?.alerta_luz) {
    currentAlerts.push({
      id: "luz",
      title: "Luces encendidas por mucho tiempo",
      description:
        "Las luces siguen encendidas más tiempo del habitual. Si nadie las usa, apágalas para no pagar de más en el recibo de luz.",
      value: formatDuration(reading.segundos_luz_continua ?? 0),
      icon: Lightbulb,
      tone: "amber",
      source: "sensor",
    });
  }

  const visibleAlerts =
    filter === "all"
      ? alerts
      : alerts.filter((alert) => alert.status === filter);

  const countNew = alerts.filter((a) => a.status === "new").length;
  const countAck = alerts.filter((a) => a.status === "acknowledged").length;
  const countClosed = alerts.filter((a) => a.status === "closed").length;

  const recentAlertRows = rows
    .filter(
      (row) =>
        row.alerta_agua ||
        row.alerta_luz ||
        (row.potencia_w && row.potencia_w > LIVE_ALERT_THRESHOLDS.powerW),
    )
    .slice(-20)
    .reverse();

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Monitoreo de condiciones</p>

        <h1 className="page-title mt-2">Alertas EcoAhorro</h1>

        <p className="mt-3 max-w-3xl text-slate-600">
          Avisos ante consumo anormal de luz o agua, antes de que te
          sorprenda el recibo. Potencia y agua: datos simulados para la
          demostración; luces encendidas: sensor del ESP32.
        </p>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Para recibirlas en el celular, pulsa «Activar avisos». En esta versión
          llegan como notificaciones del navegador mientras la app está abierta.
          Las alertas de agua y potencia salen de datos simulados, que incluyen un
          episodio de caudal anormal y otro de potencia alta cada 10 minutos para
          la demostración.
        </p>
      </header>

      <div
        className={`rounded-2xl border p-4 text-sm ${
          online
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-slate-200 bg-slate-50 text-slate-700"
        }`}
      >
        <strong>
          {online ? "ESP32 conectado" : "ESP32 sin conexión"}
        </strong>

        {latest && (
          <span className="ml-2">
            · Última lectura{" "}
            {new Intl.DateTimeFormat("es-BO", {
              dateStyle: "short",
              timeStyle: "medium",
            }).format(new Date(latest.created_at))}
          </span>
        )}
      </div>

      {/* Alertas instantáneas de la última lectura */}
      {!online ? (
        <section className="panel p-6">
          <div className="flex items-start gap-3">
            <WifiOff className="mt-0.5 h-6 w-6 text-slate-500" />
            <div>
              <h2 className="font-bold">Sin lecturas recientes</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                El ESP32 no está enviando datos, así que no hay alertas
                instantáneas. Se reanudan solas cuando vuelva a transmitir.
              </p>
            </div>
          </div>
        </section>
      ) : currentAlerts.length === 0 ? (
        <section className="panel p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-600" />
            <div>
              <h2 className="font-bold">Lectura instantánea normal</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                La última lectura se encuentra dentro de los umbrales de
                luz y agua.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {currentAlerts.map((alert) => {
            const Icon = alert.icon;

            return (
              <article
                key={alert.id}
                className={`rounded-2xl border p-5 ${
                  alert.tone === "red"
                    ? "border-red-200 bg-red-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-xl ${
                      alert.tone === "red"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>

                  <span className="text-xl font-bold">{alert.value}</span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <h2 className="font-bold text-slate-900">{alert.title}</h2>
                  <SourceBadge source={alert.source} />
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {alert.description}
                </p>
              </article>
            );
          })}
        </section>
      )}

      {/* Gestión de Alertas con Filtros y Acciones */}
      <section className="panel p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold">Gestión de alertas del sistema</h2>
            <p className="text-sm text-slate-500">
              Control de reconocimiento y resolución de incidentes
            </p>
          </div>

          <div
            className="flex flex-wrap rounded-xl border border-slate-200 bg-slate-50 p-1"
            role="group"
            aria-label="Filtro de alertas"
          >
            {[
              { key: "all", label: "Todas", count: alerts.length },
              { key: "new", label: "Nuevas", count: countNew },
              { key: "acknowledged", label: "Reconocidas", count: countAck },
              { key: "closed", label: "Cerradas", count: countClosed },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  filter === key
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                onClick={() => setFilter(key as typeof filter)}
              >
                <span>{label}</span>
                <span className="rounded-full bg-slate-200/60 px-1.5 py-0.5 text-[10px]">
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {visibleAlerts.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">
            No hay alertas en esta categoría.
          </p>
        ) : (
          <div className="space-y-3">
            {visibleAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition ${
                  alert.status === "new"
                    ? "border-amber-300 bg-amber-50/40"
                    : alert.status === "acknowledged"
                      ? "border-blue-200 bg-blue-50/30"
                      : "border-slate-200 bg-slate-50/50 opacity-75"
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  {alert.severity === "critical" ? (
                    <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 truncate">
                        {alert.title}
                      </span>
                      <SourceBadge source={alert.source === "real" ? "sensor" : "simulado"} />
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          alert.status === "new"
                            ? "bg-amber-100 text-amber-800"
                            : alert.status === "acknowledged"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {alert.status === "new"
                          ? "Nueva"
                          : alert.status === "acknowledged"
                            ? "Reconocida"
                            : "Cerrada"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-5">
                      {alert.description}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Intl.DateTimeFormat("es-BO", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(alert.openedAt))}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {alert.status === "new" && (
                    <button
                      className="button-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                      onClick={() => setAlertStatus(alert.id, "acknowledged")}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" /> Reconocer
                    </button>
                  )}
                  {alert.status !== "closed" && (
                    <button
                      className="button-secondary text-xs px-3 py-1.5 flex items-center gap-1 text-slate-700 hover:text-red-700"
                      onClick={() => setAlertStatus(alert.id, "closed")}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Cerrar
                    </button>
                  )}
                  {alert.status === "closed" && (
                    <button
                      className="button-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                      onClick={() => setAlertStatus(alert.id, "new")}
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Reabrir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Historial reciente de lecturas con banderas activas */}
      <section className="panel overflow-hidden">
        <div className="border-b border-slate-200 p-5">
          <h2 className="font-bold">Historial de incidentes detectados</h2>
          <p className="mt-1 text-sm text-slate-500">
            Registros donde se activó alguna alerta de luz o agua.
          </p>
        </div>

        {recentAlertRows.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            No existen registros recientes con incidentes.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3">
                    <span className="flex items-center gap-1.5">Potencia <SourceBadge source={metricsSource} /></span>
                  </th>
                  <th className="px-5 py-3">
                    <span className="flex items-center gap-1.5">Agua <SourceBadge source={metricsSource} /></span>
                  </th>
                  <th className="px-5 py-3">
                    <span className="flex items-center gap-1.5">Luces <SourceBadge source="sensor" /></span>
                  </th>
                  <th className="min-w-[170px] px-5 py-3">Incidentes</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {recentAlertRows.map((row) => {
                  const labels = [
                    row.alerta_agua ? "Caudal anormal" : null,
                    row.alerta_luz ? "Luces encendidas" : null,
                    row.potencia_w && row.potencia_w > LIVE_ALERT_THRESHOLDS.powerW ? "Potencia alta" : null,
                  ].filter(Boolean);

                  return (
                    <tr key={row.id}>
                      <td className="whitespace-nowrap px-5 py-4">
                        {new Intl.DateTimeFormat("es-BO", {
                          dateStyle: "short",
                          timeStyle: "medium",
                        }).format(new Date(row.created_at))}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {row.potencia_w ?? 0} W
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {row.flujo_agua_lpm?.toFixed(1) ?? "0.0"} L/min
                      </td>

                      <td className="px-5 py-4">
                        {row.estado_luz ?? "—"}
                      </td>

                      <td className="px-5 py-4 font-bold text-red-700">
                        {labels.join(", ")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
