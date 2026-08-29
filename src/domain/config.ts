import type { EcoAhorroConfig } from "./types";

export const DEFAULT_CONFIG: EcoAhorroConfig = {
  electricityTariffBs: 0.92,
  emissionFactorKgPerKwh: 0.48,
  minimumPowerWatts: 40,
  toleranceMinutes: 15,
  temperatureAlertCelsius: 30,
  temperatureNormalCelsius: 29,
  humidityAlertPercent: 70,
  humidityNormalPercent: 67,
  airWarningPercent: 8,
  airAlertPercent: 12,
  lightDirection: "lower-is-brighter",
};

export const REQUIRED_DISCLAIMER = "Resultados estimados a partir de datos simulados de EcoAhorro. No constituye una certificación oficial de huella de carbono.";

export const STORAGE_KEYS = {
  config: "ecoahorro:config:v1",
  alerts: "ecoahorro:alerts:v1",
  scenario: "ecoahorro:last-scenario:v1",
} as const;
