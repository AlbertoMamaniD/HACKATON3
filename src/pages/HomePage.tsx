import { motion } from "framer-motion";
import {
  ArrowRight,
  BellRing,
  Bolt,
  Coins,
  Droplets,
  FileText,
  History,
  Lightbulb,
  RadioTower,
  Smartphone,
  Sparkles,
  Tag,
  Wifi,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";

import { SourceBadge } from "../components/SourceBadge";
import { useLiveReadings } from "../hooks/useLiveReadings";
import { isLightOn } from "../services/ecoahorro-data-source";
import { formatDateTime, formatNumber } from "../utils/format";

const pillars = [
  {
    title: "Ahorro en Bs",
    text: "Tu consumo de luz y agua convertido en bolivianos durante el mes, no solo cuando llega el recibo.",
    icon: Coins,
    box: "border-amber-200 bg-amber-50/40",
    iconBox: "bg-amber-100 text-amber-700",
  },
  {
    title: "Alertas al celular",
    text: "Aviso ante consumo anormal: un grifo abierto, una posible fuga o equipos encendidos sin uso.",
    icon: BellRing,
    box: "border-rose-200 bg-rose-50/40",
    iconBox: "bg-rose-100 text-rose-700",
  },
  {
    title: "Historial y comparación",
    text: "Compara la última hora, el día o la semana con el período anterior para detectar desperdicios.",
    icon: History,
    box: "border-sky-200 bg-sky-50/40",
    iconBox: "bg-sky-100 text-sky-700",
  },
  {
    title: "Reporte frente a tu factura",
    text: "Un reporte del consumo registrado para contrastarlo con lo que te cobran.",
    icon: FileText,
    box: "border-emerald-200 bg-forest-50/40",
    iconBox: "bg-forest-100 text-forest-700",
  },
];

const problems = [
  {
    problem: "Gasto invisible durante el mes",
    detail: "Solo sabes cuánto gastaste cuando llega el recibo, y ya es tarde para corregirlo.",
    solution: "Alertas ante consumo anormal de luz o agua",
    to: "/alertas",
    icon: BellRing,
  },
  {
    problem: "Aumentos sin explicación",
    detail: "El recibo sube y no sabes qué equipo, hábito o fuga lo provocó.",
    solution: "Historial y comparación de períodos para detectar desperdicios",
    to: "/dashboard",
    icon: History,
  },
  {
    problem: "Cobros que no se pueden comprobar",
    detail: "No tienes un registro propio para contrastar lo que te facturan.",
    solution: "Reporte del consumo para compararlo con tu factura",
    to: "/reportes",
    icon: FileText,
  },
];

export function HomePage() {
  const { latest, online } = useLiveReadings();

  const power = latest?.potencia_w ?? null;
  const water = latest?.flujo_agua_lpm ?? null;
  const metricsSource = latest?.fuente_metricas ?? "simulado";

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* HERO SECTION */}
      <section className="relative min-w-0 overflow-hidden rounded-2xl bg-gradient-to-br from-forest-900 via-forest-950 to-slate-950 px-5 py-8 text-white sm:rounded-3xl sm:px-8 sm:py-11 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,.85fr)] lg:items-center lg:gap-10 xl:px-10 xl:py-14 shadow-2xl">
        <div className="relative z-10 min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300 border border-emerald-500/30">
            <Coins className="h-3.5 w-3.5" /> Ahorro y control del gasto
          </div>

          <h1 className="mt-4 max-w-3xl text-3xl font-black leading-[1.1] tracking-tight sm:text-4xl xl:text-5xl">
            Controla tu luz y agua desde una sola app y recibe un aviso{" "}
            <span className="text-emerald-300 underline decoration-emerald-500/60 decoration-wavy">
              antes de que te sorprenda el recibo
            </span>
          </h1>

          <p className="mt-5 flex items-center gap-2 text-lg font-bold text-white sm:text-xl">
            <Smartphone aria-hidden="true" className="h-5 w-5 shrink-0 text-emerald-300" />
            El monitor de consumo de tu casa, en tu celular.
          </p>

          <p className="mt-3 max-w-2xl text-base leading-7 text-emerald-100/90">
            EcoAhorro muestra tu consumo de <strong>luz</strong> y{" "}
            <strong>agua</strong> en bolivianos, te avisa cuando algo se sale de
            lo normal y te ayuda a contrastar lo registrado con tu factura.
          </p>

          <div className="mt-7 grid w-full gap-3 sm:flex sm:flex-wrap lg:grid lg:grid-cols-2">
            <Link
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-black text-forest-950 transition hover:bg-emerald-300 shadow-lg shadow-emerald-900/40 sm:w-auto lg:col-span-2 lg:w-full"
              to="/dashboard"
            >
              Ver mi consumo
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/25 sm:w-auto lg:w-full"
              to="/simulador"
            >
              Probar el simulador
            </Link>

            <Link
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-bold text-emerald-200 transition hover:bg-white/10 hover:text-white sm:w-auto lg:w-full"
              to="/instalacion"
            >
              Guía de instalación
            </Link>
          </div>
        </div>

        {/* TELEMETRÍA: MISMAS LECTURAS QUE EL DASHBOARD */}
        <motion.div className="relative mt-8 min-w-0 lg:mt-0" initial={false}>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md sm:rounded-3xl sm:p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
              <span className="flex items-center gap-2 font-bold text-white">
                <RadioTower className="h-4 w-4 text-emerald-300" />
                Tu casa ahora
              </span>
              <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-400/20 px-2.5 py-1 text-xs font-bold text-emerald-300">
                <span
                  className={`h-2 w-2 rounded-full ${online ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`}
                />
                {online ? "Cada 5 segundos" : "Sin conexión"}
              </span>
            </div>

            {latest ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="min-w-0 rounded-2xl border border-white/10 bg-white/10 p-3 sm:p-4">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-200">
                        <Bolt className="h-3.5 w-3.5" /> Luz
                      </span>
                      <SourceBadge source={metricsSource} />
                    </div>
                    <p className="mt-2 text-2xl font-black text-white">
                      {power !== null ? formatNumber(power, 0) : "—"}{" "}
                      <span className="text-sm font-bold text-emerald-100">W</span>
                    </p>
                  </div>

                  <div className="min-w-0 rounded-2xl border border-white/10 bg-white/10 p-3 sm:p-4">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span className="flex items-center gap-1 text-xs font-bold text-sky-200">
                        <Droplets className="h-3.5 w-3.5" /> Agua
                      </span>
                      <SourceBadge source={metricsSource} />
                    </div>
                    <p className="mt-2 text-2xl font-black text-white">
                      {water !== null ? formatNumber(water, 1) : "—"}{" "}
                      <span className="text-sm font-bold text-emerald-100">L/min</span>
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/5 p-3">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-100">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-300" /> Luces{" "}
                    {isLightOn(latest.estado_luz) ? "prendidas" : "apagadas"}
                  </span>
                  <SourceBadge source="sensor" />
                </div>

                {!online && (
                  <p className="mt-3 text-xs text-emerald-100/80">
                    Sin lecturas recientes. Valores de la última lectura:{" "}
                    {formatDateTime(latest.created_at)}.
                  </p>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-emerald-100">
                Esperando lecturas de la base de datos.
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* PILARES: AHORRO Y ALERTAS PRIMERO */}
      <section>
        <p className="eyebrow">Lo que obtienes</p>
        <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
          Ahorro y control del gasto de tu hogar
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map(({ title, text, icon: Icon, box, iconBox }) => (
            <div key={title} className={`panel p-5 ${box}`}>
              <div className={`grid h-10 w-10 place-items-center rounded-xl ${iconBox}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 mt-3">{title}</h3>
              <p className="text-sm text-slate-600 mt-1">{text}</p>
            </div>
          ))}
        </div>

      </section>

      {/* LOS 3 PROBLEMAS */}
      <section aria-labelledby="problemas">
        <p className="eyebrow">Por qué EcoAhorro</p>
        <h2 id="problemas" className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
          Los 3 problemas que resolvemos
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          ¿Te llegó un recibo más alto de lo normal y no sabes por qué? EcoAhorro
          está pensado para ti.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {problems.map(({ problem, detail, solution, to, icon: Icon }, index) => (
            <article key={problem} className="panel flex flex-col p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-rose-600">
                Problema {index + 1}
              </p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">{problem}</h3>
              <p className="mt-1 text-sm text-slate-600">{detail}</p>
              <Link
                to={to}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-forest-50 px-3 py-2.5 text-sm font-bold text-forest-700 transition hover:bg-forest-100 md:mt-auto"
              >
                <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                <span className="min-w-0">{solution}</span>
                <ArrowRight aria-hidden="true" className="ml-auto h-4 w-4 shrink-0" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="grid gap-4 md:grid-cols-3" aria-label="Cómo funciona">
        <div className="panel p-6">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-forest-50 text-forest-700">
            <RadioTower className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 mt-3">1. Medición</h3>
          <p className="text-sm text-slate-600 mt-1 leading-6">
            El ESP32 detecta cuándo hay luces encendidas. En esta demostración,
            la potencia y el caudal de agua se simulan.
          </p>
        </div>

        <div className="panel p-6">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-tech-50 text-tech-700">
            <Wifi className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 mt-3">2. Registro</h3>
          <p className="text-sm text-slate-600 mt-1 leading-6">
            Las lecturas se guardan en Supabase y la app las consulta cada 5
            segundos.
          </p>
        </div>

        <div className="panel p-6">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
            <Coins className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 mt-3">3. Control del gasto</h3>
          <p className="text-sm text-slate-600 mt-1 leading-6">
            Recibes alertas, comparas períodos y contrastas el gasto estimado
            con tu factura.
          </p>
        </div>
      </section>

      {/* PRECIO */}
      <section aria-labelledby="precio" className="panel border-emerald-200 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-forest-100 text-forest-700">
              <Tag className="h-5 w-5" />
            </span>
            <div>
              <p className="eyebrow">Precio</p>
              <h2 id="precio" className="mt-1 text-xl font-black text-slate-900">
                Kit EcoAhorro: 449 Bs pago único{" "}
                <span className="text-sm font-semibold text-slate-500">(precio tentativo)</span>
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                App básica incluida, sin mensualidad. Periodo de prueba antes de
                comprar.
              </p>
            </div>
          </div>
          <Link className="button-primary shrink-0" to="/instalacion">
            Ver qué incluye el kit
          </Link>
        </div>

        <ul className="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-sm text-slate-600 sm:grid-cols-2">
          <li className="flex items-start gap-2">
            <Sparkles aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" />
            <span>
              <strong className="text-slate-900">Premium opcional (próximamente):</strong>{" "}
              consejos con IA y reporte mensual.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Wrench aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" />
            <span>
              <strong className="text-slate-900">Servicio de instalación y mantenimiento</strong>{" "}
              para quien no quiera instalar el kit por su cuenta.
            </span>
          </li>
        </ul>
      </section>
    </div>
  );
}
