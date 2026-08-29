import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { z } from "zod";
import {
  LiveReadingsProvider,
  useLiveReadingsContext,
} from "../context/LiveReadingsContext";
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

function RealAlertsSynchronizer() {
  const { latest } = useLiveReadingsContext();
  const { addOrUpdateAlert } = useApp();

  useEffect(() => {
    if (!latest) return;

    if (latest.alerta_temp) {
      addOrUpdateAlert({
        id: "real-alert-temp",
        environmentId: "casa",
        type: "environmental-alert",
        severity: "warning",
        status: "new",
        title: "Temperatura elevada",
        description: `La temperatura superó el umbral de 30 °C (${latest.temperatura?.toFixed(1) ?? "—"} °C). Revisa ventilación o climatización.`,
        recommendation: "Ventilar la habitación o activar climatización.",
        evidence: { temperatura: latest.temperatura },
        openedAt: latest.created_at,
        source: "real",
      });
    }

    if (latest.alerta_humedad) {
      addOrUpdateAlert({
        id: "real-alert-humedad",
        environmentId: "casa",
        type: "environmental-alert",
        severity: "warning",
        status: "new",
        title: "Humedad elevada",
        description: `La humedad superó el umbral de 70 % (${latest.humedad?.toFixed(1) ?? "—"} %). Revisa las condiciones del ambiente.`,
        recommendation: "Mejorar la circulación del aire para evitar exceso de humedad.",
        evidence: { humedad: latest.humedad },
        openedAt: latest.created_at,
        source: "real",
      });
    }

    if (latest.alerta_aire) {
      addOrUpdateAlert({
        id: "real-alert-aire",
        environmentId: "casa",
        type: "environmental-alert",
        severity: "critical",
        status: "new",
        title: "Cambio importante en calidad del aire",
        description: `El sensor MQ-135 detectó una variación elevada (${latest.calidad_aire?.toFixed(1) ?? "—"} %) respecto a su línea base.`,
        recommendation: "Ventilar de inmediato e inspeccionar posibles fuentes de contaminación.",
        evidence: { calidad_aire: latest.calidad_aire },
        openedAt: latest.created_at,
        source: "real",
      });
    }

    if (latest.alerta_luz) {
      const minutes = Math.max(1, Math.round((latest.segundos_luz_continua ?? 0) / 60));
      addOrUpdateAlert({
        id: "real-alert-luz",
        environmentId: "casa",
        type: "potential-waste",
        severity: "warning",
        status: "new",
        title: "Iluminación prolongada",
        description: `La iluminación se ha mantenido activa durante ${minutes} min. Revisa si el ambiente continúa en uso.`,
        recommendation: "Apagar las luces si el ambiente se encuentra desocupado.",
        evidence: { segundos_luz_continua: latest.segundos_luz_continua },
        openedAt: latest.created_at,
        source: "real",
      });
    }
  }, [latest, addOrUpdateAlert]);

  return null;
}

function AppStateProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState(() =>
    readStored(STORAGE_KEYS.config, configSchema, DEFAULT_CONFIG),
  );
  const [alertStatuses, setAlertStatuses] = useState<Record<string, AlertStatus>>(
    () => readStored(STORAGE_KEYS.alerts, persistedAlertSchema, {}),
  );
  const [dynamicAlerts, setDynamicAlerts] = useState<Alert[]>([]);
  const [lastScenarioId, setLastScenario] = useState(() => {
    try {
      return (
        window.localStorage.getItem(STORAGE_KEYS.scenario) ??
        "empty-consumption"
      );
    } catch {
      return "empty-consumption";
    }
  });

  useEffect(() => writeStored(STORAGE_KEYS.config, config), [config]);
  useEffect(() => writeStored(STORAGE_KEYS.alerts, alertStatuses), [alertStatuses]);
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.scenario, lastScenarioId);
    } catch {
      /* Continuar sin persistencia */
    }
  }, [lastScenarioId]);

  const addOrUpdateAlert = useCallback((alert: Alert) => {
    setDynamicAlerts((current) => [
      alert,
      ...current.filter((item) => item.id !== alert.id),
    ]);
  }, []);

  const alerts = useMemo(
    () =>
      [
        ...dynamicAlerts,
        ...initialAlerts.filter(
          (item) => !dynamicAlerts.some((dynamic) => dynamic.id === item.id),
        ),
      ].map((alert) => ({
        ...alert,
        status: alertStatuses[alert.id] ?? alert.status,
      })),
    [alertStatuses, dynamicAlerts],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      config,
      alerts,
      lastScenarioId,
      updateConfig: setConfig,
      resetConfig: () => setConfig(DEFAULT_CONFIG),
      setAlertStatus: (id, status) =>
        setAlertStatuses((current) => ({ ...current, [id]: status })),
      addOrUpdateAlert,
      setLastScenarioId: setLastScenario,
    }),
    [alerts, config, lastScenarioId, addOrUpdateAlert],
  );

  return (
    <AppContext.Provider value={value}>
      <RealAlertsSynchronizer />
      {children}
    </AppContext.Provider>
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <LiveReadingsProvider>
      <AppStateProvider>{children}</AppStateProvider>
    </LiveReadingsProvider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp debe utilizarse dentro de AppProvider");
  return context;
};
