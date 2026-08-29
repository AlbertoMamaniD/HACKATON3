import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowDown, Bolt, CircleCheck, Coins, Leaf, Pause, Play, RotateCcw, Sparkles } from "lucide-react";
import { useApp } from "../app/AppProvider";
import { Disclaimer } from "../components/Disclaimer";
import { MetricCard } from "../components/MetricCard";
import { StatusBadge } from "../components/StatusBadge";
import { scenarios, getScenario } from "../data/scenarios";
import { estimateFromSimulation } from "../domain/calculations";
import { applyRecommendation, evaluateSimulation } from "../domain/rules";
import type { Alert, RuleEvaluation, SimulationInput } from "../domain/types";
import { ClassroomVisual } from "../features/simulator/ClassroomVisual";
import { SimulationControls } from "../features/simulator/SimulationControls";
import { formatNumber } from "../utils/format";

export function SimulatorPage() {
  const { config, lastScenarioId, setLastScenarioId, addOrUpdateAlert } = useApp();
  const initialScenario = getScenario(lastScenarioId);
  const withConfig = (input: SimulationInput): SimulationInput => ({ ...input, electricityTariffBs: config.electricityTariffBs, emissionFactorKgPerKwh: config.emissionFactorKgPerKwh });
  const [scenarioId, setScenarioId] = useState(initialScenario.id);
  const [input, setInput] = useState(() => withConfig(initialScenario.input));
  const [evaluation, setEvaluation] = useState<RuleEvaluation | null>(null);
  const [beforeInput, setBeforeInput] = useState<SimulationInput | null>(null);
  const [phase, setPhase] = useState<"ready" | "analyzing" | "result">("ready");
  const [paused, setPaused] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => { setInput((current) => ({ ...current, electricityTariffBs: config.electricityTariffBs, emissionFactorKgPerKwh: config.emissionFactorKgPerKwh })); }, [config.electricityTariffBs, config.emissionFactorKgPerKwh]);

  const estimate = useMemo(() => evaluation ? estimateFromSimulation(beforeInput ?? input, evaluation.potentialWaste || evaluation.unnecessaryLighting) : null, [beforeInput, evaluation, input]);
  const handleScenario = (id: string) => { const scenario = getScenario(id); setScenarioId(id); setLastScenarioId(id); setInput(withConfig(scenario.input)); setEvaluation(null); setBeforeInput(null); setApplied(false); setPhase("ready"); };
  const run = () => {
    setPhase("analyzing"); setApplied(false); setBeforeInput(input);
    const result = evaluateSimulation(input, config, evaluation ?? undefined);
    window.setTimeout(() => {
      setEvaluation(result); setPhase("result");
      if (result.status !== "normal") {
        const alert: Alert = { id: `simulation-${scenarioId}`, environmentId: "aula-02", type: result.status, severity: result.status === "potential-waste" || result.status === "offline" ? "critical" : "warning", status: "new", title: result.title, description: result.explanation, recommendation: result.recommendation, evidence: { powerWatts: input.powerWatts, minutesWithoutActivity: input.minutesWithoutActivity }, openedAt: new Date().toISOString(), source: "simulated" };
        addOrUpdateAlert(alert);
      }
    }, 450);
  };
  const apply = () => { if (!evaluation) return; const corrected = applyRecommendation(input, evaluation); setInput(corrected); setEvaluation(evaluateSimulation(corrected, config, evaluation)); setApplied(true); setPhase("result"); };
  const reset = () => handleScenario(scenarioId);

  return <div className="space-y-6">
    <header><p className="eyebrow">Laboratorio interactivo</p><h1 className="page-title mt-2">Simulador de condiciones</h1><p className="mt-3 max-w-3xl text-slate-600">Modifica un aula, ejecuta reglas transparentes y observa cómo una recomendación puede cambiar el consumo estimado.</p></header>
    <Disclaimer />
    <section className="panel p-5"><label className="label" htmlFor="scenario">Escenario demostrativo</label><div className="flex flex-col gap-3 sm:flex-row"><select id="scenario" value={scenarioId} onChange={(event) => handleScenario(event.target.value)} className="field sm:max-w-md">{scenarios.map((scenario) => <option key={scenario.id} value={scenario.id}>{scenario.name}</option>)}</select><p className="self-center text-sm text-slate-600">{getScenario(scenarioId).description}</p></div></section>
    <div className="grid gap-6 xl:grid-cols-[.95fr_1.05fr]">
      <section className="panel p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold">Aula simulada</h2><p className="text-xs text-slate-500">Las animaciones representan datos locales</p></div>{evaluation && <StatusBadge status={evaluation.status} />}</div><ClassroomVisual input={input} evaluation={evaluation} paused={paused} applied={applied} />
        <div className="mt-4 flex flex-wrap gap-2"><button className="button-primary" onClick={run} disabled={phase === "analyzing"}><Play className="h-4 w-4" />{phase === "analyzing" ? "Analizando…" : "Iniciar simulación"}</button><button className="button-secondary" onClick={() => setPaused((value) => !value)}><Pause className="h-4 w-4" />{paused ? "Reanudar" : "Pausar"}</button><button className="button-secondary" onClick={reset}><RotateCcw className="h-4 w-4" />Reiniciar</button></div>
      </section>
      <section className="panel p-5"><div className="mb-5"><h2 className="text-lg font-bold">Parámetros</h2><p className="text-sm text-slate-500">Origen: simulado · Los resultados se reproducen siempre igual.</p></div><SimulationControls input={input} onChange={(next) => { setInput(next); setEvaluation(null); setApplied(false); setPhase("ready"); }} /></section>
    </div>
    <div aria-live="polite">
      {phase === "analyzing" && <div className="panel flex items-center gap-3 border-tech-100 bg-tech-50 p-5 text-tech-700"><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Sparkles /></motion.span><div><p className="font-bold">Analizando las reglas locales…</p><p className="text-sm">Comparando actividad, potencia y umbrales configurados.</p></div></div>}
      {phase === "result" && evaluation && <section className={`panel p-5 ${evaluation.status === "normal" ? "border-forest-100" : applied ? "border-forest-100" : "border-danger-100"}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex gap-3">{evaluation.status === "normal" ? <CircleCheck className="mt-1 text-forest-600" /> : <AlertTriangle className={`mt-1 ${applied ? "text-forest-600" : "text-danger-500"}`} />}<div><StatusBadge status={evaluation.status} /><h2 className="mt-2 text-xl font-bold">{applied ? "Recomendación aplicada" : evaluation.title}</h2><p className="mt-1 text-sm text-slate-600">{applied ? "La simulación redujo el consumo y recalculó los indicadores." : evaluation.explanation}</p></div></div>{!applied && evaluation.status !== "normal" && <button className="button-primary shrink-0" onClick={apply}><Sparkles className="h-4 w-4" />Aplicar recomendación</button>}</div>
        {!applied && <div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Recomendación</p><p className="mt-1 font-semibold text-slate-800">{evaluation.recommendation}</p></div>}
        {applied && beforeInput && <div className="mt-5 grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]"><div className="rounded-xl bg-danger-50 p-4"><p className="text-xs font-bold uppercase text-danger-700">Antes</p><p className="mt-1 text-2xl font-bold">{beforeInput.powerWatts} W</p><p className="text-sm text-slate-600">Consumo mantenido</p></div><ArrowDown className="mx-auto rotate-0 text-forest-600 sm:-rotate-90" /><div className="rounded-xl bg-forest-50 p-4"><p className="text-xs font-bold uppercase text-forest-700">Después</p><p className="mt-1 text-2xl font-bold">{input.powerWatts} W</p><p className="text-sm text-slate-600">Consumo simulado corregido</p></div></div>}
      </section>}
    </div>
    {estimate && <section><div className="mb-3 flex items-end justify-between"><div><p className="eyebrow">Resultados estimados</p><h2 className="mt-1 text-xl font-bold">Impacto del escenario</h2></div><span className="text-xs font-bold text-slate-500">Origen: estimated</span></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Energía mensual" value={formatNumber(estimate.energyKwh)} unit="kWh/mes" hint="Estimación de uso" icon={Bolt} tone="blue" /><MetricCard label="Costo mensual" value={formatNumber(estimate.costBs)} unit="Bs/mes" hint="Según tarifa configurada" icon={Coins} tone="amber" /><MetricCard label="Ahorro potencial" value={formatNumber(estimate.potentialSavingBs)} unit="Bs/mes" hint="No es un ahorro garantizado" icon={Sparkles} /><MetricCard label="CO₂ evitable estimado" value={formatNumber(estimate.estimatedCo2Kg)} unit="kg CO₂/mes" hint="Cálculo demostrativo" icon={Leaf} /></div><div className="mt-4 panel p-4"><p className="text-sm font-bold">Supuestos utilizados</p><ul className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-5">{estimate.assumptions.map((assumption) => <li key={assumption}>• {assumption}</li>)}</ul></div></section>}
  </div>;
}
