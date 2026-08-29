import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Bolt,
  BrainCircuit,
  CircleCheck,
  Coins,
  Droplets,
  Flame,
  Leaf,
  Lightbulb,
  LoaderCircle,
  Pause,
  Play,
  RadioTower,
  RotateCcw,
  ScanLine,
  Sparkles,
  Wind,
} from "lucide-react";
import { useApp } from "../app/AppProvider";
import { Disclaimer } from "../components/Disclaimer";
import { MetricCard } from "../components/MetricCard";
import { StatusBadge } from "../components/StatusBadge";
import { getScenario, scenarios } from "../data/scenarios";
import { estimateFromSimulation } from "../domain/calculations";
import { applyRecommendation, evaluateSimulation } from "../domain/rules";
import type { Alert, RuleEvaluation, SimulationInput } from "../domain/types";
import { ClassroomVisual } from "../features/simulator/ClassroomVisual";
import { LiveTelemetry } from "../features/simulator/LiveTelemetry";
import { SimulationControls } from "../features/simulator/SimulationControls";
import { SimulationProgress } from "../features/simulator/SimulationProgress";
import {
  isRunningPhase,
  isSequencePhase,
  type SimulationPhase,
} from "../features/simulator/simulation-phase";
import { formatNumber } from "../utils/format";

const phaseCopy = {
  capturing: {
    title: "Capturando telemetría residencial",
    detail: "Midiendo potencia activa, caudal de agua y concentración de gases MQ-135.",
    Icon: ScanLine,
  },
  transmitting: {
    title: "Transmitiendo al concentrador EcoAhorro",
    detail: "Empaquetando lecturas del sensor en tramas de datos cada 5 segundos.",
    Icon: RadioTower,
  },
  analyzing: {
    title: "Evaluando reglas y balance de sostenibilidad",
    detail: "Calculando posibles fugas, desperdicio eléctrico y emisiones de CO₂ evitables.",
    Icon: BrainCircuit,
  },
} as const;

const roundOne = (value: number) => Math.round(value * 10) / 10;

// Variaciones naturales para simular comportamiento en tiempo real cada 5s
const powerVariations = [1.02, 0.97, 1.04, 0.98, 1.01, 0.95] as const;
const waterVariations = [0.1, -0.1, 0.2, -0.15, 0.05, 0] as const;
const gasVariations = [-0.2, 0.3, -0.1, 0.4, 0.1, -0.3] as const;
const lightVariations = [8, -12, 15, -6, 10, -4] as const;

export function SimulatorPage() {
  const { config, lastScenarioId, setLastScenarioId, addOrUpdateAlert } =
    useApp();
  const initialScenario = getScenario(lastScenarioId);

  const withConfig = (value: SimulationInput): SimulationInput => ({
    ...value,
    electricityTariffBs: config.electricityTariffBs,
    waterTariffBsPerM3: config.waterTariffBsPerM3,
    emissionFactorKgPerKwh: config.emissionFactorKgPerKwh,
  });

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

  useEffect(() => {
    setInput((current) => ({
      ...current,
      electricityTariffBs: config.electricityTariffBs,
      waterTariffBsPerM3: config.waterTariffBsPerM3,
      emissionFactorKgPerKwh: config.emissionFactorKgPerKwh,
    }));
  }, [
    config.electricityTariffBs,
    config.waterTariffBsPerM3,
    config.emissionFactorKgPerKwh,
  ]);

  // Ciclo de etapas de simulación
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

  // Actualización dinámica cada 5 segundos (5000 ms) como solicitado
  useEffect(() => {
    if (!running || paused || !runInput) return;
    const timer = window.setInterval(() => {
      setTelemetryTick((current) => current + 1);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [paused, runInput, running]);

  // Cálculo de valores con oscilación en vivo
  const displayInput = useMemo(() => {
    const source = runInput ?? input;
    if (!running) return input;

    const idx = telemetryTick % powerVariations.length;

    // Oscilación de potencia
    const powerWatts =
      source.powerWatts <= 15
        ? source.powerWatts
        : Math.max(10, Math.round(source.powerWatts * powerVariations[idx]));

    // Oscilación de agua
    const waterFlowLpm =
      source.waterFlowLpm <= 0.05
        ? 0
        : Math.max(0.1, roundOne(source.waterFlowLpm + waterVariations[idx]));

    // Oscilación de gases MQ-135
    const airChangePercent = roundOne(
      Math.max(0.5, source.airChangePercent + gasVariations[idx]),
    );

    // Oscilación sensor de luz
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

  const hasResult =
    (phase === "result" || phase === "monitoring") && evaluation !== null;

  const estimate = useMemo(() => {
    if (!evaluation) return null;
    return estimateFromSimulation(
      beforeInput ?? input,
      evaluation.potentialWaste || evaluation.unnecessaryLighting,
      evaluation.waterWaste,
    );
  }, [beforeInput, evaluation, input]);

  const handleScenario = (id: string) => {
    const scenario = getScenario(id);
    setScenarioId(id);
    setLastScenarioId(id);
    setInput(withConfig(scenario.input));
    setRunInput(null);
    setEvaluation(null);
    setBeforeInput(null);
    setApplied(false);
    setPaused(false);
    setTelemetryTick(0);
    setPhase("ready");
  };

  const run = () => {
    if (running) return;
    setRunInput(input);
    setBeforeInput(input);
    setEvaluation(null);
    setApplied(false);
    setPaused(false);
    setTelemetryTick(0);
    setPhase("capturing");
  };

  const apply = () => {
    if (!evaluation) return;
    const corrected = applyRecommendation(input, evaluation);
    setInput(corrected);
    setRunInput(corrected);
    setEvaluation(evaluateSimulation(corrected, config));
    setApplied(true);
    setPaused(false);
    setTelemetryTick(0);
    setPhase("monitoring");
  };

  const updateInput = (next: SimulationInput) => {
    setInput(next);
    setRunInput(null);
    setEvaluation(null);
    setBeforeInput(null);
    setApplied(false);
    setPaused(false);
    setTelemetryTick(0);
    setPhase("ready");
  };

  const activeCopy =
    phase === "capturing" || phase === "transmitting" || phase === "analyzing"
      ? phaseCopy[phase]
      : null;

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Simulador en tiempo real (5s)</p>
        <h1 className="page-title mt-2">
          Laboratorio de Sostenibilidad y Ahorro
        </h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Monitorea el comportamiento dinámico de energía, flujo de agua, gases
          MQ-135 e iluminación. Comprueba el ahorro económico en bolivianos y el
          porcentaje de emisiones de CO₂ evitadas.
        </p>
      </header>
      <Disclaimer />

      {/* Selector de escenarios */}
      <section className="panel p-4 sm:p-5">
        <label className="label" htmlFor="scenario">
          Escenario residencial demostrativo
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            id="scenario"
            value={scenarioId}
            disabled={running}
            onChange={(event) => handleScenario(event.target.value)}
            className="field disabled:cursor-wait disabled:bg-slate-100 sm:max-w-md"
          >
            {scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}
              </option>
            ))}
          </select>
          <p className="self-center text-sm text-slate-600">
            {getScenario(scenarioId).description}
          </p>
        </div>
      </section>

      {/* Panel principal de simulación */}
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="panel p-4 sm:p-5">
          <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold">Vivienda EcoAhorro</h2>
              <p className="text-xs text-slate-500">
                Lecturas continuas con refresco dinámico cada 5 segundos
              </p>
            </div>
            {hasResult && <StatusBadge status={evaluation.status} />}
          </div>

          <ClassroomVisual
            input={displayInput}
            evaluation={evaluation}
            paused={paused}
            applied={applied}
            phase={phase}
          />

          <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <button
              className="button-primary col-span-2 w-full sm:w-auto"
              onClick={run}
              disabled={running}
              aria-busy={running}
            >
              {running ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {running
                ? paused
                  ? phase === "monitoring"
                    ? "Monitoreo pausado"
                    : "Simulación pausada"
                  : phase === "monitoring"
                    ? "Monitoreando en vivo"
                    : "Simulando…"
                : phase === "result"
                  ? "Ejecutar de nuevo"
                  : "Iniciar simulación"}
            </button>
            <button
              className="button-secondary w-full sm:w-auto"
              disabled={!running}
              onClick={() => setPaused((value) => !value)}
            >
              {paused ? (
                <Play className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
              {paused ? "Reanudar" : "Pausar"}
            </button>
            <button
              className="button-secondary w-full sm:w-auto"
              onClick={() => handleScenario(scenarioId)}
            >
              <RotateCcw className="h-4 w-4" />
              Reiniciar
            </button>
          </div>

          {activeCopy && (
            <motion.div
              aria-live="polite"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-3 flex items-center gap-3 rounded-xl border p-3 ${
                paused
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-tech-100 bg-tech-50 text-tech-700"
              }`}
            >
              <motion.span
                animate={
                  !paused
                    ? {
                        rotate: phase === "analyzing" ? 360 : 0,
                        scale: [1, 1.08, 1],
                      }
                    : {}
                }
                transition={{
                  duration: 1,
                  repeat: !paused ? Infinity : 0,
                  ease: "linear",
                }}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/80"
              >
                <activeCopy.Icon className="h-4 w-4" />
              </motion.span>
              <div>
                <p className="text-sm font-bold">
                  {paused ? "Simulación pausada" : activeCopy.title}
                </p>
                <p className="text-xs leading-5">
                  {paused
                    ? "Los valores y el temporizador están detenidos. Pulsa Reanudar para continuar."
                    : activeCopy.detail}
                </p>
              </div>
            </motion.div>
          )}

          <LiveTelemetry
            input={displayInput}
            phase={phase}
            paused={paused}
          />
          <SimulationProgress phase={phase} paused={paused} />
        </section>

        {/* Panel de parámetros */}
        <section className="panel p-4 sm:p-5">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Parámetros del escenario</h2>
              <p className="text-sm text-slate-500">
                Ajuste interactivo de consumos, tarifas y factores ambientales.
              </p>
            </div>
            {running && (
              <span className="shrink-0 rounded-full bg-tech-50 px-2.5 py-1 text-[11px] font-bold text-tech-700">
                Fijados durante ejecución
              </span>
            )}
          </div>
          <SimulationControls
            input={input}
            onChange={updateInput}
            disabled={running}
          />
        </section>
      </div>

      {/* Evaluación y Comparación ANTES vs DESPUÉS */}
      <div aria-live="polite">
        {evaluation && (
          <section
            className={`panel p-4 sm:p-6 border-2 transition-all ${
              evaluation.status === "normal" || applied
                ? "border-emerald-200 bg-emerald-50/20"
                : "border-rose-200 bg-rose-50/30 shadow-md"
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                {evaluation.status === "normal" || applied ? (
                  <CircleCheck className="mt-1 shrink-0 text-forest-600 h-6 w-6" />
                ) : (
                  <AlertTriangle className="mt-1 shrink-0 text-danger-500 h-6 w-6 animate-pulse" />
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={evaluation.status} />
                    {phase === "ready" && !applied && (
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        Diagnóstico del escenario
                      </span>
                    )}
                  </div>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">
                    {applied
                      ? "Recomendación aplicada: Consumo y emisiones optimizados"
                      : evaluation.title}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {applied
                      ? "Se han cerrado las fugas de agua y minimizado el consumo eléctrico innecesario."
                      : evaluation.explanation}
                  </p>
                </div>
              </div>
              {!applied && evaluation.status !== "normal" && (
                <button
                  className="button-primary shrink-0 flex items-center gap-2"
                  onClick={apply}
                >
                  <Sparkles className="h-4 w-4" />
                  Aplicar recomendación y optimizar
                </button>
              )}
            </div>

            {!applied && (
              <div className="mt-4 rounded-xl bg-white p-4 border border-slate-200 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Acción recomendada
                </p>
                <p className="mt-1 font-semibold text-slate-800">
                  {evaluation.recommendation}
                </p>
              </div>
            )}

            {/* COMPARADOR ANTES VS DESPUÉS */}
            {applied && beforeInput && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    Comparativa de Impacto: Antes vs Después
                  </h3>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                    Optimización demostrada
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Electricidad */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500">
                      <Bolt className="h-4 w-4 text-amber-500" />
                      Potencia eléctrica
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-rose-600 font-bold">Antes</p>
                        <p className="text-lg font-bold text-slate-700">
                          {beforeInput.powerWatts} W
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-xs text-emerald-600 font-bold">
                          Después
                        </p>
                        <p className="text-xl font-bold text-emerald-700">
                          {input.powerWatts} W
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] font-medium text-slate-500">
                      Reducción de {beforeInput.powerWatts - input.powerWatts} W
                    </p>
                  </div>

                  {/* Agua */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500">
                      <Droplets className="h-4 w-4 text-sky-500" />
                      Caudal de agua
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-rose-600 font-bold">Antes</p>
                        <p className="text-lg font-bold text-slate-700">
                          {beforeInput.waterFlowLpm.toFixed(1)} L/min
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-xs text-emerald-600 font-bold">
                          Después
                        </p>
                        <p className="text-xl font-bold text-emerald-700">
                          {input.waterFlowLpm.toFixed(1)} L/min
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] font-medium text-slate-500">
                      {beforeInput.waterFlowLpm > 0
                        ? "Fuga o grifo controlado"
                        : "Consumo hídrico óptimo"}
                    </p>
                  </div>

                  {/* Emisión de CO2 */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500">
                      <Leaf className="h-4 w-4 text-emerald-500" />
                      Reducción CO₂
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-500 font-bold">
                          Emisión inicial
                        </p>
                        <p className="text-lg font-bold text-slate-700">
                          {estimate?.co2CurrentKg ?? 0} kg
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-xs text-emerald-600 font-bold">
                          Evitado
                        </p>
                        <p className="text-xl font-bold text-emerald-700">
                          {estimate?.co2AvoidedKg ?? 0} kg
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] font-bold text-emerald-600">
                      {estimate?.co2ReductionPercent ?? 0}% de CO₂ reducido
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Resultados Estimados de Ahorro y Fórmula de CO2 */}
      {estimate && (
        <section className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Impacto y Sostenibilidad</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Balance Cuantificado de Ahorro
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500">
              Cálculos basados en fórmulas auditables
            </span>
          </div>

          {/* TARJETA DESTACADA: REDUCCIÓN DE CO2 */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500 bg-gradient-to-r from-emerald-900 to-forest-900 p-5 sm:p-6 text-white shadow-xl">
            <div className="relative z-10 grid gap-6 md:grid-cols-[1.2fr_1fr] items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 text-xs font-bold text-emerald-300">
                  <Leaf className="h-3.5 w-3.5" />
                  Métrica de Huella de Carbono
                </span>
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="text-4xl sm:text-5xl font-black tracking-tight text-emerald-300">
                    {estimate.co2ReductionPercent}%
                  </span>
                  <span className="text-lg font-semibold text-slate-200">
                    de emisiones de CO₂ evitadas
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-300 max-w-xl">
                  Equivale a{" "}
                  <strong className="text-white">
                    {formatNumber(estimate.co2AvoidedKg)} kg de CO₂/mes
                  </strong>{" "}
                  que no se emitieron a la atmósfera al corregir el consumo
                  eléctrico innecesario.
                </p>
              </div>

              {/* Fórmula visible */}
              <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm border border-white/15">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                  Fórmula de cálculo de CO₂
                </p>
                <div className="mt-2 space-y-1.5 text-xs text-slate-200 font-mono">
                  <p>CO₂ Evitado = kWh Ahorrados × {config.emissionFactorKgPerKwh} kg/kWh</p>
                  <p>
                    % Reducción = (CO₂ Evitado / CO₂ Base) × 100%
                  </p>
                  <div className="mt-2 pt-2 border-t border-white/10 text-[11px] text-emerald-300">
                    = ({formatNumber(estimate.avoidableEnergyKwh)} kWh × {config.emissionFactorKgPerKwh}) / {formatNumber(estimate.co2CurrentKg || 1)} kg = <strong>{estimate.co2ReductionPercent}%</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjetas de métricas de Energía y Agua */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Ahorro económico total"
              value={`Bs ${formatNumber(estimate.totalSavingBs)}`}
              unit="por mes"
              hint="Energía + Agua combinadas"
              icon={Coins}
              tone="amber"
            />
            <MetricCard
              label="Ahorro de energía"
              value={`${formatNumber(estimate.avoidableEnergyKwh)} kWh`}
              unit={`Bs ${formatNumber(estimate.potentialSavingBs)}/mes`}
              hint={`Tarifa: Bs ${config.electricityTariffBs.toFixed(2)}/kWh`}
              icon={Bolt}
              tone="blue"
            />
            <MetricCard
              label="Ahorro de agua potable"
              value={`${formatNumber(estimate.avoidableWaterLiters)} L`}
              unit={`Bs ${formatNumber(estimate.waterSavingBs)}/mes`}
              hint={`Tarifa: Bs ${config.waterTariffBsPerM3.toFixed(2)}/m³`}
              icon={Droplets}
              tone="blue"
            />
            <MetricCard
              label="CO₂ mensual evitado"
              value={`${formatNumber(estimate.co2AvoidedKg)} kg`}
              unit="CO₂/mes"
              hint={`${estimate.co2ReductionPercent}% de reducción`}
              icon={Leaf}
            />
          </div>

          <div className="panel p-4">
            <p className="text-sm font-bold text-slate-800">
              Supuestos de cálculo utilizados
            </p>
            <ul className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
              {estimate.assumptions.map((assumption) => (
                <li key={assumption} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-forest-600 shrink-0" />
                  <span>{assumption}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
