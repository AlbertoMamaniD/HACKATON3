import { averageByMinute, summarizeHistory } from "../domain/history";

const lectura = (iso: string, value: number) => ({ created_at: iso, value });

describe("historial por minuto", () => {
  it("promedia las lecturas de cada minuto y las ordena", () => {
    const points = averageByMinute([
      lectura("2026-10-09T15:01:15Z", 300),
      lectura("2026-10-09T15:00:00Z", 100),
      lectura("2026-10-09T15:00:30Z", 200),
      lectura("2026-10-09T15:01:45Z", 340),
    ]);

    expect(points.map((point) => point.value)).toEqual([150, 320]);
    expect(points.map((point) => point.readings)).toEqual([2, 2]);
    expect(points[0].minuteMs).toBe(Date.parse("2026-10-09T15:00:00Z"));
  });

  it("resume promedio, máximo y minutos sobre el umbral", () => {
    const raw = [100, 200, 300, 340];
    const points = averageByMinute([
      lectura("2026-10-09T15:00:00Z", 100),
      lectura("2026-10-09T15:00:30Z", 200),
      lectura("2026-10-09T15:01:15Z", 300),
      lectura("2026-10-09T15:01:45Z", 340),
    ]);
    expect(summarizeHistory(points, raw, 250)).toEqual({
      average: 235,
      max: 340,
      minutesOverThreshold: 1,
    });
  });

  it("devuelve ceros sin lecturas", () => {
    expect(summarizeHistory([], [], 250)).toEqual({ average: 0, max: 0, minutesOverThreshold: 0 });
  });
});
