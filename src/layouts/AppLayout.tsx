import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, ChevronRight, Gauge, House, Leaf, Menu, Radio, Settings, SlidersHorizontal, Wrench, X, FileText } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useApp } from "../app/AppProvider";
import { DemoNotice } from "../components/DemoNotice";

const navigation = [
  { to: "/", label: "Inicio", icon: House },
  { to: "/instalacion", label: "Instalación", icon: Wrench },
  { to: "/simulador", label: "Simulador", icon: SlidersHorizontal },
  { to: "/dashboard", label: "Dashboard", icon: Gauge },
  { to: "/alertas", label: "Alertas", icon: Bell },
  { to: "/reportes", label: "Reportes", icon: FileText },
  { to: "/configuracion", label: "Configuración", icon: Settings },
];

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const { alerts } = useApp();
  const openAlerts = alerts.filter((alert) => alert.status !== "closed").length;
  return <>
    <NavLink to="/" onClick={onNavigate} className="mb-8 flex items-center gap-3 px-2 text-white">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15"><Leaf aria-hidden="true" /></span>
      <span><span className="block text-lg font-bold">EcoAhorro</span><span className="block text-xs text-emerald-100">IoT · MVP visual</span></span>
    </NavLink>
    <nav aria-label="Navegación principal" className="space-y-1">
      {navigation.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === "/"} onClick={onNavigate} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${isActive ? "bg-white text-forest-700 shadow" : "text-emerald-50 hover:bg-white/10"}`}>
        <Icon aria-hidden="true" className="h-5 w-5" />{label}
        {label === "Alertas" && openAlerts > 0 && <span className="ml-auto rounded-full bg-danger-500 px-2 py-0.5 text-[11px] font-bold text-white" aria-label={`${openAlerts} alertas activas`}>{openAlerts}</span>}
      </NavLink>)}
    </nav>
    <div className="mt-auto rounded-2xl bg-white/10 p-4 text-sm text-emerald-50"><p className="font-bold">Hogar Eco Tarija</p><p className="mt-1 text-xs leading-5 text-emerald-100">Vivienda demostrativa · Tarija, Bolivia</p></div>
  </>;
}

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const current = navigation.find((item) => item.to !== "/" && location.pathname.startsWith(item.to)) ?? navigation[0];
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] flex-col bg-forest-900 p-5 lg:flex"><NavContent /></aside>
      <AnimatePresence>{menuOpen && <>
        <motion.button aria-label="Cerrar menú" className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenuOpen(false)} />
        <motion.aside className="fixed inset-y-0 left-0 z-50 flex w-[290px] flex-col bg-forest-900 p-5 lg:hidden" initial={{ x: -310 }} animate={{ x: 0 }} exit={{ x: -310 }} transition={{ type: "spring", damping: 26, stiffness: 260 }}>
          <button className="absolute right-4 top-4 rounded-lg p-2 text-white hover:bg-white/10" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)}><X /></button><NavContent onNavigate={() => setMenuOpen(false)} />
        </motion.aside>
      </>}</AnimatePresence>
      <div className="min-w-0 lg:col-start-2">
        <header className="no-print sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-[72px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button aria-label="Abrir menú" className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden" onClick={() => setMenuOpen(true)}><Menu /></button>
            <div className="min-w-0"><div className="flex items-center gap-1 text-xs font-semibold text-slate-500"><House className="h-3.5 w-3.5" /> Hogar Eco Tarija <ChevronRight className="h-3 w-3" /></div><p className="truncate text-sm font-bold text-ink">{current.label}</p></div>
            <div className="ml-auto hidden sm:block"><DemoNotice compact /></div>
            <div className="hidden items-center gap-2 text-xs text-slate-500 xl:flex"><Radio className="h-4 w-4 text-forest-500" /><span><strong className="text-forest-700">Hogar simulado operativo</strong><br />Actualizado 20:30</span></div>
          </div>
          <div className="px-4 pb-3 sm:hidden"><DemoNotice compact /></div>
        </header>
        <main id="contenido" className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
