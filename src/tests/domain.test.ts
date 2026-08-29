import { DEFAULT_CONFIG } from "../domain/config";
import { calculateCostBs, calculateEnergyKwh, calculateEstimatedCo2Kg, estimateFromSimulation } from "../domain/calculations";
import { applyRecommendation, evaluateHumidity, evaluateSimulation, evaluateTemperature } from "../domain/rules";
import { getScenario } from "../data/scenarios";

describe("reglas de EcoAhorro", () => {
  it("mantiene normal un hogar con actividad", () => { expect(evaluateSimulation(getScenario("normal").input, DEFAULT_CONFIG).status).toBe("normal"); });
  it("detecta posible desperdicio en una casa sin actividad con consumo", () => { const result = evaluateSimulation(getScenario("empty-consumption").input, DEFAULT_CONFIG); expect(result.potentialWaste).toBe(true); expect(result.status).toBe("potential-waste"); });
  it("detecta iluminación posiblemente innecesaria", () => { expect(evaluateSimulation(getScenario("light-no-activity").input, DEFAULT_CONFIG).unnecessaryLighting).toBe(true); });
  it("aplica una recomendación energética", () => { const input = getScenario("empty-consumption").input; const evaluation = evaluateSimulation(input, DEFAULT_CONFIG); const corrected = applyRecommendation(input, evaluation); expect(corrected.powerWatts).toBeLessThan(input.powerWatts); expect(corrected.lightOn).toBe(false); });
  it("aplica histéresis de temperatura", () => { expect(evaluateTemperature(30, false, DEFAULT_CONFIG)).toBe(true); expect(evaluateTemperature(29.2, true, DEFAULT_CONFIG)).toBe(true); expect(evaluateTemperature(28.9, true, DEFAULT_CONFIG)).toBe(false); });
  it("aplica histéresis de humedad", () => { expect(evaluateHumidity(70, false, DEFAULT_CONFIG)).toBe(true); expect(evaluateHumidity(68, true, DEFAULT_CONFIG)).toBe(true); expect(evaluateHumidity(66.9, true, DEFAULT_CONFIG)).toBe(false); });
  it("clasifica cambio relativo del aire sin usar ppm", () => { const result = evaluateSimulation(getScenario("air-change").input, DEFAULT_CONFIG); expect(result.airLevel).toBe("alert"); expect(result.status).toBe("environmental-alert"); });
  it("gestiona nodo desconectado y sensor con error", () => { expect(evaluateSimulation(getScenario("offline").input, DEFAULT_CONFIG).status).toBe("offline"); expect(evaluateSimulation(getScenario("sensor-error").input, DEFAULT_CONFIG).status).toBe("sensor-error"); });
});

describe("cálculos estimados", () => {
  it("calcula energía", () => expect(calculateEnergyKwh(1000, 2, 20)).toBe(40));
  it("calcula costo", () => expect(calculateCostBs(40, .92)).toBeCloseTo(36.8));
  it("calcula CO₂ estimado", () => expect(calculateEstimatedCo2Kg(40, .48)).toBeCloseTo(19.2));
  it("calcula ahorro potencial del escenario", () => { const input = getScenario("empty-consumption").input; const result = estimateFromSimulation(input, true); expect(result.avoidableEnergyKwh).toBeGreaterThan(0); expect(result.potentialSavingBs).toBeCloseTo(result.avoidableEnergyKwh * input.electricityTariffBs); });
});
