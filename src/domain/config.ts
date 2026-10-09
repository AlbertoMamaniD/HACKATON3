import type { EcoAhorroConfig } from "./types";

export const DEFAULT_CONFIG: EcoAhorroConfig = {
  electricityTariffBs: 0.92, // Bs / kWh
  waterTariffBsPerM3: 4.5, // Bs / m3 (equivale a Bs 0.0045 por litro)
  emissionFactorKgPerKwh: 0.48, // kg CO2 / kWh
  minimumPowerWatts: 30, // W standby
  waterLeakThresholdLpm: 0.3, // L/min considerado fuga o grifo abierto
  toleranceMinutes: 15, // Minutos sin actividad para alertar
  airWarningPercent: 5, // % cambio MQ-135 nivel regular
  airAlertPercent: 12, // % cambio MQ-135 nivel malo / alerta
  lightDirection: "lower-is-brighter",
};

export const REQUIRED_DISCLAIMER =
  "Resultados estimados a partir de datos simulados de EcoAhorro. No constituye una certificación oficial ni reemplaza a la factura de luz o agua.";

export const STORAGE_KEYS = {
  config: "ecoahorro:config:v1",
  alerts: "ecoahorro:alerts:v1",
  scenario: "ecoahorro:last-scenario:v1",
  bills: "ecoahorro:bill-amounts:v1",
} as const;

/**
 * Umbrales de las alertas en vivo (Dashboard, Alertas, notificaciones).
 * Los umbrales de Configuración solo afectan al simulador.
 */
export const LIVE_ALERT_THRESHOLDS = {
  /** Caudal anormal: posible fuga o grifo abierto (L/min). */
  waterLpm: 4.5,
  /** Potencia alta: equipos de alto consumo encendidos (W). */
  powerW: 250,
} as const;
