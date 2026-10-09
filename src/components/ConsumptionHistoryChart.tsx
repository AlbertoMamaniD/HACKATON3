import { useState } from "react";
import { Bolt, Droplets } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { LIVE_ALERT_THRESHOLDS } from "../domain/config";
import { averageByMinute, summarizeHistory } from "../domain/history";
import type { LecturaEcoAhorro } from "../hooks/useLiveReadings";
import { formatNumber } from "../utils/format";
import { SourceBadge, type MetricSource } from "./SourceBadge";

type Metric = "luz" | "agua";

const METRICS = {
  luz: {
    label: "Luz",
    unit: "W",
    icon: Bolt,
    color: "#f59e0b",
    threshold: LIVE_ALERT_THRESHOLDS.powerW,
    digits: 0,
    axisStep: 100,
    pick: (row: LecturaEcoAhorro) => row.potencia_w ?? 0,
  },
  agua: {
    label: "Agua",
    unit: "L/min",
    icon: Droplets,
    color: "#0284c7",
    threshold: LIVE_ALERT_THRESHOLDS.waterLpm,
    digits: 1,
    axisStep: 2,
    pick: (row: LecturaEcoAhorro) => row.flujo_agua_lpm ?? 0,
  },
} as const;

const timeFormat = new Intl.DateTimeFormat("es-BO", { hour: "2-digit", minute: "2-digit" });

/** Historial de luz y agua: una serie a la vez, promedio por minuto y línea del umbral de alerta. */
export function ConsumptionHistoryChart({
  rows,
  source,
}: {
  rows: LecturaEcoAhorro[];
  source: MetricSource;
}) {
  const [metric, setMetric] = useState<Metric>("luz");
  const config = METRICS[metric];

  const raw = rows.map((row) => ({ created_at: row.created_at, value: config.pick(row) }));
  const points = averageByMinute(raw);
  const summary = summarizeHistory(points, raw.map((row) => row.value), config.threshold);
  const data = points.map((point) => ({
    time: timeFormat.format(new Date(point.minuteMs)),
    value: Number(point.value.toFixed(config.digits === 0 ? 0 : 2)),
  }));
  // Eje con valores redondos (0–400 W, 0–8 L/min…) que siempre deja ver el umbral.
  const yMax =
    Math.ceil(Math.max(config.threshold * 1.2, summary.max * 1.05) / config.axisStep) * config.axisStep;
  const yTicks = Array.from({ length: Math.round(yMax / config.axisStep) + 1 }, (_, i) => i * config.axisStep);

  return (
    <article className="panel min-w-0 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-bold">Historial de luz y agua</h2>
            <SourceBadge source={source} />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Promedio por minuto de las últimas lecturas. La línea punteada es el umbral de alerta.
          </p>
        </div>

        <div className="flex shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-1" role="group" aria-label="Serie del historial">
          {(Object.keys(METRICS) as Metric[]).map((key) => {
            const Icon = METRICS[key].icon;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={metric === key}
                onClick={() => setMetric(key)}
                className={`flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-4 text-xs font-bold transition ${
                  metric === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                {METRICS[key].label}
              </button>
            );
          })}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="mt-4 grid h-56 place-items-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500">
          Sin información para este periodo
        </div>
      ) : (
        <>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-slate-50 px-2 py-2">
              <dt className="text-[11px] font-semibold text-slate-500">Promedio</dt>
              <dd className="text-sm font-black text-slate-900">
                {formatNumber(summary.average, config.digits)} {config.unit}
              </dd>
            </div>
            <div className="rounded-xl bg-slate-50 px-2 py-2">
              <dt className="text-[11px] font-semibold text-slate-500">Máximo</dt>
              <dd className="text-sm font-black text-slate-900">
                {formatNumber(summary.max, config.digits)} {config.unit}
              </dd>
            </div>
            <div className={`rounded-xl px-2 py-2 ${summary.minutesOverThreshold > 0 ? "bg-rose-50" : "bg-slate-50"}`}>
              <dt className="text-[11px] font-semibold text-slate-500">Sobre el umbral</dt>
              <dd className={`text-sm font-black ${summary.minutesOverThreshold > 0 ? "text-rose-700" : "text-slate-900"}`}>
                {summary.minutesOverThreshold} min
              </dd>
            </div>
          </dl>

          <div className="mt-4 h-56 min-w-0 sm:h-64">
            {/* key: se vuelve a medir al cambiar de serie para ocupar todo el ancho */}
            <ResponsiveContainer key={metric} width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id={`historial-${metric}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={config.color} stopOpacity={0.45} />
                    <stop offset="95%" stopColor={config.color} stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} minTickGap={36} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  width={44}
                  domain={[0, yMax]}
                  ticks={yTicks.length <= 6 ? yTicks : yTicks.filter((_, i) => i % 2 === 0)}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) => [`${formatNumber(Number(value), config.digits)} ${config.unit}`, config.label]}
                  labelFormatter={(label) => `Minuto ${label}`}
                  contentStyle={{ borderRadius: "12px", boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)" }}
                />
                <ReferenceLine
                  y={config.threshold}
                  stroke="#e11d48"
                  strokeDasharray="5 4"
                  label={{
                    value: `Alerta ${formatNumber(config.threshold, config.digits)} ${config.unit}`,
                    position: "insideBottomRight",
                    offset: 6,
                    fill: "#be123c",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  name={config.label}
                  stroke={config.color}
                  strokeWidth={2.5}
                  fill={`url(#historial-${metric})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </article>
  );
}
