import {
  useEffect,
  useState,
} from "react";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
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
  Thermometer,
  Wifi,
  Wind,
} from "lucide-react";

const steps = [
  {
    title: "Preparar el nodo ESP32",
    component: "ESP32",
    description:
      "El ESP32 funciona como nodo principal. Recibe las lecturas de los sensores y ejecuta la lógica de EcoAhorro.",
    result: "ESP32 preparado",
    icon: Cpu,
  },
  {
    title: "Conectar el DHT22",
    component:
      "DHT22 · GPIO 16",
    description:
      "El DHT22 obtiene temperatura y humedad relativa del ambiente.",
    result:
      "Temperatura y humedad disponibles",
    icon: Thermometer,
  },
  {
    title: "Conectar el KY-018",
    component:
      "Sensor de luz · GPIO 34",
    description:
      "El KY-018 permite determinar si el ambiente se encuentra iluminado, con luz media u oscuro.",
    result:
      "Sensor de iluminación disponible",
    icon: Lightbulb,
  },
  {
    title: "Conectar el MQ-135",
    component:
      "MQ-135 · GPIO 32",
    description:
      "El MQ-135 registra una señal analógica que EcoAhorro compara con una línea base para detectar cambios en el aire.",
    result:
      "Sensor de aire disponible",
    icon: Wind,
  },
  {
    title: "Conectar el indicador LED",
    component:
      "LED de estado · GPIO 23",
    description:
      "El LED permite visualizar estados de calentamiento, errores o condiciones ambientales que requieren atención.",
    result:
      "Indicador visual preparado",
    icon: CheckCircle2,
  },
  {
    title: "Cargar el firmware",
    component:
      "Programa EcoAhorro",
    description:
      "Se carga al ESP32 el programa encargado de leer los sensores, filtrar valores y generar estados.",
    result:
      "Firmware ejecutándose",
    icon: Cable,
  },
  {
    title: "Esperar la calibración",
    component:
      "Calibración del MQ-135",
    description:
      "El MQ-135 necesita una etapa inicial de calentamiento y calibración antes de utilizar su línea base.",
    result:
      "Línea base obtenida",
    icon: Gauge,
  },
  {
    title: "Conectar el nodo a la red",
    component:
      "WiFi",
    description:
      "El ESP32 se conecta a la red para poder enviar sus mediciones hacia EcoAhorro.",
    result:
      "Nodo conectado a la red",
    icon: Wifi,
  },
  {
    title: "Vincular con EcoAhorro",
    component:
      "API y dashboard",
    description:
      "Las lecturas recibidas por EcoAhorro se relacionan con el ambiente correspondiente y se muestran en el dashboard.",
    result:
      "Datos visibles en EcoAhorro",
    icon: Router,
  },
  {
    title: "Verificar funcionamiento",
    component:
      "Nodo EcoAhorro",
    description:
      "Se comprueba que temperatura, humedad, iluminación, calidad del aire y estado del nodo se actualicen correctamente.",
    result:
      "Nodo EcoAhorro operativo",
    icon: RadioTower,
  },
];

function PrototypeDiagram({
  step,
}: {
  step: number;
}) {
  const sensors = [
    {
      name: "DHT22",
      description:
        "Temperatura · Humedad",
      pin: "GPIO 16",
      icon: Thermometer,
      activeFrom: 1,
    },
    {
      name: "KY-018",
      description: "Iluminación",
      pin: "GPIO 34",
      icon: Lightbulb,
      activeFrom: 2,
    },
    {
      name: "MQ-135",
      description:
        "Cambio del aire",
      pin: "GPIO 32",
      icon: Wind,
      activeFrom: 3,
    },
    {
      name: "LED",
      description:
        "Estado y alertas",
      pin: "GPIO 23",
      icon: CheckCircle2,
      activeFrom: 4,
    },
  ];

  return (
    <div className="relative min-h-[430px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Prototipo físico EcoAhorro
        </span>

        <span className="rounded-full bg-forest-50 px-2 py-1 text-xs font-bold text-forest-700">
          ESP32
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div className="grid gap-3">
          {sensors.map(
            (sensor) => {
              const Icon =
                sensor.icon;

              const active =
                step >=
                sensor.activeFrom;

              return (
                <motion.div
                  key={sensor.name}
                  animate={{
                    opacity:
                      active
                        ? 1
                        : 0.45,

                    scale:
                      active
                        ? 1
                        : 0.97,
                  }}
                  className={`rounded-xl border-2 bg-white p-3 ${
                    active
                      ? "border-forest-300"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid h-10 w-10 place-items-center rounded-xl ${
                        active
                          ? "bg-forest-50 text-forest-700"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>

                    <div className="min-w-0">
                      <p className="font-bold">
                        {
                          sensor.name
                        }
                      </p>

                      <p className="text-xs text-slate-500">
                        {
                          sensor.description
                        }
                      </p>

                      <p className="mt-1 text-[11px] font-bold text-tech-700">
                        {
                          sensor.pin
                        }
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            },
          )}
        </div>

        <motion.div
          className="hidden h-1 w-12 rounded-full bg-forest-500 md:block"
          animate={{
            scaleX:
              step >= 1 ? 1 : 0.2,
          }}
        />

        <motion.div
          animate={{
            scale:
              step >= 5 ? 1 : 0.96,
          }}
          className="rounded-2xl border-2 border-tech-200 bg-tech-50 p-6 text-center"
        >
          <Cpu className="mx-auto h-10 w-10 text-tech-700" />

          <p className="mt-3 text-lg font-bold">
            ESP32
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Nodo EcoAhorro
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-slate-600">
              Lecturas
            </span>

            <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-slate-600">
              Filtros
            </span>

            <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-slate-600">
              Alertas
            </span>
          </div>
        </motion.div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <motion.div
          animate={{
            opacity:
              step >= 7 ? 1 : 0.35,
          }}
          className="rounded-xl border border-slate-200 bg-white p-4 text-center"
        >
          <Wifi className="mx-auto h-6 w-6 text-tech-700" />

          <p className="mt-2 text-sm font-bold">
            Red WiFi
          </p>

          <p className="text-xs text-slate-500">
            Comunicación del nodo
          </p>
        </motion.div>

        <motion.div
          animate={{
            scaleX:
              step >= 8 ? 1 : 0.2,
          }}
          className="hidden h-1 w-14 rounded-full bg-tech-500 sm:block"
        />

        <motion.div
          animate={{
            opacity:
              step >= 8 ? 1 : 0.35,
          }}
          className="rounded-xl border border-forest-200 bg-forest-50 p-4 text-center"
        >
          <RadioTower className="mx-auto h-6 w-6 text-forest-700" />

          <p className="mt-2 text-sm font-bold">
            Dashboard EcoAhorro
          </p>

          <p className="text-xs text-slate-500">
            Visualización de datos
          </p>
        </motion.div>
      </div>

      {step >= 9 && (
        <motion.div
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-forest-600 p-3 text-sm font-bold text-white"
        >
          <CheckCircle2 className="h-5 w-5" />

          Nodo EcoAhorro operativo
        </motion.div>
      )}
    </div>
  );
}

export function InstallationPage() {
  const [step, setStep] =
    useState(0);

  const [playing, setPlaying] =
    useState(false);

  useEffect(() => {
    if (!playing) {
      return;
    }

    const timer =
      window.setInterval(() => {
        setStep((current) => {
          if (
            current >=
            steps.length - 1
          ) {
            setPlaying(false);

            return current;
          }

          return current + 1;
        });
      }, 1600);

    return () =>
      window.clearInterval(timer);
  }, [playing]);

  const current = steps[step];

  const Icon = current.icon;

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">
          Recorrido guiado
        </p>

        <h1 className="page-title mt-2">
          ¿Cómo funciona la instalación
          del prototipo?
        </h1>

        <p className="mt-3 max-w-3xl text-slate-600">
          Esta vista muestra cómo los
          sensores ambientales se integran
          con el ESP32 y cómo el nodo se
          conecta posteriormente con
          EcoAhorro.
        </p>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <div className="panel p-5">
          <PrototypeDiagram
            step={step}
          />
        </div>

        <div className="panel flex flex-col p-5">
          <div className="flex items-center justify-between">
            <span className="eyebrow">
              Paso {step + 1} de{" "}
              {steps.length}
            </span>

            <span className="text-xs font-bold text-slate-500">
              {Math.round(
                ((step + 1) /
                  steps.length) *
                  100,
              )}
              %
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full rounded-full bg-forest-500"
              animate={{
                width: `${((step + 1) / steps.length) * 100}%`,
              }}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{
                opacity: 0,
                x: 12,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              exit={{
                opacity: 0,
                x: -12,
              }}
              className="mt-8"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-forest-50 text-forest-700">
                <Icon />
              </span>

              <h2 className="mt-4 text-2xl font-bold">
                {current.title}
              </h2>

              <p className="mt-2 leading-7 text-slate-600">
                {
                  current.description
                }
              </p>

              <dl className="mt-6 space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
                <div>
                  <dt className="font-bold text-slate-500">
                    Componente
                  </dt>

                  <dd className="mt-1 font-semibold">
                    {
                      current.component
                    }
                  </dd>
                </div>

                <div>
                  <dt className="font-bold text-slate-500">
                    Resultado del paso
                  </dt>

                  <dd className="mt-1 flex items-center gap-2 font-semibold text-forest-700">
                    <CheckCircle2 className="h-4 w-4" />

                    {current.result}
                  </dd>
                </div>
              </dl>
            </motion.div>
          </AnimatePresence>

          <div className="mt-auto flex flex-wrap gap-2 pt-7">
            <button
              className="button-secondary"
              disabled={step === 0}
              onClick={() =>
                setStep(
                  (value) =>
                    value - 1,
                )
              }
            >
              <ArrowLeft className="h-4 w-4" />

              Anterior
            </button>

            <button
              className="button-primary"
              disabled={
                step ===
                steps.length - 1
              }
              onClick={() =>
                setStep(
                  (value) =>
                    value + 1,
                )
              }
            >
              Siguiente

              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              className="button-secondary"
              onClick={() =>
                setPlaying(
                  (value) =>
                    !value,
                )
              }
            >
              {playing ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}

              {playing
                ? "Pausar"
                : "Reproducir"}
            </button>

            <button
              aria-label="Reiniciar recorrido"
              className="button-secondary px-3"
              onClick={() => {
                setStep(0);
                setPlaying(false);
              }}
            >
              <RefreshCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="panel p-5">
          <p className="eyebrow">
            Prototipo actual
          </p>

          <h2 className="mt-2 font-bold">
            ESP32 con sensores ambientales
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-3">
              <Thermometer className="h-5 w-5 text-amber-700" />

              <p className="mt-2 text-sm font-bold">
                DHT22
              </p>

              <p className="text-xs text-slate-500">
                Temperatura y humedad
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <Lightbulb className="h-5 w-5 text-amber-700" />

              <p className="mt-2 text-sm font-bold">
                KY-018
              </p>

              <p className="text-xs text-slate-500">
                Iluminación
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <Wind className="h-5 w-5 text-forest-700" />

              <p className="mt-2 text-sm font-bold">
                MQ-135
              </p>

              <p className="text-xs text-slate-500">
                Variación del aire
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <Droplets className="h-5 w-5 text-tech-700" />

              <p className="mt-2 text-sm font-bold">
                Dashboard
              </p>

              <p className="text-xs text-slate-500">
                Visualización central
              </p>
            </div>
          </div>
        </article>

        <article className="panel border-tech-100 bg-tech-50 p-5">
          <p className="eyebrow text-tech-700">
            Evolución futura
          </p>

          <h2 className="mt-2 font-bold">
            Incorporar medición energética
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            El prototipo ambiental puede
            evolucionar posteriormente con
            medidores adecuados para
            consumo eléctrico. Hasta que
            ese hardware exista, EcoAhorro
            no debe presentar valores de W,
            kWh o ahorro económico como si
            hubieran sido medidos.
          </p>
        </article>
      </section>

      <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />

        <p>
          <strong>Importante:</strong>{" "}
          esta vista explica la arquitectura
          del prototipo IoT. Cualquier
          futura medición de corriente
          alterna deberá utilizar hardware
          adecuado y ser instalada por
          personal capacitado.
        </p>
      </div>
    </div>
  );
}
