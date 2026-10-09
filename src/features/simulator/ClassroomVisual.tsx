import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  Bolt,
  BrainCircuit,
  CircleCheck,
  Droplets,
  Flame,
  LampCeiling,
  RadioTower,
  ScanLine,
  Send,
  Sparkles,
  UserRound,
} from "lucide-react";
import type { RuleEvaluation, SimulationInput } from "../../domain/types";
import type { SimulationPhase } from "./simulation-phase";

interface ClassroomVisualProps {
  input: SimulationInput;
  evaluation: RuleEvaluation | null;
  paused: boolean;
  applied: boolean;
  phase: SimulationPhase;
}

const runningState = {
  capturing: { label: "Capturando", Icon: ScanLine },
  transmitting: { label: "Transmitiendo", Icon: Send },
  analyzing: { label: "Analizando", Icon: BrainCircuit },
} as const;

export function ClassroomVisual({
  input,
  evaluation,
  paused,
  applied,
  phase,
}: ClassroomVisualProps) {
  const isAlerting = evaluation && evaluation.status !== "normal" && !applied;
  const currentRunningState =
    phase === "capturing" || phase === "transmitting" || phase === "analyzing"
      ? runningState[phase]
      : null;
  const monitoring = phase === "monitoring";

  // Identificar qué anomalía específica está ocurriendo
  const isWaterLeak = input.waterFlowLpm > 0.3 && !input.presenceDetected;
  const isEnergyWaste = input.powerWatts > 40 && !input.presenceDetected && input.minutesWithoutActivity >= 15;
  const isLightWaste = input.lightOn && !input.presenceDetected && input.minutesWithoutActivity >= 10;

  return (
    <div
      className={`relative min-h-[390px] overflow-hidden rounded-2xl border transition-all duration-500 p-4 sm:min-h-[410px] sm:p-5 flex flex-col justify-between ${
        isAlerting
          ? "border-rose-300 bg-gradient-to-b from-[#fdf0f0] via-[#fcf3f3] to-[#fae6e6] shadow-[0_0_35px_rgba(239,68,68,0.15)]"
          : applied
            ? "border-emerald-300 bg-gradient-to-b from-[#f0fdf4] via-[#f4fcf6] to-[#e6f7ec]"
            : "border-slate-200 bg-[#eef4f0]"
      }`}
      aria-label="Representación visual del hogar inteligente"
    >
      {/* Header del visual */}
      <div className="relative z-10 flex min-h-9 items-start justify-between gap-2">
        <span className="rounded-lg bg-white/95 backdrop-blur px-3 py-1.5 text-[11px] font-bold text-slate-800 shadow-sm sm:text-xs flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${isAlerting ? "bg-red-500 animate-ping" : applied ? "bg-emerald-500" : "bg-forest-600"}`} />
          Vivienda EcoAhorro · Monitoreo de Recursos
        </span>

        <AnimatePresence mode="wait">
          {currentRunningState && (
            <motion.span
              key={paused ? "paused" : phase}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold shadow-sm sm:text-xs ${
                paused
                  ? "bg-amber-100 text-amber-800"
                  : "bg-tech-700 text-white"
              }`}
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 6, opacity: 0 }}
            >
              <currentRunningState.Icon className="h-3.5 w-3.5" />{" "}
              {paused ? "Pausada" : currentRunningState.label}
            </motion.span>
          )}

          {monitoring && !isAlerting && !applied && (
            <motion.span
              key="monitoring"
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-forest-600 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-md sm:text-xs"
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <RadioTower className="h-3.5 w-3.5" />{" "}
              {paused ? "Pausada" : "Monitoreo en vivo (5s)"}
            </motion.span>
          )}

          {(phase === "result" || monitoring) && isAlerting && (
            <motion.span
              key="alert"
              role="img"
              aria-label="Alerta generada"
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-[11px] font-black text-white shadow-lg sm:text-xs animate-bounce"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <AlertTriangle className="h-3.5 w-3.5" />{" "}
              {evaluation?.status === "water-leak"
                ? "¡Fuga de agua detectada!"
                : "¡Desperdicio eléctrico detectado!"}
            </motion.span>
          )}

          {(phase === "result" || monitoring) && applied && (
            <motion.span
              key="applied"
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-md sm:text-xs"
              initial={{ y: -8, opacity: 1 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <CircleCheck className="h-3.5 w-3.5" /> Optimización aplicada
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Lámpara de techo */}
      <div className="relative z-10 mx-auto mt-1 flex w-fit justify-center">
        <motion.div
          className={`rounded-b-2xl border px-6 py-2 sm:px-8 transition-all duration-300 ${
            input.lightOn
              ? "border-amber-400 bg-amber-100 text-amber-800 shadow-[0_12px_35px_rgba(245,158,11,.45)]"
              : "border-slate-300 bg-slate-200/80 text-slate-500"
          }`}
          animate={{ opacity: input.lightOn ? 1 : 0.65 }}
        >
          <LampCeiling
            className="h-4 w-4 sm:h-5 sm:w-5"
            aria-label={input.lightOn ? "Luz encendida" : "Luz apagada"}
          />
        </motion.div>
      </div>

      {/* Elementos interactivos del hogar */}
      <div className="relative z-10 mt-3 grid grid-cols-3 items-end gap-2 sm:gap-3">
        {/* 1. Actividad y Presencia */}
        <div className="flex min-w-0 flex-col items-center">
          <div className="grid h-14 w-full place-items-center sm:h-16">
            <AnimatePresence mode="wait">
              {input.presenceDetected ? (
                <motion.div
                  key="present"
                  initial={{ x: -12, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -12, opacity: 0 }}
                >
                  <UserRound className="h-9 w-9 text-tech-700 sm:h-12 sm:w-12" />
                </motion.div>
              ) : (
                <motion.div
                  key="absent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid min-h-12 w-full max-w-24 place-items-center rounded-xl border border-dashed border-slate-400 px-1 text-center text-[10px] font-semibold leading-3 text-slate-500 sm:text-xs"
                >
                  Sin actividad
                  <br />
                  {input.minutesWithoutActivity} min
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <span className="mt-1.5 min-h-8 w-full rounded-lg bg-white/95 px-1 py-1 text-center text-[10px] font-bold leading-3 text-slate-700 shadow-sm sm:text-xs flex items-center justify-center">
            {input.presenceDetected ? "Con personas" : "Sin personas"}
          </span>
        </div>

        {/* 2. Electricidad / Potencia */}
        <div className="flex min-w-0 flex-col items-center">
          <div className="flex h-14 w-full flex-col items-center justify-end sm:h-16">
            <div
              className={`flex h-11 w-full max-w-20 items-center justify-center rounded-xl border transition-all sm:h-13 ${
                isEnergyWaste
                  ? "bg-rose-100 border-rose-400 text-rose-800 shadow-[0_0_15px_rgba(244,63,94,0.35)]"
                  : input.powerWatts > 50
                    ? "bg-amber-100 border-amber-300 text-amber-800"
                    : "bg-slate-100 border-slate-200 text-slate-500"
              }`}
            >
              <Bolt
                className={`h-5 w-5 sm:h-6 sm:w-6 ${
                  input.powerWatts > 50
                    ? isEnergyWaste
                      ? "text-rose-600 animate-bounce"
                      : "text-amber-600 animate-pulse"
                    : "text-slate-400"
                }`}
              />
            </div>
          </div>
          <span
            className={`mt-1.5 min-h-8 w-full rounded-lg bg-white/95 px-1 py-1 text-center text-[10px] font-bold leading-3 shadow-sm sm:text-xs flex items-center justify-center ${
              isEnergyWaste ? "text-rose-700 font-black" : "text-amber-800"
            }`}
          >
            {input.powerWatts} W
          </span>
        </div>

        {/* 3. Agua / Flujo */}
        <div className="flex min-w-0 flex-col items-center">
          <div className="flex h-14 w-full flex-col items-center justify-end sm:h-16">
            <div
              className={`flex h-11 w-full max-w-20 items-center justify-center rounded-xl border transition-all sm:h-13 ${
                isWaterLeak
                  ? "bg-rose-100 border-rose-400 text-rose-800 shadow-[0_0_15px_rgba(244,63,94,0.35)]"
                  : input.waterFlowLpm > 0.3
                    ? "bg-sky-100 border-sky-300 text-sky-700"
                    : "bg-slate-100 border-slate-200 text-slate-400"
              }`}
            >
              <Droplets
                className={`h-5 w-5 sm:h-6 sm:w-6 ${
                  input.waterFlowLpm > 0.3
                    ? isWaterLeak
                      ? "text-rose-600 animate-bounce"
                      : "text-sky-600 animate-bounce"
                    : "text-slate-400"
                }`}
              />
            </div>
          </div>
          <span
            className={`mt-1.5 min-h-8 w-full rounded-lg bg-white/95 px-1 py-1 text-center text-[10px] font-bold leading-3 shadow-sm sm:text-xs flex items-center justify-center ${
              isWaterLeak ? "text-rose-700 font-black" : "text-sky-800"
            }`}
          >
            {input.waterFlowLpm > 0.3
              ? `${input.waterFlowLpm.toFixed(1)} L/min`
              : "Grifo cerrado"}
          </span>
        </div>

      </div>

      {/* BANNER DINÁMICO DE DIAGNÓSTICO EN VIVO (Muestra la alerta en pantalla) */}
      <div className="relative z-10 mt-4 pt-1">
        {isAlerting && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-xl border border-rose-300 bg-white/95 p-3.5 shadow-md backdrop-blur text-rose-950"
          >
            <div className="flex items-start gap-2.5">
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-rose-100 text-rose-700 font-bold">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-rose-700">
                    Incidente Detectado en Vivo
                  </p>
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-800">
                    ALERTA ACTIVA
                  </span>
                </div>
                <p className="mt-0.5 text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                  {isWaterLeak
                    ? `Fuga activa de ${input.waterFlowLpm.toFixed(1)} L/min en ausencia de personas.`
                    : isEnergyWaste
                      ? `Consumo fantasma de ${input.powerWatts} W sin presencia desde hace ${input.minutesWithoutActivity} min.`
                      : isLightWaste
                        ? `Luces encendidas sin nadie en casa (${input.minutesWithoutActivity} min).`
                        : evaluation?.explanation || "Consumo anómalo detectado."}
                </p>
                <p className="mt-1 text-[11px] sm:text-xs text-slate-600">
                  <span className="font-semibold text-rose-800">Causa e Impacto:</span>{" "}
                  {isWaterLeak
                    ? "Grifo goteando o tubería dañada. Genera pérdida de litros y sobrecosto de agua."
                    : isEnergyWaste
                      ? "Aparatos en standby o equipos encendidos sin uso. Incrementa factura y huella de CO₂."
                      : "Luces encendidas sin uso. Suman al recibo de luz sin aportar nada."}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {applied && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-xl border border-emerald-300 bg-white/95 p-3.5 shadow-md backdrop-blur text-emerald-950"
          >
            <div className="flex items-start gap-2.5">
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-700 font-bold">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-700">
                    Hogar Inteligente Optimizado
                  </p>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                    AHORRO ACTIVO
                  </span>
                </div>
                <p className="mt-0.5 text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                  Grifos cerrados, potencia reducida a {input.powerWatts} W y emisiones de CO₂ mitigadas.
                </p>
                <p className="mt-1 text-[11px] sm:text-xs text-slate-600">
                  La vivienda se encuentra en modo eficiente, ahorrando bolivianos en cada ciclo de telemetría.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {!isAlerting && !applied && (
          <div className="rounded-xl border border-slate-200/80 bg-white/80 p-2.5 text-center text-xs text-slate-600 shadow-sm backdrop-blur">
            <span className="font-semibold text-forest-700">Condición actual:</span>{" "}
            {input.presenceDetected
              ? "Habitación ocupada · Consumo residencial en uso normal."
              : "Vivienda en estado eficiente sin personas presentes."}
          </div>
        )}
      </div>
    </div>
  );
}
