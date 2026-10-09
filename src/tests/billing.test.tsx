import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { BillComparison } from "../components/BillComparison";
import {
  EMPTY_BILL_AMOUNTS,
  billAmountsSchema,
  compareWithBill,
  parseBillInput,
} from "../domain/billing";
import { STORAGE_KEYS } from "../domain/config";
import { readStored } from "../utils/storage";

describe("comparación con la factura", () => {
  it("calcula la diferencia en Bs, en % y la precisión", () => {
    const result = compareWithBill(90, 100);
    expect(result).not.toBeNull();
    expect(result!.differenceBs).toBeCloseTo(-10);
    expect(result!.differencePercent).toBeCloseTo(-10);
    expect(result!.accuracyPercent).toBeCloseTo(90);
  });

  it("usa el monto facturado como base del porcentaje cuando el estimado es mayor", () => {
    const result = compareWithBill(150, 120);
    expect(result!.differenceBs).toBeCloseTo(30);
    expect(result!.differencePercent).toBeCloseTo(25);
    expect(result!.accuracyPercent).toBeCloseTo(75);
  });

  it("acota la precisión a 0 % cuando la diferencia supera el 100 %", () => {
    expect(compareWithBill(300, 100)!.accuracyPercent).toBe(0);
  });

  it("no compara sin factura o con factura de 0 Bs", () => {
    expect(compareWithBill(50, null)).toBeNull();
    expect(compareWithBill(50, 0)).toBeNull();
  });

  it("valida los montos ingresados", () => {
    expect(parseBillInput("")).toEqual({ ok: true, value: null });
    expect(parseBillInput("120,5")).toEqual({ ok: true, value: 120.5 });
    expect(parseBillInput("-3").ok).toBe(false);
    expect(parseBillInput("abc").ok).toBe(false);
    expect(billAmountsSchema.safeParse({ electricityBs: -1, waterBs: null }).success).toBe(false);
  });
});

describe("persistencia de los montos de factura", () => {
  it("guarda los montos en localStorage y los recupera al volver a montar", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <BillComparison estimatedElectricityBs={90} estimatedWaterBs={20} />,
    );

    await user.type(screen.getByLabelText("Monto de tu última factura de luz (Bs)"), "100");
    await user.type(screen.getByLabelText("Monto de tu última factura de agua (Bs)"), "25");

    expect(readStored(STORAGE_KEYS.bills, billAmountsSchema, EMPTY_BILL_AMOUNTS)).toEqual({
      electricityBs: 100,
      waterBs: 25,
    });
    expect(screen.getByTestId("diferencia-Luz")).toHaveTextContent("Bs −10,0 (−10,0 %)");
    expect(screen.getAllByText("Precisión frente a la factura (%)")).toHaveLength(2);

    unmount();
    render(<BillComparison estimatedElectricityBs={90} estimatedWaterBs={20} />);
    expect(screen.getByLabelText("Monto de tu última factura de luz (Bs)")).toHaveValue(100);
    expect(screen.getByLabelText("Monto de tu última factura de agua (Bs)")).toHaveValue(25);
  });

  it("no guarda montos negativos y muestra el error", async () => {
    const user = userEvent.setup();
    render(<BillComparison estimatedElectricityBs={90} estimatedWaterBs={20} />);

    await user.type(screen.getByLabelText("Monto de tu última factura de luz (Bs)"), "-5");

    expect(screen.getByRole("alert")).toHaveTextContent("El monto no puede ser negativo.");
    expect(
      readStored(STORAGE_KEYS.bills, billAmountsSchema, EMPTY_BILL_AMOUNTS).electricityBs,
    ).toBeNull();
  });

  it("descarta montos guardados que no cumplen el esquema", () => {
    localStorage.setItem(STORAGE_KEYS.bills, JSON.stringify({ electricityBs: -20, waterBs: 10 }));
    expect(readStored(STORAGE_KEYS.bills, billAmountsSchema, EMPTY_BILL_AMOUNTS)).toEqual(
      EMPTY_BILL_AMOUNTS,
    );
  });
});
