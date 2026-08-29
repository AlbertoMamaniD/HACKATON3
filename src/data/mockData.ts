import type { Alert, Building, Environment, Institution, SensorSnapshot } from "../domain/types";

// TODO: cambia el nombre/ciudad si quieres personalizarlo más.
export const institution: Institution = { id: "casa-eco-ahorro", name: "Mi Casa", type: "Vivienda residencial", city: "Tarija, Bolivia" };
export const buildings: Building[] = [{ id: "vivienda", institutionId: institution.id, name: "Mi Casa" }];

// Un solo ambiente real: tu casa, alimentada por el nodo ESP32.
export const environments: Environment[] = [
  { id: "casa", buildingId: "vivienda", name: "Mi Casa", type: "Vivienda", status: "normal", occupancyCapacity: 4 },
];

const snapshotOverrides: Record<string, Partial<SensorSnapshot>> = {
  casa: { presenceDetected: false, minutesWithoutActivity: 0, lightOn: true, lightRaw: 350, powerWatts: 0, temperatureCelsius: 24, humidityPercent: 53, airChangePercent: 0 },
};

// Se sigue usando solo por el modo demostración (services/mock-ecoahorro-data-source.ts).
// Los datos reales del ESP32 pasan por services/ecoahorro-data-source.ts en su lugar.
export const createSnapshot = (environmentId: string): SensorSnapshot => ({
  environmentId,
  recordedAt: "2026-08-28T20:30:00-04:00",
  presenceDetected: false,
  minutesWithoutActivity: 0,
  lightOn: false,
  lightRaw: 700,
  powerWatts: 0,
  energyKwh: 0,
  temperatureCelsius: 24,
  humidityPercent: 50,
  airChangePercent: 0,
  nodeOnline: true,
  source: "simulated",
  ...snapshotOverrides[environmentId],
});

export const generateHistory = (environmentId: string, days = 7): SensorSnapshot[] => {
  const base = createSnapshot(environmentId);
  const points: SensorSnapshot[] = [];
  for (let day = days - 1; day >= 0; day -= 1) {
    for (const hour of [6, 9, 12, 15, 18, 22]) {
      const active = hour >= 8 && hour <= 22;
      const timestamp = new Date(Date.UTC(2026, 7, 28 - day, hour, 0, 0)).toISOString();
      points.push({
        ...base,
        recordedAt: timestamp,
        presenceDetected: active,
        minutesWithoutActivity: active ? 0 : 60,
        lightOn: active,
        temperatureCelsius: Number((base.temperatureCelsius + (active ? (hour - 9) * 0.22 : -1)).toFixed(1)),
        humidityPercent: Number(Math.max(0, base.humidityPercent + (hour === 12 ? 4 : 0)).toFixed(1)),
      });
    }
  }
  return points;
};

// Vacío: las alertas reales ahora se generan a partir de las lecturas del ESP32
// (alerta_temp / alerta_humedad / alerta_aire ya vienen calculadas por el firmware).
export const initialAlerts: Alert[] = [];
