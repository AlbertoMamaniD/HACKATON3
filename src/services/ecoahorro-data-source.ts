import type { Alert, Building, Environment, Institution, SensorSnapshot, SimulationInput, SimulationResult } from "../domain/types";

export interface EcoAhorroDataSource {
  getInstitution(): Promise<Institution>;
  getBuildings(): Promise<Building[]>;
  getEnvironments(): Promise<Environment[]>;
  getEnvironment(id: string): Promise<Environment | null>;
  getCurrentSnapshot(environmentId: string): Promise<SensorSnapshot>;
  getMeasurementHistory(environmentId: string): Promise<SensorSnapshot[]>;
  getAlerts(): Promise<Alert[]>;
  acknowledgeAlert(id: string): Promise<void>;
  closeAlert(id: string): Promise<void>;
  runSimulation(input: SimulationInput): Promise<SimulationResult>;
}
