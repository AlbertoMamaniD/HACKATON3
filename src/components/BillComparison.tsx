import { useState } from "react";
import { Bolt, Droplets, Receipt, type LucideIcon } from "lucide-react";

import {
  EMPTY_BILL_AMOUNTS,
  billAmountsSchema,
  compareWithBill,
  parseBillInput,
  type BillAmounts,
} from "../domain/billing";
import { STORAGE_KEYS } from "../domain/config";
import { formatNumber } from "../utils/format";
import { readStored, writeStored } from "../utils/storage";

type BillKey = keyof BillAmounts;

const toDraft = (value: number | null) => (value === null ? "" : String(value));

function signed(value: number, digits = 1) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatNumber(Math.abs(value), digits)}`;
}

function ServiceComparison({
  title,
  icon: Icon,
  iconClass,
  estimatedBs,
  billedBs,
}: {
  title: string;
  icon: LucideIcon;
  iconClass: string;
  estimatedBs: number;
  billedBs: number | null;
}) {
  const result = compareWithBill(estimatedBs, billedBs);

  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <Icon aria-hidden="true" className={`h-4 w-4 ${iconClass}`} />
        {title}
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <dt className="text-slate-500">Estimado EcoAhorro</dt>
        <dd className="text-right font-semibold text-slate-900">Bs {formatNumber(estimatedBs)}</dd>
        <dt className="text-slate-500">Tu factura</dt>
        <dd className="text-right font-semibold text-slate-900">
          {billedBs === null ? "—" : `Bs ${formatNumber(billedBs)}`}
        </dd>
        {result && (
          <>
            <dt className="text-slate-500">Diferencia</dt>
            <dd className="text-right font-semibold text-slate-900" data-testid={`diferencia-${title}`}>
              Bs {signed(result.differenceBs)} ({signed(result.differencePercent)} %)
            </dd>
            <dt className="text-slate-500">Precisión frente a la factura (%)</dt>
            <dd className="text-right text-lg font-black text-forest-700">
              {formatNumber(result.accuracyPercent)} %
            </dd>
          </>
        )}
      </dl>
      {result ? (
        <p className="mt-3 text-xs leading-5 text-slate-500">
          {result.differenceBs < 0
            ? "Tu factura supera lo estimado por EcoAhorro. Revisa consumos no registrados o el detalle del cobro."
            : result.differenceBs > 0
              ? "EcoAhorro estima un gasto mayor que tu factura. Ajusta las tarifas en Configuración si no coinciden."
              : "El estimado coincide con tu factura."}
        </p>
      ) : (
        <p className="mt-3 text-xs leading-5 text-slate-500">
          {billedBs === 0
            ? "Con una factura de 0 Bs no se puede calcular el porcentaje."
            : "Ingresa el monto de tu factura para ver la diferencia."}
        </p>
      )}
    </div>
  );
}

/** Solución 3 del lienzo: contrastar el consumo estimado con la factura real del hogar. */
export function BillComparison({
  estimatedElectricityBs,
  estimatedWaterBs,
}: {
  estimatedElectricityBs: number;
  estimatedWaterBs: number;
}) {
  const [amounts, setAmounts] = useState<BillAmounts>(() =>
    readStored(STORAGE_KEYS.bills, billAmountsSchema, EMPTY_BILL_AMOUNTS),
  );
  const [drafts, setDrafts] = useState<Record<BillKey, string>>(() => ({
    electricityBs: toDraft(amounts.electricityBs),
    waterBs: toDraft(amounts.waterBs),
  }));
  const [errors, setErrors] = useState<Partial<Record<BillKey, string>>>({});

  const handleChange = (key: BillKey, raw: string) => {
    setDrafts((current) => ({ ...current, [key]: raw }));
    const parsed = parseBillInput(raw);
    if (!parsed.ok) {
      setErrors((current) => ({ ...current, [key]: parsed.error }));
      return;
    }
    setErrors((current) => ({ ...current, [key]: undefined }));
    const next = { ...amounts, [key]: parsed.value };
    setAmounts(next);
    writeStored(STORAGE_KEYS.bills, next);
  };

  const fields: { key: BillKey; label: string }[] = [
    { key: "electricityBs", label: "Monto de tu última factura de luz (Bs)" },
    { key: "waterBs", label: "Monto de tu última factura de agua (Bs)" },
  ];

  return (
    <section aria-labelledby="compara-factura" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <h3 id="compara-factura" className="flex items-center gap-2 text-base font-bold text-slate-900">
        <Receipt aria-hidden="true" className="h-4 w-4 text-forest-600" />
        Compara con tu factura
      </h3>
      <p className="mt-1 text-sm text-slate-600">
        Copia el total de tus últimos recibos. Los montos se guardan solo en este navegador.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {fields.map(({ key, label }) => (
          <label key={key} className="block min-w-0">
            <span className="label">{label}</span>
            <input
              className={`field ${errors[key] ? "border-danger-500" : ""}`}
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="Ej.: 120,50"
              value={drafts[key]}
              aria-invalid={Boolean(errors[key])}
              onChange={(event) => handleChange(key, event.target.value)}
            />
            {errors[key] && (
              <span className="mt-1 block text-xs font-semibold text-danger-700" role="alert">
                {errors[key]}
              </span>
            )}
          </label>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ServiceComparison
          title="Luz"
          icon={Bolt}
          iconClass="text-amber-600"
          estimatedBs={estimatedElectricityBs}
          billedBs={amounts.electricityBs}
        />
        <ServiceComparison
          title="Agua"
          icon={Droplets}
          iconClass="text-sky-600"
          estimatedBs={estimatedWaterBs}
          billedBs={amounts.waterBs}
        />
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        La comparación es orientativa: en esta demostración la potencia y el caudal son simulados, por lo que la
        diferencia no sirve como prueba ante la empresa distribuidora.
      </p>
    </section>
  );
}
