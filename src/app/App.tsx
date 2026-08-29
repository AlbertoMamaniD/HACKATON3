import { Route, Routes } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { AlertsPage } from "../pages/AlertsPage";
import { DashboardPage } from "../pages/DashboardPage";
import { EnvironmentDetailPage } from "../pages/EnvironmentDetailPage";
import { HomePage } from "../pages/HomePage";
import { InstallationPage } from "../pages/InstallationPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { ReportsPage } from "../pages/ReportsPage";
import { SettingsPage } from "../pages/SettingsPage";
import { SimulatorPage } from "../pages/SimulatorPage";

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="instalacion" element={<InstallationPage />} />
        <Route path="simulador" element={<SimulatorPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="dashboard/ambientes/:environmentId" element={<EnvironmentDetailPage />} />
        <Route path="alertas" element={<AlertsPage />} />
        <Route path="reportes" element={<ReportsPage />} />
        <Route path="configuracion" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
