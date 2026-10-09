import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bolt,
  CheckCircle2,
  Cpu,
  Droplets,
  Home,
  LampCeiling,
  MapPin,
  Radio,
  ShieldCheck,
  Sparkles,
  Wifi,
} from "lucide-react";

interface InstallationPlace {
  id: string;
  name: string;
  room: string;
  badge: string;
  description: string;
  howItSaves: string;
  installationTip: string;
  icon: typeof Bolt;
  tone: "amber" | "blue" | "emerald" | "purple" | "rose";
  tag: string;
}

const places: InstallationPlace[] = [
  {
    id: "tablero",
    name: "Tablero Eléctrico General",
    room: "Caja de térmicos / Entrada eléctrica",
    badge: "Energía Eléctrica",
    description:
      "Se ubica en la caja principal de disyuntores de la vivienda. Supervisa la potencia instantánea activa (W) de todos los circuitos del hogar.",
    howItSaves:
      "Detecta aparatos que quedan consumiendo energía en reposo (consumo fantasma) y luces encendidas cuando no hay nadie en casa.",
    installationTip:
      "Instalación no invasiva mediante pinza de corriente en la fase principal del cuadro general.",
    icon: Bolt,
    tone: "amber",
    tag: "Ahorro de Luz",
  },
  {
    id: "agua",
    name: "Tubería Principal de Agua",
    room: "Acometida de entrada / Llave de paso general",
    badge: "Flujo de Agua y Fugas",
    description:
      "Se instala en la tubería principal que abastece a la cocina y los baños. Mide el paso de agua en litros por minuto (L/min).",
    howItSaves:
      "Alerta de inmediato si un grifo quedó goteando, si la ducha lleva demasiado tiempo abierta o si hay una fuga oculta en sanitarios.",
    installationTip:
      "Se coloca en línea recta en la tubería de entrada antes de las bifurcaciones principales.",
    icon: Droplets,
    tone: "blue",
    tag: "Cero Fugas",
  },
  {
    id: "pasillo",
    name: "Pasillos y Habitaciones",
    room: "Zonas de paso / Dormitorios",
    badge: "Iluminación Eficiente",
    description:
      "Se ubica en los techos o paredes de las áreas de mayor tránsito para supervisar las horas que permanecen encendidas las luces.",
    howItSaves:
      "Evita que las bombillas continúen encendidas durante horas del día o en habitaciones donde no hay actividad humana.",
    installationTip:
      "Orientar hacia el centro de la habitación o pasillo donde se proyecte la iluminación principal.",
    icon: LampCeiling,
    tone: "purple",
    tag: "Iluminación Inteligente",
  },
  {
    id: "central",
    name: "Módulo Central EcoAhorro",
    room: "Punto central de la vivienda",
    badge: "Conectividad en Tiempo Real",
    description:
      "Es el cerebro del sistema. Recibe la información de todos los puntos de la casa y la envía por WiFi a la plataforma EcoAhorro.",
    howItSaves:
      "Sincroniza toda la información cada 5 segundos para que puedas ver el consumo, las alertas y el ahorro en tu teléfono o computadora.",
    installationTip:
      "Ubicar en un lugar con buena cobertura WiFi cerca de un tomacorriente estándar.",
    icon: Cpu,
    tone: "emerald",
    tag: "Monitoreo 24/7",
  },
];

export function InstallationPage() {
  const [selectedPlaceIndex, setSelectedPlaceIndex] = useState(0);

  const place = places[selectedPlaceIndex];
  const Icon = place.icon;

  const toneClasses = {
    amber: "border-amber-300 bg-amber-50 text-amber-800",
    blue: "border-sky-300 bg-sky-50 text-sky-800",
    rose: "border-rose-300 bg-rose-50 text-rose-800",
    purple: "border-purple-300 bg-purple-50 text-purple-800",
    emerald: "border-emerald-300 bg-emerald-50 text-emerald-800",
  };

  const badgeClasses = {
    amber: "bg-amber-100 text-amber-900 border-amber-200",
    blue: "bg-sky-100 text-sky-900 border-sky-200",
    rose: "bg-rose-100 text-rose-900 border-rose-200",
    purple: "bg-purple-100 text-purple-900 border-purple-200",
    emerald: "bg-emerald-100 text-emerald-900 border-emerald-200",
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Guía de Distribución en el Hogar</p>
        <h1 className="page-title mt-2">Instalación del Nodo de Sensores</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Descubre en qué lugares de la vivienda se colocarían los puntos de
          monitoreo del kit EcoAhorro para controlar el consumo de luz y agua.
        </p>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          En el prototipo actual el ESP32 detecta las luces encendidas; la pinza de
          corriente y el sensor de caudal son parte del kit planificado y sus
          datos se simulan en la demostración.
        </p>
      </header>

      {/* Selector de Lugares / Pestañas */}
      <section className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {places.map((item, index) => {
          const ItemIcon = item.icon;
          const isSelected = index === selectedPlaceIndex;

          return (
            <button
              key={item.id}
              onClick={() => setSelectedPlaceIndex(index)}
              className={`panel p-4 text-left transition-all flex flex-col justify-between border-2 ${
                isSelected
                  ? "border-forest-600 bg-forest-50/40 shadow-md scale-[1.02]"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`grid h-8 w-8 place-items-center rounded-xl font-bold text-xs ${
                    isSelected
                      ? "bg-forest-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {index + 1}
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  {item.tag}
                </span>
              </div>

              <div className="mt-3">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {item.name}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {item.room}
                </p>
              </div>
            </button>
          );
        })}
      </section>

      {/* Detalle del Lugar Seleccionado + Plano Visual del Hogar */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Tarjeta de Información Detallada */}
        <section className="panel p-5 sm:p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`grid h-12 w-12 place-items-center rounded-2xl border ${toneClasses[place.tone]}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <span
                    className={`inline-block text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${badgeClasses[place.tone]}`}
                  >
                    {place.badge}
                  </span>
                  <h2 className="text-xl font-black text-slate-900 mt-1">
                    {place.name}
                  </h2>
                </div>
              </div>

              <span className="text-xs font-bold text-slate-400">
                Punto {selectedPlaceIndex + 1} de {places.length}
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-forest-600" />
                  Ubicación en la casa
                </p>
                <p className="text-sm font-semibold text-slate-800 mt-1">
                  {place.room}
                </p>
                <p className="text-sm text-slate-600 mt-1 leading-6">
                  {place.description}
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-800 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  ¿Cómo te ayuda a ahorrar?
                </p>
                <p className="text-sm font-medium text-emerald-950 mt-1 leading-6">
                  {place.howItSaves}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-600 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
                  Consejo de instalación sencilla
                </p>
                <p className="text-xs text-slate-600 mt-1 leading-5">
                  {place.installationTip}
                </p>
              </div>
            </div>
          </div>

          {/* Botones Anterior / Siguiente */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() =>
                setSelectedPlaceIndex((prev) =>
                  prev > 0 ? prev - 1 : places.length - 1,
                )
              }
              className="button-secondary text-xs flex items-center gap-1.5 px-3 py-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Lugar anterior
            </button>

            <button
              onClick={() =>
                setSelectedPlaceIndex((prev) =>
                  prev < places.length - 1 ? prev + 1 : 0,
                )
              }
              className="button-primary text-xs flex items-center gap-1.5 px-4 py-2"
            >
              Siguiente lugar
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* Maqueta / Mapa Visual del Hogar */}
        <section className="panel p-5 sm:p-6 flex flex-col justify-between bg-gradient-to-b from-slate-50 to-slate-100">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Home className="h-4 w-4 text-forest-600" />
                Mapa de Puntos de la Casa
              </h3>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Vista de Planta
              </span>
            </div>

            {/* Esquema interactivo de la casa */}
            <div className="mt-5 space-y-2.5">
              {places.map((item, index) => {
                const ItemIcon = item.icon;
                const isSelected = index === selectedPlaceIndex;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedPlaceIndex(index)}
                    className={`cursor-pointer rounded-xl p-3 border transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-white border-forest-500 shadow-md scale-[1.01]"
                        : "bg-white/60 border-slate-200 hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg font-bold text-xs ${
                          isSelected
                            ? "bg-forest-600 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <ItemIcon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {item.room}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isSelected
                          ? "bg-forest-100 text-forest-800"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {isSelected ? "Activo" : "Ver"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-3.5 text-center text-xs text-slate-600 shadow-sm">
            <p className="font-bold text-slate-800">
              💡 Toda la casa conectada sin cables complicados
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Los puntos envían su información inalámbricamente hacia la plataforma EcoAhorro.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
