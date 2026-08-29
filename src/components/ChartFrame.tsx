import type { ReactNode } from "react";

export function ChartFrame({ title, description, children, empty = false }: { title: string; description?: string; children: ReactNode; empty?: boolean }) { return <article className="panel min-w-0 p-5"><h2 className="font-bold">{title}</h2>{description && <p className="mt-1 text-xs text-slate-500">{description}</p>}<div className="mt-5 h-64 min-w-0">{empty ? <div className="grid h-full place-items-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500">Sin información para este periodo</div> : children}</div></article> }
