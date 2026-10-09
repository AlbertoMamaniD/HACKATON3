/** Solución 2 del lienzo: historial y comparación de períodos para detectar desperdicios. */

export type PeriodId = "hora" | "dia" | "semana";

export interface PeriodOption {
  id: PeriodId;
  label: string;
  currentLabel: string;
  previousLabel: string;
  durationMs: number;
}

const HOUR_MS = 3_600_000;

export const PERIOD_OPTIONS: PeriodOption[] = [
  { id: "hora", label: "Hora", currentLabel: "Última hora", previousLabel: "Hora anterior", durationMs: HOUR_MS },
  { id: "dia", label: "Día", currentLabel: "Últimas 24 h", previousLabel: "24 h anteriores", durationMs: 24 * HOUR_MS },
  { id: "semana", label: "Semana", currentLabel: "Últimos 7 días", previousLabel: "7 días anteriores", durationMs: 7 * 24 * HOUR_MS },
];

export const getPeriodOption = (id: PeriodId): PeriodOption =>
  PERIOD_OPTIONS.find((option) => option.id === id) ?? PERIOD_OPTIONS[0];

export interface PeriodReading {
  created_at: string;
  potencia_w: number;
  flujo_agua_lpm: number;
}

export interface PeriodTariffs {
  electricityTariffBs: number;
  waterTariffBsPerM3: number;
}

export interface PeriodSummary {
  kwh: number;
  liters: number;
  electricityBs: number;
  waterBs: number;
  totalBs: number;
  /** Segundos cubiertos por lecturas consecutivas; los huecos no se cuentan como consumo. */
  coveredSeconds: number;
  readings: number;
}

/** Lecturas separadas por más de este tiempo se consideran un hueco sin datos. */
export const MAX_GAP_SECONDS = 30;

/**
 * Suma el consumo de un período [startMs, endMs) integrando cada lectura hasta la siguiente.
 * Si entre dos lecturas pasan más de MAX_GAP_SECONDS, ese tramo no se cuenta: sin datos no se inventa consumo.
 */
export function summarizePeriod(
  rows: PeriodReading[],
  startMs: number,
  endMs: number,
  tariffs: PeriodTariffs,
): PeriodSummary {
  const inRange = rows
    .map((row) => ({ row, time: new Date(row.created_at).getTime() }))
    .filter(({ time }) => !Number.isNaN(time) && time >= startMs && time < endMs)
    .sort((a, b) => a.time - b.time);

  let wattSeconds = 0;
  let liters = 0;
  let coveredSeconds = 0;

  for (let i = 0; i < inRange.length - 1; i += 1) {
    const current = inRange[i];
    const seconds = (inRange[i + 1].time - current.time) / 1000;
    if (seconds <= 0 || seconds > MAX_GAP_SECONDS) continue;
    wattSeconds += current.row.potencia_w * seconds;
    liters += (current.row.flujo_agua_lpm * seconds) / 60;
    coveredSeconds += seconds;
  }

  const kwh = wattSeconds / 3_600_000;
  const electricityBs = kwh * tariffs.electricityTariffBs;
  const waterBs = (liters / 1000) * tariffs.waterTariffBsPerM3;

  return {
    kwh,
    liters,
    electricityBs,
    waterBs,
    totalBs: electricityBs + waterBs,
    coveredSeconds,
    readings: inRange.length,
  };
}

export interface PeriodDifference {
  differenceBs: number;
  /** null cuando el período anterior no tiene consumo con el que comparar. */
  differencePercent: number | null;
}

export function compareAmounts(currentBs: number, previousBs: number): PeriodDifference {
  const differenceBs = currentBs - previousBs;
  return {
    differenceBs,
    differencePercent: previousBs > 0 ? (differenceBs / previousBs) * 100 : null,
  };
}

/** Límites del período actual y del anterior, terminando en `anchorMs`. */
export function periodBounds(anchorMs: number, durationMs: number) {
  return {
    current: { start: anchorMs - durationMs, end: anchorMs },
    previous: { start: anchorMs - 2 * durationMs, end: anchorMs - durationMs },
  };
}
