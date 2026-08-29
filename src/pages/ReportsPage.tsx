import {
  Droplets,
  FileText,
  Printer,
  RadioTower,
  Thermometer,
  TriangleAlert,
  Wind,
} from "lucide-react";

import { useApp } from "../app/AppProvider";
import {
  ErrorState,
  LoadingState,
} from "../components/LoadingState";
import { useDashboardData } from "../hooks/useEcoData";
import {
  formatDateTime,
  formatNumber,
} from "../utils/format";

function average(
  values: number[],
) {
  if (!values.length) {
    return 0;
  }

  return (
    values.reduce(
      (sum, value) => sum + value,
      0,
    ) / values.length
  );
}

function airQuality(
  value: number | null,
) {
  if (value === null) {
    return "Sin datos";
  }

  if (value >= 12) {
    return "Malo";
  }

  if (value >= 5) {
    return "Regular";
  }

  return "Bueno";
}

export function ReportsPage() {
  const { alerts } = useApp();

  const {
    data,
    error,
  } = useDashboardData();

  if (error) {
    return (
      <ErrorState message="No se pudieron obtener los datos para generar el reporte." />
    );
  }

  if (!data) {
    return <LoadingState />;
  }

  const active = alerts.filter(
    (alert) =>
      alert.status !== "closed",
  );

  const rows =
    data.environments.map(
      (environment, index) => {
        const snapshot =
          data.snapshots[index];

        return {
          environment,

          online:
            snapshot?.nodeOnline ??
            false,

          temperature:
            snapshot
              ?.temperatureCelsius ??
            null,

          humidity:
            snapshot
              ?.humidityPercent ??
            null,

          air:
            snapshot
              ?.airChangePercent ??
            null,

          recordedAt:
            snapshot?.recordedAt ??
            null,

          alerts: active.filter(
            (alert) =>
              alert.environmentId ===
              environment.id,
          ).length,
        };
      },
    );

  const onlineRows =
    rows.filter(
      (row) => row.online,
    );

  const temperatures =
    onlineRows
      .map(
        (row) =>
          row.temperature,
      )
      .filter(
        (value): value is number =>
          value !== null,
      );

  const humidities =
    onlineRows
      .map(
        (row) =>
          row.humidity,
      )
      .filter(
        (value): value is number =>
          value !== null,
      );

  const airValues =
    onlineRows
      .map(
        (row) => row.air,
      )
      .filter(
        (value): value is number =>
          value !== null,
      );

  const avgTemperature =
    average(temperatures);

  const avgHumidity =
    average(humidities);

  const avgAir =
    average(airValues);

  const generatedAt =
    new Intl.DateTimeFormat(
      "es-BO",
      {
        dateStyle: "long",
        timeStyle: "short",
      },
    ).format(new Date());

  return (
    <div className="space-y-6">
      <header className="no-print flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">
            Documento de monitoreo
          </p>

          <h1 className="page-title mt-2">
            Reporte EcoAhorro
          </h1>

          <p className="mt-3 text-slate-600">
            Resumen de las lecturas
            ambientales disponibles en el
            sistema.
          </p>
        </div>

        <button
          className="button-primary"
          onClick={() =>
            window.print()
          }
        >
          <Printer className="h-4 w-4" />

          Imprimir reporte
        </button>
      </header>

      <article className="print-panel panel mx-auto max-w-5xl overflow-hidden">
        <div className="bg-forest-900 p-6 text-white sm:p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-300">
                EcoAhorro IoT
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                Reporte de monitoreo
                ambiental
              </h2>

              <p className="mt-2 text-emerald-100">
                ESP32 + sensores
                ambientales
              </p>
            </div>

            <FileText className="hidden h-10 w-10 text-emerald-300 sm:block" />
          </div>
        </div>

        <div className="space-y-8 p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">
                Sistema
              </p>

              <p className="mt-1 font-bold">
                EcoAhorro
              </p>

              <p className="text-sm text-slate-600">
                Prototipo IoT
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-slate-500">
                Nodos disponibles
              </p>

              <p className="mt-1 font-bold">
                {onlineRows.length} de{" "}
                {rows.length}
              </p>

              <p className="text-sm text-slate-600">
                Con lectura disponible
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-slate-500">
                Generado
              </p>

              <p className="mt-1 font-bold">
                {generatedAt}
              </p>

              <p className="text-sm text-slate-600">
                Reporte interno
              </p>
            </div>
          </div>

          <section>
            <h3 className="text-lg font-bold">
              Resumen ambiental
            </h3>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-amber-50 p-4">
                <Thermometer className="h-5 w-5 text-amber-700" />

                <p className="mt-2 text-2xl font-bold">
                  {temperatures.length
                    ? formatNumber(
                        avgTemperature,
                        1,
                      )
                    : "—"}{" "}
                  °C
                </p>

                <p className="text-sm text-slate-600">
                  Temperatura media
                </p>
              </div>

              <div className="rounded-xl bg-tech-50 p-4">
                <Droplets className="h-5 w-5 text-tech-700" />

                <p className="mt-2 text-2xl font-bold">
                  {humidities.length
                    ? formatNumber(
                        avgHumidity,
                        1,
                      )
                    : "—"}{" "}
                  %
                </p>

                <p className="text-sm text-slate-600">
                  Humedad media
                </p>
              </div>

              <div className="rounded-xl bg-forest-50 p-4">
                <Wind className="h-5 w-5 text-forest-600" />

                <p className="mt-2 text-2xl font-bold">
                  {airValues.length
                    ? formatNumber(
                        avgAir,
                        1,
                      )
                    : "—"}{" "}
                  %
                </p>

                <p className="text-sm text-slate-600">
                  Cambio medio del aire
                </p>
              </div>

              <div className="rounded-xl bg-slate-100 p-4">
                <RadioTower className="h-5 w-5 text-slate-700" />

                <p className="mt-2 text-2xl font-bold">
                  {active.length}
                </p>

                <p className="text-sm text-slate-600">
                  Alertas activas
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold">
              Lecturas por ambiente
            </h3>

            <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="p-3">
                      Ambiente
                    </th>

                    <th className="p-3">
                      Nodo
                    </th>

                    <th className="p-3">
                      Temperatura
                    </th>

                    <th className="p-3">
                      Humedad
                    </th>

                    <th className="p-3">
                      Cambio aire
                    </th>

                    <th className="p-3">
                      Calidad
                    </th>

                    <th className="p-3">
                      Alertas
                    </th>

                    <th className="p-3">
                      Actualización
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {rows.map(
                    (row) => (
                      <tr
                        key={
                          row
                            .environment
                            .id
                        }
                      >
                        <td className="p-3 font-bold">
                          {
                            row
                              .environment
                              .name
                          }
                        </td>

                        <td className="p-3">
                          {row.online
                            ? "Conectado"
                            : "Sin conexión"}
                        </td>

                        <td className="p-3">
                          {row.online &&
                          row.temperature !==
                            null
                            ? `${formatNumber(
                                row.temperature,
                                1,
                              )} °C`
                            : "—"}
                        </td>

                        <td className="p-3">
                          {row.online &&
                          row.humidity !==
                            null
                            ? `${formatNumber(
                                row.humidity,
                                1,
                              )} %`
                            : "—"}
                        </td>

                        <td className="p-3">
                          {row.online &&
                          row.air !== null
                            ? `${formatNumber(
                                row.air,
                                1,
                              )} %`
                            : "—"}
                        </td>

                        <td className="p-3 font-semibold">
                          {row.online
                            ? airQuality(
                                row.air,
                              )
                            : "Sin datos"}
                        </td>

                        <td className="p-3">
                          {
                            row.alerts
                          }
                        </td>

                        <td className="p-3 text-slate-500">
                          {row.recordedAt
                            ? formatDateTime(
                                row.recordedAt,
                              )
                            : "—"}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="font-bold">
                Sensores utilizados
              </h3>

              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>
                  • DHT22: temperatura y
                  humedad.
                </li>

                <li>
                  • KY-018: iluminación.
                </li>

                <li>
                  • MQ-135: cambio relativo
                  respecto a línea base.
                </li>

                <li>
                  • ESP32: adquisición,
                  procesamiento y
                  comunicación.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold">
                Estado de alertas
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Actualmente existen{" "}
                {active.length} alertas
                activas en los ambientes
                monitoreados. Las alertas
                permiten identificar
                condiciones que requieren
                revisión.
              </p>
            </div>
          </section>

          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />

            <p>
              Las lecturas del MQ-135 se
              interpretan como variaciones
              respecto a una línea base y
              no como ppm de CO₂. Este
              reporte no constituye una
              certificación oficial de
              calidad ambiental ni de
              huella de carbono.
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
