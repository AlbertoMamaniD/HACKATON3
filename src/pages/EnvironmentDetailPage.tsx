import {
  useMemo,
  useState,
} from "react";
import {
  Activity,
  ArrowLeft,
  Clock3,
  Droplets,
  RadioTower,
  Thermometer,
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
import {
  Link,
  useParams,
} from "react-router-dom";

import { useApp } from "../app/AppProvider";
import { ChartFrame } from "../components/ChartFrame";
import {
  ErrorState,
  LoadingState,
} from "../components/LoadingState";
import { MetricCard } from "../components/MetricCard";
import { StatusBadge } from "../components/StatusBadge";
import { useEnvironmentData } from "../hooks/useEcoData";
import {
  formatDateTime,
} from "../utils/format";

export function EnvironmentDetailPage() {
  const { environmentId } = useParams();

  const {
    data,
    notFound,
    error,
  } = useEnvironmentData(environmentId);

  const { alerts } = useApp();

  const [period, setPeriod] = useState<
    "today" | "7" | "30"
  >("7");

  const filteredHistory = useMemo(() => {
    if (!data || !data.history.length) {
      return [];
    }

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

    return filtered.length > 0 ? filtered : data.history;
  }, [data, period]);

  if (notFound) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="max-w-lg text-center">
          <p className="eyebrow">
            Ambiente no encontrado
          </p>

          <h1 className="page-title mt-2">
            No existen datos para esta ruta
          </h1>

          <p className="mt-3 text-slate-600">
            Comprueba el ambiente o regresa
            al listado del dashboard.
          </p>

          <Link
            to="/dashboard"
            className="button-primary mt-6"
          >
            <ArrowLeft className="h-4 w-4" />

            Volver al dashboard
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

  const {
    environment,
    snapshot,
  } = data;

  const environmentAlerts = alerts.filter(
    (alert) =>
      alert.environmentId ===
      environment.id,
  );

  const activeEnvironmentAlerts =
    environmentAlerts.filter(
      (alert) =>
        alert.status !== "closed",
    );

  const chartData =
    filteredHistory.map((item) => ({
      time: new Intl.DateTimeFormat(
        "es-BO",
        {
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        },
      ).format(
        new Date(item.recordedAt),
      ),

      temperatura:
        item.temperatureCelsius,

      humedad:
        item.humidityPercent,
    }));

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm font-bold text-forest-700 hover:underline"
        to="/dashboard"
      >
        <ArrowLeft className="h-4 w-4" />

        Todos los ambientes
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">
            Detalle del ambiente
          </p>

          <h1 className="page-title mt-2">
            {environment.name}
          </h1>

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

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Temperatura"
          value={
            snapshot.nodeOnline
              ? snapshot.temperatureCelsius
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
            snapshot.nodeOnline
              ? snapshot.humidityPercent
              : "—"
          }
          unit="%"
          hint="Humedad relativa · DHT22"
          icon={Droplets}
          tone="blue"
        />

        <MetricCard
          label="Cambio del aire"
          value={
            snapshot.nodeOnline
              ? snapshot.airChangePercent
              : "—"
          }
          unit="%"
          hint="Variación respecto a la línea base del MQ-135"
          icon={Wind}
        />

        <MetricCard
          label="Alertas activas"
          value={
            activeEnvironmentAlerts.length
          }
          unit="alertas"
          hint="Condiciones que requieren revisión"
          icon={Activity}
          tone={
            activeEnvironmentAlerts.length >
            0
              ? "red"
              : undefined
          }
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">
                Historial de mediciones
              </h2>

              <p className="text-xs text-slate-500">
                Temperatura y humedad
                registradas por EcoAhorro
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
              ].map(
                ([value, label]) => (
                  <button
                    key={value}
                    className={`rounded-lg px-3 py-2 text-xs font-bold ${
                      period === value
                        ? "bg-forest-600 text-white"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                    onClick={() =>
                      setPeriod(
                        value as typeof period,
                      )
                    }
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
          </div>

          <ChartFrame
            title="Temperatura y humedad"
            description="Historial disponible de las lecturas ambientales"
            empty={
              chartData.length === 0
            }
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="time"
                  fontSize={10}
                  minTickGap={28}
                />

                <YAxis fontSize={11} />

                <Tooltip />

                <Legend />

                <Line
                  isAnimationActive={false}
                  dataKey="temperatura"
                  name="Temperatura °C"
                  stroke="#e5a30f"
                  dot={false}
                  strokeWidth={2}
                />

                <Line
                  isAnimationActive={false}
                  dataKey="humedad"
                  name="Humedad %"
                  stroke="#2a84c6"
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
              <RadioTower
                className={
                  snapshot.nodeOnline
                    ? "text-forest-600"
                    : "text-slate-500"
                }
              />

              <h2 className="font-bold">
                Nodo ESP32
              </h2>
            </div>

            <p className="mt-3 text-sm font-semibold">
              {snapshot.nodeOnline
                ? "ESP32 conectado"
                : "ESP32 sin conexión"}
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Última actualización:{" "}
              {formatDateTime(
                snapshot.recordedAt,
              )}
            </p>
          </article>

          <article className="panel p-5">
            <h2 className="font-bold">
              Sensores del nodo
            </h2>

            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="font-bold text-slate-700">
                  DHT22
                </dt>

                <dd className="text-slate-500">
                  Temperatura y humedad
                </dd>
              </div>

              <div>
                <dt className="font-bold text-slate-700">
                  KY-018
                </dt>

                <dd className="text-slate-500">
                  Nivel de iluminación
                </dd>
              </div>

              <div>
                <dt className="font-bold text-slate-700">
                  MQ-135
                </dt>

                <dd className="text-slate-500">
                  Variación relativa de
                  calidad del aire
                </dd>
              </div>
            </dl>
          </article>
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="panel p-5">
          <h2 className="flex items-center gap-2 font-bold">
            <Activity className="h-5 w-5 text-danger-500" />

            Alertas del ambiente
          </h2>

          {environmentAlerts.length ? (
            <ul className="mt-4 space-y-3">
              {environmentAlerts.map(
                (alert) => (
                  <li
                    key={alert.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold">
                        {alert.title}
                      </p>

                      <span className="text-xs font-bold uppercase text-slate-500">
                        {alert.status === "new"
                          ? "Nueva"
                          : alert.status ===
                              "acknowledged"
                            ? "Reconocida"
                            : "Cerrada"}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-600">
                      {
                        alert.description
                      }
                    </p>
                  </li>
                ),
              )}
            </ul>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
              No hay alertas para este
              ambiente.
            </p>
          )}
        </article>

        <article className="panel p-5">
          <h2 className="flex items-center gap-2 font-bold">
            <Clock3 className="h-5 w-5 text-forest-600" />

            Recomendaciones
          </h2>

          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li>
              • Revisar ventilación si la
              temperatura o humedad se
              mantienen elevadas.
            </li>

            <li>
              • Verificar el nivel de
              iluminación según el uso del
              ambiente.
            </li>

            <li>
              • Revisar el ambiente cuando
              el MQ-135 detecte un cambio
              importante respecto a su
              línea base.
            </li>

            <li>
              • El MQ-135 no representa una
              medición certificada de ppm
              de CO₂.
            </li>
          </ul>
        </article>
      </section>
    </div>
  );
}
