import { z } from "zod";

export const configSchema = z.object({
  electricityTariffBs: z.number().min(0.01).max(20),
  emissionFactorKgPerKwh: z.number().min(0).max(5),
  minimumPowerWatts: z.number().min(0).max(10000),
  toleranceMinutes: z.number().int().min(0).max(1440),
  temperatureAlertCelsius: z.number().min(10).max(60),
  temperatureNormalCelsius: z.number().min(5).max(59),
  humidityAlertPercent: z.number().min(1).max(100),
  humidityNormalPercent: z.number().min(0).max(99),
  airWarningPercent: z.number().min(0).max(100),
  airAlertPercent: z.number().min(0).max(100),
  lightDirection: z.enum(["lower-is-brighter", "higher-is-brighter"]),
}).refine((value) => value.temperatureNormalCelsius < value.temperatureAlertCelsius, { message: "El retorno normal de temperatura debe ser menor al umbral de alerta." })
  .refine((value) => value.humidityNormalPercent < value.humidityAlertPercent, { message: "El retorno normal de humedad debe ser menor al umbral de alerta." })
  .refine((value) => value.airWarningPercent < value.airAlertPercent, { message: "La advertencia de aire debe ser menor a la alerta." });

export const alertStatusSchema = z.enum(["new", "acknowledged", "closed"]);
