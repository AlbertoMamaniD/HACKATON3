import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { App } from "../app/App";
import { AppProvider } from "../app/AppProvider";
import { SimulatorPage } from "../pages/SimulatorPage";

const renderApp = (path: string) => render(<MemoryRouter initialEntries={[path]}><AppProvider><App /></AppProvider></MemoryRouter>);

describe("rutas y avisos", () => {
  it("renderiza la ruta de inicio", () => { renderApp("/"); expect(screen.getByRole("heading", { name: /Convertimos el desperdicio/i })).toBeInTheDocument(); });
  it("renderiza la ruta de ambiente inexistente", async () => { renderApp("/dashboard/ambientes/no-existe"); expect(await screen.findByRole("heading", { name: /No existen datos/i })).toBeInTheDocument(); });
  it("renderiza una página 404", () => { renderApp("/ruta-invalida"); expect(screen.getByRole("heading", { name: /Esta página no existe/i })).toBeInTheDocument(); });
  it("mantiene visible el aviso de datos simulados", () => { renderApp("/simulador"); expect(screen.getAllByText(/Modo demostración:/i).length).toBeGreaterThan(0); });
  it("muestra el aviso de no certificación en el simulador", () => { renderApp("/simulador"); expect(screen.getByText(/No constituye una certificación oficial/i)).toBeInTheDocument(); });
});

describe("recorrido principal", () => {
  it("aula vacía → alerta → recomendación → menor consumo → ahorro potencial", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AppProvider><SimulatorPage /></AppProvider></MemoryRouter>);
    const scenario = screen.getByLabelText(/Escenario demostrativo/i);
    await user.selectOptions(scenario, "empty-consumption");
    await user.click(screen.getByRole("button", { name: /Iniciar simulación/i }));
    expect(await screen.findByRole("heading", { name: "Posible desperdicio" }, { timeout: 1500 })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Aplicar recomendación/i }));
    expect(screen.getByText("Recomendación aplicada")).toBeInTheDocument();
    expect(screen.getAllByText("8 W").length).toBeGreaterThan(0);
    await waitFor(() => expect(screen.getByText("Ahorro potencial")).toBeInTheDocument());
  });
});
