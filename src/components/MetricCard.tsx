import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function MetricCard({ label, value, unit, hint, icon: Icon, tone = "green", badge }: { label: string; value: string | number; unit: string; hint?: string; icon: LucideIcon; tone?: "green" | "blue" | "amber" | "red"; badge?: ReactNode }) {
  const tones = { green: "bg-forest-50 text-forest-700", blue: "bg-tech-50 text-tech-700", amber: "bg-amber-50 text-amber-700", red: "bg-danger-50 text-danger-700" };
  return (
    <motion.article layout className="panel p-4 sm:p-5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 flex-wrap items-center gap-1.5"><p className="text-sm font-semibold text-slate-600">{label}</p>{badge}</div><span className={`rounded-xl p-2 ${tones[tone]}`}><Icon aria-hidden="true" className="h-4 w-4" /></span></div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-ink">{value} <span className="text-sm font-semibold text-slate-500">{unit}</span></p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </motion.article>
  );
}
