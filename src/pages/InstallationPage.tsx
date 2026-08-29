import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bolt,
  Cable,
  CheckCircle2,
  Cpu,
  Droplets,
  Gauge,
  Lightbulb,
  Pause,
  Play,
  RadioTower,
  RefreshCcw,
  Router,
  ShieldAlert,
  Wifi,
  Wind,
} from "lucide-react";

const steps = [
  {
    title: "Preparar el nodo ESP32",
    component: "ESP32 DevKit",
    description:
      "El ESP32 funciona como microcontrolador central. Recibe las lecturas de los 4 sensores y ejecuta la lógica de EcoAhorro.",
    result: "ESP32 alimentado y preparado",
    icon: Cpu,
  },
  {
    title: "Conectar el Sensor de Flujo de Agua (YF-S201)",
    component: "Caudalímetro · GPIO 16 (Interrupción)",
    description:
      "El sensor de efecto Hall contabiliza los pulsos por cada litro de agua que fluye a través de la tubería para calcular caudal (L/min) y volumen acumulado.",
    result: "Flujo de agua y detección de fugas disponible",
    icon: Droplets,
  },
  {
    title: "Conectar el Medidor de Energía",
    component: "Sensor de Corriente / Potencia · GPIO 35 (ADC)",
    description:
      "Mide la potencia instantánea activa en vatios (W) para supervisar consumos fantasma y sobrecargas eléctricas.",
    result: "Monitoreo eléctrico disponible",
    icon: Bolt,
  },
  {
    title: "Conectar el sensor de gases MQ-135",
    component: "MQ-135 · GPIO 32 (ADC)",
    description:
      "El MQ-135 registra concentraciones de gases nocivos, humo y compuestos volátiles para evaluar la calidad del aire.",
    result: "Detección de gases operativa",
    icon: Wind,
  },
  {
    title: "Conectar el sensor de luz KY-018 (LDR)",
    component: "KY-018 · GPIO 34 (ADC)",
    description:
      "Permite identificar si las luces permanecen encendidas en ambientes desocupados.",
    result: "Sensor de iluminación activo",
    icon: Lightbulb,
  },
  {
    title: "Conectar el indicador LED de diagnóstico",
    component: "LED de estado · GPIO 23",
    description:
      "El LED visualiza estados de calibración, detección de fugas y alertas críticas en hardware.",
    result: "Indicador físico preparado",
    icon: CheckCircle2,
  },
  {
    title: "Cargar el firmware de EcoAhorro",
    component: "Firmware C++ en ESP32",
    description:
      "Se compila y graba el programa que calcula métricas de ahorro y transmite los datos en intervalos de 5 a 15 segundos.",
    result: "Firmware ejecutándose",
    icon: Cable,
  },
  {
    title: "Calibración inicial del MQ-135",
    component: "Calentamiento y línea base",
    description:
      "El MQ-135 requiere un precalentamiento para establecer su línea base limpia en el ambiente.",
    result: "Línea base de gases calibrada",
    icon: Gauge,
  },
  {
    title: "Conectar el nodo a WiFi",
    component: "Conectividad WiFi 2.4GHz",
    description:
      "El ESP32 se conecta a la red inalámbrica local para enviar la telemetría a la nube.",
    result: "Nodo en línea con acceso a internet",
    icon: Wifi,
  },
  {
    title: "Vincular con la plataforma EcoAhorro",
    component: "Telemetría en tiempo real",
    description:
      "Los datos de agua, energía, gases y luz se sincronizan automáticamente en el dashboard y el simulador.",
    result: "Plataforma recibiendo datos en vivo",
    icon: Router,
  },
  {
    title: "Verificación y ahorro continuo",
    component: "Sistema Integral EcoAhorro",
    description:
      "Se comprueba que el monitoreo de agua, electricidad, gases MQ-135 e iluminación funcionen armónicamente.",
    result: "Hogar inteligente optimizado",
    icon: RadioTower,
  },
];

function PrototypeDiagram({ step }: { step: number }) {
  const sensors = [
    {
      name: "YF-S201",
      description: "Caudal de agua (L/min)",
      pin: "GPIO 16",
      icon: Droplets,
      activeFrom: 1,
    },
    {
      name: "Medidor Eléctrico",
      description: "Potencia (W) y Energía",
      pin: "GPIO 35",
      icon: Bolt,
      activeFrom: 2,
    },
    {
      name: "MQ-135",
      description: "Gases y calidad de aire",
      pin: "GPIO 32",
      icon: Wind,
      activeFrom: 3,
    },
    {
      name: "KY-018",
      description: "Iluminación (LDR)",
      pin: "GPIO 34",
      icon: Lightbulb,
      activeFrom: 4,
    },
    {
      name: "LED Alertas",
      description: "Diagnóstico físico",
      pin: "GPIO 23",
      icon: CheckCircle2,
      activeFrom: 5,
    },
  ];

  return (
    <div className="relative min-h-[450px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Arquitectura Hardware EcoAhorro
        </span>
        <span className="rounded-full bg-forest-50 px-2.5 py-1 text-xs font-bold text-forest-700">
          ESP32 Core
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div className="grid gap-2.5">
          {sensors.map((sensor) => {
            const Icon = sensor.icon;
            const active = step >= sensor.activeFrom;
            return (
              <motion.div
                key={sensor.name}
                animate={{
                  opacity: active ? 1 : 0.45,
                  scale: active ? 1 : 0.97,
                }}
                className={`rounded-xl border-2 bg-white p-3 shadow-sm transition ${
                  active ? "border-forest-400" : "border-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-xl ${
                      active
                        ? "bg-forest-50 text-forest-700"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900">
                      {sensor.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {sensor.description}
                    </p>
                    <p className="text-[11px] font-bold text-tech-700">
                      {sensor.pin}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div className="hidden h-1 w-12 rounded-full bg-forest-500 md:block" />

        <div className="rounded-2xl border-2 border-tech-300 bg-white p-5 text-center shadow-md">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-tech-50 text-tech-700">
            <Cpu className="h-8 w-8" />
          </div>
          <p className="mt-3 font-black text-slate-900">ESP32 Concentrador</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Microcontrolador WiFi / BLE
          </p>
          <div className="mt-4 space-y-1 text-left text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <p className="font-semibold text-slate-800">Sensores activos:</p>
            <p>• Agua: YF-S201</p>
            <p>• Electricidad: Potencia (W)</p>
            <p>• Gases: MQ-135</p>
            <p>• Luz: KY-018</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function InstallationPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

  useEffect(() => {
    if (!autoPlay) return;
    const timer = window.setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : 0));
    }, 3500);
    return () => window.clearInterval(timer);
  }, [autoPlay]);

  const activeStep = steps[currentStep];

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Guía técnica y ensamblaje</p>
        <h1 className="page-title mt-2">Instalación del Nodo de Sensores</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Guía paso a paso para la conexión física de los sensores de agua,
          energía, gases MQ-135 e iluminación al ESP32.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="panel p-5 sm:p-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <span className="text-xs font-bold uppercase text-forest-700">
                Paso {currentStep + 1} de {steps.length}
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                {activeStep.title}
              </h2>
            </div>
            <span className="rounded-xl bg-forest-50 p-2 text-forest-700">
              <activeStep.icon className="h-6 w-6" />
            </span>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">
                Componente / Pinout
              </p>
              <p className="text-base font-semibold text-slate-800 mt-1">
                {activeStep.component}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-slate-500">
                Descripción
              </p>
              <p className="text-sm text-slate-600 leading-6 mt-1">
                {activeStep.description}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
              <p className="text-xs font-bold uppercase text-emerald-800">
                Resultado esperado
              </p>
              <p className="text-sm font-semibold text-emerald-900 mt-0.5">
                {activeStep.result}
              </p>
            </div>
          </div>

          {/* Controles de navegación */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <div className="flex gap-2">
              <button
                className="button-secondary"
                disabled={currentStep === 0}
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              >
                <ArrowLeft className="h-4 w-4" /> Anterior
              </button>
              <button
                className="button-primary"
                disabled={currentStep === steps.length - 1}
                onClick={() =>
                  setCurrentStep((prev) =>
                    Math.min(steps.length - 1, prev + 1),
                  )
                }
              >
                Siguiente <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="button-secondary"
                onClick={() => setAutoPlay((prev) => !prev)}
              >
                {autoPlay ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {autoPlay ? "Pausar" : "Recorrido automático"}
              </button>
              <button
                className="button-secondary"
                onClick={() => setCurrentStep(0)}
              >
                <RefreshCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section>
          <PrototypeDiagram step={currentStep} />
        </section>
      </div>
    </div>
  );
}
