import { motion } from "framer-motion";
import { Activity, Bolt, RadioTower, Thermometer } from "lucide-react";
import type { SimulationInput } from "../../domain/types";
import type { SimulationPhase } from "./simulation-phase";

export function LiveTelemetry({ input, phase, paused }: { input: SimulationInput; phase: SimulationPhase; paused: boolean }) {
  const active = phase === "capturing" || phase === "transmitting" || phase === "analyzing" || phase === "monitoring";
  const items = [
    { label: "Potencia", value: `${input.powerWatts} W`, Icon: Bolt },
    { label: "Temperatura", value: `${input.temperatureCelsius.toFixed(1)} °C`, Icon: Thermometer },
    { label: "Actividad", value: input.presenceDetected ? "Detectada" : "No detectada", Icon: Activity },
    { label: "Nodo", value: input.nodeOnline ? "Conectado" : "Sin conexión", Icon: RadioTower },
  ];
  return (
    <div className="mt-4" aria-live="polite" aria-label="Telemetría simulada en vivo">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Telemetría en vivo</p>
        {active && <span className={`flex shrink-0 items-center gap-1.5 text-[11px] font-bold ${paused ? "text-amber-700" : "text-forest-700"}`}><motion.span className={`h-2 w-2 rounded-full ${paused ? "bg-amber-500" : "bg-forest-500"}`} animate={!paused ? { opacity: [0.3, 1, 0.3] } : { opacity: 1 }} transition={{ duration: 0.8, repeat: !paused ? Infinity : 0 }} />{paused ? "Lecturas pausadas" : "Actualiza cada 1 s"}</span>}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map(({ label, value, Icon }) => (
          <div key={label} className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500"><Icon className="h-3.5 w-3.5 shrink-0 text-tech-700" />{label}</div>
            <motion.p key={`${label}-${value}`} initial={{ opacity: 0.35, y: 3 }} animate={{ opacity: 1, y: 0 }} className="mt-1 break-words text-xs font-bold leading-4 text-ink sm:text-sm">{value}</motion.p>
          </div>
        ))}
      </div>
    </div>
  );
}
