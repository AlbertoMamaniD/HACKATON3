import {
  Bolt,
  Coins,
  Droplets,
  FileText,
  Leaf,
  Lightbulb,
  Printer,
  RadioTower,
  TriangleAlert,
} from "lucide-react";

import { useApp } from "../app/AppProvider";
import { BillComparison } from "../components/BillComparison";
import { Disclaimer } from "../components/Disclaimer";
import { SourceBadge } from "../components/SourceBadge";
import { ErrorState, LoadingState } from "../components/LoadingState";
import { useLiveReadings } from "../hooks/useLiveReadings";
import { useDashboardData } from "../hooks/useEcoData";
import { isLightOn } from "../services/ecoahorro-data-source";
import { formatDateTime, formatNumber } from "../utils/format";

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function ReportsPage() {
  const { alerts, config } = useApp();
  const { data, error } = useDashboardData();
  const { rows: liveRows, latest: liveLatest } = useLiveReadings(120);

  if (error) {
    return (
      <ErrorState message="No se pudieron obtener los datos para generar el reporte." />
    );
  }

  if (!data) {
    return <LoadingState />;
  }

  const active = alerts.filter((alert) => alert.status !== "closed");

  const rows = data.environments.map((environment, index) => {
    const snapshot = data.snapshots[index];
    const isMainHome = environment.id === "casa" || index === 0;

    const power =
      isMainHome && liveLatest
        ? (liveLatest.potencia_w ?? snapshot?.powerWatts ?? 0)
        : (snapshot?.powerWatts ?? 0);

    const waterFlow =
      isMainHome && liveLatest
        ? (liveLatest.flujo_agua_lpm ?? snapshot?.waterFlowLpm ?? 0)
        : (snapshot?.waterFlowLpm ?? 0);

    return {
      environment,
      online: snapshot?.nodeOnline ?? true,
      power,
      waterFlow,
      lightOn:
        isMainHome && liveLatest
          ? isLightOn(liveLatest.estado_luz)
          : (snapshot?.lightOn ?? false),
      recordedAt:
        isMainHome && liveLatest
          ? liveLatest.created_at
          : (snapshot?.recordedAt ?? null),
      alerts: active.filter((alert) => alert.environmentId === environment.id)
        .length,
    };
  });

  const onlineRows = rows.filter((row) => row.online);

  const powerValues =
    liveRows.length > 0
      ? liveRows.map((row) => row.potencia_w ?? 0)
      : onlineRows.map((row) => row.power);

  const waterValues =
    liveRows.length > 0
      ? liveRows.map((row) => row.flujo_agua_lpm ?? 0)
      : onlineRows.map((row) => row.waterFlow);

  const avgPower = average(powerValues);
  const avgWater = average(waterValues);
  const lightsOn = liveLatest ? isLightOn(liveLatest.estado_luz) : null;

  // Estimación mensual extrapolada para el reporte
  const estKwhMonth = (avgPower * 6 * 30) / 1000;
  const estElecCostBs = estKwhMonth * config.electricityTariffBs;
  const estWaterLitersMonth = avgWater * 60 * 2 * 30;
  const estWaterCostBs = (estWaterLitersMonth / 1000) * config.waterTariffBsPerM3;
  const estCo2Kg = estKwhMonth * config.emissionFactorKgPerKwh;

  const generatedAt = new Intl.DateTimeFormat("es-BO", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());

  return (
    <div className="space-y-6">
      <header className="no-print flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Reporte estimado de consumo</p>
          <h1 className="page-title mt-2">Reporte EcoAhorro</h1>
          <p className="mt-3 text-slate-600">
            Resumen del consumo de luz y agua registrado por EcoAhorro para
            contrastarlo con tu factura. Incluye el CO₂ estimado como
            información adicional.
          </p>
        </div>

        <button className="button-primary" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Imprimir reporte
        </button>
      </header>

      <article className="print-panel panel mx-auto max-w-5xl overflow-hidden shadow-lg border border-slate-200">
        <div className="bg-gradient-to-r from-forest-900 to-emerald-950 p-6 text-white sm:p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-300">
                EcoAhorro IoT · Plataforma Residencial
              </p>
              <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                Reporte estimado de consumo
              </h2>
              <p className="mt-2 text-emerald-100">
                Luz y agua del hogar · no es un documento oficial ni una auditoría
              </p>
            </div>
            <FileText className="hidden h-12 w-12 text-emerald-300 sm:block" />
          </div>
        </div>

        <div className="space-y-8 p-4 sm:p-8">
          <Disclaimer />

          {/* Metadatos */}
          <div className="grid gap-4 sm:grid-cols-3 border-b pb-6">
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">
                Vivienda
              </p>
              <p className="mt-1 font-bold text-slate-900">
                {data.institution.name}
              </p>
              <p className="text-sm text-slate-600">{data.institution.city}</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-slate-500">
                Estado del concentrador
              </p>
              <p
                className={`mt-1 font-bold ${onlineRows.length > 0 ? "text-emerald-700" : "text-slate-600"}`}
              >
                {onlineRows.length > 0 ? "Nodo conectado" : "Sin conexión"}
              </p>
              <p className="text-sm text-slate-600">Muestreo cada 5s</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-slate-500">
                Fecha de emisión
              </p>
              <p className="mt-1 font-bold text-slate-900">{generatedAt}</p>
              <p className="text-sm text-slate-600">Reporte estimado, no oficial</p>
            </div>
          </div>

          {/* Resumen de los 4 Pilares */}
          <section>
            <h3 className="text-lg font-bold text-slate-900">
              Resumen de consumo
            </h3>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-amber-50 p-4 border border-amber-200">
                <Bolt className="h-5 w-5 text-amber-700" />
                <p className="mt-2 text-2xl font-bold text-amber-950">
                  {formatNumber(avgPower, 0)} W
                </p>
                <p className="flex flex-wrap items-center gap-1.5 text-sm text-slate-600">
                  Potencia media <SourceBadge source="simulado" />
                </p>
              </div>

              <div className="rounded-xl bg-sky-50 p-4 border border-sky-200">
                <Droplets className="h-5 w-5 text-sky-700" />
                <p className="mt-2 text-2xl font-bold text-sky-950">
                  {formatNumber(avgWater, 1)} L/min
                </p>
                <p className="flex flex-wrap items-center gap-1.5 text-sm text-slate-600">
                  Caudal medio de agua <SourceBadge source="simulado" />
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200">
                <Lightbulb className="h-5 w-5 text-emerald-700" />
                <p className="mt-2 text-2xl font-bold text-emerald-950">
                  {lightsOn === null ? "—" : lightsOn ? "Encendidas" : "Apagadas"}
                </p>
                <p className="flex flex-wrap items-center gap-1.5 text-sm text-slate-600">
                  Luces ahora <SourceBadge source="sensor" />
                </p>
              </div>

              <div className="rounded-xl bg-purple-50 p-4 border border-purple-200">
                <Leaf className="h-5 w-5 text-purple-700" />
                <p className="mt-2 text-2xl font-bold text-purple-950">
                  {formatNumber(estCo2Kg, 1)} kg
                </p>
                <p className="text-sm text-slate-600">CO₂ mensual estimado (beneficio adicional)</p>
              </div>
            </div>
          </section>

          {/* Balance Económico */}
          <section className="rounded-2xl bg-slate-50 p-5 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-600" />
              Gasto mensual estimado
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Supuestos: potencia media durante 6 h/día y caudal medio durante
              2 h/día, por 30 días, con las tarifas de Configuración.
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-3 text-sm">
              <div>
                <p className="text-slate-500">Energía eléctrica ({formatNumber(estKwhMonth, 1)} kWh):</p>
                <p className="font-bold text-slate-900">Bs {formatNumber(estElecCostBs)} / mes</p>
              </div>
              <div>
                <p className="text-slate-500">Agua potable ({formatNumber(estWaterLitersMonth, 0)} L):</p>
                <p className="font-bold text-slate-900">Bs {formatNumber(estWaterCostBs)} / mes</p>
              </div>
              <div>
                <p className="text-slate-500">Total combinado estimado:</p>
                <p className="font-extrabold text-emerald-700 text-base">Bs {formatNumber(estElecCostBs + estWaterCostBs)} / mes</p>
              </div>
            </div>
          </section>

          <BillComparison
            estimatedElectricityBs={estElecCostBs}
            estimatedWaterBs={estWaterCostBs}
          />

          {/* Tabla de ambientes */}
          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              Detalle por zona del hogar
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-slate-100 text-xs font-bold uppercase text-slate-600">
                  <tr>
                    <th className="p-3">Zona</th>
                    <th className="p-3">
                      <span className="flex items-center gap-1.5">Potencia <SourceBadge source="simulado" /></span>
                    </th>
                    <th className="p-3">
                      <span className="flex items-center gap-1.5">Agua <SourceBadge source="simulado" /></span>
                    </th>
                    <th className="p-3">
                      <span className="flex items-center gap-1.5">Luces <SourceBadge source="sensor" /></span>
                    </th>
                    <th className="p-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rows.map((row) => (
                    <tr key={row.environment.id}>
                      <td className="p-3 font-bold">{row.environment.name}</td>
                      <td className="p-3">{row.power} W</td>
                      <td className="p-3">{row.waterFlow.toFixed(1)} L/min</td>
                      <td className="p-3">{row.lightOn ? "Encendidas" : "Apagadas"}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                          row.online ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                        }`}>
                          {row.online ? "En línea" : "Desconectado"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}
