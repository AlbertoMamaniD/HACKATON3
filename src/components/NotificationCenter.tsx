import { useEffect, useRef, useState } from "react";
import { Bell, BellOff, BellRing, Volume2 } from "lucide-react";

import { useLiveReadings } from "../hooks/useLiveReadings";

const STORAGE_KEY = "ecoahorro-notificaciones-habilitadas";

type AlertFlags = {
  agua: boolean;
  luz: boolean;
  energia: boolean;
};

// Singleton para mantener un único AudioContext gestionado
let globalAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (!globalAudioContext) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (AudioContextClass) {
      globalAudioContext = new AudioContextClass();
    }
  }

  return globalAudioContext;
}

function unlockAudioContext(): void {
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch((err) => {
      console.warn("No se pudo desbloquear el AudioContext:", err);
    });
  }
}

function getInitialEnabled() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(STORAGE_KEY) === "true";
}

function playBeep() {
  try {
    const context = getAudioContext();
    if (!context) return;

    if (context.state === "suspended") {
      context.resume().catch(() => {});
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 880;

    const now = context.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.15, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();
    oscillator.stop(now + 0.3);
  } catch (error) {
    console.warn("No se pudo reproducir el sonido de alerta:", error);
  }
}

async function showBrowserNotification(
  title: string,
  body: string,
  tag: string,
) {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return;
  }

  try {
    // 1. En navegadores móviles (Chrome Android / PWA), Notification constructor directo está bloqueado
    // y se debe usar ServiceWorkerRegistration.showNotification()
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && "showNotification" in registration) {
          await registration.showNotification(title, {
            body,
            tag,
            icon: "/favicon.ico",
          });
          return;
        }
      } catch {
        /* Fallback a constructor directo si service worker no está disponible */
      }
    }

    // 2. Fallback estándar para navegadores de escritorio
    new Notification(title, {
      body,
      tag,
    });
  } catch (error) {
    // Capturar de forma segura en caso de que el navegador móvil prohíba el constructor
    console.warn("Notificación de navegador móvil no disponible vía constructor directo:", error);
  }
}

function getFlags(
  latest: ReturnType<typeof useLiveReadings>["latest"],
): AlertFlags {
  return {
    agua: Boolean(latest?.alerta_agua || (latest?.flujo_agua_lpm && latest.flujo_agua_lpm > 0.5)),
    luz: Boolean(latest?.alerta_luz),
    energia: Boolean(latest?.potencia_w && latest.potencia_w > 250),
  };
}

export function NotificationCenter() {
  const { latest } = useLiveReadings();

  const [enabled, setEnabled] = useState(getInitialEnabled);

  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported"
  >(() => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window)
    ) {
      return "unsupported";
    }

    return Notification.permission;
  });

  const previousFlags = useRef<AlertFlags | null>(null);
  const lastReadingId = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleUserInteraction = () => {
      unlockAudioContext();
    };

    window.addEventListener("click", handleUserInteraction, { once: true });
    window.addEventListener("keydown", handleUserInteraction, { once: true });
    window.addEventListener("touchstart", handleUserInteraction, { once: true });

    return () => {
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
      window.removeEventListener("touchstart", handleUserInteraction);
    };
  }, [enabled]);

  async function activarNotificaciones() {
    unlockAudioContext();

    let nextPermission:
      | NotificationPermission
      | "unsupported" = "unsupported";

    if ("Notification" in window) {
      nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);
    }

    window.localStorage.setItem(STORAGE_KEY, "true");
    setEnabled(true);

    playBeep();
  }

  function desactivarNotificaciones() {
    window.localStorage.setItem(STORAGE_KEY, "false");
    setEnabled(false);
  }

  useEffect(() => {
    if (!latest) {
      return;
    }

    const currentFlags = getFlags(latest);

    if (previousFlags.current === null) {
      previousFlags.current = currentFlags;
      lastReadingId.current = latest.id;
      return;
    }

    if (lastReadingId.current === latest.id) {
      return;
    }

    const previous = previousFlags.current;

    if (enabled) {
      if (currentFlags.agua && !previous.agua) {
        playBeep();
        showBrowserNotification(
          "EcoAhorro · Posible fuga de agua",
          `Caudal detectado: ${latest.flujo_agua_lpm?.toFixed(1) ?? "—"} L/min (dato simulado). Revisa grifos y sanitarios.`,
          "ecoahorro-agua",
        );
      }

      if (currentFlags.luz && !previous.luz) {
        playBeep();
        showBrowserNotification(
          "EcoAhorro · Luces encendidas",
          `Las luces llevan ${latest.segundos_luz_continua ?? 0} s encendidas. Apágalas si nadie las usa.`,
          "ecoahorro-luz",
        );
      }

      if (currentFlags.energia && !previous.energia) {
        playBeep();
        showBrowserNotification(
          "EcoAhorro · Consumo eléctrico alto",
          `Potencia instantánea: ${latest.potencia_w?.toFixed(0)} W (dato simulado). Revisa artefactos encendidos.`,
          "ecoahorro-energia",
        );
      }
    }

    previousFlags.current = currentFlags;
    lastReadingId.current = latest.id;
  }, [enabled, latest]);

  return (
    <div className="flex items-center gap-2">
      {enabled ? (
        <button
          onClick={desactivarNotificaciones}
          className="button-secondary text-xs flex items-center gap-1.5 text-forest-700 bg-forest-50 border-forest-200"
          title="Notificaciones de alerta activadas con sonido"
        >
          <BellRing className="h-3.5 w-3.5 animate-bounce" />
          <Volume2 className="h-3.5 w-3.5" />
          <span>Alertas activas</span>
        </button>
      ) : (
        <button
          onClick={activarNotificaciones}
          className="button-secondary text-xs flex items-center gap-1.5 text-slate-500"
          title="Activar notificaciones sonoras y en navegador para alertas"
        >
          <BellOff className="h-3.5 w-3.5" />
          <span>Activar avisos</span>
        </button>
      )}
    </div>
  );
}
