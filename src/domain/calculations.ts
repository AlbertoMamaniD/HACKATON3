import type { EstimatedResult, SimulationInput } from "./types";

export interface EstimateParams {
  powerWatts: number;
  avoidablePowerWatts: number;
  hoursPerDay: number;
  avoidableHoursPerDay: number;
  daysPerMonth: number;
  electricityTariffBs: number;
  emissionFactorKgPerKwh: number;
}

export const calculateEnergyKwh = (powerWatts: number, hoursPerDay: number, daysPerMonth: number) =>
  (powerWatts * hoursPerDay * daysPerMonth) / 1000;

export const calculateCostBs = (energyKwh: number, tariffBs: number) => energyKwh * tariffBs;
export const calculateEstimatedCo2Kg = (energyKwh: number, factor: number) => energyKwh * factor;

export const calculateEstimate = (params: EstimateParams): EstimatedResult => {
  const energyKwh = calculateEnergyKwh(params.powerWatts, params.hoursPerDay, params.daysPerMonth);
  const costBs = calculateCostBs(energyKwh, params.electricityTariffBs);
  const avoidableEnergyKwh = calculateEnergyKwh(params.avoidablePowerWatts, params.avoidableHoursPerDay, params.daysPerMonth);
  return {
    energyKwh,
    costBs,
    avoidableEnergyKwh,
    potentialSavingBs: calculateCostBs(avoidableEnergyKwh, params.electricityTariffBs),
    estimatedCo2Kg: calculateEstimatedCo2Kg(avoidableEnergyKwh, params.emissionFactorKgPerKwh),
    source: "estimated",
    assumptions: [
      `Potencia: ${params.powerWatts} W`,
      `Uso: ${params.hoursPerDay} h/día`,
      `Periodo: ${params.daysPerMonth} días/mes`,
      `Tarifa: Bs ${params.electricityTariffBs.toFixed(2)}/kWh`,
      `Factor: ${params.emissionFactorKgPerKwh.toFixed(2)} kg CO₂/kWh`,
    ],
  };
};

export const estimateFromSimulation = (input: SimulationInput, isAvoidable: boolean) => calculateEstimate({
  powerWatts: input.powerWatts,
  avoidablePowerWatts: isAvoidable ? input.powerWatts : 0,
  hoursPerDay: input.hoursPerDay,
  avoidableHoursPerDay: isAvoidable ? Math.min(input.hoursPerDay, input.minutesWithoutActivity / 60) : 0,
  daysPerMonth: input.daysPerMonth,
  electricityTariffBs: input.electricityTariffBs,
  emissionFactorKgPerKwh: input.emissionFactorKgPerKwh,
});
