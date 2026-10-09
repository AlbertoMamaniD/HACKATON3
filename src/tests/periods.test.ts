import {
  compareAmounts,
  periodBounds,
  summarizePeriod,
  type PeriodReading,
} from "../domain/periods";

const tariffs = { electricityTariffBs: 1, waterTariffBsPerM3: 5 };
const base = Date.parse("2026-08-29T12:00:00Z");
const at = (seconds: number, potencia_w: number, flujo_agua_lpm: number): PeriodReading => ({
  created_at: new Date(base + seconds * 1000).toISOString(),
  potencia_w,
  flujo_agua_lpm,
});

describe("comparación de períodos", () => {
  it("integra potencia y caudal entre lecturas consecutivas", () => {
    // 1000 W durante 3600 s = 1 kWh; 2 L/min durante 60 min = 120 L
    const rows = Array.from({ length: 721 }, (_, i) => at(i * 5, 1000, 2));
    const summary = summarizePeriod(rows, base, base + 3_601_000, tariffs);

    expect(summary.kwh).toBeCloseTo(1, 5);
    expect(summary.liters).toBeCloseTo(120, 5);
    expect(summary.electricityBs).toBeCloseTo(1, 5);
    expect(summary.waterBs).toBeCloseTo(0.6, 5); // 0,12 m³ × 5 Bs
    expect(summary.coveredSeconds).toBe(3600);
  });

  it("no cuenta consumo en los huecos sin lecturas", () => {
    const rows = [at(0, 1000, 0), at(5, 1000, 0), at(600, 1000, 0), at(605, 1000, 0)];
    const summary = summarizePeriod(rows, base, base + 700_000, tariffs);

    expect(summary.coveredSeconds).toBe(10);
    expect(summary.kwh).toBeCloseTo((1000 * 10) / 3_600_000, 8);
  });

  it("solo usa las lecturas dentro del período", () => {
    const rows = [at(0, 500, 1), at(5, 500, 1), at(10, 500, 1)];
    expect(summarizePeriod(rows, base + 20_000, base + 60_000, tariffs).readings).toBe(0);
  });

  it("calcula la diferencia en Bs y en %, sin porcentaje si no hay período anterior", () => {
    expect(compareAmounts(12, 10)).toEqual({ differenceBs: 2, differencePercent: 20 });
    expect(compareAmounts(8, 10).differencePercent).toBeCloseTo(-20);
    expect(compareAmounts(5, 0)).toEqual({ differenceBs: 5, differencePercent: null });
  });

  it("define el período actual y el anterior hasta el ancla", () => {
    expect(periodBounds(10_000, 3_000)).toEqual({
      current: { start: 7_000, end: 10_000 },
      previous: { start: 4_000, end: 7_000 },
    });
  });
});
