/** Agrupa lecturas por minuto para que el historial se lea bien en pantallas pequeñas. */

export interface MinutePoint {
  /** Inicio del minuto en milisegundos. */
  minuteMs: number;
  /** Promedio del minuto. */
  value: number;
  readings: number;
}

export interface HistorySummary {
  average: number;
  max: number;
  /** Minutos cuyo promedio supera el umbral de alerta. */
  minutesOverThreshold: number;
}

export function averageByMinute(
  rows: { created_at: string; value: number }[],
): MinutePoint[] {
  const buckets = new Map<number, { sum: number; count: number }>();

  for (const row of rows) {
    const time = new Date(row.created_at).getTime();
    if (Number.isNaN(time)) continue;
    const minuteMs = Math.floor(time / 60_000) * 60_000;
    const bucket = buckets.get(minuteMs) ?? { sum: 0, count: 0 };
    bucket.sum += row.value;
    bucket.count += 1;
    buckets.set(minuteMs, bucket);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([minuteMs, { sum, count }]) => ({ minuteMs, value: sum / count, readings: count }));
}

export function summarizeHistory(
  points: MinutePoint[],
  rawValues: number[],
  threshold: number,
): HistorySummary {
  const average = points.length
    ? points.reduce((sum, point) => sum + point.value * point.readings, 0) /
      points.reduce((sum, point) => sum + point.readings, 0)
    : 0;

  return {
    average,
    max: rawValues.length ? Math.max(...rawValues) : 0,
    minutesOverThreshold: points.filter((point) => point.value > threshold).length,
  };
}
