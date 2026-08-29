import type { Alert, Building, Environment, Institution, SensorSnapshot } from "../domain/types";

export const institution: Institution = { id: "inst-eco-tarija", name: "Colegio Eco Tarija", type: "Colegio privado", city: "Tarija, Bolivia" };
export const buildings: Building[] = [{ id: "building-a", institutionId: institution.id, name: "Bloque A" }];

export const environments: Environment[] = [
  { id: "aula-01", buildingId: "building-a", name: "Aula 01", type: "Aula", status: "normal", occupancyCapacity: 32 },
  { id: "aula-02", buildingId: "building-a", name: "Aula 02", type: "Aula", status: "potential-waste", occupancyCapacity: 30 },
  { id: "laboratorio", buildingId: "building-a", name: "Laboratorio", type: "Laboratorio", status: "warning", occupancyCapacity: 24 },
  { id: "pasillo", buildingId: "building-a", name: "Pasillo principal", type: "Área común", status: "potential-waste", occupancyCapacity: 80 },
  { id: "oficina", buildingId: "building-a", name: "Oficina administrativa", type: "Oficina", status: "offline", occupancyCapacity: 8 },
];

const snapshotOverrides: Record<string, Partial<SensorSnapshot>> = {
  "aula-01": { presenceDetected: true, minutesWithoutActivity: 0, lightOn: true, lightRaw: 350, powerWatts: 215, temperatureCelsius: 24.8, humidityPercent: 53, airChangePercent: 3 },
  "aula-02": { presenceDetected: false, minutesWithoutActivity: 42, lightOn: true, lightRaw: 340, powerWatts: 410, temperatureCelsius: 25.6, humidityPercent: 56, airChangePercent: 5 },
  laboratorio: { presenceDetected: true, minutesWithoutActivity: 0, lightOn: true, lightRaw: 300, powerWatts: 870, temperatureCelsius: 29.2, humidityPercent: 60, airChangePercent: 9 },
  pasillo: { presenceDetected: false, minutesWithoutActivity: 65, lightOn: true, lightRaw: 290, powerWatts: 125, temperatureCelsius: 23.4, humidityPercent: 58, airChangePercent: 4 },
  oficina: { presenceDetected: false, minutesWithoutActivity: 25, lightOn: false, lightRaw: 720, powerWatts: 0, temperatureCelsius: 0, humidityPercent: 0, airChangePercent: 0, nodeOnline: false },
};

export const createSnapshot = (environmentId: string): SensorSnapshot => ({
  environmentId,
  recordedAt: "2026-08-28T14:30:00-04:00",
  presenceDetected: false,
  minutesWithoutActivity: 0,
  lightOn: false,
  lightRaw: 700,
  powerWatts: 0,
  energyKwh: Number((((snapshotOverrides[environmentId]?.powerWatts ?? 0) * 6 * 22) / 1000).toFixed(2)),
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
      const active = hour >= 8 && hour <= 16;
      const wastePeriod = environmentId === "aula-02" && day === 1 && hour === 18;
      const hallwayWaste = environmentId === "pasillo" && hour === 22;
      const timestamp = new Date(Date.UTC(2026, 7, 28 - day, hour, 0, 0)).toISOString();
      const factor = active ? 0.82 + (hour % 3) * 0.09 : 0.06;
      points.push({
        ...base,
        recordedAt: timestamp,
        presenceDetected: active && !wastePeriod,
        minutesWithoutActivity: active && !wastePeriod ? 0 : hour === 22 ? 90 : 35,
        lightOn: active || wastePeriod || hallwayWaste,
        powerWatts: Number((base.powerWatts * (wastePeriod || hallwayWaste ? 0.9 : factor)).toFixed(1)),
        temperatureCelsius: Number((base.temperatureCelsius + (active ? (hour - 9) * 0.22 : -1)).toFixed(1)),
        humidityPercent: Number(Math.max(0, base.humidityPercent + (hour === 12 ? 4 : 0)).toFixed(1)),
        airChangePercent: environmentId === "laboratorio" && day === 2 && hour === 15 ? 13 : base.airChangePercent,
      });
    }
  }
  return points;
};

export const initialAlerts: Alert[] = [
  { id: "alert-aula-02", environmentId: "aula-02", type: "energy", severity: "critical", status: "new", title: "Posible desperdicio en Aula 02", description: "No se detectó actividad durante 42 min y el consumo simulado es 410 W.", recommendation: "Apagar luces y equipos que no sean necesarios.", evidence: { powerWatts: 410, minutesWithoutActivity: 42 }, openedAt: "2026-08-28T14:20:00-04:00", source: "simulated" },
  { id: "alert-pasillo", environmentId: "pasillo", type: "lighting", severity: "warning", status: "new", title: "Iluminación fuera de horario", description: "El pasillo mantiene iluminación sin actividad detectada.", recommendation: "Revisar el horario y apagar iluminación innecesaria.", evidence: { lightOn: true, minutesWithoutActivity: 65 }, openedAt: "2026-08-28T13:55:00-04:00", source: "simulated" },
  { id: "alert-lab-air", environmentId: "laboratorio", type: "air", severity: "warning", status: "acknowledged", title: "Cambio relativo del aire", description: "La variación respecto a la línea base simulada requiere seguimiento; no representa ppm.", recommendation: "Ventilar y contrastar con instrumentación profesional.", evidence: { airChangePercent: 13 }, openedAt: "2026-08-27T15:00:00-04:00", source: "simulated" },
  { id: "alert-temp", environmentId: "laboratorio", type: "temperature", severity: "warning", status: "closed", title: "Temperatura elevada", description: "La temperatura simulada alcanzó 30.4 °C.", recommendation: "Revisar ventilación y fuentes de calor.", evidence: { temperatureCelsius: 30.4 }, openedAt: "2026-08-26T12:00:00-04:00", source: "simulated" },
  { id: "alert-offline", environmentId: "oficina", type: "connectivity", severity: "critical", status: "new", title: "Nodo desconectado", description: "No se reciben datos simulados del nodo de oficina.", recommendation: "Comprobar alimentación y conectividad del nodo.", evidence: { nodeOnline: false }, openedAt: "2026-08-28T12:40:00-04:00", source: "simulated" },
];
