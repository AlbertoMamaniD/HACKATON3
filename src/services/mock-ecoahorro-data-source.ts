import { DEFAULT_CONFIG } from "../domain/config";
import { estimateFromSimulation } from "../domain/calculations";
import { evaluateSimulation } from "../domain/rules";
import type { Alert, SimulationInput, SimulationResult } from "../domain/types";
import { buildings, createSnapshot, environments, generateHistory, initialAlerts, institution } from "../data/mockData";
import type { EcoAhorroDataSource } from "./ecoahorro-data-source";

export class MockEcoAhorroDataSource implements EcoAhorroDataSource {
  private alerts: Alert[] = structuredClone(initialAlerts);
  async getInstitution() { return structuredClone(institution); }
  async getBuildings() { return structuredClone(buildings); }
  async getEnvironments() { return structuredClone(environments); }
  async getEnvironment(id: string) { return structuredClone(environments.find((item) => item.id === id) ?? null); }
  async getCurrentSnapshot(environmentId: string) {
    if (!environments.some((item) => item.id === environmentId)) throw new Error("Ambiente no encontrado");
    return createSnapshot(environmentId);
  }
  async getMeasurementHistory(environmentId: string) {
    if (!environments.some((item) => item.id === environmentId)) return [];
    return generateHistory(environmentId, 30);
  }
  async getAlerts() { return structuredClone(this.alerts); }
  async acknowledgeAlert(id: string) { this.alerts = this.alerts.map((alert) => alert.id === id ? { ...alert, status: "acknowledged" } : alert); }
  async closeAlert(id: string) { this.alerts = this.alerts.map((alert) => alert.id === id ? { ...alert, status: "closed" } : alert); }
  async runSimulation(input: SimulationInput): Promise<SimulationResult> {
    const evaluation = evaluateSimulation(input, { ...DEFAULT_CONFIG, electricityTariffBs: input.electricityTariffBs, emissionFactorKgPerKwh: input.emissionFactorKgPerKwh });
    const estimate = estimateFromSimulation(input, evaluation.potentialWaste || evaluation.unnecessaryLighting);
    const alert: Alert | null = evaluation.status === "normal" ? null : {
      id: `simulation-${input.scenarioId}`,
      environmentId: "casa",
      type: evaluation.status,
      severity: evaluation.status === "potential-waste" || evaluation.status === "offline" ? "critical" : "warning",
      status: "new",
      title: evaluation.title,
      description: evaluation.explanation,
      recommendation: evaluation.recommendation,
      evidence: { powerWatts: input.powerWatts, minutesWithoutActivity: input.minutesWithoutActivity },
      openedAt: "2026-08-28T20:30:00-04:00",
      source: "simulated",
    };
    return { input, evaluation, estimate, alert, appliedRecommendation: false };
  }
}

export const ecoAhorroDataSource = new MockEcoAhorroDataSource();
