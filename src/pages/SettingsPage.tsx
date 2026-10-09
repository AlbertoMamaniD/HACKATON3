import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, RotateCcw, Save, Settings2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useApp } from "../app/AppProvider";
import { DEFAULT_CONFIG } from "../domain/config";
import { configSchema } from "../domain/schemas";
import type { EcoAhorroConfig } from "../domain/types";

const fields: Array<{
  key: keyof EcoAhorroConfig;
  label: string;
  unit: string;
  help: string;
  step?: number;
  group: "tarifas" | "simulador";
}> = [
  {
    key: "electricityTariffBs",
    label: "Tarifa eléctrica",
    unit: "Bs/kWh",
    help: "Costo por kilovatio-hora para estimar factura y ahorro.",
    step: 0.01,
    group: "tarifas",
  },
  {
    key: "waterTariffBsPerM3",
    label: "Tarifa de agua potable",
    unit: "Bs/m³",
    help: "Costo por metro cúbico (1 m³ = 1000 L).",
    step: 0.1,
    group: "tarifas",
  },
  {
    key: "minimumPowerWatts",
    label: "Potencia base / Standby",
    unit: "W",
    help: "Consumo a partir del cual el simulador evalúa desperdicio en ausencia.",
    group: "simulador",
  },
  {
    key: "waterLeakThresholdLpm",
    label: "Umbral de fuga de agua",
    unit: "L/min",
    help: "Caudal sin actividad que el simulador considera fuga o grifo abierto.",
    step: 0.1,
    group: "simulador",
  },
  {
    key: "toleranceMinutes",
    label: "Tiempo de tolerancia",
    unit: "min",
    help: "Minutos sin presencia antes de que el simulador alerte desperdicio.",
    group: "simulador",
  },
];

export function SettingsPage() {
  const { config, updateConfig, resetConfig } = useApp();
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EcoAhorroConfig>({
    resolver: zodResolver(configSchema),
    defaultValues: config,
  });

  useEffect(() => reset(config), [config, reset]);

  const submit = (values: EcoAhorroConfig) => {
    updateConfig(values);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  const restore = () => {
    if (
      window.confirm(
        "¿Restaurar todos los parámetros a sus valores predeterminados?",
      )
    ) {
      resetConfig();
      reset(DEFAULT_CONFIG);
      setSaved(true);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Parámetros del sistema</p>
        <h1 className="page-title mt-2">Configuración y Tarifas</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Ajusta las tarifas de luz y agua y los umbrales del simulador.
        </p>
      </header>

      <form onSubmit={handleSubmit(submit)} className="space-y-6">
        <section className="panel p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-forest-50 text-forest-700">
              <Settings2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold">Tarifas de luz y agua</h2>
              <p className="text-sm text-slate-500">
                Se usan en el Dashboard, la comparación de períodos, el reporte y el simulador.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {fields.filter((field) => field.group === "tarifas").map((field) => (
              <label key={field.key} className="block">
                <span className="label">
                  {field.label}{" "}
                  <span className="font-normal text-slate-500">
                    ({field.unit})
                  </span>
                </span>
                <input
                  type="number"
                  step={field.step ?? 1}
                  className="field"
                  {...register(field.key, { valueAsNumber: true })}
                />
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  {field.help}
                </span>
                {errors[field.key] && (
                  <span className="mt-1 block text-xs font-semibold text-danger-700">
                    {errors[field.key]?.message}
                  </span>
                )}
              </label>
            ))}
          </div>
        </section>

        <section className="panel p-5 sm:p-6">
          <h2 className="font-bold">Umbrales del simulador</h2>
          <p className="mt-1 text-sm text-slate-500">
            Solo afectan a los escenarios del simulador. Las alertas en vivo usan sus propios criterios:
            caudal anormal (más de 4,5 L/min), potencia mayor a 250 W y luces prendidas por mucho tiempo
            según el ESP32.
          </p>
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {fields.filter((field) => field.group === "simulador").map((field) => (
              <label key={field.key} className="block">
                <span className="label">
                  {field.label}{" "}
                  <span className="font-normal text-slate-500">
                    ({field.unit})
                  </span>
                </span>
                <input
                  type="number"
                  step={field.step ?? 1}
                  className="field"
                  {...register(field.key, { valueAsNumber: true })}
                />
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  {field.help}
                </span>
                {errors[field.key] && (
                  <span className="mt-1 block text-xs font-semibold text-danger-700">
                    {errors[field.key]?.message}
                  </span>
                )}
              </label>
            ))}
          </div>
        </section>

        <section className="panel p-5 sm:p-6">
          <h2 className="font-bold">Dirección del sensor de luz (KY-018)</h2>
          <p className="mt-1 text-sm text-slate-500">
            Interpretación de los valores analógicos de luminosidad.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-4">
              <input
                type="radio"
                value="lower-is-brighter"
                {...register("lightDirection")}
                className="mt-1 accent-forest-600"
              />
              <span>
                <strong className="block text-sm">
                  Menor valor analógico = Más luz
                </strong>
                <span className="text-xs text-slate-500">
                  Comportamiento típico con divisor resistivo LDR.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-4">
              <input
                type="radio"
                value="higher-is-brighter"
                {...register("lightDirection")}
                className="mt-1 accent-forest-600"
              />
              <span>
                <strong className="block text-sm">
                  Mayor valor analógico = Más luz
                </strong>
                <span className="text-xs text-slate-500">
                  Interpretación directa de voltaje.
                </span>
              </span>
            </label>
          </div>
        </section>

        {errors.root && (
          <p className="rounded-xl bg-danger-50 p-3 text-sm font-semibold text-danger-700">
            Revisa los umbrales relacionados.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button className="button-primary" type="submit">
            <Save className="h-4 w-4" /> Guardar configuración
          </button>
          <button className="button-secondary" type="button" onClick={restore}>
            <RotateCcw className="h-4 w-4" /> Restaurar valores
          </button>
          <span
            className={`flex items-center gap-2 text-sm font-bold text-forest-700 transition ${
              saved ? "opacity-100" : "opacity-0"
            }`}
            aria-live="polite"
          >
            <CheckCircle2 className="h-4 w-4" /> Configuración guardada
          </span>
        </div>
      </form>
    </div>
  );
}
