import { z } from "zod";

export const configSchema = z
  .object({
    electricityTariffBs: z.number().min(0.01).max(20),
    waterTariffBsPerM3: z.number().min(0.01).max(50),
    emissionFactorKgPerKwh: z.number().min(0).max(5),
    minimumPowerWatts: z.number().min(0).max(10000),
    waterLeakThresholdLpm: z.number().min(0.05).max(50),
    toleranceMinutes: z.number().int().min(0).max(1440),
    airWarningPercent: z.number().min(0).max(100),
    airAlertPercent: z.number().min(0).max(100),
    lightDirection: z.enum(["lower-is-brighter", "higher-is-brighter"]),
  })
  .refine((value) => value.airWarningPercent < value.airAlertPercent, {
    message: "La advertencia de gases/aire debe ser menor a la alerta.",
  });

export const alertStatusSchema = z.enum(["new", "acknowledged", "closed"]);
