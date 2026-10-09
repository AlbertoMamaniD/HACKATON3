import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { LightingPanel } from "../components/LightingPanel";
import type { LecturaEcoAhorro } from "../hooks/useLiveReadings";

const lectura: LecturaEcoAhorro = {
  id: 2802,
  created_at: "2026-08-29T22:42:24.773973+00:00",
  calidad_aire: 0,
  estado_aire: "BUENO",
  luz: 368,
  luz_pct: 84.5,
  estado_luz: "ILUMINADO",
  segundos_luz_continua: 1104,
  alerta_aire: false,
  alerta_luz: true,
  bloque: "Mi Casa",
};

const state = { online: false };

vi.mock("../hooks/useLiveReadings", () => ({
  useLiveReadings: () => ({
    rows: [lectura],
    todayRows: [],
    latest: lectura,
    online: state.online,
    loading: false,
    error: null,
    refresh: async () => undefined,
  }),
}));

describe("panel de luces encendidas", () => {
  it("no presenta una lectura antigua como actual cuando el ESP32 está sin conexión", () => {
    state.online = false;
    render(<LightingPanel />);

    expect(screen.getByText(/Sin lecturas recientes del ESP32/i)).toBeInTheDocument();
    expect(screen.getByText("Última lectura")).toBeInTheDocument();
    expect(screen.queryByText(/luces prendidas por mucho tiempo/i)).toBeNull();
    expect(screen.queryByText("18m 24s")).toBeNull();
    expect(screen.getByText(/Supuesto: 60 W/i)).toBeInTheDocument();
  });

  it("muestra el estado y el aviso cuando el ESP32 está en línea", () => {
    state.online = true;
    render(<LightingPanel />);

    expect(screen.getByText("Luces ahora")).toBeInTheDocument();
    expect(screen.getByText("Prendidas")).toBeInTheDocument();
    expect(screen.getByText("18m 24s")).toBeInTheDocument();
    expect(screen.getByText(/luces prendidas por mucho tiempo/i)).toBeInTheDocument();
    expect(screen.queryByText(/Sin lecturas recientes/i)).toBeNull();
  });
});
