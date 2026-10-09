import {
  AlertTriangle,
  CircleCheck,
  CircleHelp,
  Droplets,
  PlugZap,
  Radio,
  WifiOff,
  XCircle,
} from "lucide-react";
import type { EnvironmentStatus } from "../domain/types";

const definitions: Record<
  EnvironmentStatus,
  { label: string; className: string; Icon: typeof CircleCheck }
> = {
  normal: {
    label: "Eficiente / Normal",
    className: "bg-forest-50 text-forest-700 border-forest-100",
    Icon: CircleCheck,
  },
  warning: {
    label: "Advertencia",
    className: "bg-amber-50 text-amber-700 border-amber-100",
    Icon: AlertTriangle,
  },
  "potential-waste": {
    label: "Desperdicio eléctrico",
    className: "bg-danger-50 text-danger-700 border-danger-100",
    Icon: PlugZap,
  },
  "water-leak": {
    label: "Fuga de agua",
    className: "bg-sky-50 text-sky-700 border-sky-200",
    Icon: Droplets,
  },
  "environmental-alert": {
    label: "Alerta del sensor",
    className: "bg-rose-50 text-rose-700 border-rose-100",
    Icon: Radio,
  },
  offline: {
    label: "Nodo desconectado",
    className: "bg-slate-100 text-slate-700 border-slate-200",
    Icon: WifiOff,
  },
  "sensor-error": {
    label: "Sensor con error",
    className: "bg-danger-50 text-danger-700 border-danger-100",
    Icon: XCircle,
  },
  "no-data": {
    label: "Sin datos",
    className: "bg-slate-100 text-slate-600 border-slate-200",
    Icon: CircleHelp,
  },
};

export function StatusBadge({
  status,
  className = "",
}: {
  status: EnvironmentStatus;
  className?: string;
}) {
  const { Icon, label, className: colors } =
    definitions[status] ?? definitions.normal;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${colors} ${className}`}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
