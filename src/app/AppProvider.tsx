import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { z } from "zod";
import {
  LiveReadingsProvider,
  useLiveReadingsContext,
} from "../context/LiveReadingsContext";
import { SimulatorProvider } from "../context/SimulatorContext";
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
  removeAlert: (id: string) => void;
  setLastScenarioId: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

type SensorAlertKey = "aire" | "luz" | "agua" | "energia";

interface ActiveEpisode {
  id: string;
  openedAt: string;
}

function RealAlertsSynchronizer() {
  const { latest, online } = useLiveReadingsContext();
  const { addOrUpdateAlert, removeAlert } = useApp();

  const episodesRef = useRef<Partial<Record<SensorAlertKey, ActiveEpisode>>>({});

  useEffect(() => {
    if (!latest) return;

    const episodes = episodesRef.current;

    // Helper para conciliar el ciclo de vida de cada alerta según el sensor
    const reconcileSensor = (
      key: SensorAlertKey,
      isActive: boolean | null | undefined,
      createAlert: (episode: ActiveEpisode) => Alert,
    ) => {
      // Sin conexión la última lectura es antigua: no debe abrir ni mantener alertas.
      if (isActive && online) {
        if (!episodes[key]) {
          const newEpisode: ActiveEpisode = {
            id: `real-alert-${key}-${new Date(latest.created_at).getTime()}`,
            openedAt: latest.created_at,
          };
          episodes[key] = newEpisode;
        }

        const currentEpisode = episodes[key]!;
        addOrUpdateAlert(createAlert(currentEpisode));
      } else {
        if (episodes[key]) {
          const oldEpisode = episodes[key]!;
          removeAlert(oldEpisode.id);
          delete episodes[key];
        }
      }
    };

    // 1. Luces encendidas (sensor de luz del ESP32)
    reconcileSensor("luz", Boolean(latest.alerta_luz), (ep) => {
      const minutes = Math.max(1, Math.round((latest.segundos_luz_continua ?? 0) / 60));
      return {
        id: ep.id,
        environmentId: "casa",
        type: "potential-waste",
        severity: "warning",
        status: "new",
        title: "Luces encendidas por mucho tiempo",
        description: `Las luces llevan ${minutes} min encendidas. Si nadie las usa, apágalas para no pagar de más en el recibo de luz.`,
        recommendation: "Apagar las luces de los espacios que no se están usando.",
        evidence: { segundos_luz_continua: latest.segundos_luz_continua },
        openedAt: ep.openedAt,
        source: "real",
      };
    });

    // 2. Fuga / Desperdicio de Agua (alerta_agua: caudal anormal, ver LiveReadingsContext)
    const isWaterAlert = Boolean(latest.alerta_agua);

    reconcileSensor("agua", isWaterAlert, (ep) => ({
      id: ep.id,
      environmentId: "casa",
      type: "water-leak",
      severity: "critical",
      status: "new",
      title: "Posible fuga o grifo abierto",
      description: `Se detecta un flujo continuo de agua (${latest.flujo_agua_lpm?.toFixed(1) ?? "—"} L/min).`,
      recommendation: "Revisar grifos, inodoros y conexiones de agua en el domicilio.",
      evidence: { flujo_agua_lpm: latest.flujo_agua_lpm },
      openedAt: ep.openedAt,
      source: "simulated",
    }));

    // 3. Desperdicio Eléctrico
    const isEnergyAlert =
      latest.potencia_w !== undefined &&
      latest.potencia_w !== null &&
      latest.potencia_w > 250;

    reconcileSensor("energia", isEnergyAlert, (ep) => ({
      id: ep.id,
      environmentId: "casa",
      type: "potential-waste",
      severity: "warning",
      status: "new",
      title: "Consumo eléctrico elevado",
      description: `Potencia instantánea de ${latest.potencia_w?.toFixed(0)} W detectada.`,
      recommendation: "Comprobar artefactos de alto consumo encendidos.",
      evidence: { potencia_w: latest.potencia_w },
      openedAt: ep.openedAt,
      source: "simulated",
    }));
  }, [latest, online, addOrUpdateAlert, removeAlert]);

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

  const removeAlert = useCallback((id: string) => {
    setDynamicAlerts((current) => current.filter((item) => item.id !== id));
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
      removeAlert,
      setLastScenarioId: setLastScenario,
    }),
    [alerts, config, lastScenarioId, addOrUpdateAlert, removeAlert],
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
      <AppStateProvider>
        <SimulatorProvider>{children}</SimulatorProvider>
      </AppStateProvider>
    </LiveReadingsProvider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp debe utilizarse dentro de AppProvider");
  return context;
};
