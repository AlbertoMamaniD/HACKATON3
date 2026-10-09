import {
  enrichRowWithSimulatedMetrics,
  type LecturaEcoAhorro,
} from "../context/LiveReadingsContext";
import { LIVE_ALERT_THRESHOLDS } from "../domain/config";

const lectura = (createdAt: string, estadoLuz = "ILUMINADO"): LecturaEcoAhorro => ({
  id: 1,
  created_at: createdAt,
  calidad_aire: 0,
  estado_aire: "NO DISPONIBLE",
  luz: 368,
  luz_pct: 84.5,
  estado_luz: estadoLuz,
  segundos_luz_continua: 0,
  alerta_aire: false,
  alerta_luz: false,
  bloque: "Mi Casa",
});

// Cada minuto de un ciclo de 10 minutos, con lecturas cada 15 s.
const minutoDelCiclo = (minuto: number) =>
  [0, 15, 30, 45].map((segundo) =>
    enrichRowWithSimulatedMetrics(
      lectura(`2026-10-09T15:0${minuto}:${String(segundo).padStart(2, "0")}Z`),
    ),
  );

describe("datos simulados de potencia y agua", () => {
  it("genera un episodio de caudal anormal en el minuto 3 del ciclo", () => {
    for (const row of minutoDelCiclo(3)) {
      expect(row.flujo_agua_lpm!).toBeGreaterThan(LIVE_ALERT_THRESHOLDS.waterLpm);
      expect(row.alerta_agua).toBe(true);
      expect(row.fuente_metricas).toBe("simulado");
    }
  });

  it("genera un episodio de potencia alta en el minuto 7 del ciclo", () => {
    for (const row of minutoDelCiclo(7)) {
      expect(row.potencia_w!).toBeGreaterThan(LIVE_ALERT_THRESHOLDS.powerW);
    }
  });

  it("fuera de los episodios, el consumo simulado no dispara alertas", () => {
    for (const minuto of [0, 1, 2, 4, 5, 6, 8, 9]) {
      for (const row of minutoDelCiclo(minuto)) {
        expect(row.flujo_agua_lpm!).toBeLessThanOrEqual(LIVE_ALERT_THRESHOLDS.waterLpm);
        expect(row.potencia_w!).toBeLessThanOrEqual(LIVE_ALERT_THRESHOLDS.powerW);
        expect(row.alerta_agua).toBe(false);
      }
    }
  });

  it("respeta los valores reales si la fila ya trae potencia y caudal", () => {
    const row = enrichRowWithSimulatedMetrics({
      ...lectura("2026-10-09T15:03:00Z"),
      potencia_w: 90,
      flujo_agua_lpm: 0.5,
      fuente_metricas: "sensor",
    });
    expect(row.potencia_w).toBe(90);
    expect(row.flujo_agua_lpm).toBe(0.5);
    expect(row.fuente_metricas).toBe("sensor");
  });
});
