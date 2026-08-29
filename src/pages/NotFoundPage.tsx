import { ArrowLeft, MapPinOff } from "lucide-react";
import { Link } from "react-router-dom";

export function NotFoundPage() { return <div className="grid min-h-[65vh] place-items-center"><div className="max-w-lg text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-600"><MapPinOff /></span><p className="eyebrow mt-6">Error 404</p><h1 className="page-title mt-2">Esta página no existe</h1><p className="mt-4 text-slate-600">La ruta solicitada no forma parte del recorrido demostrativo de EcoAhorro.</p><Link to="/" className="button-primary mt-6"><ArrowLeft className="h-4 w-4" />Volver al inicio</Link></div></div> }
