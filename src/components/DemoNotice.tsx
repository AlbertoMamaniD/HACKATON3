import { Info } from "lucide-react";

export function DemoNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center gap-2 rounded-xl border border-tech-100 bg-tech-50 text-tech-700 ${compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm"}`} role="status">
      <Info aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span><strong>Modo demostración:</strong> datos simulados</span>
    </div>
  );
}
