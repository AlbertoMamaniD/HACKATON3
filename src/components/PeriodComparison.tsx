import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Bolt, Coins, Droplets, History, Minus, type LucideIcon } from "lucide-react";

import { useApp } from "../app/AppProvider";
import {
  PERIOD_OPTIONS,
  compareAmounts,
  getPeriodOption,
  periodBounds,
  summarizePeriod,
  type PeriodId,
} from "../domain/periods";
import { useLiveReadings } from "../hooks/useLiveReadings";
import { usePeriodReadings } from "../hooks/usePeriodReadings";
import { formatDateTime, formatNumber } from "../utils/format";
import { SourceBadge } from "./SourceBadge";

const MINUTE_MS = 60_000;

const bsFormat = new Intl.NumberFormat("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatBs = (value: number) => `Bs ${bsFormat.format(value)}`;
const timeFormat = new Intl.DateTimeFormat("es-BO", { hour: "2-digit", minute: "2-digit" });

function formatWait(ms: number) {
  const minutes = Math.max(1, Math.ceil(ms / MINUTE_MS));
  if (minutes < 60) return `unos ${minutes} min`;
  const hours = Math.ceil(minutes / 60);
  if (hours < 48) return `unas ${hours} h`;
  return `unos ${Math.ceil(hours / 24)} días`;
}

function formatHours(seconds: number) {
  if (seconds <= 0) return "sin lecturas";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min con lecturas`;
  return `${formatNumber(minutes / 60, 1)} h con lecturas`;
}

function DifferenceTag({ differenceBs, differencePercent }: { differenceBs: number; differencePercent: number | null }) {
  if (differencePercent === null) {
    return <span className="text-xs font-semibold text-slate-500">Sin período anterior para comparar</span>;
  }
  const up = differenceBs > 0.005;
  const down = differenceBs < -0.005;
  const Icon = up ? ArrowUpRight : down ? ArrowDownRight : Minus;
  const tone = up ? "bg-rose-50 text-rose-700" : down ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600";
  const sign = up ? "+" : down ? "−" : "";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${tone}`}>
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {sign}
      {formatBs(Math.abs(differenceBs))} ({sign}
      {formatNumber(Math.abs(differencePercent), 1)} %)
    </span>
  );
}

function AmountCard({
  title,
  icon: Icon,
  iconClass,
  currentBs,
  previousBs,
  detail,
  currentLabel,
  previousLabel,
}: {
  title: string;
  icon: LucideIcon;
  iconClass: string;
  currentBs: number;
  /** null: el período anterior no tiene lecturas. */
  previousBs: number | null;
  detail: string;
  currentLabel: string;
  previousLabel: string;
}) {
  const diff = previousBs === null ? null : compareAmounts(currentBs, previousBs);
  return (
    <article className="panel min-w-0 p-4 sm:p-5">
      <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
        <Icon aria-hidden="true" className={`h-4 w-4 ${iconClass}`} />
        {title}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-slate-500">{currentLabel}</p>
          <p className="text-xl font-black text-slate-900">{formatBs(currentBs)}</p>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-slate-500">{previousLabel}</p>
          <p className="text-xl font-bold text-slate-400">
            {previousBs === null ? "Sin datos" : formatBs(previousBs)}
          </p>
        </div>
      </div>
      <div className="mt-3">
        {diff ? (
          <DifferenceTag {...diff} />
        ) : (
          <span className="text-xs font-semibold text-slate-500">Aún sin período anterior</span>
        )}
      </div>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </article>
  );
}

/** Solución 2 del lienzo: comparar el gasto de luz y agua entre períodos para detectar desperdicios. */
export function PeriodComparison() {
  const { config } = useApp();
  const { latest, online } = useLiveReadings();
  const [periodId, setPeriodId] = useState<PeriodId>("hora");
  const [minuteTick, setMinuteTick] = useState(() => Math.ceil(Date.now() / MINUTE_MS) * MINUTE_MS);

  useEffect(() => {
    const interval = window.setInterval(
      () => setMinuteTick(Math.ceil(Date.now() / MINUTE_MS) * MINUTE_MS),
      MINUTE_MS,
    );
    return () => window.clearInterval(interval);
  }, []);

  const option = getPeriodOption(periodId);

  // En línea: períodos hasta ahora. Sin conexión: hasta la última lectura, para no comparar horas vacías.
  const lastReadingMs = latest ? new Date(latest.created_at).getTime() : null;
  const anchorMs = online || lastReadingMs === null ? minuteTick : lastReadingMs + 1;
  const bounds = useMemo(() => periodBounds(anchorMs, option.durationMs), [anchorMs, option.durationMs]);

  const { rows, loading, error, truncated } = usePeriodReadings(bounds.previous.start, bounds.current.end);

  const tariffs = {
    electricityTariffBs: config.electricityTariffBs,
    waterTariffBsPerM3: config.waterTariffBsPerM3,
  };
  const current = summarizePeriod(rows, bounds.current.start, bounds.current.end, tariffs);
  const previous = summarizePeriod(rows, bounds.previous.start, bounds.previous.end, tariffs);
  const hasData = current.readings > 0 || previous.readings > 0;
  const previousEmpty = previous.readings === 0;
  // Primera lectura disponible: el período anterior empieza a tener datos cuando el ancla la supera por una duración.
  const firstReadingMs = rows.length > 0 ? new Date(rows[0].created_at).getTime() : null;
  const waitMs = firstReadingMs !== null ? firstReadingMs + option.durationMs - anchorMs : null;

  return (
    <section id="comparar" aria-labelledby="comparar-periodos" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="eyebrow">Historial</p>
            <SourceBadge source="simulado" />
          </div>
          <h2 id="comparar-periodos" className="mt-1 text-xl font-bold text-slate-900">
            Compara períodos
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Si un período cuesta más que el anterior sin una razón clara, puede haber un desperdicio: revisa
            el historial de luz y agua.
          </p>
        </div>

        <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1" role="group" aria-label="Período a comparar">
          {PERIOD_OPTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={periodId === item.id}
              onClick={() => setPeriodId(item.id)}
              className={`min-h-9 flex-1 rounded-lg px-3 text-xs font-bold transition ${
                periodId === item.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {!online && lastReadingMs !== null && (
        <p className="text-xs text-slate-500">
          ESP32 sin conexión: los períodos se cuentan hasta la última lectura ({formatDateTime(latest!.created_at)}).
        </p>
      )}

      {error ? (
        <div className="panel border-red-200 bg-red-50 p-4 text-sm text-red-700">
          No se pudo leer el historial: {error}
        </div>
      ) : loading && !hasData ? (
        <div className="panel p-4 text-sm text-slate-500">Cargando historial…</div>
      ) : !hasData ? (
        <div className="panel p-4 text-sm text-slate-500">
          No hay lecturas en estos períodos. La comparación aparece cuando el ESP32 lleva tiempo enviando datos.
        </div>
      ) : (
        <>
          {previousEmpty && firstReadingMs !== null && (
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
              <strong>{option.previousLabel}: todavía sin lecturas.</strong> El ESP32 empezó a enviar datos a las{" "}
              {timeFormat.format(new Date(firstReadingMs))}
              {online && waitMs !== null && waitMs > 0
                ? `; en ${formatWait(waitMs)} habrá con qué comparar.`
                : "."}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <AmountCard
              title="Luz"
              icon={Bolt}
              iconClass="text-amber-600"
              currentBs={current.electricityBs}
              previousBs={previousEmpty ? null : previous.electricityBs}
              detail={
                previousEmpty
                  ? `${formatNumber(current.kwh, 2)} kWh en ${option.currentLabel.toLowerCase()}`
                  : `${formatNumber(current.kwh, 2)} kWh frente a ${formatNumber(previous.kwh, 2)} kWh`
              }
              currentLabel={option.currentLabel}
              previousLabel={option.previousLabel}
            />
            <AmountCard
              title="Agua"
              icon={Droplets}
              iconClass="text-sky-600"
              currentBs={current.waterBs}
              previousBs={previousEmpty ? null : previous.waterBs}
              detail={
                previousEmpty
                  ? `${formatNumber(current.liters, 0)} L en ${option.currentLabel.toLowerCase()}`
                  : `${formatNumber(current.liters, 0)} L frente a ${formatNumber(previous.liters, 0)} L`
              }
              currentLabel={option.currentLabel}
              previousLabel={option.previousLabel}
            />
            <AmountCard
              title="Total"
              icon={Coins}
              iconClass="text-forest-600"
              currentBs={current.totalBs}
              previousBs={previousEmpty ? null : previous.totalBs}
              detail="Luz + agua con las tarifas de Configuración"
              currentLabel={option.currentLabel}
              previousLabel={option.previousLabel}
            />
          </div>

          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <History aria-hidden="true" className="h-3.5 w-3.5" />
            {option.currentLabel}: {formatHours(current.coveredSeconds)} · {option.previousLabel}:{" "}
            {formatHours(previous.coveredSeconds)}. Los tramos sin lecturas no suman consumo, así que compara
            períodos con cobertura parecida.
            {truncated && " Se analizaron solo las lecturas más recientes (límite de la consulta)."}
          </p>
        </>
      )}
    </section>
  );
}
