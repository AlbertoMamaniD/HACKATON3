import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowLeft, ArrowRight, Box, Cable, CheckCircle2, ClipboardCheck, Gauge, House, Lightbulb, Pause, Play, RadioTower, RefreshCcw, Router, ShieldAlert, Thermometer, Wrench } from "lucide-react";

const steps = [
  { title: "Conocer el consumo del hogar", component: "Factura y hábitos familiares", description: "Identificar horarios, equipos de mayor uso y oportunidades sin abrir ni alterar el medidor de la empresa eléctrica.", result: "Perfil residencial definido", icon: House },
  { title: "Evaluar el tablero eléctrico", component: "Revisión profesional", description: "Un electricista capacitado determina si el tablero permite incorporar medición residencial de forma segura.", result: "Punto técnico evaluado", icon: ShieldAlert },
  { title: "Seleccionar medición para CA", component: "Medidor o pinza certificados", description: "Elegir un equipo diseñado para corriente alterna y compatible con la instalación de la vivienda.", result: "Tecnología adecuada seleccionada", icon: Gauge },
  { title: "Instalar el medidor residencial", component: "Tablero de distribución", description: "La instalación futura se realiza en el tablero por personal capacitado; no se interviene el medidor sellado de la compañía.", result: "Medición residencial representada", icon: Wrench },
  { title: "Ubicar sensores opcionales", component: "Sensores de baja tensión", description: "Definir zonas como sala, cocina o dormitorio para interpretar actividad y condiciones ambientales.", result: "Zonas del hogar seleccionadas", icon: Thermometer },
  { title: "Conectar datos al nodo", component: "Nodo EcoAhorro", description: "Los sensores de baja tensión y el adaptador del medidor enviarían lecturas al nodo; aquí todo se simula localmente.", result: "Flujo de datos trazado", icon: Cable },
  { title: "Proteger el equipo", component: "Caja técnica", description: "El nodo y sus conexiones de baja tensión se mantienen ordenados y fuera del alcance cotidiano.", result: "Nodo protegido", icon: Box },
  { title: "Vincular la red del hogar", component: "Wi-Fi doméstico", description: "El nodo podría enviar lecturas a una fuente de datos futura. En este MVP no existe conexión real ni nube.", result: "Enlace de red simulado", icon: Router },
  { title: "Registrar zonas y circuitos", component: "Ficha de vivienda", description: "Asociar las lecturas con cocina, iluminación, tomacorrientes u otras zonas comprensibles para la familia.", result: "Vivienda organizada", icon: ClipboardCheck },
  { title: "Verificar las lecturas", component: "Panel de comprobación", description: "Revisar unidades, origen del dato y respuesta ante desconexión antes de interpretar resultados.", result: "Lecturas simuladas válidas", icon: Lightbulb },
  { title: "Activar el modo demostración", component: "EcoAhorro Hogar", description: "Finalizar el recorrido mostrando consumo, posibles desperdicios y recomendaciones sin controlar equipos físicos.", result: "Monitoreo doméstico en modo demo", icon: CheckCircle2 },
];

function HomeDiagram({ step }: { step: number }) {
  const rooms = ["Sala", "Cocina", "Dormitorio", "Pasillo", "Lavandería"];
  const activeRoom = Math.min(Math.max(step - 4, 0), rooms.length - 1);
  return (
    <div className="relative min-h-[430px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Vista conceptual · Vivienda</span>
        <span className="rounded-full bg-tech-50 px-2 py-1 text-xs font-bold text-tech-700">Sin cableado real</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {rooms.map((room, index) => (
          <motion.div
            key={room}
            animate={{ borderColor: index === activeRoom ? "#16815f" : "#cbd5e1", backgroundColor: index === activeRoom ? "#effaf5" : "#ffffff" }}
            className={`relative min-h-20 rounded-xl border-2 p-3 ${room === "Pasillo" ? "sm:col-span-2" : ""}`}
          >
            <span className="text-xs font-bold text-slate-700">{room}</span>
            {step >= 4 && index === activeRoom && <motion.div initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute bottom-3 left-3 flex gap-2"><Thermometer className="h-5 w-5 text-amber-700"/><Lightbulb className="h-5 w-5 text-tech-700"/></motion.div>}
            {step >= 8 && index === activeRoom && <span className="absolute bottom-2 right-2 h-3 w-3 rounded-full bg-forest-500" />}
          </motion.div>
        ))}
      </div>

      <div className="mt-5 grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <div className="rounded-xl border border-slate-300 bg-white p-3 text-center">
          <Gauge className="mx-auto h-5 w-5 text-slate-600"/>
          <p className="mt-1 text-xs font-bold">Medidor de la compañía</p>
          <p className="text-[10px] font-semibold text-danger-700">Sellado · no intervenir</p>
        </div>
        <ArrowDown className="mx-auto h-4 w-4 text-slate-400 sm:-rotate-90" />
        <motion.div animate={{ scale: step >= 2 ? 1 : .96 }} className={`rounded-xl border p-3 text-center ${step >= 2 ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
          <Wrench className="mx-auto h-5 w-5 text-amber-700"/>
          <p className="mt-1 text-xs font-bold">Medidor CA certificado</p>
          <p className="text-[10px] text-slate-500">En tablero · profesional</p>
        </motion.div>
        <ArrowDown className="mx-auto h-4 w-4 text-tech-500 sm:-rotate-90" />
        <motion.div animate={{ scale: step >= 5 ? 1 : .96 }} className={`rounded-xl border p-3 text-center ${step >= 9 ? "border-forest-200 bg-forest-50" : "border-tech-200 bg-tech-50"}`}>
          <RadioTower className={`mx-auto h-6 w-6 ${step >= 9 ? "text-forest-600" : "text-tech-700"}`} />
          <p className="mt-1 text-xs font-bold">Nodo EcoAhorro</p>
          <p className="text-[10px] text-slate-500">{step >= 9 ? "Operativo · demo" : "Datos simulados"}</p>
        </motion.div>
      </div>

      {step >= 7 && <motion.div className="absolute bottom-3 right-5 flex gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{[0, 1, 2].map((value) => <motion.span key={value} className="h-2 w-2 rounded-full bg-tech-500" animate={{ x: [0, 12, 24], opacity: [0, 1, 0] }} transition={{ duration: 1, delay: value * .18, repeat: 2 }} />)}</motion.div>}
    </div>
  );
}

export function InstallationPage() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setStep((current) => {
      if (current >= steps.length - 1) { setPlaying(false); return current; }
      return current + 1;
    }), 1600);
    return () => window.clearInterval(timer);
  }, [playing]);
  const current = steps[step];
  const Icon = current.icon;

  return <div className="space-y-6">
    <header><p className="eyebrow">Recorrido residencial guiado</p><h1 className="page-title mt-2">¿Cómo llegaría EcoAhorro a una vivienda?</h1><p className="mt-3 max-w-3xl text-slate-600">Una explicación visual y segura del proceso. No incluye instrucciones de cableado ni interviene el medidor de la empresa eléctrica.</p></header>
    <section className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]"><div className="panel p-4 sm:p-5"><HomeDiagram step={step} /></div><div className="panel flex flex-col p-5"><div className="flex items-center justify-between"><span className="eyebrow">Paso {step + 1} de {steps.length}</span><span className="text-xs font-bold text-slate-500">{Math.round(((step + 1) / steps.length) * 100)}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><motion.div className="h-full rounded-full bg-forest-500" animate={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
      <AnimatePresence mode="wait"><motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="mt-8"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-forest-50 text-forest-700"><Icon /></span><h2 className="mt-4 text-2xl font-bold">{current.title}</h2><p className="mt-2 leading-7 text-slate-600">{current.description}</p><dl className="mt-6 space-y-3 rounded-xl bg-slate-50 p-4 text-sm"><div><dt className="font-bold text-slate-500">Componente o decisión</dt><dd className="mt-1 font-semibold">{current.component}</dd></div><div><dt className="font-bold text-slate-500">Resultado del paso</dt><dd className="mt-1 flex items-center gap-2 font-semibold text-forest-700"><CheckCircle2 className="h-4 w-4" />{current.result}</dd></div></dl></motion.div></AnimatePresence>
      <div className="mt-auto flex flex-wrap gap-2 pt-7"><button className="button-secondary" disabled={step === 0} onClick={() => setStep((value) => value - 1)}><ArrowLeft className="h-4 w-4" />Anterior</button><button className="button-primary" disabled={step === steps.length - 1} onClick={() => setStep((value) => value + 1)}>Siguiente<ArrowRight className="h-4 w-4" /></button><button className="button-secondary" onClick={() => setPlaying((value) => !value)}>{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{playing ? "Pausar" : "Reproducir"}</button><button aria-label="Reiniciar recorrido" className="button-secondary px-3" onClick={() => { setStep(0); setPlaying(false); }}><RefreshCcw className="h-4 w-4" /></button></div></div></section>

    <section className="grid gap-4 md:grid-cols-2"><article className="panel p-5"><p className="eyebrow">Maqueta de demostración</p><h2 className="mt-2 font-bold">INA219 solo en baja tensión</h2><p className="mt-2 text-sm leading-6 text-slate-600">El INA219 puede representarse únicamente en una maqueta de corriente continua de baja tensión. No se conecta a 220 V ni al medidor domiciliario.</p></article><article className="panel border-tech-100 bg-tech-50 p-5"><p className="eyebrow text-tech-700">Vivienda real</p><h2 className="mt-2 font-bold">Medición residencial adecuada</h2><p className="mt-2 text-sm leading-6 text-slate-600">Una implementación futura utilizaría un medidor para corriente alterna o una pinza de corriente certificados, seleccionados e instalados por personal capacitado.</p></article></section>
    <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0"/><p><strong>Seguridad:</strong> No abrir, perforar, puentear ni alterar el medidor sellado de la empresa eléctrica. Toda intervención en el tablero residencial debe ser realizada por un electricista capacitado. Esta vista no incluye instrucciones de cableado doméstico.</p></div>
  </div>;
}
