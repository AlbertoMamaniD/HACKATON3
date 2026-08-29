import { useEffect, useState } from "react";
import type { Environment, Institution, SensorSnapshot } from "../domain/types";
import { ecoAhorroDataSource } from "../services/mock-ecoahorro-data-source";

interface DashboardData { institution: Institution; environments: Environment[]; snapshots: SensorSnapshot[] }

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => { let active = true; Promise.all([ecoAhorroDataSource.getInstitution(), ecoAhorroDataSource.getEnvironments()]).then(async ([institution, environments]) => ({ institution, environments, snapshots: await Promise.all(environments.map((item) => ecoAhorroDataSource.getCurrentSnapshot(item.id))) })).then((result) => { if (active) setData(result); }).catch(() => { if (active) setError(true); }); return () => { active = false; }; }, []);
  return { data, error };
}

export function useEnvironmentData(id: string | undefined) {
  const [data, setData] = useState<{ environment: Environment; snapshot: SensorSnapshot; history: SensorSnapshot[] } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => { let active = true; if (!id) { setNotFound(true); return; } ecoAhorroDataSource.getEnvironment(id).then(async (environment) => { if (!environment) { if (active) setNotFound(true); return; } const [snapshot, history] = await Promise.all([ecoAhorroDataSource.getCurrentSnapshot(id), ecoAhorroDataSource.getMeasurementHistory(id)]); if (active) setData({ environment, snapshot, history }); }).catch(() => { if (active) setError(true); }); return () => { active = false; }; }, [id]);
  return { data, notFound, error };
}
