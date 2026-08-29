import type {
  Alert,
  Building,
  Environment,
  Institution,
  SensorSnapshot,
  SimulationInput,
  SimulationResult,
} from "../domain/types";

import {
  environments,
  institution,
} from "../data/mockData";

import {
  supabase,
  type LecturaRow,
} from "./supabaseClient";

/**
 * Contrato común para las fuentes de datos de EcoAhorro.
 *
 * Lo siguen usando:
 * - MockEcoAhorroDataSource
 * - ApiEcoAhorroDataSource
 *
 * La fuente real actual usa Supabase para las lecturas del ESP32.
 */
export interface EcoAhorroDataSource {
  getInstitution(): Promise<Institution>;

  getBuildings(): Promise<Building[]>;

  getEnvironments(): Promise<Environment[]>;

  getEnvironment(
    id: string,
  ): Promise<
    Environment | null | undefined
  >;

  getCurrentSnapshot(
    environmentId: string,
  ): Promise<SensorSnapshot>;

  getMeasurementHistory(
    environmentId: string,
    limit?: number,
  ): Promise<SensorSnapshot[]>;

  getAlerts(): Promise<Alert[]>;

  acknowledgeAlert(
    id: string,
  ): Promise<void>;

  closeAlert(
    id: string,
  ): Promise<void>;

  runSimulation(
    input: SimulationInput,
  ): Promise<SimulationResult>;
}

// =====================================================
// CONFIGURACIÓN DEL NODO REAL
// =====================================================

// Actualmente existe un solo ESP32 real.
// Sus lecturas se asocian al ambiente "casa".
const REAL_ENVIRONMENT_ID = "casa";

// Si no llega una lectura nueva durante este tiempo,
// consideramos que el nodo está desconectado.
const NODE_OFFLINE_AFTER_MS = 90_000;

// =====================================================
// CONVERSIÓN SUPABASE -> SensorSnapshot
// =====================================================

function filaALectura(
  row: LecturaRow,
): SensorSnapshot {
  const recordedAtMs =
    new Date(
      row.created_at,
    ).getTime();

  const nodeOnline =
    !Number.isNaN(
      recordedAtMs,
    ) &&
    Date.now() -
      recordedAtMs <
      NODE_OFFLINE_AFTER_MS;

  return {
    environmentId:
      REAL_ENVIRONMENT_ID,

    recordedAt:
      row.created_at,

    /*
     * Todavía no existe PIR conectado.
     * Cuando llegue el sensor de presencia,
     * este valor se reemplazará por el dato real.
     */
    presenceDetected:
      false,

    minutesWithoutActivity:
      0,

    /*
     * Con el KY-018 consideramos que existe
     * iluminación cuando el estado no es OSCURO.
     */
    lightOn:
      row.estado_luz !==
      "OSCURO",

    lightRaw:
      row.luz,

    /*
     * Todavía no existe medidor eléctrico real.
     * No inventamos W ni kWh.
     */
    powerWatts:
      0,

    energyKwh:
      0,

    temperatureCelsius:
      row.temperatura,

    humidityPercent:
      row.humedad,

    airChangePercent:
      row.calidad_aire,

    nodeOnline,

    sensorError:
      false,

    source:
      "real",
  };
}

// =====================================================
// FUENTE REAL ACTUAL
// ESP32 -> SUPABASE -> REACT
// =====================================================

export const ecoAhorroDataSource = {
  async getInstitution(): Promise<Institution> {
    return institution;
  },

  async getEnvironments(): Promise<Environment[]> {
    return environments;
  },

  async getEnvironment(
    id: string,
  ): Promise<
    Environment | undefined
  > {
    return environments.find(
      (item) =>
        item.id === id,
    );
  },

  async getCurrentSnapshot(
    environmentId: string,
  ): Promise<SensorSnapshot> {
    const {
      data,
      error,
    } = await supabase
      .from("lecturas")
      .select("*")
      .order(
        "created_at",
        {
          ascending:
            false,
        },
      )
      .limit(1);

    if (
      error ||
      !data ||
      data.length === 0
    ) {
      /*
       * Si todavía no existen filas,
       * devolvemos un estado sin datos
       * en vez de romper el Dashboard.
       */
      return {
        environmentId:
          environmentId ||
          REAL_ENVIRONMENT_ID,

        recordedAt:
          new Date().toISOString(),

        presenceDetected:
          false,

        minutesWithoutActivity:
          0,

        lightOn:
          false,

        lightRaw:
          0,

        powerWatts:
          0,

        energyKwh:
          0,

        temperatureCelsius:
          0,

        humidityPercent:
          0,

        airChangePercent:
          0,

        nodeOnline:
          false,

        sensorError:
          false,

        source:
          "real",
      };
    }

    return filaALectura(
      data[0] as LecturaRow,
    );
  },

  async getMeasurementHistory(
    _environmentId: string,
    limite = 200,
  ): Promise<
    SensorSnapshot[]
  > {
    const {
      data,
      error,
    } = await supabase
      .from("lecturas")
      .select("*")
      .order(
        "created_at",
        {
          ascending:
            true,
        },
      )
      .limit(limite);

    if (
      error ||
      !data
    ) {
      return [];
    }

    return data.map(
      (row) =>
        filaALectura(
          row as LecturaRow,
        ),
    );
  },
};

export {
  REAL_ENVIRONMENT_ID,
};