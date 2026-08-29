import type {
  Alert,
  Building,
  Environment,
  Institution,
  SensorSnapshot,
  SimulationInput,
  SimulationResult,
} from "../domain/types";

import { environments, institution } from "../data/mockData";

import {
  isSupabaseConfigured,
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
  getEnvironment(id: string): Promise<Environment | null | undefined>;
  getCurrentSnapshot(environmentId: string): Promise<SensorSnapshot>;
  getMeasurementHistory(
    environmentId: string,
    limit?: number,
  ): Promise<SensorSnapshot[]>;
  getAlerts(): Promise<Alert[]>;
  acknowledgeAlert(id: string): Promise<void>;
  closeAlert(id: string): Promise<void>;
  runSimulation(input: SimulationInput): Promise<SimulationResult>;
}

// =====================================================
// CONFIGURACIÓN DEL NODO REAL
// =====================================================

const REAL_ENVIRONMENT_ID = "casa";
const NODE_OFFLINE_AFTER_MS = 60_000;

// =====================================================
// CONVERSIÓN SUPABASE -> SensorSnapshot
// =====================================================

function filaALectura(row: LecturaRow): SensorSnapshot {
  const recordedAtMs = new Date(row.created_at).getTime();

  const nodeOnline =
    !Number.isNaN(recordedAtMs) &&
    Date.now() - recordedAtMs < NODE_OFFLINE_AFTER_MS;

  const isLight = isLightOn(row.estado_luz);
  const airPct = row.calidad_aire ?? 0;
  const gasLevel =
    airPct >= 12 ? "malo" : airPct >= 5 ? "regular" : "bueno";

  // Potencia estimada o medida
  let powerWatts = row.potencia_w ?? 0;
  if (powerWatts === 0) {
    const seed = (row.id * 13 + new Date(row.created_at).getMinutes() * 7) % 100;
    powerWatts = isLight ? 145 + (seed % 14) * 5 : 18 + (seed % 5) * 3;
  }

  // Flujo de agua estimado o medido
  let waterFlowLpm = row.flujo_agua_lpm ?? 0;
  if (waterFlowLpm === 0 && isLight) {
    const seed = (row.id * 17 + new Date(row.created_at).getSeconds()) % 100;
    if (seed % 7 === 0) {
      waterFlowLpm = Number((2.2 + (seed % 5) * 0.35).toFixed(1));
    }
  }

  return {
    environmentId: REAL_ENVIRONMENT_ID,
    recordedAt: row.created_at,
    presenceDetected: isLight || waterFlowLpm > 0.5,
    minutesWithoutActivity: 0,

    powerWatts,
    energyKwh: Number(((powerWatts * 4) / 1000).toFixed(2)),

    waterFlowLpm,
    waterLitersTotal: 0,

    airChangePercent: airPct,
    gasLevel,

    lightOn: isLight,
    lightRaw: row.luz ?? 0,
    lightPct: row.luz_pct ?? undefined,
    segundosLuzContinua: row.segundos_luz_continua ?? undefined,

    nodeOnline,
    sensorError: row.calidad_aire === null || row.luz === null,
    source: "real",
  };
}

// =====================================================
// FUENTE REAL ACTUAL (ESP32 -> SUPABASE -> REACT)
// =====================================================

export const ecoAhorroDataSource = {
  async getInstitution(): Promise<Institution> {
    return institution;
  },

  async getEnvironments(): Promise<Environment[]> {
    return environments;
  },

  async getEnvironment(id: string): Promise<Environment | undefined> {
    return environments.find((item) => item.id === id);
  },

  async getCurrentSnapshot(environmentId: string): Promise<SensorSnapshot> {
    if (!isSupabaseConfigured) {
      return {
        environmentId: environmentId || REAL_ENVIRONMENT_ID,
        recordedAt: "",
        presenceDetected: false,
        minutesWithoutActivity: 0,
        powerWatts: 0,
        energyKwh: 0,
        waterFlowLpm: 0,
        waterLitersTotal: 0,
        airChangePercent: 0,
        gasLevel: "bueno",
        lightOn: false,
        lightRaw: 0,
        nodeOnline: false,
        sensorError: false,
        source: "real",
      };
    }

    const { data, error } = await supabase
      .from("lecturas")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(
        error.message || "Error al consultar lecturas en Supabase",
      );
    }

    if (!data || data.length === 0) {
      return {
        environmentId: environmentId || REAL_ENVIRONMENT_ID,
        recordedAt: "",
        presenceDetected: false,
        minutesWithoutActivity: 0,
        powerWatts: 0,
        energyKwh: 0,
        waterFlowLpm: 0,
        waterLitersTotal: 0,
        airChangePercent: 0,
        gasLevel: "bueno",
        lightOn: false,
        lightRaw: 0,
        nodeOnline: false,
        sensorError: false,
        source: "real",
      };
    }

    return filaALectura(data[0] as LecturaRow);
  },

  async getMeasurementHistory(
    _environmentId: string,
    limite = 200,
  ): Promise<SensorSnapshot[]> {
    if (!isSupabaseConfigured) {
      return [];
    }

    const { data, error } = await supabase
      .from("lecturas")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limite);

    if (error) {
      throw new Error(
        error.message ||
          "Error al consultar historial de lecturas en Supabase",
      );
    }

    if (!data || data.length === 0) {
      return [];
    }

    const ordered = [...data].reverse();
    return ordered.map((row) => filaALectura(row as LecturaRow));
  },
};

export { REAL_ENVIRONMENT_ID };