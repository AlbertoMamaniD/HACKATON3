import { useEffect, useState } from "react";

import type {
  Environment,
  Institution,
  SensorSnapshot,
} from "../domain/types";

import { ecoAhorroDataSource } from "../services/ecoahorro-data-source";

interface DashboardData {
  institution: Institution;
  environments: Environment[];
  snapshots: SensorSnapshot[];
}

const POLLING_MS = 5000;
const OFFLINE_AFTER_MS = 60_000;

function actualizarEstadoConexion(
  snapshot: SensorSnapshot,
): SensorSnapshot {
  if (!snapshot.recordedAt || snapshot.recordedAt.trim() === "") {
    return {
      ...snapshot,
      nodeOnline: false,
    };
  }

  const fecha =
    new Date(
      snapshot.recordedAt,
    ).getTime();

  return {
    ...snapshot,

    nodeOnline:
      !Number.isNaN(fecha) &&
      Date.now() - fecha <
        OFFLINE_AFTER_MS,
  };
}

export function useDashboardData() {
  const [data, setData] =
    useState<DashboardData | null>(
      null,
    );

  const [error, setError] =
    useState(false);

  useEffect(() => {
    let active = true;

    let institutionCache:
      Institution | null = null;

    let environmentsCache:
      Environment[] = [];

    async function cargarInicial() {
      try {
        const [
          institution,
          environments,
        ] = await Promise.all([
          ecoAhorroDataSource.getInstitution(),
          ecoAhorroDataSource.getEnvironments(),
        ]);

        institutionCache =
          institution;

        environmentsCache =
          environments;

        const snapshots =
          await Promise.all(
            environments.map(
              async (
                environment,
              ) => {
                const snapshot =
                  await ecoAhorroDataSource
                    .getCurrentSnapshot(
                      environment.id,
                    );

                return actualizarEstadoConexion(
                  snapshot,
                );
              },
            ),
          );

        if (!active) {
          return;
        }

        setData({
          institution,
          environments,
          snapshots,
        });

        setError(false);
      } catch (err) {
        console.error(
          "Error cargando Dashboard EcoAhorro:",
          err,
        );

        if (active) {
          setError(true);
        }
      }
    }

    async function actualizarLecturas() {
      if (
        !institutionCache ||
        environmentsCache.length === 0
      ) {
        return;
      }

      try {
        const snapshots =
          await Promise.all(
            environmentsCache.map(
              async (
                environment,
              ) => {
                const snapshot =
                  await ecoAhorroDataSource
                    .getCurrentSnapshot(
                      environment.id,
                    );

                return actualizarEstadoConexion(
                  snapshot,
                );
              },
            ),
          );

        if (!active) {
          return;
        }

        setData((current) =>
          current
            ? {
                ...current,
                snapshots,
              }
            : current,
        );

        setError(false);
      } catch (err) {
        console.error(
          "Error actualizando lecturas:",
          err,
        );
      }
    }

    cargarInicial();

    const interval =
      window.setInterval(
        actualizarLecturas,
        POLLING_MS,
      );

    return () => {
      active = false;

      window.clearInterval(
        interval,
      );
    };
  }, []);

  return {
    data,
    error,
  };
}

export function useEnvironmentData(
  id: string | undefined,
) {
  const [data, setData] =
    useState<{
      environment: Environment;
      snapshot: SensorSnapshot;
      history: SensorSnapshot[];
    } | null>(null);

  const [notFound, setNotFound] =
    useState(false);

  const [error, setError] =
    useState(false);

  useEffect(() => {
    let active = true;

    if (!id) {
      setNotFound(true);
      setData(null);
      return;
    }

    const environmentId: string =
      id;

    async function cargarInicial() {
      try {
        const environment =
          await ecoAhorroDataSource
            .getEnvironment(
              environmentId,
            );

        if (!environment) {
          if (active) {
            setNotFound(true);
            setData(null);
          }

          return;
        }

        const [
          snapshot,
          history,
        ] = await Promise.all([
          ecoAhorroDataSource
            .getCurrentSnapshot(
              environmentId,
            ),

          ecoAhorroDataSource
            .getMeasurementHistory(
              environmentId,
            ),
        ]);

        if (!active) {
          return;
        }

        setData({
          environment,

          snapshot:
            actualizarEstadoConexion(
              snapshot,
            ),

          history,
        });

        setNotFound(false);
        setError(false);
      } catch (err) {
        console.error(
          "Error cargando ambiente:",
          err,
        );

        if (active) {
          setError(true);
        }
      }
    }

    async function actualizarLectura() {
      try {
        const snapshot =
          await ecoAhorroDataSource
            .getCurrentSnapshot(
              environmentId,
            );

        if (!active) {
          return;
        }

        const nuevoSnapshot =
          actualizarEstadoConexion(
            snapshot,
          );

        setData((current) => {
          if (!current) {
            return current;
          }

          const ultimo =
            current.history[
              current.history.length -
                1
            ];

          const esNueva =
            !ultimo ||
            ultimo.recordedAt !==
              nuevoSnapshot.recordedAt;

          return {
            ...current,

            snapshot:
              nuevoSnapshot,

            history: esNueva
              ? [
                  ...current.history,
                  nuevoSnapshot,
                ]
              : current.history,
          };
        });

        setError(false);
      } catch (err) {
        console.error(
          "Error actualizando ambiente:",
          err,
        );
      }
    }

    cargarInicial();

    const interval =
      window.setInterval(
        actualizarLectura,
        POLLING_MS,
      );

    return () => {
      active = false;

      window.clearInterval(
        interval,
      );
    };
  }, [id]);

  return {
    data,
    notFound,
    error,
  };
}
