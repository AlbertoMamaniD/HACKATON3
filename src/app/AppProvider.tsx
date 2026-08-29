import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { z } from "zod";
import { initialAlerts } from "../data/mockData";
import { DEFAULT_CONFIG, STORAGE_KEYS } from "../domain/config";
import { alertStatusSchema, configSchema } from "../domain/schemas";
import type { Alert, AlertStatus, EcoAhorroConfig } from "../domain/types";
import { readStored, writeStored } from "../utils/storage";

const persistedAlertSchema = z.record(z.string(), alertStatusSchema);

interface AppContextValue {
  config: EcoAhorroConfig;
  alerts: Alert[];
  lastScenarioId: string;
  updateConfig: (config: EcoAhorroConfig) => void;
  resetConfig: () => void;
  setAlertStatus: (id: string, status: AlertStatus) => void;
  addOrUpdateAlert: (alert: Alert) => void;
  setLastScenarioId: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState(() => readStored(STORAGE_KEYS.config, configSchema, DEFAULT_CONFIG));
  const [alertStatuses, setAlertStatuses] = useState<Record<string, AlertStatus>>(() => readStored(STORAGE_KEYS.alerts, persistedAlertSchema, {}));
  const [dynamicAlerts, setDynamicAlerts] = useState<Alert[]>([]);
  const [lastScenarioId, setLastScenario] = useState(() => {
    try { return window.localStorage.getItem(STORAGE_KEYS.scenario) ?? "empty-consumption"; } catch { return "empty-consumption"; }
  });

  useEffect(() => writeStored(STORAGE_KEYS.config, config), [config]);
  useEffect(() => writeStored(STORAGE_KEYS.alerts, alertStatuses), [alertStatuses]);
  useEffect(() => { try { window.localStorage.setItem(STORAGE_KEYS.scenario, lastScenarioId); } catch { /* Continuar sin persistencia. */ } }, [lastScenarioId]);

  const alerts = useMemo(() => [...dynamicAlerts, ...initialAlerts.filter((item) => !dynamicAlerts.some((dynamic) => dynamic.id === item.id))]
    .map((alert) => ({ ...alert, status: alertStatuses[alert.id] ?? alert.status })), [alertStatuses, dynamicAlerts]);

  const value = useMemo<AppContextValue>(() => ({
    config,
    alerts,
    lastScenarioId,
    updateConfig: setConfig,
    resetConfig: () => setConfig(DEFAULT_CONFIG),
    setAlertStatus: (id, status) => setAlertStatuses((current) => ({ ...current, [id]: status })),
    addOrUpdateAlert: (alert) => setDynamicAlerts((current) => [alert, ...current.filter((item) => item.id !== alert.id)]),
    setLastScenarioId: setLastScenario,
  }), [alerts, config, lastScenarioId]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp debe utilizarse dentro de AppProvider");
  return context;
};
