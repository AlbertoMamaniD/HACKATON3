export type DataOrigin = "simulated" | "real" | "manual" | "estimated";
export type EnvironmentStatus = "normal" | "warning" | "potential-waste" | "environmental-alert" | "offline" | "sensor-error" | "no-data";
export type AlertSeverity = "info" | "warning" | "critical";
export type AlertStatus = "new" | "acknowledged" | "closed";

export interface Institution { id: string; name: string; type: string; city: string }
export interface Building { id: string; institutionId: string; name: string }
export interface Environment { id: string; buildingId: string; name: string; type: string; status: EnvironmentStatus; occupancyCapacity: number }

export interface SensorSnapshot {
  environmentId: string;
  recordedAt: string;
  presenceDetected: boolean;
  minutesWithoutActivity: number;
  lightOn: boolean;
  lightRaw: number;
  powerWatts: number;
  energyKwh: number;
  temperatureCelsius: number;
  humidityPercent: number;
  airChangePercent: number;
  nodeOnline: boolean;
  sensorError?: boolean;
  source: "simulated";
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
  source: "simulated";
}

export interface EstimatedResult {
  energyKwh: number;
  costBs: number;
  avoidableEnergyKwh: number;
  potentialSavingBs: number;
  estimatedCo2Kg: number;
  source: "estimated";
  assumptions: string[];
}

export interface EcoAhorroConfig {
  electricityTariffBs: number;
  emissionFactorKgPerKwh: number;
  minimumPowerWatts: number;
  toleranceMinutes: number;
  temperatureAlertCelsius: number;
  temperatureNormalCelsius: number;
  humidityAlertPercent: number;
  humidityNormalPercent: number;
  airWarningPercent: number;
  airAlertPercent: number;
  lightDirection: "lower-is-brighter" | "higher-is-brighter";
}

export interface SimulationInput {
  scenarioId: string;
  presenceDetected: boolean;
  lightOn: boolean;
  powerWatts: number;
  minutesWithoutActivity: number;
  temperatureCelsius: number;
  humidityPercent: number;
  lightRaw: number;
  airChangePercent: number;
  nodeOnline: boolean;
  sensorError: boolean;
  hoursPerDay: number;
  daysPerMonth: number;
  electricityTariffBs: number;
  emissionFactorKgPerKwh: number;
}

export interface RuleEvaluation {
  status: EnvironmentStatus;
  potentialWaste: boolean;
  unnecessaryLighting: boolean;
  temperatureAlert: boolean;
  humidityAlert: boolean;
  airLevel: "normal" | "warning" | "alert";
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

export interface Scenario { id: string; name: string; description: string; input: SimulationInput }
