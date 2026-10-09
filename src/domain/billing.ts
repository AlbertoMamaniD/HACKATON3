import { z } from "zod";

/** Montos que el usuario copia de su última factura. null = todavía no ingresado. */
export interface BillAmounts {
  electricityBs: number | null;
  waterBs: number | null;
}

export const EMPTY_BILL_AMOUNTS: BillAmounts = { electricityBs: null, waterBs: null };

export const billAmountSchema = z
  // En Zod 4, z.number() ya rechaza NaN e Infinity.
  .number({ message: "Ingresa un número válido." })
  .min(0, "El monto no puede ser negativo.");

export const billAmountsSchema = z.object({
  electricityBs: billAmountSchema.nullable(),
  waterBs: billAmountSchema.nullable(),
});

export type ParsedBillInput =
  | { ok: true; value: number | null }
  | { ok: false; error: string };

/** Convierte el texto del campo (acepta coma decimal) en un monto validado. Vacío = sin dato. */
export function parseBillInput(raw: string): ParsedBillInput {
  const clean = raw.trim().replace(",", ".");
  if (clean === "") return { ok: true, value: null };
  const parsed = billAmountSchema.safeParse(Number(clean));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Monto inválido." };
  }
  return { ok: true, value: parsed.data };
}

export interface BillComparison {
  estimatedBs: number;
  billedBs: number;
  /** Estimado − facturado. Negativo: la factura supera lo estimado por EcoAhorro. */
  differenceBs: number;
  /** Diferencia relativa al monto facturado. */
  differencePercent: number;
  /** 100 − |diferencia %|, acotado a 0–100. */
  accuracyPercent: number;
}

/**
 * Compara lo estimado por EcoAhorro con lo facturado.
 * Devuelve null si no hay factura válida (sin dato o 0 Bs), porque el porcentaje no tendría sentido.
 */
export function compareWithBill(
  estimatedBs: number,
  billedBs: number | null,
): BillComparison | null {
  if (billedBs === null || !Number.isFinite(billedBs) || billedBs <= 0) return null;
  if (!Number.isFinite(estimatedBs)) return null;

  const differenceBs = estimatedBs - billedBs;
  const differencePercent = (differenceBs / billedBs) * 100;
  const accuracyPercent = Math.max(0, Math.min(100, 100 - Math.abs(differencePercent)));

  return { estimatedBs, billedBs, differenceBs, differencePercent, accuracyPercent };
}
