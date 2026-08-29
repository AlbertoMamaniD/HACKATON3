import type {
  Alert,
  Building,
  Environment,
  Institution,
  SensorSnapshot,
} from "../domain/types";

export const institution: Institution = {
  id: "casa-eco-ahorro",
  name: "Mi Casa",
  type: "Vivienda residencial",
  city: "Tarija, Bolivia",
};

export const buildings: Building[] = [
  { id: "vivienda", institutionId: institution.id, name: "Mi Casa" },
];

export const environments: Environment[] = [
  {
    id: "casa",
    buildingId: "vivienda",
    name: "Mi Casa",
    type: "Vivienda",
    status: "normal",
    occupancyCapacity: 4,
  },
];

const snapshotOverrides: Record<string, Partial<SensorSnapshot>> = {
  casa: {
    presenceDetected: true,
    minutesWithoutActivity: 0,
    powerWatts: 145,
    energyKwh: 12.4,
    waterFlowLpm: 0,
    waterLitersTotal: 340,
    airChangePercent: 2.8,
    gasLevel: "bueno",
    lightOn: true,
    lightRaw: 380,
  },
};

export const createSnapshot = (environmentId: string): SensorSnapshot => ({
  environmentId,
  recordedAt: "2026-08-28T20:30:00-04:00",
  presenceDetected: false,
  minutesWithoutActivity: 0,
  powerWatts: 0,
  energyKwh: 0,
  waterFlowLpm: 0,
  waterLitersTotal: 0,
  airChangePercent: 0,
  gasLevel: "bueno",
  lightOn: false,
  lightRaw: 700,
  nodeOnline: true,
  source: "simulated",
  ...snapshotOverrides[environmentId],
});

export const generateHistory = (
  environmentId: string,
  days = 7,
): SensorSnapshot[] => {
  const base = createSnapshot(environmentId);
  const points: SensorSnapshot[] = [];

  for (let day = days - 1; day >= 0; day -= 1) {
    for (const hour of [6, 9, 12, 15, 18, 22]) {
      const active = hour >= 8 && hour <= 22;
      const timestamp = new Date(
        Date.UTC(2026, 7, 28 - day, hour, 0, 0),
      ).toISOString();

      const powerWatts = active ? 160 + (hour % 5) * 35 : 18;
      const waterFlowLpm = hour === 12 || hour === 18 ? 3.5 : 0;
      const airChange = active ? 3.5 + (hour % 4) * 1.2 : 1.8;

      points.push({
        ...base,
        recordedAt: timestamp,
        presenceDetected: active,
        minutesWithoutActivity: active ? 0 : 60,
        powerWatts,
        energyKwh: Number(((powerWatts * hour) / 1000).toFixed(2)),
        waterFlowLpm,
        waterLitersTotal: Number((waterFlowLpm * 25 + day * 120).toFixed(0)),
        airChangePercent: Number(airChange.toFixed(1)),
        gasLevel: airChange > 12 ? "malo" : airChange > 5 ? "regular" : "bueno",
        lightOn: active,
        lightRaw: active ? 320 : 820,
      });
    }
  }

  return points;
};

export const initialAlerts: Alert[] = [];
