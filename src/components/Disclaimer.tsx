import { ShieldCheck } from "lucide-react";
import { REQUIRED_DISCLAIMER } from "../domain/config";

export function Disclaimer({ className = "" }: { className?: string }) {
  return <p className={`flex gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600 ${className}`}><ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />{REQUIRED_DISCLAIMER}</p>;
}
