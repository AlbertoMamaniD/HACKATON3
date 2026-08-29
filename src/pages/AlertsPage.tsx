import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Droplets,
  Lightbulb,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Thermometer,
  Wind,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useApp } from "../app/AppProvider";
import type { AlertStatus } from "../domain/types";
import { useLiveReadings } from "../hooks/useLiveReadings";

interface CurrentAlert {
  id: string;
  title: string;
  description: string;
  value: string;
  icon: LucideIcon;
  tone: "red" | "amber";
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

  if (latest?.alerta_temp) {
    currentAlerts.push({
      id: "temp",
      title: "Temperatura elevada",
      description:
        "La temperatura superó el umbral configurado de 30 °C. Revisa ventilación o climatización.",
      value: `${latest.temperatura?.toFixed(1) ?? "—"} °C`,
      icon: Thermometer,
      tone: "red",
    });
  }

  if (latest?.alerta_humedad) {
    currentAlerts.push({
      id: "humedad",
      title: "Humedad elevada",
      description:
        "La humedad superó el umbral configurado de 70 %. Revisa las condiciones del ambiente.",
      value: `${latest.humedad?.toFixed(1) ?? "—"} %`,
      icon: Droplets,
      tone: "amber",
    });
  }

  if (latest?.alerta_aire) {
    currentAlerts.push({
      id: "aire",
      title: "Cambio importante en el aire",
      description:
        "El MQ-135 detectó una variación elevada respecto a su línea base. Esta medición no representa ppm de CO₂.",
      value: `${latest.calidad_aire?.toFixed(1) ?? "—"} %`,
      icon: Wind,
      tone: "red",
    });
  }

  if (latest?.alerta_luz) {
    currentAlerts.push({
      id: "luz",
      title: "Iluminación prolongada",
      description:
        "La iluminación se mantuvo activa durante más tiempo del permitido. Revisa si el ambiente continúa en uso.",
      value: formatDuration(latest.segundos_luz_continua ?? 0),
      icon: Lightbulb,
      tone: "amber",
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
        row.alerta_temp ||
        row.alerta_humedad ||
        row.alerta_aire ||
        row.alerta_luz,
    )
    .slice(-20)
    .reverse();

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Monitoreo de condiciones</p>

        <h1 className="page-title mt-2">Alertas EcoAhorro</h1>

        <p className="mt-3 max-w-3xl text-slate-600">
          Las alertas se generan a partir de los valores reales enviados por el
          ESP32 a Supabase. Puedes reconocerlas, cerrarlas o reabrirlas para
          gestionar el estado operativo del sistema.
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
      {currentAlerts.length === 0 ? (
        <section className="panel p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-600" />
            <div>
              <h2 className="font-bold">Lectura instantánea normal</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                La última lectura recibida del ESP32 se encuentra dentro de los
                umbrales seguros configurados.
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

                <h2 className="mt-4 font-bold">{alert.title}</h2>

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
                    ? "bg-white text-forest-800 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                onClick={() => setFilter(key as typeof filter)}
              >
                {label}
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    filter === key
                      ? "bg-forest-100 text-forest-800"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {visibleAlerts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            No hay alertas que coincidan con el filtro seleccionado.
          </div>
        ) : (
          <div className="grid gap-4">
            {visibleAlerts.map((alert) => {
              const isClosed = alert.status === "closed";
              const isAck = alert.status === "acknowledged";
              const isNew = alert.status === "new";

              return (
                <article
                  key={alert.id}
                  className={`rounded-2xl border p-5 transition ${
                    isClosed
                      ? "border-slate-200 bg-slate-50/70 opacity-80"
                      : isAck
                        ? "border-amber-200 bg-amber-50/40"
                        : "border-red-200 bg-red-50/40"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            isNew
                              ? "bg-red-100 text-red-800"
                              : isAck
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {isNew && <AlertCircle className="h-3.5 w-3.5" />}
                          {isAck && <Clock className="h-3.5 w-3.5" />}
                          {isClosed && <ShieldCheck className="h-3.5 w-3.5" />}
                          {isNew
                            ? "Nueva"
                            : isAck
                              ? "Reconocida"
                              : "Cerrada"}
                        </span>

                        <span className="text-xs text-slate-500">
                          {new Intl.DateTimeFormat("es-BO", {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(new Date(alert.openedAt))}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 pt-1">
                        {alert.title}
                      </h3>

                      <p className="text-sm text-slate-600 leading-6">
                        {alert.description}
                      </p>

                      {alert.recommendation && (
                        <p className="text-xs font-medium text-emerald-800 bg-emerald-50 rounded-lg p-2.5 mt-2 border border-emerald-100">
                          💡 <strong>Recomendación:</strong> {alert.recommendation}
                        </p>
                      )}
                    </div>

                    {/* Botones de acción operativos */}
                    <div className="flex sm:flex-col gap-2 shrink-0 self-end sm:self-start">
                      {isNew && (
                        <>
                          <button
                            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-900 transition hover:bg-amber-200"
                            onClick={() =>
                              setAlertStatus(alert.id, "acknowledged")
                            }
                          >
                            <ShieldAlert className="h-3.5 w-3.5" />
                            Reconocer
                          </button>

                          <button
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                            onClick={() => setAlertStatus(alert.id, "closed")}
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Cerrar
                          </button>
                        </>
                      )}

                      {isAck && (
                        <>
                          <button
                            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-900 transition hover:bg-emerald-200"
                            onClick={() => setAlertStatus(alert.id, "closed")}
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Cerrar
                          </button>

                          <button
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                            onClick={() => setAlertStatus(alert.id, "new")}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reabrir
                          </button>
                        </>
                      )}

                      {isClosed && (
                        <button
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                          onClick={() => setAlertStatus(alert.id, "new")}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Reabrir
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Historial reciente de lecturas con banderas activas */}
      <section className="panel overflow-hidden">
        <div className="border-b border-slate-200 p-5">
          <h2 className="font-bold">Historial de lecturas con alertas</h2>
          <p className="mt-1 text-sm text-slate-500">
            Registros donde al menos una bandera de sensor estuvo activa.
          </p>
        </div>

        {recentAlertRows.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            Todavía no existen registros recientes con alertas.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3">Temperatura</th>
                  <th className="px-5 py-3">Humedad</th>
                  <th className="px-5 py-3">Aire</th>
                  <th className="px-5 py-3">Luz</th>
                  <th className="px-5 py-3">Banderas</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {recentAlertRows.map((row) => {
                  const labels = [
                    row.alerta_temp ? "Temperatura" : null,
                    row.alerta_humedad ? "Humedad" : null,
                    row.alerta_aire ? "Aire" : null,
                    row.alerta_luz ? "Luz" : null,
                  ].filter(Boolean);

                  return (
                    <tr key={row.id}>
                      <td className="px-5 py-4">
                        {new Intl.DateTimeFormat("es-BO", {
                          dateStyle: "short",
                          timeStyle: "medium",
                        }).format(new Date(row.created_at))}
                      </td>

                      <td className="px-5 py-4">
                        {row.temperatura?.toFixed(1) ?? "—"} °C
                      </td>

                      <td className="px-5 py-4">
                        {row.humedad?.toFixed(1) ?? "—"} %
                      </td>

                      <td className="px-5 py-4">
                        {row.calidad_aire?.toFixed(1) ?? "—"} %
                      </td>

                      <td className="px-5 py-4">
                        {row.estado_luz ?? "—"}
                      </td>

                      <td className="px-5 py-4 font-semibold text-red-700">
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

      <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          El MQ-135 se interpreta como cambio relativo respecto a una línea base.
          No representa ppm de CO₂ ni una medición certificada de calidad del aire.
        </p>
      </div>
    </div>
  );
}
