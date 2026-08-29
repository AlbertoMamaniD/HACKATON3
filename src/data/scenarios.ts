import { DEFAULT_CONFIG } from "../domain/config";
import type { Scenario, SimulationInput } from "../domain/types";

const baseInput: SimulationInput = {
  scenarioId: "normal",
  presenceDetected: true,
  lightOn: true,
  powerWatts: 210,
  minutesWithoutActivity: 0,
  temperatureCelsius: 24.5,
  humidityPercent: 54,
  lightRaw: 360,
  airChangePercent: 3,
  nodeOnline: true,
  sensorError: false,
  hoursPerDay: 6,
  daysPerMonth: 22,
  electricityTariffBs: DEFAULT_CONFIG.electricityTariffBs,
  emissionFactorKgPerKwh: DEFAULT_CONFIG.emissionFactorKgPerKwh,
};

const make = (id: string, name: string, description: string, changes: Partial<SimulationInput>): Scenario => ({
  id, name, description, input: { ...baseInput, ...changes, scenarioId: id },
});

export const scenarios: Scenario[] = [
  make("normal", "Clase normal", "Actividad y consumo coherentes con una clase en curso.", {}),
  make("empty-consumption", "Aula vacía con consumo", "No se detectó actividad, pero los equipos continúan consumiendo.", { presenceDetected: false, lightOn: true, powerWatts: 420, minutesWithoutActivity: 45, hoursPerDay: 4 }),
  make("light-no-activity", "Luz encendida sin actividad", "La iluminación permanece encendida fuera de uso.", { presenceDetected: false, lightOn: true, powerWatts: 95, minutesWithoutActivity: 30, hoursPerDay: 3 }),
  make("high-temperature", "Temperatura elevada", "Condición térmica por encima del umbral demostrativo.", { temperatureCelsius: 31.5, humidityPercent: 59 }),
  make("high-humidity", "Humedad elevada", "Humedad relativa por encima del umbral configurado.", { temperatureCelsius: 26, humidityPercent: 74 }),
  make("air-change", "Cambio desfavorable del aire", "Cambio relativo respecto a la línea base simulada.", { airChangePercent: 14 }),
  make("sensor-error", "Sensor con error", "Una lectura simulada no es confiable.", { sensorError: true, powerWatts: 0 }),
  make("offline", "Nodo desconectado", "El nodo dejó de enviar datos simulados.", { nodeOnline: false, powerWatts: 0 }),
  make("custom", "Personalizado", "Ajusta cada variable para explorar las reglas.", { powerWatts: 180, minutesWithoutActivity: 10 }),
];

export const getScenario = (id: string) => scenarios.find((scenario) => scenario.id === id) ?? scenarios[0];
