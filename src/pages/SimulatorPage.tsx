import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowDown, Bolt, BrainCircuit, CircleCheck, Coins, Leaf, LoaderCircle, Pause, Play, RadioTower, RotateCcw, ScanLine, Sparkles } from "lucide-react";
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
import { isRunningPhase, isSequencePhase, type SimulationPhase } from "../features/simulator/simulation-phase";
import { formatNumber } from "../utils/format";

const phaseCopy = {
  capturing: { title: "Capturando lecturas simuladas", detail: "Leyendo actividad, potencia y condiciones ambientales.", Icon: ScanLine },
  transmitting: { title: "Transmitiendo al nodo EcoAhorro", detail: "Empaquetando las lecturas y enviándolas localmente.", Icon: RadioTower },
  analyzing: { title: "Analizando reglas y umbrales", detail: "Comparando actividad, consumo y configuración institucional.", Icon: BrainCircuit },
} as const;

const roundOne = (value: number) => Math.round(value * 10) / 10;
const powerFactors = [0.94, 1.02, 0.98, 1.04, 0.96, 1.01] as const;
const lowPowerOffsets = [0, -1, 1, 0, 1, -1] as const;
const temperatureOffsets = [-0.2, 0.1, 0.2, -0.1, 0, 0.1] as const;
const humidityOffsets = [-1, 0, 1, 0, 2, -1] as const;
const lightOffsets = [14, -8, 6, -3, 10, 0] as const;
const airOffsets = [0, 0.2, -0.1, 0.3, 0.1, 0] as const;

export function SimulatorPage() {
  const { config, lastScenarioId, setLastScenarioId, addOrUpdateAlert } = useApp();
  const initialScenario = getScenario(lastScenarioId);
  const withConfig = (value: SimulationInput): SimulationInput => ({ ...value, electricityTariffBs: config.electricityTariffBs, emissionFactorKgPerKwh: config.emissionFactorKgPerKwh });

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
    setInput((current) => ({ ...current, electricityTariffBs: config.electricityTariffBs, emissionFactorKgPerKwh: config.emissionFactorKgPerKwh }));
  }, [config.electricityTariffBs, config.emissionFactorKgPerKwh]);

  useEffect(() => {
    if (!isSequencePhase(phase) || paused || !runInput) return;
    const duration = phase === "capturing" ? 900 : phase === "transmitting" ? 950 : 1050;
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
          environmentId: "aula-02",
          type: result.status,
          severity: result.status === "potential-waste" || result.status === "offline" ? "critical" : "warning",
          status: "new",
          title: result.title,
          description: result.explanation,
          recommendation: result.recommendation,
          evidence: { powerWatts: runInput.powerWatts, minutesWithoutActivity: runInput.minutesWithoutActivity },
          openedAt: new Date().toISOString(),
          source: "simulated",
        };
        addOrUpdateAlert(alert);
      }
    }, duration);
    return () => window.clearTimeout(timer);
  }, [addOrUpdateAlert, config, paused, phase, runInput, scenarioId]);

  useEffect(() => {
    if (!running || paused || !runInput) return;
    const timer = window.setInterval(() => setTelemetryTick((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, [paused, runInput, running]);

  const displayInput = useMemo(() => {
    const source = runInput ?? input;
    if (!running) return input;
    const index = telemetryTick % powerFactors.length;
    const powerWatts = source.powerWatts <= 10
      ? Math.max(0, source.powerWatts + lowPowerOffsets[index])
      : Math.max(0, Math.round(source.powerWatts * powerFactors[index]));
    return {
      ...source,
      powerWatts,
      temperatureCelsius: roundOne(source.temperatureCelsius + temperatureOffsets[index]),
      humidityPercent: Math.min(100, Math.max(0, source.humidityPercent + humidityOffsets[index])),
      lightRaw: Math.min(1023, Math.max(0, source.lightRaw + lightOffsets[index])),
      airChangePercent: roundOne(Math.max(0, source.airChangePercent + airOffsets[index])),
    };
  }, [input, runInput, running, telemetryTick]);

  const hasResult = (phase === "result" || phase === "monitoring") && evaluation !== null;

  const estimate = useMemo(
    () => evaluation ? estimateFromSimulation(beforeInput ?? input, evaluation.potentialWaste || evaluation.unnecessaryLighting) : null,
    [beforeInput, evaluation, input],
  );

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
    setEvaluation(evaluateSimulation(corrected, config, evaluation));
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

  const activeCopy = phase === "capturing" || phase === "transmitting" || phase === "analyzing" ? phaseCopy[phase] : null;

  return (
    <div className="space-y-6">
      <header><p className="eyebrow">Laboratorio interactivo</p><h1 className="page-title mt-2">Simulador de condiciones</h1><p className="mt-3 max-w-3xl text-slate-600">Modifica un aula, ejecuta reglas transparentes y observa cómo una recomendación puede cambiar el consumo estimado.</p></header>
      <Disclaimer />

      <section className="panel p-4 sm:p-5">
        <label className="label" htmlFor="scenario">Escenario demostrativo</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <select id="scenario" value={scenarioId} disabled={running} onChange={(event) => handleScenario(event.target.value)} className="field disabled:cursor-wait disabled:bg-slate-100 sm:max-w-md">
            {scenarios.map((scenario) => <option key={scenario.id} value={scenario.id}>{scenario.name}</option>)}
          </select>
          <p className="self-center text-sm text-slate-600">{getScenario(scenarioId).description}</p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[.95fr_1.05fr]">
        <section className="panel p-4 sm:p-5">
          <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-lg font-bold">Aula simulada</h2><p className="text-xs text-slate-500">Telemetría local, determinista y animada por etapas</p></div>
            {hasResult && <StatusBadge status={evaluation.status} />}
          </div>
          <ClassroomVisual input={displayInput} evaluation={evaluation} paused={paused} applied={applied} phase={phase} />
          <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <button className="button-primary col-span-2 w-full sm:w-auto" onClick={run} disabled={running} aria-busy={running}>
              {running ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {running ? paused ? phase === "monitoring" ? "Monitoreo pausado" : "Simulación pausada" : phase === "monitoring" ? "Monitoreo en vivo" : "Simulación en curso…" : phase === "result" ? "Ejecutar nuevamente" : "Iniciar simulación"}
            </button>
            <button className="button-secondary w-full sm:w-auto" disabled={!running} onClick={() => setPaused((value) => !value)}>
              {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}{paused ? "Reanudar" : "Pausar"}
            </button>
            <button className="button-secondary w-full sm:w-auto" onClick={() => handleScenario(scenarioId)}><RotateCcw className="h-4 w-4" />Reiniciar</button>
          </div>
          {activeCopy && (
            <motion.div aria-live="polite" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`mt-3 flex items-center gap-3 rounded-xl border p-3 ${paused ? "border-amber-200 bg-amber-50 text-amber-700" : "border-tech-100 bg-tech-50 text-tech-700"}`}>
              <motion.span animate={!paused ? { rotate: phase === "analyzing" ? 360 : 0, scale: [1, 1.08, 1] } : {}} transition={{ duration: 1, repeat: !paused ? Infinity : 0, ease: "linear" }} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/80"><activeCopy.Icon className="h-4 w-4" /></motion.span>
              <div><p className="text-sm font-bold">{paused ? "Simulación pausada" : activeCopy.title}</p><p className="text-xs leading-5">{paused ? "Los valores y el temporizador están detenidos. Pulsa Reanudar para continuar." : activeCopy.detail}</p></div>
            </motion.div>
          )}
          <LiveTelemetry input={displayInput} phase={phase} paused={paused} />
          <SimulationProgress phase={phase} paused={paused} />
        </section>

        <section className="panel p-4 sm:p-5">
          <div className="mb-5 flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold">Parámetros</h2><p className="text-sm text-slate-500">Origen: simulado · Resultados reproducibles.</p></div>{running && <span className="shrink-0 rounded-full bg-tech-50 px-2.5 py-1 text-[11px] font-bold text-tech-700">Bloqueados durante la ejecución</span>}</div>
          <SimulationControls input={input} onChange={updateInput} disabled={running} />
        </section>
      </div>

      <div aria-live="polite">
        {hasResult && evaluation && (
          <section className={`panel p-4 sm:p-5 ${evaluation.status === "normal" || applied ? "border-forest-100" : "border-danger-100"}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">{evaluation.status === "normal" ? <CircleCheck className="mt-1 shrink-0 text-forest-600" /> : <AlertTriangle className={`mt-1 shrink-0 ${applied ? "text-forest-600" : "text-danger-500"}`} />}<div><StatusBadge status={evaluation.status} /><h2 className="mt-2 text-xl font-bold">{applied ? "Recomendación aplicada" : evaluation.title}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{applied ? "La simulación redujo el consumo y recalculó los indicadores." : evaluation.explanation}</p></div></div>
              {!applied && evaluation.status !== "normal" && <button className="button-primary shrink-0" onClick={apply}><Sparkles className="h-4 w-4" />Aplicar recomendación</button>}
            </div>
            {!applied && <div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Recomendación</p><p className="mt-1 font-semibold text-slate-800">{evaluation.recommendation}</p></div>}
            {applied && beforeInput && <div className="mt-5 grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]"><div className="rounded-xl bg-danger-50 p-4"><p className="text-xs font-bold uppercase text-danger-700">Antes</p><p className="mt-1 text-2xl font-bold">{beforeInput.powerWatts} W</p><p className="text-sm text-slate-600">Consumo mantenido</p></div><ArrowDown className="mx-auto text-forest-600 sm:-rotate-90" /><div className="rounded-xl bg-forest-50 p-4"><p className="text-xs font-bold uppercase text-forest-700">Después</p><p className="mt-1 text-2xl font-bold">{input.powerWatts} W</p><p className="text-sm text-slate-600">Consumo simulado corregido</p></div></div>}
          </section>
        )}
      </div>

      {estimate && <section><div className="mb-3 flex items-end justify-between gap-3"><div><p className="eyebrow">Resultados estimados</p><h2 className="mt-1 text-xl font-bold">Impacto del escenario</h2></div><span className="text-xs font-bold text-slate-500">Origen: estimated</span></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Energía mensual" value={formatNumber(estimate.energyKwh)} unit="kWh/mes" hint="Estimación de uso" icon={Bolt} tone="blue" /><MetricCard label="Costo mensual" value={formatNumber(estimate.costBs)} unit="Bs/mes" hint="Según tarifa configurada" icon={Coins} tone="amber" /><MetricCard label="Ahorro potencial" value={formatNumber(estimate.potentialSavingBs)} unit="Bs/mes" hint="No es un ahorro garantizado" icon={Sparkles} /><MetricCard label="CO₂ evitable estimado" value={formatNumber(estimate.estimatedCo2Kg)} unit="kg CO₂/mes" hint="Cálculo demostrativo" icon={Leaf} /></div><div className="panel mt-4 p-4"><p className="text-sm font-bold">Supuestos utilizados</p><ul className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-5">{estimate.assumptions.map((assumption) => <li key={assumption}>• {assumption}</li>)}</ul></div></section>}
    </div>
  );
}
