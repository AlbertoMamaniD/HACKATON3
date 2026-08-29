export type DataOrigin = "simulated" | "real" | "manual" | "estimated";
export type EnvironmentStatus =
  | "normal"
  | "warning"
  | "potential-waste"
  | "environmental-alert"
  | "water-leak"
  | "offline"
  | "sensor-error"
  | "no-data";

export type AlertSeverity = "info" | "warning" | "critical";
export type AlertStatus = "new" | "acknowledged" | "closed";

export interface Institution {
  id: string;
  name: string;
  type: string;
  city: string;
}

export interface Building {
  id: string;
  institutionId: string;
  name: string;
}

export interface Environment {
  id: string;
  buildingId: string;
  name: string;
  type: string;
  status: EnvironmentStatus;
  occupancyCapacity: number;
}

export interface SensorSnapshot {
  environmentId: string;
  recordedAt: string;
  presenceDetected: boolean;
  minutesWithoutActivity: number;

  // 1. Energía
  powerWatts: number;
  energyKwh: number;

  // 2. Agua
  waterFlowLpm: number; // Litros por minuto instantáneos
  waterLitersTotal: number; // Litros acumulados

  // 3. Gases / Calidad de aire (MQ-135)
  airChangePercent: number; // % variación relativa MQ-135
  gasLevel: "bueno" | "regular" | "malo" | "desconocido";

  // 4. Iluminación (KY-018)
  lightOn: boolean;
  lightRaw: number;
  lightPct?: number;
  segundosLuzContinua?: number;

  nodeOnline: boolean;
  sensorError?: boolean;
  source: "simulated" | "real";
}

export interface Alert {
  id: string;
  environmentId: string;
  type: string;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string;
  recommendation: string;
  evidence: Record<string, unknown>;
  openedAt: string;
  source: "simulated" | "real";
}

export interface EstimatedResult {
  // Energía
  energyKwh: number;
  costBs: number;
  avoidableEnergyKwh: number;
  potentialSavingBs: number;

  // Agua
  waterLitersMonth: number;
  waterCostBs: number;
  avoidableWaterLiters: number;
  waterSavingBs: number;

  // Total combinado
  totalSavingBs: number;

  // Huella de Carbono / CO2
  co2CurrentKg: number;
  co2AvoidedKg: number;
  co2ReductionPercent: number;

  source: "estimated";
  assumptions: string[];
}

export interface EcoAhorroConfig {
  electricityTariffBs: number; // Bs/kWh (ej. 0.92)
  waterTariffBsPerM3: number; // Bs/m3 (ej. 4.50 -> Bs 0.0045/L)
  emissionFactorKgPerKwh: number; // kg CO2/kWh (ej. 0.48)
  minimumPowerWatts: number; // Umbral standby (ej. 30 W)
  waterLeakThresholdLpm: number; // Umbral fuga de agua (ej. 0.3 L/min)
  toleranceMinutes: number; // Minutos sin presencia para alertar (ej. 15)
  airWarningPercent: number; // % MQ-135 regular (ej. 5%)
  airAlertPercent: number; // % MQ-135 malo/alerta (ej. 12%)
  lightDirection: "lower-is-brighter" | "higher-is-brighter";
}

export interface SimulationInput {
  scenarioId: string;
  presenceDetected: boolean;
  powerWatts: number;
  waterFlowLpm: number; // Litros por minuto
  lightOn: boolean;
  lightRaw: number;
  airChangePercent: number;
  minutesWithoutActivity: number;
  nodeOnline: boolean;
  sensorError: boolean;
  hoursPerDay: number;
  daysPerMonth: number;
  electricityTariffBs: number;
  waterTariffBsPerM3: number;
  emissionFactorKgPerKwh: number;
}

export interface RuleEvaluation {
  status: EnvironmentStatus;
  potentialWaste: boolean; // Desperdicio eléctrico
  waterWaste: boolean; // Fuga / desperdicio de agua
  unnecessaryLighting: boolean; // Luz encendida en vacío
  airLevel: "normal" | "warning" | "alert"; // Gases MQ-135
  title: string;
  explanation: string;
  recommendation: string;
}

export interface SimulationResult {
  input: SimulationInput;
  evaluation: RuleEvaluation;
  estimate: EstimatedResult;
  alert: Alert | null;
  appliedRecommendation: boolean;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  input: SimulationInput;
}