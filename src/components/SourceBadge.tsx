import { Cpu, FlaskConical } from "lucide-react";

export type MetricSource = "simulado" | "sensor";

const STYLES: Record<MetricSource, { label: string; className: string; title: string }> = {
  simulado: {
    label: "Simulado",
    className: "border-amber-200 bg-amber-50 text-amber-800",
    title: "Dato simulado para la demostración; no proviene de un medidor real.",
  },
  sensor: {
    label: "Sensor",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    title: "Dato medido por el ESP32 y guardado en Supabase.",
  },
};

/** Etiqueta visible que indica si una métrica es simulada o viene del sensor ESP32. */
export function SourceBadge({ source, className = "" }: { source: MetricSource; className?: string }) {
  const style = STYLES[source];
  const Icon = source === "simulado" ? FlaskConical : Cpu;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase leading-4 tracking-wide ${style.className} ${className}`}
      title={style.title}
    >
      <Icon aria-hidden="true" className="h-3 w-3" />
      {style.label}
    </span>
  );
}
