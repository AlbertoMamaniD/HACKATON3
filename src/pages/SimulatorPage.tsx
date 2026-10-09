import { useMemo } from "react";
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
  LoaderCircle,
  Pause,
  Play,
  RadioTower,
  RotateCcw,
  ScanLine,
  Sparkles,
  Square,
} from "lucide-react";
import { useApp } from "../app/AppProvider";
import { Disclaimer } from "../components/Disclaimer";
import { MetricCard } from "../components/MetricCard";
import { StatusBadge } from "../components/StatusBadge";
import { getScenario, scenarios } from "../data/scenarios";
import { estimateFromSimulation } from "../domain/calculations";
import { ClassroomVisual } from "../features/simulator/ClassroomVisual";
import { LiveTelemetry } from "../features/simulator/LiveTelemetry";
import { SimulationControls } from "../features/simulator/SimulationControls";
import { SimulationProgress } from "../features/simulator/SimulationProgress";
import { formatNumber } from "../utils/format";
import { useSimulator } from "../context/SimulatorContext";

const phaseCopy = {
  capturing: {
    title: "Capturando telemetría residencial",
    detail: "Midiendo potencia activa, caudal de agua y luces encendidas.",
    Icon: ScanLine,
  },
  transmitting: {
    title: "Transmitiendo al concentrador EcoAhorro",
    detail: "Empaquetando lecturas del sensor en tramas de datos cada 5 segundos.",
    Icon: RadioTower,
  },
  analyzing: {
    title: "Evaluando reglas y balance de sostenibilidad",
    detail: "Calculando posibles fugas, desperdicio eléctrico y su costo en Bs.",
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
  const { config } = useApp();
  const {
    scenarioId,
    input,
    evaluation,
    beforeInput,
    phase,
    paused,
    applied,
    displayInput,
    running,
    run,
    stop,
    setPaused,
    apply,
    handleScenario,
    updateInput,
  } = useSimulator();

  const hasResult =
    (phase === "result" || phase === "monitoring") && evaluation !== null;

  const estimate = useMemo(() => {
    return estimateFromSimulation(
      beforeInput ?? input,
      Boolean(evaluation?.potentialWaste || evaluation?.unnecessaryLighting),
      Boolean(evaluation?.waterWaste),
    );
  }, [beforeInput, evaluation, input]);

  const activeCopy =
    phase === "capturing" || phase === "transmitting" || phase === "analyzing"
      ? phaseCopy[phase]
      : null;

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Simulador en tiempo real (5s)</p>
        <h1 className="page-title mt-2">
          Simulador de ahorro de luz y agua
        </h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Prueba situaciones de consumo de luz y agua, recibe la alerta y
          comprueba cuánto ahorras en bolivianos al corregirlas.
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
            {running && (
              <button
                className="button-secondary border-rose-300 text-rose-700 bg-rose-50/60 hover:bg-rose-100/80 w-full sm:w-auto flex items-center justify-center gap-1.5"
                onClick={stop}
              >
                <Square className="h-3.5 w-3.5 fill-rose-600 text-rose-600" />
                Detener
              </button>
            )}
            <button
              className="button-secondary w-full sm:w-auto"
              onClick={() => handleScenario(scenarioId)}
            >
              <RotateCcw className="h-4 w-4" />
              Reiniciar
            </button>
          </div>

          {phase === "monitoring" && (
            <motion.div
              aria-live="polite"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-3 flex items-center gap-3 rounded-xl border p-3 ${
                paused
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              <span className={`h-3 w-3 shrink-0 rounded-full ${paused ? "bg-amber-500" : "bg-emerald-500 animate-ping"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-bold">
                  {paused
                    ? "Monitoreo en vivo pausado"
                    : "Simulación continua en vivo activa"}
                </p>
                <p className="text-[11px] sm:text-xs leading-4 text-emerald-700/90">
                  {paused
                    ? "El reloj y la telemetría están detenidos. Pulsa Reanudar para continuar."
                    : "Actualizando datos cada 5 segundos de forma ininterrumpida hasta que pulses Detener o Pausar."}
                </p>
              </div>
            </motion.div>
          )}

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
                      ? "Recomendación aplicada: consumo optimizado"
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

                <div className="grid gap-4 sm:grid-cols-2">
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

                </div>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Ahorro estimado en Bs */}
      {estimate && (
        <section className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Ahorro en bolivianos</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Ahorro estimado al corregir el consumo
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500">
              Estimación con datos simulados; no garantiza ahorro
            </span>
          </div>

          {/* Tarjetas de métricas de Energía y Agua */}
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard
              label="Ahorro económico total"
              value={`Bs ${formatNumber(estimate.totalSavingBs)}`}
              unit="por mes"
              hint="Energía + Agua combinadas"
              icon={Coins}
              tone="amber"
            />
            <MetricCard
              label="Ahorro de luz"
              value={`${formatNumber(estimate.avoidableEnergyKwh)} kWh`}
              unit={`Bs ${formatNumber(estimate.potentialSavingBs)}/mes`}
              hint={`Tarifa: Bs ${(beforeInput ?? input).electricityTariffBs.toFixed(2)}/kWh`}
              icon={Bolt}
              tone="blue"
            />
            <MetricCard
              label="Ahorro de agua"
              value={`${formatNumber(estimate.avoidableWaterLiters)} L`}
              unit={`Bs ${formatNumber(estimate.waterSavingBs)}/mes`}
              hint={`Tarifa: Bs ${(beforeInput ?? input).waterTariffBsPerM3.toFixed(2)}/m³`}
              icon={Droplets}
              tone="blue"
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
