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
 * Helper unificado para determinar si un estado de luz representa iluminación activa.
 * Solo reconoce estados válidos de iluminación.
 */
export function isLightOn(estadoLuz: string | null | undefined): boolean {
  if (!estadoLuz || typeof estadoLuz !== "string") {
    return false;
  }
  const clean = estadoLuz.trim().toUpperCase();
  return clean === "ILUMINADO" || clean === "LUZ MEDIA" || clean === "ENCENDIDO";
}

/**
 * Contrato común para las fuentes de datos de EcoAhorro.
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

// Actualmente existe un solo ESP32 real asociado a "casa".
const REAL_ENVIRONMENT_ID = "casa";

// Si no llega una lectura nueva durante este tiempo,
// consideramos que el nodo está desconectado.
const NODE_OFFLINE_AFTER_MS = 60_000;

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

    presenceDetected:
      false,

    minutesWithoutActivity:
      0,

    lightOn:
      isLightOn(row.estado_luz),

    lightRaw:
      row.luz ?? 0,

    powerWatts:
      0,

    energyKwh:
      0,

    temperatureCelsius:
      row.temperatura ?? 0,

    humidityPercent:
      row.humedad ?? 0,

    airChangePercent:
      row.calidad_aire ?? 0,

    nodeOnline,

    sensorError:
      row.temperatura === null || row.humedad === null || row.calidad_aire === null,

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

    if (error) {
      throw new Error(error.message || "Error al consultar lecturas en Supabase");
    }

    if (!data || data.length === 0) {
      /*
       * Si todavía no existen filas en la base de datos,
       * devolvemos un snapshot desconectado con timestamp vacío
       * para evitar que useEcoData lo marque erróneamente como online.
       */
      return {
        environmentId:
          environmentId ||
          REAL_ENVIRONMENT_ID,

        recordedAt:
          "",

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
    // Obtenemos las últimas `limite` lecturas en orden descendente y luego
    // las invertimos a orden cronológico (más antigua a más reciente)
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
      .limit(limite);

    if (error) {
      throw new Error(error.message || "Error al consultar historial de lecturas en Supabase");
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Invertir para entregar en orden cronológico a los gráficos
    const ordered = [...data].reverse();

    return ordered.map(
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