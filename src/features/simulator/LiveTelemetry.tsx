import { motion } from "framer-motion";
import { Bolt, Droplets, Lightbulb, Wind } from "lucide-react";
import type { SimulationInput } from "../../domain/types";
import type { SimulationPhase } from "./simulation-phase";

export function LiveTelemetry({
  input,
  phase,
  paused,
}: {
  input: SimulationInput;
  phase: SimulationPhase;
  paused: boolean;
}) {
  const active =
    phase === "capturing" ||
    phase === "transmitting" ||
    phase === "analyzing" ||
    phase === "monitoring";

  const airStatus =
    input.airChangePercent >= 12
      ? "Malo"
      : input.airChangePercent >= 5
        ? "Regular"
        : "Bueno";

  const items = [
    {
      label: "Potencia activa",
      value: `${input.powerWatts} W`,
      hint: input.powerWatts > 200 ? "Alto consumo" : "Consumo base",
      Icon: Bolt,
      color: "text-amber-600",
    },
    {
      label: "Caudal de agua",
      value: `${input.waterFlowLpm.toFixed(1)} L/min`,
      hint: input.waterFlowLpm > 0.3 ? "Flujo activo" : "Sin flujo",
      Icon: Droplets,
      color: "text-sky-600",
    },
    {
      label: "Gases (MQ-135)",
      value: `${input.airChangePercent.toFixed(1)} %`,
      hint: airStatus,
      Icon: Wind,
      color: input.airChangePercent >= 12 ? "text-rose-600" : "text-emerald-600",
    },
    {
      label: "Iluminación",
      value: input.lightOn ? "Encendida" : "Apagada",
      hint: input.lightOn ? "Luz activa" : "Ambiente oscuro",
      Icon: Lightbulb,
      color: "text-amber-500",
    },
  ];

  return (
    <div
      className="mt-4"
      aria-live="polite"
      aria-label="Telemetría simulada en vivo"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
          Telemetría simulada
        </p>
        {active && (
          <span
            className={`flex shrink-0 items-center gap-1.5 text-[11px] font-bold ${
              paused ? "text-amber-700" : "text-forest-700"
            }`}
          >
            <motion.span
              className={`h-2 w-2 rounded-full ${
                paused ? "bg-amber-500" : "bg-forest-500"
              }`}
              animate={!paused ? { opacity: [0.3, 1, 0.3] } : { opacity: 1 }}
              transition={{ duration: 1.2, repeat: !paused ? Infinity : 0 }}
            />
            {paused ? "Lecturas pausadas" : "Actualiza cada 5 s"}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map(({ label, value, hint, Icon, color }) => (
          <div
            key={label}
            className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition hover:border-slate-300"
          >
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
              <Icon className={`h-3.5 w-3.5 shrink-0 ${color}`} />
              <span className="truncate">{label}</span>
            </div>
            <motion.p
              key={`${label}-${value}`}
              initial={{ opacity: 0.35, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 break-words text-sm font-bold leading-5 text-slate-900"
            >
              {value}
            </motion.p>
            <p className="text-[10px] font-medium text-slate-500 truncate mt-0.5">
              {hint}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
