import { DEFAULT_CONFIG } from "../domain/config";
import {
  calculateElectricityCostBs,
  calculateEnergyKwh,
  calculateEstimatedCo2Kg,
  calculateWaterCostBs,
  calculateWaterLiters,
  estimateFromSimulation,
} from "../domain/calculations";
import {
  applyRecommendation,
  evaluateAir,
  evaluateSimulation,
  evaluateWaterLeak,
} from "../domain/rules";
import { getScenario } from "../data/scenarios";

describe("reglas de EcoAhorro (Agua, Energía, MQ-135, Iluminación)", () => {
  it("mantiene normal un hogar con consumo eficiente", () => {
    expect(
      evaluateSimulation(getScenario("normal").input, DEFAULT_CONFIG).status,
    ).toBe("normal");
  });

  it("detecta fuga de agua o consumo hídrico en ausencia", () => {
    const leak = evaluateWaterLeak(3.5, false, 20, DEFAULT_CONFIG);
    expect(leak).toBe(true);

    const result = evaluateSimulation(
      getScenario("water-leak").input,
      DEFAULT_CONFIG,
    );
    expect(result.waterWaste).toBe(true);
    expect(result.status).toBe("water-leak");
  });

  it("detecta posible desperdicio eléctrico en una casa sin actividad", () => {
    const result = evaluateSimulation(
      getScenario("empty-consumption").input,
      DEFAULT_CONFIG,
    );
    expect(result.potentialWaste).toBe(true);
  });

  it("detecta iluminación innecesaria en ausencia", () => {
    expect(
      evaluateSimulation(getScenario("light-no-activity").input, DEFAULT_CONFIG)
        .unnecessaryLighting,
    ).toBe(true);
  });

  it("evalúa calidad del aire con sensor MQ-135", () => {
    expect(evaluateAir(2.0, DEFAULT_CONFIG)).toBe("normal");
    expect(evaluateAir(6.5, DEFAULT_CONFIG)).toBe("warning");
    expect(evaluateAir(14.0, DEFAULT_CONFIG)).toBe("alert");

    // La regla se conserva internamente aunque la interfaz ya no muestre gases.
    const result = evaluateSimulation(
      { ...getScenario("normal").input, airChangePercent: 16.5 },
      DEFAULT_CONFIG,
    );
    expect(result.airLevel).toBe("alert");
    expect(result.status).toBe("environmental-alert");
  });

  it("aplica recomendación correctiva para cerrar fugas y reducir consumo", () => {
    const input = getScenario("empty-consumption").input;
    const evaluation = evaluateSimulation(input, DEFAULT_CONFIG);
    const corrected = applyRecommendation(input, evaluation);

    expect(corrected.powerWatts).toBeLessThan(input.powerWatts);
    expect(corrected.waterFlowLpm).toBe(0);
    expect(corrected.lightOn).toBe(false);
  });
});

describe("cálculos de sostenibilidad y balance económico", () => {
  it("calcula energía eléctrica en kWh y costo en Bs", () => {
    const kwh = calculateEnergyKwh(1000, 2, 20); // 1000W * 2h * 20d / 1000 = 40 kWh
    expect(kwh).toBe(40);
    expect(calculateElectricityCostBs(40, 0.92)).toBeCloseTo(36.8);
  });

  it("calcula volumen de agua en Litros y costo en Bs", () => {
    const liters = calculateWaterLiters(2.0, 1, 30); // 2 L/min * 60 min * 1h * 30d = 3600 L
    expect(liters).toBe(3600);
    // 3600 L = 3.6 m3 * 4.50 Bs/m3 = 16.2 Bs
    expect(calculateWaterCostBs(liters, 4.5)).toBeCloseTo(16.2);
  });

  it("calcula emisiones de CO₂ y porcentaje de reducción", () => {
    const co2Kg = calculateEstimatedCo2Kg(40, 0.48); // 40 kWh * 0.48 kg/kWh = 19.2 kg
    expect(co2Kg).toBeCloseTo(19.2);

    const input = getScenario("empty-consumption").input;
    const estimate = estimateFromSimulation(input, true, true);

    expect(estimate.avoidableEnergyKwh).toBeGreaterThan(0);
    expect(estimate.avoidableWaterLiters).toBeGreaterThan(0);
    expect(estimate.totalSavingBs).toBeGreaterThan(0);
    expect(estimate.co2ReductionPercent).toBeGreaterThan(0);
    expect(estimate.co2ReductionPercent).toBeLessThanOrEqual(100);
  });
});
