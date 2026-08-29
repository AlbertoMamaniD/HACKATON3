import type { SimulationInput } from "../domain/types";
import type { EcoAhorroDataSource } from "./ecoahorro-data-source";

const unavailable = (): never => { throw new Error("Integración con backend todavía no configurada"); };

/** Contrato futuro: no realiza solicitudes HTTP en este MVP. */
export class ApiEcoAhorroDataSource implements EcoAhorroDataSource {
  async getInstitution() { return unavailable(); }
  async getBuildings() { return unavailable(); }
  async getEnvironments() { return unavailable(); }
  async getEnvironment(_id: string) { return unavailable(); }
  async getCurrentSnapshot(_environmentId: string) { return unavailable(); }
  async getMeasurementHistory(_environmentId: string) { return unavailable(); }
  async getAlerts() { return unavailable(); }
  async acknowledgeAlert(_id: string) { unavailable(); }
  async closeAlert(_id: string) { unavailable(); }
  async runSimulation(_input: SimulationInput) { return unavailable(); }
}

// TODO: añadir un adaptador HTTP cuando exista una API documentada y autorizada.
// TODO: crear contratos separados para MQTT, autenticación y sincronización; no están activos.
