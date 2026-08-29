import type { EstimatedResult, SimulationInput } from "./types";

export interface EstimateParams {
  powerWatts: number;
  avoidablePowerWatts: number;
  waterFlowLpm: number;
  avoidableWaterFlowLpm: number;
  hoursPerDay: number;
  avoidableHoursPerDay: number;
  daysPerMonth: number;
  electricityTariffBs: number;
  waterTariffBsPerM3: number;
  emissionFactorKgPerKwh: number;
}

// 1. Cálculos de Energía
export const calculateEnergyKwh = (
  powerWatts: number,
  hoursPerDay: number,
  daysPerMonth: number,
): number => (powerWatts * hoursPerDay * daysPerMonth) / 1000;

export const calculateElectricityCostBs = (
  energyKwh: number,
  tariffBs: number,
): number => energyKwh * tariffBs;

export const calculateEstimatedCo2Kg = (
  energyKwh: number,
  factorKgPerKwh: number,
): number => energyKwh * factorKgPerKwh;

// 2. Cálculos de Agua
// 1 m3 = 1000 Litros
export const calculateWaterLiters = (
  flowLpm: number,
  hoursPerDay: number,
  daysPerMonth: number,
): number => flowLpm * 60 * hoursPerDay * daysPerMonth;

export const calculateWaterCostBs = (
  liters: number,
  tariffBsPerM3: number,
): number => (liters / 1000) * tariffBsPerM3;

// 3. Estimación Integral (Energía + Agua + CO2)
export const calculateEstimate = (params: EstimateParams): EstimatedResult => {
  // Energía
  const energyKwh = calculateEnergyKwh(
    params.powerWatts,
    params.hoursPerDay,
    params.daysPerMonth,
  );
  const costBs = calculateElectricityCostBs(
    energyKwh,
    params.electricityTariffBs,
  );
  const avoidableEnergyKwh = calculateEnergyKwh(
    params.avoidablePowerWatts,
    params.avoidableHoursPerDay,
    params.daysPerMonth,
  );
  const potentialSavingBs = calculateElectricityCostBs(
    avoidableEnergyKwh,
    params.electricityTariffBs,
  );

  // Agua
  const waterLitersMonth = calculateWaterLiters(
    params.waterFlowLpm,
    params.hoursPerDay,
    params.daysPerMonth,
  );
  const waterCostBs = calculateWaterCostBs(
    waterLitersMonth,
    params.waterTariffBsPerM3,
  );
  const avoidableWaterLiters = calculateWaterLiters(
    params.avoidableWaterFlowLpm,
    params.avoidableHoursPerDay,
    params.daysPerMonth,
  );
  const waterSavingBs = calculateWaterCostBs(
    avoidableWaterLiters,
    params.waterTariffBsPerM3,
  );

  // Ahorro Combinado
  const totalSavingBs = potentialSavingBs + waterSavingBs;

  // Huella de Carbono
  const co2CurrentKg = calculateEstimatedCo2Kg(
    energyKwh,
    params.emissionFactorKgPerKwh,
  );
  const co2AvoidedKg = calculateEstimatedCo2Kg(
    avoidableEnergyKwh,
    params.emissionFactorKgPerKwh,
  );
  const co2ReductionPercent =
    co2CurrentKg > 0
      ? Math.min(100, Math.round((co2AvoidedKg / co2CurrentKg) * 100))
      : 0;

  return {
    energyKwh: Number(energyKwh.toFixed(1)),
    costBs: Number(costBs.toFixed(2)),
    avoidableEnergyKwh: Number(avoidableEnergyKwh.toFixed(1)),
    potentialSavingBs: Number(potentialSavingBs.toFixed(2)),

    waterLitersMonth: Math.round(waterLitersMonth),
    waterCostBs: Number(waterCostBs.toFixed(2)),
    avoidableWaterLiters: Math.round(avoidableWaterLiters),
    waterSavingBs: Number(waterSavingBs.toFixed(2)),

    totalSavingBs: Number(totalSavingBs.toFixed(2)),

    co2CurrentKg: Number(co2CurrentKg.toFixed(1)),
    co2AvoidedKg: Number(co2AvoidedKg.toFixed(1)),
    co2ReductionPercent,

    source: "estimated",
    assumptions: [
      `Potencia base: ${params.powerWatts} W · ${params.hoursPerDay} h/día`,
      `Caudal de agua: ${params.waterFlowLpm.toFixed(1)} L/min`,
      `Tarifa eléctrica: Bs ${params.electricityTariffBs.toFixed(2)}/kWh`,
      `Tarifa de agua: Bs ${params.waterTariffBsPerM3.toFixed(2)}/m³ (Bs ${(params.waterTariffBsPerM3 / 1000).toFixed(4)}/L)`,
      `Factor emisión: ${params.emissionFactorKgPerKwh.toFixed(2)} kg CO₂/kWh`,
    ],
  };
};

export const estimateFromSimulation = (
  input: SimulationInput,
  isAvoidableEnergy = false,
  isAvoidableWater = false,
): EstimatedResult => {
  const electricityTariff =
    input.electricityTariffBs && input.electricityTariffBs > 0
      ? input.electricityTariffBs
      : 0.85;

  const waterTariff =
    input.waterTariffBsPerM3 && input.waterTariffBsPerM3 > 0
      ? input.waterTariffBsPerM3
      : 3.5;

  const emissionFactor =
    input.emissionFactorKgPerKwh && input.emissionFactorKgPerKwh > 0
      ? input.emissionFactorKgPerKwh
      : 0.45;

  const hasAvoidableEnergy =
    isAvoidableEnergy || input.powerWatts > 10 || !input.presenceDetected;

  const hasAvoidableWater =
    isAvoidableWater || input.waterFlowLpm > 0.01;

  const avoidableHours = Math.max(
    0.5,
    Math.min(
      input.hoursPerDay,
      input.minutesWithoutActivity > 0
        ? input.minutesWithoutActivity / 60
        : Math.max(1, input.hoursPerDay * 0.75),
    ),
  );

  const avoidablePower = hasAvoidableEnergy
    ? Math.max(
        0,
        input.powerWatts > 20 ? input.powerWatts - 12 : input.powerWatts * 0.5,
      )
    : 0;

  const avoidableWater = hasAvoidableWater ? input.waterFlowLpm : 0;

  return calculateEstimate({
    powerWatts: input.powerWatts,
    avoidablePowerWatts: avoidablePower,
    waterFlowLpm: input.waterFlowLpm,
    avoidableWaterFlowLpm: avoidableWater,
    hoursPerDay: Math.max(0.5, input.hoursPerDay || 4),
    avoidableHoursPerDay: avoidableHours,
    daysPerMonth: Math.max(1, input.daysPerMonth || 30),
    electricityTariffBs: electricityTariff,
    waterTariffBsPerM3: waterTariff,
    emissionFactorKgPerKwh: emissionFactor,
  });
};
