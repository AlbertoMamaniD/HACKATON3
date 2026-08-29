import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, BrainCircuit, Fan, LampCeiling, Laptop, RadioTower, ScanLine, Send, UserRound, WifiOff } from "lucide-react";
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

export function ClassroomVisual({ input, evaluation, paused, applied, phase }: ClassroomVisualProps) {
  const alerting = evaluation && evaluation.status !== "normal";
  const currentRunningState = phase === "capturing" || phase === "transmitting" || phase === "analyzing" ? runningState[phase] : null;
  const monitoring = phase === "monitoring";

  return (
    <div
      className="relative min-h-[330px] overflow-hidden rounded-2xl border border-slate-200 bg-[#eef4f0] p-4 sm:min-h-[350px] sm:p-5"
      aria-label="Representación visual del hogar simulado"
    >
      <div className="absolute inset-x-0 bottom-0 h-16 bg-[#d6dfd9] sm:h-20" />

      <div className="relative z-10 flex min-h-9 items-start justify-between gap-2">
        <span className="rounded-lg bg-white px-3 py-2 text-[11px] font-bold text-slate-600 shadow-sm sm:text-xs">
          Cocina · Escenario visual
        </span>
        <AnimatePresence mode="wait">
          {currentRunningState && (
            <motion.span
              key={paused ? "paused" : phase}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-bold shadow-sm sm:text-xs ${paused ? "bg-amber-100 text-amber-700" : "bg-tech-700 text-white"}`}
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 6, opacity: 0 }}
            >
              <currentRunningState.Icon className="h-3.5 w-3.5" /> {paused ? "Pausada" : currentRunningState.label}
            </motion.span>
          )}
          {monitoring && !alerting && !applied && (
            <motion.span
              key="monitoring"
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-forest-600 px-2.5 py-2 text-[11px] font-bold text-white shadow-lg sm:text-xs"
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <RadioTower className="h-3.5 w-3.5" /> {paused ? "Pausada" : "Monitoreando"}
            </motion.span>
          )}
          {(phase === "result" || monitoring) && alerting && !applied && (
            <motion.span
              key="alert"
              role="img"
              aria-label="Alerta generada"
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-danger-500 px-2.5 py-2 text-[11px] font-bold text-white shadow-lg sm:text-xs"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <AlertTriangle className="h-3.5 w-3.5" /> Alerta
            </motion.span>
          )}
          {(phase === "result" || monitoring) && applied && (
            <motion.span
              key="applied"
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-forest-600 px-2.5 py-2 text-[11px] font-bold text-white shadow-lg sm:text-xs"
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <Fan className="h-3.5 w-3.5" /> Acción aplicada
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="relative z-10 mx-auto mt-2 flex w-fit justify-center">
        <motion.div
          className={`rounded-b-3xl border px-7 py-2.5 sm:px-9 ${input.lightOn ? "border-amber-300 bg-amber-100 text-amber-700 shadow-[0_16px_45px_rgba(229,163,15,.24)]" : "border-slate-300 bg-slate-200 text-slate-500"}`}
          animate={{ opacity: input.lightOn ? 1 : 0.65 }}
        >
          <LampCeiling className="h-5 w-5" aria-label={input.lightOn ? "Luz encendida" : "Luz apagada"} />
        </motion.div>
      </div>

      <div className="relative z-10 mt-5 grid grid-cols-3 items-end gap-2 sm:mt-7 sm:gap-5">
        <div className="flex min-w-0 flex-col items-center">
          <div className="grid h-20 w-full place-items-center sm:h-24">
            <AnimatePresence mode="wait">
              {input.presenceDetected ? (
                <motion.div key="present" initial={{ x: -18, opacity: 0 }} animate={phase === "capturing" && !paused ? { x: 0, opacity: 1, scale: [1, 1.08, 1] } : { x: 0, opacity: 1, scale: 1 }} transition={{ duration: 0.8, repeat: phase === "capturing" && !paused ? Infinity : 0 }} exit={{ x: -18, opacity: 0 }}>
                  <UserRound className="h-12 w-12 text-tech-700 sm:h-16 sm:w-16" />
                </motion.div>
              ) : (
                <motion.div key="absent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid min-h-16 w-full max-w-32 place-items-center rounded-xl border border-dashed border-slate-400 px-2 text-center text-[11px] font-semibold leading-4 text-slate-500 sm:text-xs">
                  Sin actividad<br />{input.minutesWithoutActivity} min
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <span className="mt-2 min-h-11 w-full rounded-lg bg-white/85 px-1.5 py-2 text-center text-[11px] font-bold leading-4 text-tech-700 sm:min-h-9 sm:px-2 sm:text-xs">
            {input.presenceDetected ? "Actividad detectada" : "No se detectó actividad"}
          </span>
        </div>

        <div className="flex min-w-0 flex-col items-center">
          <div className="flex h-20 w-full flex-col items-center justify-end sm:h-24">
            <div className="h-3 w-[92%] max-w-36 rounded-t-lg bg-slate-600 sm:h-4" />
            <div className="flex h-14 w-[76%] max-w-28 items-center justify-center rounded-b-lg bg-slate-700 text-white sm:h-16">
              <Laptop className={`h-5 w-5 ${input.powerWatts > 20 ? "text-tech-100" : "text-slate-500"}`} />
            </div>
          </div>
          <span className="mt-2 min-h-11 w-full rounded-lg bg-white/85 px-1.5 py-2 text-center text-[11px] font-bold leading-4 text-slate-700 sm:min-h-9 sm:px-2 sm:text-xs">
            Consumo · {input.powerWatts} W
          </span>
        </div>

        <div className="relative flex min-w-0 flex-col items-center">
          {input.nodeOnline && (phase === "transmitting" || monitoring) && !paused && (
            <div className="pointer-events-none absolute -top-1 left-0 right-0 flex justify-center gap-1" aria-hidden="true">
              {[0, 1, 2].map((value) => (
                <motion.span key={value} className="h-1.5 w-1.5 rounded-full bg-tech-500" animate={{ opacity: [0.15, 1, 0.15], y: [2, -2, 2] }} transition={{ duration: 0.8, delay: value * 0.15, repeat: monitoring ? Infinity : 2 }} />
              ))}
            </div>
          )}
          <div className="grid h-20 w-full place-items-center sm:h-24">
            <motion.div
              animate={!paused && input.nodeOnline && (phase === "transmitting" || monitoring) ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={{ duration: 0.75, repeat: !paused && input.nodeOnline && (phase === "transmitting" || monitoring) ? Infinity : 0 }}
              className={`grid h-14 w-14 place-items-center rounded-2xl text-white sm:h-16 sm:w-16 ${input.nodeOnline ? "bg-tech-700" : "bg-slate-500"}`}
            >
              {input.nodeOnline ? <RadioTower className="h-6 w-6" /> : <WifiOff className="h-6 w-6" />}
            </motion.div>
          </div>
          <span className="mt-2 min-h-11 w-full rounded-lg bg-white/85 px-1.5 py-2 text-center text-[11px] font-bold leading-4 text-slate-700 sm:min-h-9 sm:px-2 sm:text-xs">
            Nodo {input.nodeOnline ? "conectado" : "sin conexión"}
          </span>
        </div>
      </div>
    </div>
  );
}
