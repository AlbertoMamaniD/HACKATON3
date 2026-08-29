import { motion } from "framer-motion";
import {
  ArrowRight,
  BellRing,
  Bolt,
  Coins,
  Droplets,
  Leaf,
  Lightbulb,
  RadioTower,
  Sparkles,
  Wifi,
  Wind,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useDashboardData } from "../hooks/useEcoData";

function getStatusLabel(online: boolean, status: string) {
  if (!online) return "Sin conexión";
  if (status === "normal") return "Eficiente";
  if (status === "water-leak") return "Fuga de agua";
  if (status === "potential-waste") return "Desperdicio";
  if (status === "environmental-alert") return "Alerta gases";
  return "Revisar";
}

export function HomePage() {
  const { data } = useDashboardData();

  const environmentCards =
    data?.environments.slice(0, 4).map((environment, index) => {
      const snapshot = data.snapshots[index];
      const online = snapshot?.nodeOnline ?? false;

      return {
        id: environment.id,
        name: environment.name,
        online,
        status: getStatusLabel(online, environment.status),
        power: snapshot?.powerWatts,
        water: snapshot?.waterFlowLpm,
        air: snapshot?.airChangePercent,
      };
    }) ?? [];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* HERO SECTION */}
      <section className="relative min-w-0 overflow-hidden rounded-2xl bg-gradient-to-br from-forest-900 via-forest-950 to-slate-950 px-5 py-8 text-white sm:rounded-3xl sm:px-8 sm:py-11 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,.85fr)] lg:items-center lg:gap-10 xl:px-10 xl:py-14 shadow-2xl">
        <div className="relative z-10 min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300 border border-emerald-500/30">
            <Sparkles className="h-3.5 w-3.5" /> Sostenibilidad & Ahorro Inteligente
          </div>

          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.25rem] xl:text-6xl">
            Optimiza tu consumo y reduce tu{" "}
            <span className="text-emerald-300 underline decoration-emerald-500/60 decoration-wavy">
              huella de CO₂
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-emerald-100/90 sm:text-lg sm:leading-8">
            EcoAhorro supervisa en tiempo real el consumo de{" "}
            <strong>energía eléctrica</strong>, <strong>flujo de agua</strong>,{" "}
            <strong>gases contaminantes (MQ-135)</strong> e{" "}
            <strong>iluminación</strong> para evitar fugas, reducir costos en
            bolivianos y cuantificar emisiones evitadas.
          </p>

          <div className="mt-7 grid w-full gap-3 sm:flex sm:flex-wrap lg:grid lg:grid-cols-2">
            <Link
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-black text-forest-950 transition hover:bg-emerald-300 shadow-lg shadow-emerald-900/40 sm:w-auto lg:col-span-2 lg:w-full"
              to="/simulador"
            >
              <Sparkles className="h-4 w-4" />
              Abrir simulador interactivo (5s)
            </Link>

            <Link
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/25 sm:w-auto lg:w-full"
              to="/dashboard"
            >
              Ver telemetría en vivo
            </Link>

            <Link
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-bold text-emerald-200 transition hover:bg-white/10 hover:text-white sm:w-auto lg:w-full"
              to="/instalacion"
            >
              Guía de sensores
            </Link>
          </div>
        </div>

        {/* NODO CARD DISPLAY */}
        <motion.div className="relative mt-8 min-w-0 lg:mt-0" initial={false}>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md sm:rounded-3xl sm:p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
              <span className="font-bold text-white flex items-center gap-2">
                <RadioTower className="h-4 w-4 text-emerald-300" />
                Telemetría en Vivo
              </span>
              <span className="shrink-0 rounded-full bg-emerald-400/20 px-2.5 py-1 text-xs font-bold text-emerald-300">
                Cada 5 segundos
              </span>
            </div>

            {environmentCards.length ? (
              <div className="grid grid-cols-2 gap-3">
                {environmentCards.map((item) => (
                  <div
                    key={item.id}
                    className="min-w-0 rounded-2xl bg-white/10 p-4 border border-white/10 hover:bg-white/15 transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${
                          item.online ? "bg-emerald-400 animate-pulse" : "bg-slate-400"
                        }`}
                      />
                      <span className="text-[10px] uppercase font-bold text-emerald-200">
                        {item.status}
                      </span>
                    </div>

                    <p className="truncate text-sm font-bold text-white">
                      {item.name}
                    </p>

                    {item.online && (
                      <div className="mt-2.5 space-y-1 text-[11px] font-medium text-emerald-100">
                        <p className="flex items-center gap-1">
                          <Bolt className="h-3 w-3 text-amber-300" /> {item.power ?? 0} W
                        </p>
                        <p className="flex items-center gap-1">
                          <Droplets className="h-3 w-3 text-sky-300" /> {item.water?.toFixed(1) ?? "0.0"} L/min
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-emerald-100">
                Esperando datos de los sensores EcoAhorro.
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* 4 PILARES DE ECOAHORRO */}
      <section>
        <p className="eyebrow">4 Pilares de monitoreo</p>
        <h2 className="mt-2 text-3xl font-black text-slate-900">
          Control integral de recursos y sostenibilidad
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="panel p-5 border-amber-200 bg-amber-50/40">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-700">
              <Bolt className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 mt-3">Energía Eléctrica</h3>
            <p className="text-sm text-slate-600 mt-1">
              Monitorea potencia en vatios y kilovatios-hora para eliminar consumos fantasma.
            </p>
          </div>

          <div className="panel p-5 border-sky-200 bg-sky-50/40">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-100 text-sky-700">
              <Droplets className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 mt-3">Flujo de Agua</h3>
            <p className="text-sm text-slate-600 mt-1">
              Detección inmediata de fugas o grifos abiertos sin presencia con el sensor YF-S201.
            </p>
          </div>

          <div className="panel p-5 border-emerald-200 bg-emerald-50/40">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
              <Wind className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 mt-3">Gases MQ-135</h3>
            <p className="text-sm text-slate-600 mt-1">
              Supervisión de gases nocivos, humo y compuestos orgánicos volátiles en el aire.
            </p>
          </div>

          <div className="panel p-5 border-indigo-200 bg-indigo-50/40">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-100 text-indigo-700">
              <Leaf className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 mt-3">Reducción de CO₂</h3>
            <p className="text-sm text-slate-600 mt-1">
              Cuantificación de porcentaje y kilogramos de CO₂ evitados con fórmulas auditables.
            </p>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="panel p-6">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-forest-50 text-forest-700">
            <RadioTower className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 mt-3">1. Medición IoT</h3>
          <p className="text-sm text-slate-600 mt-1 leading-6">
            El ESP32 realiza el muestreo de caudal de agua, potencia, gases MQ-135 y nivel de luz KY-018.
          </p>
        </div>

        <div className="panel p-6">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-tech-50 text-tech-700">
            <Wifi className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 mt-3">2. Transmisión Segura</h3>
          <p className="text-sm text-slate-600 mt-1 leading-6">
            Las lecturas se envían cifradas hacia la nube de Supabase y el dashboard de EcoAhorro.
          </p>
        </div>

        <div className="panel p-6">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
            <Coins className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 mt-3">3. Ahorro & Impacto</h3>
          <p className="text-sm text-slate-600 mt-1 leading-6">
            Visualiza alertas automáticas, calcula ahorros en Bs/mes y conoce el % exacto de CO₂ reducido.
          </p>
        </div>
      </section>
    </div>
  );
}