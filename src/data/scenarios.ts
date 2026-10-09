import { DEFAULT_CONFIG } from "../domain/config";
import type { Scenario, SimulationInput } from "../domain/types";

const baseInput: SimulationInput = {
  scenarioId: "normal",
  presenceDetected: true,
  powerWatts: 160,
  waterFlowLpm: 0,
  lightOn: true,
  lightRaw: 380,
  airChangePercent: 3.2,
  minutesWithoutActivity: 0,
  nodeOnline: true,
  sensorError: false,
  hoursPerDay: 5,
  daysPerMonth: 30,
  electricityTariffBs: DEFAULT_CONFIG.electricityTariffBs,
  waterTariffBsPerM3: DEFAULT_CONFIG.waterTariffBsPerM3,
  emissionFactorKgPerKwh: DEFAULT_CONFIG.emissionFactorKgPerKwh,
};

const make = (
  id: string,
  name: string,
  description: string,
  changes: Partial<SimulationInput>,
): Scenario => ({
  id,
  name,
  description,
  input: { ...baseInput, ...changes, scenarioId: id },
});

export const scenarios: Scenario[] = [
  make(
    "empty-consumption",
    "Fuga de agua y consumo fantasma",
    "Grifo goteando (3.6 L/min) y electrodomésticos en reposo (380 W) sin personas presentes.",
    {
      presenceDetected: false,
      powerWatts: 380,
      waterFlowLpm: 3.6,
      lightOn: true,
      minutesWithoutActivity: 45,
      hoursPerDay: 4,
    },
  ),
  make(
    "water-leak",
    "Fuga de agua en sanitario o jardín",
    "Caudal constante de 4.8 L/min detectado en ausencia, generando desperdicio hídrico.",
    {
      presenceDetected: false,
      waterFlowLpm: 4.8,
      powerWatts: 35,
      lightOn: false,
      minutesWithoutActivity: 30,
      hoursPerDay: 5,
    },
  ),
  make(
    "light-no-activity",
    "Iluminación encendida sin actividad",
    "Luminarias encendidas (95 W) en una zona desocupada durante más de 30 minutos.",
    {
      presenceDetected: false,
      lightOn: true,
      powerWatts: 95,
      waterFlowLpm: 0,
      minutesWithoutActivity: 35,
      hoursPerDay: 3,
    },
  ),
  make(
    "normal",
    "Hogar eficiente en uso normal",
    "Actividad coordinada, consumo eléctrico adecuado (85 W) y sin fugas de agua.",
    {
      presenceDetected: true,
      powerWatts: 85,
      waterFlowLpm: 0,
      lightOn: true,
      airChangePercent: 2.1,
    },
  ),
  make(
    "custom",
    "Hogar personalizado",
    "Ajusta potencia, flujo de agua e iluminación libremente.",
    {
      powerWatts: 220,
      waterFlowLpm: 1.5,
      minutesWithoutActivity: 10,
    },
  ),
];

export const getScenario = (id: string): Scenario =>
  scenarios.find((scenario) => scenario.id === id) ?? scenarios[0];
