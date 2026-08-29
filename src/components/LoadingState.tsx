import { LoaderCircle } from "lucide-react";

export function LoadingState({ label = "Cargando datos simulados…" }: { label?: string }) { return <div className="panel flex min-h-48 items-center justify-center gap-3 p-8 text-slate-600" role="status"><LoaderCircle className="h-5 w-5 animate-spin text-forest-600" /><span className="font-semibold">{label}</span></div> }

export function ErrorState({ message = "No fue posible cargar los datos. Intenta nuevamente." }: { message?: string }) { return <div className="panel border-danger-100 bg-danger-50 p-6"><h2 className="font-bold text-danger-700">No pudimos mostrar esta información</h2><p className="mt-2 text-sm text-slate-600">{message}</p></div> }
