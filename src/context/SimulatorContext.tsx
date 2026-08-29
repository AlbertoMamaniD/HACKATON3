import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useApp } from "../app/AppProvider";
import { getScenario, scenarios } from "../data/scenarios";
import { applyRecommendation, evaluateSimulation } from "../domain/rules";
import type { Alert, RuleEvaluation, SimulationInput } from "../domain/types";
import {
  isRunningPhase,
  isSequencePhase,
  type SimulationPhase,
} from "../features/simulator/simulation-phase";

const powerVariations = [1.0, 1.05, 0.95, 1.08, 0.92, 1.03, 0.97, 1.06, 0.94];
const waterVariations = [0.0, 0.3, -0.2, 0.5, -0.4, 0.2, -0.1, 0.4, -0.3];
const gasVariations = [0.0, 0.4, -0.3, 0.8, -0.5, 0.3, -0.2, 0.6, -0.4];
const lightVariations = [0, 25, -20, 40, -30, 15, -10, 35, -25];

const roundOne = (value: number) => Math.round(value * 10) / 10;

interface SimulatorContextValue {
  scenarioId: string;
  input: SimulationInput;
  runInput: SimulationInput | null;
  evaluation: RuleEvaluation | null;
  beforeInput: SimulationInput | null;
  phase: SimulationPhase;
  paused: boolean;
  applied: boolean;
  telemetryTick: number;
  displayInput: SimulationInput;
  running: boolean;
  run: () => void;
  stop: () => void;
  togglePause: () => void;
  setPaused: (paused: boolean | ((prev: boolean) => boolean)) => void;
  apply: () => void;
  handleScenario: (id: string) => void;
  updateInput: (next: SimulationInput) => void;
}

const SimulatorContext = createContext<SimulatorContextValue | null>(null);

export function SimulatorProvider({ children }: { children: ReactNode }) {
  const { config, addOrUpdateAlert } = useApp();

  const initialScenario = scenarios[0];

  const withConfig = useCallback(
    (base: SimulationInput): SimulationInput => ({
      ...base,
      electricityTariffBs: config.electricityTariffBs,
      waterTariffBsPerM3: config.waterTariffBsPerM3,
      emissionFactorKgPerKwh: config.emissionFactorKgPerKwh,
    }),
    [
      config.electricityTariffBs,
      config.waterTariffBsPerM3,
      config.emissionFactorKgPerKwh,
    ],
  );

  const [scenarioId, setScenarioId] = useState(initialScenario.id);
  const [input, setInput] = useState(() => withConfig(initialScenario.input));
  const [runInput, setRunInput] = useState<SimulationInput | null>(null);
  const [evaluation, setEvaluation] = useState<RuleEvaluation | null>(null);
  const [beforeInput, setBeforeInput] = useState<SimulationInput | null>(null);
  const [phase, setPhase] = useState<SimulationPhase>("ready");
  const [paused, setPaused] = useState(false);
  const [applied, setApplied] = useState(false);
  const [telemetryTick, setTelemetryTick] = useState(0);

  const running = isRunningPhase(phase);

  // Mantener sincronizadas las tarifas del usuario cuando no esté en modo personalizado
  useEffect(() => {
    if (scenarioId !== "custom") {
      setInput((current) => ({
        ...current,
        electricityTariffBs: config.electricityTariffBs,
        waterTariffBsPerM3: config.waterTariffBsPerM3,
        emissionFactorKgPerKwh: config.emissionFactorKgPerKwh,
      }));
    }
  }, [
    config.electricityTariffBs,
    config.waterTariffBsPerM3,
    config.emissionFactorKgPerKwh,
    scenarioId,
  ]);

  // Transición entre etapas de inicialización
  useEffect(() => {
    if (!isSequencePhase(phase) || paused || !runInput) return;
    const duration =
      phase === "capturing" ? 950 : phase === "transmitting" ? 1000 : 1100;
    const timer = window.setTimeout(() => {
      if (phase === "capturing") {
        setPhase("transmitting");
        return;
      }
      if (phase === "transmitting") {
        setPhase("analyzing");
        return;
      }

      const result = evaluateSimulation(runInput, config);
      setEvaluation(result);
      setPhase("monitoring");

      if (result.status !== "normal") {
        const alert: Alert = {
          id: `simulation-${scenarioId}`,
          environmentId: "casa",
          type: result.status,
          severity:
            result.status === "potential-waste" ||
            result.status === "water-leak" ||
            result.status === "environmental-alert" ||
            result.status === "offline"
              ? "critical"
              : "warning",
          status: "new",
          title: result.title,
          description: result.explanation,
          recommendation: result.recommendation,
          evidence: {
            powerWatts: runInput.powerWatts,
            waterFlowLpm: runInput.waterFlowLpm,
            airChangePercent: runInput.airChangePercent,
            minutesWithoutActivity: runInput.minutesWithoutActivity,
          },
          openedAt: new Date().toISOString(),
          source: "simulated",
        };
        addOrUpdateAlert(alert);
      }
    }, duration);
    return () => window.clearTimeout(timer);
  }, [addOrUpdateAlert, config, paused, phase, runInput, scenarioId]);

  // Actualización dinámica continua en vivo cada 5 segundos que NO se detiene entre pestañas
  useEffect(() => {
    if (!running || paused || !runInput) return;
    const timer = window.setInterval(() => {
      setTelemetryTick((current) => current + 1);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [paused, runInput, running]);

  // Cálculo de telemetría dinámica con oscilaciones realistas
  const displayInput = useMemo(() => {
    const source = runInput ?? input;
    if (!running) return input;

    const idx = telemetryTick % powerVariations.length;

    const powerWatts =
      source.powerWatts <= 15
        ? source.powerWatts
        : Math.max(10, Math.round(source.powerWatts * powerVariations[idx]));

    const waterFlowLpm =
      source.waterFlowLpm <= 0.05
        ? 0
        : Math.max(0.1, roundOne(source.waterFlowLpm + waterVariations[idx]));

    const airChangePercent = roundOne(
      Math.max(0.5, source.airChangePercent + gasVariations[idx]),
    );

    const lightRaw = Math.min(
      1023,
      Math.max(0, source.lightRaw + lightVariations[idx]),
    );

    return {
      ...source,
      powerWatts,
      waterFlowLpm,
      airChangePercent,
      lightRaw,
    };
  }, [input, runInput, running, telemetryTick]);

  const handleScenario = useCallback(
    (id: string) => {
      const scenario = getScenario(id);
      setScenarioId(id);
      setInput(withConfig(scenario.input));
      setRunInput(null);
      setEvaluation(null);
      setBeforeInput(null);
      setApplied(false);
      setPaused(false);
      setTelemetryTick(0);
      setPhase("ready");
    },
    [withConfig],
  );

  const run = useCallback(() => {
    if (running) return;
    setRunInput(input);
    setBeforeInput(input);
    setEvaluation(null);
    setApplied(false);
    setPaused(false);
    setTelemetryTick(0);
    setPhase("capturing");
  }, [input, running]);

  const stop = useCallback(() => {
    setPhase("result");
    setPaused(false);
  }, []);

  const togglePause = useCallback(() => {
    setPaused((prev) => !prev);
  }, []);

  const apply = useCallback(() => {
    if (!evaluation) return;
    const corrected = applyRecommendation(input, evaluation);
    setInput(corrected);
    setRunInput(corrected);
    setEvaluation(evaluateSimulation(corrected, config));
    setApplied(true);
    setPaused(false);
    setTelemetryTick(0);
    setPhase("monitoring");
  }, [config, evaluation, input]);

  const updateInput = useCallback(
    (next: SimulationInput) => {
      setInput(next);
      setRunInput(null);
      setEvaluation(null);
      setBeforeInput(null);
      setApplied(false);
      setPaused(false);
      setTelemetryTick(0);
      setPhase("ready");
    },
    [],
  );

  const value = useMemo(
    () => ({
      scenarioId,
      input,
      runInput,
      evaluation,
      beforeInput,
      phase,
      paused,
      applied,
      telemetryTick,
      displayInput,
      running,
      run,
      stop,
      togglePause,
      setPaused,
      apply,
      handleScenario,
      updateInput,
    }),
    [
      scenarioId,
      input,
      runInput,
      evaluation,
      beforeInput,
      phase,
      paused,
      applied,
      telemetryTick,
      displayInput,
      running,
      run,
      stop,
      togglePause,
      apply,
      handleScenario,
      updateInput,
    ],
  );

  return (
    <SimulatorContext.Provider value={value}>
      {children}
    </SimulatorContext.Provider>
  );
}

export function useSimulator(): SimulatorContextValue {
  const context = useContext(SimulatorContext);
  if (!context) {
    throw new Error("useSimulator debe usarse dentro de un SimulatorProvider");
  }
  return context;
}
