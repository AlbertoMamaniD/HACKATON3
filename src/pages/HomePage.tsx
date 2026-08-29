import { motion } from "framer-motion";
import {
  ArrowRight,
  BellRing,
  Droplets,
  Lightbulb,
  RadioTower,
  Thermometer,
  Wifi,
  Wind,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useDashboardData } from "../hooks/useEcoData";

function getStatusLabel(
  online: boolean,
  status: string,
) {
  if (!online) {
    return "Sin conexión";
  }

  if (status === "normal") {
    return "Normal";
  }

  if (status === "offline") {
    return "Sin conexión";
  }

  return "Revisar";
}

export function HomePage() {
  const { data } =
    useDashboardData();

  const environmentCards =
    data?.environments
      .slice(0, 4)
      .map(
        (environment, index) => {
          const snapshot =
            data.snapshots[index];

          const online =
            snapshot?.nodeOnline ??
            false;

          return {
            id: environment.id,
            name: environment.name,
            online,
            status: getStatusLabel(
              online,
              environment.status,
            ),
            temperature:
              snapshot
                ?.temperatureCelsius,
            humidity:
              snapshot
                ?.humidityPercent,
          };
        },
      ) ?? [];

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="relative min-w-0 overflow-hidden rounded-2xl bg-forest-900 px-5 py-8 text-white sm:rounded-3xl sm:px-8 sm:py-11 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,.85fr)] lg:items-center lg:gap-10 xl:px-10 xl:py-14">
        <div className="relative z-10 min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">
            Monitoreo ambiental IoT ·
            Tarija
          </p>

          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.04] tracking-tight sm:text-5xl lg:text-[3.25rem] xl:text-6xl">
            Tus datos ambientales,
            visibles en{" "}
            <span className="text-emerald-300">
              tiempo real
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-emerald-50 sm:text-lg sm:leading-8">
            EcoAhorro conecta sensores
            ambientales a un ESP32 para
            visualizar temperatura,
            humedad, iluminación y cambios
            en la calidad del aire desde un
            solo dashboard.
          </p>

          <div className="mt-7 grid w-full gap-3 sm:flex sm:flex-wrap lg:grid lg:grid-cols-2">
            <Link
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-forest-900 transition hover:bg-emerald-50 sm:w-auto lg:col-span-2 lg:w-full"
              to="/dashboard"
            >
              Abrir dashboard

              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/35 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 sm:w-auto lg:w-full"
              to="/instalacion"
            >
              Ver instalación
            </Link>

            <Link
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-transparent px-4 py-2.5 text-sm font-bold text-emerald-200 transition hover:bg-white/10 hover:text-white sm:w-auto lg:w-full"
              to="/simulador"
            >
              Abrir simulador
            </Link>
          </div>
        </div>

        <motion.div
          className="relative mt-8 min-w-0 lg:mt-0"
          initial={false}
        >
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur sm:rounded-3xl sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="font-bold">
                Nodos EcoAhorro
              </span>

              <span className="shrink-0 rounded-full bg-emerald-300/20 px-2.5 py-1 text-xs font-bold text-emerald-200">
                Monitoreo IoT
              </span>
            </div>

            {environmentCards.length ? (
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {environmentCards.map(
                  (item) => (
                    <div
                      key={item.id}
                      className="min-w-0 rounded-xl bg-white/10 p-3 sm:rounded-2xl sm:p-4"
                    >
                      <div
                        className={`mb-2.5 h-2 w-2 rounded-full ${
                          item.online
                            ? item.status ===
                              "Normal"
                              ? "bg-emerald-300"
                              : "bg-amber-300"
                            : "bg-slate-400"
                        }`}
                      />

                      <p className="truncate text-sm font-bold">
                        {item.name}
                      </p>

                      <p className="mt-1 text-xs text-emerald-100">
                        {item.status}
                      </p>

                      {item.online && (
                        <p className="mt-2 text-[11px] text-emerald-100/80">
                          {item.temperature ??
                            "—"}{" "}
                          °C ·{" "}
                          {item.humidity ??
                            "—"}{" "}
                          %
                        </p>
                      )}
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-emerald-100">
                Esperando información de
                los nodos EcoAhorro.
              </div>
            )}
          </div>
        </motion.div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="panel p-6">
          <p className="eyebrow">
            El problema
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            Sin mediciones, las condiciones
            del ambiente pasan
            desapercibidas
          </h2>

          <p className="mt-3 leading-7 text-slate-600">
            Temperatura elevada, humedad,
            poca iluminación o cambios en
            el aire pueden ocurrir sin que
            exista un registro que permita
            analizarlos posteriormente.
          </p>
        </article>

        <article className="panel border-forest-100 bg-forest-50 p-6">
          <p className="eyebrow">
            Nuestra respuesta
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            Sensores conectados a un
            dashboard
          </h2>

          <p className="mt-3 leading-7 text-slate-600">
            EcoAhorro utiliza un ESP32 para
            recopilar las lecturas de los
            sensores y presentarlas de
            forma clara mediante estados,
            gráficos y alertas.
          </p>
        </article>
      </section>

      <section>
        <p className="eyebrow">
          Así funciona
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          Del sensor al dashboard
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            [
              RadioTower,
              "1. Medir",
              "El ESP32 obtiene las lecturas del DHT22, KY-018 y MQ-135.",
            ],
            [
              Wifi,
              "2. Transmitir",
              "Las mediciones se envían mediante la red hacia la fuente de datos de EcoAhorro.",
            ],
            [
              BellRing,
              "3. Visualizar",
              "El dashboard muestra estados, tendencias y alertas para facilitar su interpretación.",
            ],
          ].map(
            ([Icon, title, text]) => {
              const Component =
                Icon as typeof RadioTower;

              return (
                <article
                  key={title as string}
                  className="panel p-6"
                >
                  <Component className="h-7 w-7 text-forest-600" />

                  <h3 className="mt-4 font-bold">
                    {title as string}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {text as string}
                  </p>
                </article>
              );
            },
          )}
        </div>
      </section>

      <section className="panel grid gap-8 p-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Thermometer className="h-6 w-6 text-amber-700" />

          <h3 className="mt-3 font-bold">
            Temperatura
          </h3>

          <p className="mt-1 text-sm text-slate-600">
            Medición mediante DHT22.
          </p>
        </div>

        <div>
          <Droplets className="h-6 w-6 text-tech-700" />

          <h3 className="mt-3 font-bold">
            Humedad
          </h3>

          <p className="mt-1 text-sm text-slate-600">
            Humedad relativa del ambiente.
          </p>
        </div>

        <div>
          <Lightbulb className="h-6 w-6 text-amber-700" />

          <h3 className="mt-3 font-bold">
            Iluminación
          </h3>

          <p className="mt-1 text-sm text-slate-600">
            Estado obtenido mediante
            KY-018.
          </p>
        </div>

        <div>
          <Wind className="h-6 w-6 text-forest-600" />

          <h3 className="mt-3 font-bold">
            Calidad del aire
          </h3>

          <p className="mt-1 text-sm text-slate-600">
            Cambio relativo detectado por
            el MQ-135.
          </p>
        </div>
      </section>
    </div>
  );
}