import type { SimulationInput } from "../../domain/types";

interface Props {
  input: SimulationInput;
  onChange: (next: SimulationInput) => void;
  disabled?: boolean;
}

export function SimulationControls({
  input,
  onChange,
  disabled = false,
}: Props) {
  const setNumber = (key: keyof SimulationInput, value: string) =>
    onChange({ ...input, [key]: Number(value) });

  const numeric: Array<{
    key: keyof SimulationInput;
    label: string;
    unit: string;
    min: number;
    max: number;
    step?: number;
  }> = [
    {
      key: "powerWatts",
      label: "Potencia eléctrica",
      unit: "W",
      min: 0,
      max: 3000,
    },
    {
      key: "waterFlowLpm",
      label: "Caudal de agua",
      unit: "L/min",
      min: 0,
      max: 25,
      step: 0.1,
    },
    {
      key: "minutesWithoutActivity",
      label: "Minutos sin actividad",
      unit: "min",
      min: 0,
      max: 240,
    },
    {
      key: "lightRaw",
      label: "Sensor de luz (KY-018)",
      unit: "raw",
      min: 0,
      max: 1023,
    },
    {
      key: "hoursPerDay",
      label: "Uso diario estimado",
      unit: "h/día",
      min: 0,
      max: 24,
      step: 0.5,
    },
    {
      key: "daysPerMonth",
      label: "Días por mes",
      unit: "días",
      min: 1,
      max: 31,
    },
    {
      key: "electricityTariffBs",
      label: "Tarifa eléctrica",
      unit: "Bs/kWh",
      min: 0.01,
      max: 20,
      step: 0.01,
    },
    {
      key: "waterTariffBsPerM3",
      label: "Tarifa de agua",
      unit: "Bs/m³",
      min: 0.01,
      max: 50,
      step: 0.1,
    },
    {
      key: "emissionFactorKgPerKwh",
      label: "Factor emisión CO₂",
      unit: "kg CO₂/kWh",
      min: 0,
      max: 5,
      step: 0.01,
    },
  ];

  return (
    <fieldset
      disabled={disabled}
      className={`grid gap-4 transition sm:grid-cols-2 xl:grid-cols-3 ${
        disabled ? "cursor-wait opacity-60" : ""
      }`}
    >
      <legend className="sr-only">Parámetros de simulación</legend>
      <label className="flex min-h-12 items-center justify-between rounded-xl border border-slate-200 px-3 text-sm font-semibold hover:border-slate-300">
        <span>Presencia activa</span>
        <input
          type="checkbox"
          checked={input.presenceDetected}
          onChange={(event) =>
            onChange({ ...input, presenceDetected: event.target.checked })
          }
          className="h-5 w-5 accent-forest-600 rounded"
        />
      </label>
      <label className="flex min-h-12 items-center justify-between rounded-xl border border-slate-200 px-3 text-sm font-semibold hover:border-slate-300">
        <span>Luz encendida</span>
        <input
          type="checkbox"
          checked={input.lightOn}
          onChange={(event) =>
            onChange({ ...input, lightOn: event.target.checked })
          }
          className="h-5 w-5 accent-forest-600 rounded"
        />
      </label>
      <label className="flex min-h-12 items-center justify-between rounded-xl border border-slate-200 px-3 text-sm font-semibold hover:border-slate-300">
        <span>Nodo conectado</span>
        <input
          type="checkbox"
          checked={input.nodeOnline}
          onChange={(event) =>
            onChange({ ...input, nodeOnline: event.target.checked })
          }
          className="h-5 w-5 accent-forest-600 rounded"
        />
      </label>
      {numeric.map(({ key, label, unit, ...rest }) => (
        <label key={key} className="block">
          <span className="label">
            {label} <span className="font-normal text-slate-500">({unit})</span>
          </span>
          <input
            className="field"
            type="number"
            value={input[key] as number}
            onChange={(event) => setNumber(key, event.target.value)}
            {...rest}
          />
        </label>
      ))}
    </fieldset>
  );
}
