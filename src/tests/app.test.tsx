import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { App } from "../app/App";
import { AppProvider } from "../app/AppProvider";
import { SimulatorPage } from "../pages/SimulatorPage";

const renderApp = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppProvider>
        <App />
      </AppProvider>
    </MemoryRouter>,
  );

describe("rutas y avisos", () => {
  it("renderiza la ruta de inicio", () => {
    renderApp("/");
    expect(
      screen.getByRole("heading", { name: /Optimiza tu consumo/i }),
    ).toBeInTheDocument();
  });

  it("renderiza la ruta de ambiente inexistente", async () => {
    renderApp("/dashboard/ambientes/no-existe");
    expect(
      await screen.findByRole("heading", { name: /No existen datos/i }),
    ).toBeInTheDocument();
  });

  it("renderiza una página 404", () => {
    renderApp("/ruta-invalida");
    expect(
      screen.getByRole("heading", { name: /Esta página no existe/i }),
    ).toBeInTheDocument();
  });

  it("mantiene visible el aviso de datos simulados", () => {
    renderApp("/simulador");
    expect(
      screen.getByText(/No constituye una certificación oficial/i),
    ).toBeInTheDocument();
  });

  it("explica la instalación del prototipo", () => {
    renderApp("/instalacion");
    expect(
      screen.getByRole("heading", { name: /Instalación del Nodo de Sensores/i }),
    ).toBeInTheDocument();
  });
});

describe("recorrido principal", () => {
  it(
    "casa sin actividad → alerta → recomendación → menor consumo → ahorro de agua y energía",
    async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <AppProvider>
            <SimulatorPage />
          </AppProvider>
        </MemoryRouter>,
      );

      const scenario = screen.getByLabelText(/Escenario residencial demostrativo/i);
      await user.selectOptions(scenario, "empty-consumption");

      await user.click(
        screen.getByRole("button", { name: /Iniciar simulación/i }),
      );

      expect(scenario).toBeDisabled();

      await user.click(screen.getByRole("button", { name: "Pausar" }));
      expect(
        screen.getByRole("button", { name: /Simulación pausada/i }),
      ).toBeDisabled();

      await user.click(screen.getByRole("button", { name: "Reanudar" }));

      expect(
        await screen.findByRole(
          "heading",
          { name: /Posible fuga|Desperdicio/i },
          { timeout: 8000 },
        ),
      ).toBeInTheDocument();

      expect(screen.getByText("Actualiza cada 5 s")).toBeInTheDocument();

      await user.click(
        screen.getByRole("button", { name: /Aplicar recomendación/i }),
      );

      expect(screen.getByText(/Recomendación aplicada/i)).toBeInTheDocument();
      expect(screen.getByText(/Comparativa de Impacto: Antes vs Después/i)).toBeInTheDocument();
      expect(screen.getByText(/Ahorro económico total/i)).toBeInTheDocument();
    },
    15000,
  );
});
