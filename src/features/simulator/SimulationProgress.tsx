import { motion } from "framer-motion";
import { BrainCircuit, Check, RadioTower, ScanLine } from "lucide-react";
import type { SimulationPhase } from "./simulation-phase";

const steps = [
  { phase: "capturing", label: "Capturar datos", detail: "Lecturas simuladas", Icon: ScanLine },
  { phase: "transmitting", label: "Transmitir datos", detail: "Nodo local", Icon: RadioTower },
  { phase: "analyzing", label: "Analizar reglas", detail: "Umbrales del hogar", Icon: BrainCircuit },
  { phase: "result", label: "Resultado", detail: "Acción", Icon: Check },
] as const;

const phaseIndex: Record<SimulationPhase, number> = { ready: -1, capturing: 0, transmitting: 1, analyzing: 2, result: 3, monitoring: 4 };
const progressByPhase: Record<SimulationPhase, number> = { ready: 0, capturing: 18, transmitting: 47, analyzing: 76, result: 100, monitoring: 100 };

export function SimulationProgress({ phase, paused }: { phase: SimulationPhase; paused: boolean }) {
  const activeIndex = phaseIndex[phase];
  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5 sm:p-4" aria-label="Progreso de la simulación">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Secuencia de simulación</p>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${paused ? "bg-amber-100 text-amber-700" : phase === "result" || phase === "monitoring" ? "bg-forest-100 text-forest-700" : phase === "ready" ? "bg-slate-200 text-slate-600" : "bg-tech-100 text-tech-700"}`}>
          {paused ? "Pausada" : phase === "monitoring" ? "Monitoreo activo" : phase === "result" ? "Completada" : phase === "ready" ? "Lista" : "En curso"}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
        <motion.div className="h-full rounded-full bg-tech-500" initial={{ width: `${progressByPhase[phase]}%` }} animate={{ width: `${progressByPhase[phase]}%` }} transition={{ duration: 0.35, ease: "easeOut" }} />
      </div>
      <ol className="mt-4 grid grid-cols-1 gap-2 min-[390px]:grid-cols-2">
        {steps.map(({ phase: stepPhase, label, detail, Icon }, index) => {
          const complete = activeIndex > index || phase === "result" || phase === "monitoring";
          const active = activeIndex === index && phase !== "result";
          return (
            <li key={stepPhase} className={`flex min-w-0 items-center gap-2 rounded-lg border px-2.5 py-2 transition ${complete ? "border-forest-100 bg-forest-50" : active ? "border-tech-200 bg-white shadow-sm" : "border-transparent bg-white/60"}`}>
              <motion.span animate={active && !paused ? { scale: [1, 1.12, 1] } : { scale: 1 }} transition={{ duration: 0.8, repeat: active && !paused ? Infinity : 0 }} className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${complete ? "bg-forest-600 text-white" : active ? "bg-tech-700 text-white" : "bg-slate-200 text-slate-500"}`}>
                {complete ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              </motion.span>
              <span className="min-w-0"><strong className="block text-[11px] leading-4 text-slate-800 sm:text-xs">{label}</strong><span className="block text-[10px] leading-4 text-slate-500 sm:text-[11px]">{detail}</span></span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
