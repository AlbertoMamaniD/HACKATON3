import { useEffect } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppProvider, useApp } from "../app/AppProvider";
import { DEFAULT_CONFIG, STORAGE_KEYS } from "../domain/config";

function ConfigHarness() {
  const { config, updateConfig, resetConfig } = useApp();
  return (
    <>
      <output aria-label="tarifa">{config.electricityTariffBs}</output>
      <button
        onClick={() =>
          updateConfig({ ...config, electricityTariffBs: 1.25 })
        }
      >
        Cambiar tarifa
      </button>
      <button onClick={resetConfig}>Restaurar</button>
    </>
  );
}

function AlertHarness() {
  const { alerts, addOrUpdateAlert, setAlertStatus } = useApp();

  useEffect(() => {
    addOrUpdateAlert({
      id: "alert-cocina",
      environmentId: "casa",
      type: "potential-waste",
      severity: "warning",
      status: "new",
      title: "Consumo detectado en horario sin actividad",
      description: "Se detectó actividad eléctrica sin presencia registrada.",
      recommendation: "Revisar los equipos conectados.",
      evidence: { powerWatts: 220, minutesWithoutActivity: 45 },
      openedAt: "2026-08-28T20:30:00-04:00",
      source: "simulated",
    });
  }, [addOrUpdateAlert]);

  const alert = alerts.find((item) => item.id === "alert-cocina");
  if (!alert) return null;

  return (
    <>
      <output aria-label="estado alerta">{alert.status}</output>
      <button onClick={() => setAlertStatus(alert.id, "acknowledged")}>
        Reconocer alerta
      </button>
    </>
  );
}

describe("persistencia de estado de la aplicación", () => {
  it("guarda configuración y restaura valores predeterminados", async () => {
    const user = userEvent.setup();
    render(
      <AppProvider>
        <ConfigHarness />
      </AppProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Cambiar tarifa" }));
    expect(screen.getByLabelText("tarifa")).toHaveTextContent("1.25");
    await waitFor(() =>
      expect(localStorage.getItem(STORAGE_KEYS.config)).toContain("1.25"),
    );
    await user.click(screen.getByRole("button", { name: "Restaurar" }));
    expect(screen.getByLabelText("tarifa")).toHaveTextContent(
      String(DEFAULT_CONFIG.electricityTariffBs),
    );
  });

  it("guarda el cambio de estado de una alerta", async () => {
    const user = userEvent.setup();
    render(
      <AppProvider>
        <AlertHarness />
      </AppProvider>,
    );
    expect(await screen.findByLabelText("estado alerta")).toHaveTextContent(
      "new",
    );
    await user.click(screen.getByRole("button", { name: "Reconocer alerta" }));
    expect(screen.getByLabelText("estado alerta")).toHaveTextContent(
      "acknowledged",
    );
    await waitFor(() =>
      expect(localStorage.getItem(STORAGE_KEYS.alerts)).toContain(
        "acknowledged",
      ),
    );
  });
});
