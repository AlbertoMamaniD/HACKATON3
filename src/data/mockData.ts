import type { Alert, Building, Environment, Institution, SensorSnapshot } from "../domain/types";

export const institution: Institution = {
  id: "home-eco-tarija",
  name: "Hogar Eco Tarija",
  type: "Vivienda familiar demostrativa",
  city: "Tarija, Bolivia",
};

export const buildings: Building[] = [
  { id: "home-main", institutionId: institution.id, name: "Vivienda principal" },
];

export const environments: Environment[] = [
  { id: "sala", buildingId: "home-main", name: "Sala", type: "Área social", status: "normal", occupancyCapacity: 5 },
  { id: "cocina", buildingId: "home-main", name: "Cocina", type: "Cocina", status: "potential-waste", occupancyCapacity: 4 },
  { id: "dormitorio", buildingId: "home-main", name: "Dormitorio principal", type: "Dormitorio", status: "warning", occupancyCapacity: 2 },
  { id: "pasillo", buildingId: "home-main", name: "Ingreso y pasillo", type: "Circulación", status: "potential-waste", occupancyCapacity: 4 },
  { id: "lavanderia", buildingId: "home-main", name: "Lavandería", type: "Servicio", status: "offline", occupancyCapacity: 2 },
];

const snapshotOverrides: Record<string, Partial<SensorSnapshot>> = {
  sala: { presenceDetected: true, minutesWithoutActivity: 0, lightOn: true, lightRaw: 350, powerWatts: 185, temperatureCelsius: 24.8, humidityPercent: 53, airChangePercent: 3 },
  cocina: { presenceDetected: false, minutesWithoutActivity: 42, lightOn: true, lightRaw: 340, powerWatts: 620, temperatureCelsius: 26.1, humidityPercent: 57, airChangePercent: 5 },
  dormitorio: { presenceDetected: true, minutesWithoutActivity: 0, lightOn: false, lightRaw: 690, powerWatts: 115, temperatureCelsius: 29.2, humidityPercent: 60, airChangePercent: 9 },
  pasillo: { presenceDetected: false, minutesWithoutActivity: 65, lightOn: true, lightRaw: 290, powerWatts: 82, temperatureCelsius: 23.4, humidityPercent: 58, airChangePercent: 4 },
  lavanderia: { presenceDetected: false, minutesWithoutActivity: 25, lightOn: false, lightRaw: 720, powerWatts: 0, temperatureCelsius: 0, humidityPercent: 0, airChangePercent: 0, nodeOnline: false },
};

export const createSnapshot = (environmentId: string): SensorSnapshot => ({
  environmentId,
  recordedAt: "2026-08-28T20:30:00-04:00",
  presenceDetected: false,
  minutesWithoutActivity: 0,
  lightOn: false,
  lightRaw: 700,
  powerWatts: 0,
  energyKwh: Number((((snapshotOverrides[environmentId]?.powerWatts ?? 0) * 5 * 30) / 1000).toFixed(2)),
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
      const homeActive = hour === 6 || hour === 18 || hour === 22;
      const kitchenWaste = environmentId === "cocina" && day === 1 && hour === 15;
      const hallwayWaste = environmentId === "pasillo" && hour === 22;
      const timestamp = new Date(Date.UTC(2026, 7, 28 - day, hour, 0, 0)).toISOString();
      const factor = homeActive ? 0.78 + (hour % 3) * 0.09 : 0.08;
      points.push({
        ...base,
        recordedAt: timestamp,
        presenceDetected: homeActive && !kitchenWaste && !hallwayWaste,
        minutesWithoutActivity: homeActive && !kitchenWaste && !hallwayWaste ? 0 : hour === 22 ? 65 : 35,
        lightOn: homeActive || kitchenWaste || hallwayWaste,
        powerWatts: Number((base.powerWatts * (kitchenWaste || hallwayWaste ? 0.9 : factor)).toFixed(1)),
        temperatureCelsius: Number((base.temperatureCelsius + (hour >= 12 && hour <= 18 ? 1.2 : -0.5)).toFixed(1)),
        humidityPercent: Number(Math.max(0, base.humidityPercent + (hour === 6 ? 4 : 0)).toFixed(1)),
        airChangePercent: environmentId === "dormitorio" && day === 2 && hour === 22 ? 13 : base.airChangePercent,
      });
    }
  }
  return points;
};

export const initialAlerts: Alert[] = [
  { id: "alert-cocina", environmentId: "cocina", type: "energy", severity: "critical", status: "new", title: "Posible desperdicio en la cocina", description: "No se detectó actividad durante 42 min y el consumo simulado es 620 W.", recommendation: "Comprobar si los equipos deben continuar encendidos antes de desconectarlos.", evidence: { powerWatts: 620, minutesWithoutActivity: 42 }, openedAt: "2026-08-28T20:20:00-04:00", source: "simulated" },
  { id: "alert-pasillo", environmentId: "pasillo", type: "lighting", severity: "warning", status: "new", title: "Iluminación posiblemente innecesaria", description: "El ingreso mantiene iluminación sin actividad detectada.", recommendation: "Revisar si la luz puede apagarse de forma segura.", evidence: { lightOn: true, minutesWithoutActivity: 65 }, openedAt: "2026-08-28T19:55:00-04:00", source: "simulated" },
  { id: "alert-bedroom-air", environmentId: "dormitorio", type: "air", severity: "warning", status: "acknowledged", title: "Cambio relativo del aire", description: "La variación respecto a la línea base simulada requiere seguimiento; no representa ppm.", recommendation: "Ventilar y contrastar con instrumentación profesional si la condición persiste.", evidence: { airChangePercent: 13 }, openedAt: "2026-08-27T22:00:00-04:00", source: "simulated" },
  { id: "alert-temperature", environmentId: "dormitorio", type: "temperature", severity: "warning", status: "closed", title: "Temperatura elevada", description: "La temperatura simulada alcanzó 30.4 °C.", recommendation: "Revisar ventilación y fuentes de calor.", evidence: { temperatureCelsius: 30.4 }, openedAt: "2026-08-26T18:00:00-04:00", source: "simulated" },
  { id: "alert-offline", environmentId: "lavanderia", type: "connectivity", severity: "critical", status: "new", title: "Nodo desconectado", description: "No se reciben datos simulados del nodo de lavandería.", recommendation: "Comprobar la alimentación de baja tensión y la conectividad del nodo.", evidence: { nodeOnline: false }, openedAt: "2026-08-28T20:10:00-04:00", source: "simulated" },
];
