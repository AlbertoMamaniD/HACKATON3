import { useEffect, useRef, useState } from "react";
import {
  Bell,
  BellOff,
  BellRing,
  Volume2,
} from "lucide-react";

import { useLiveReadings } from "../hooks/useLiveReadings";

const STORAGE_KEY = "ecoahorro-notificaciones-habilitadas";

type AlertFlags = {
  temperatura: boolean;
  humedad: boolean;
  aire: boolean;
  luz: boolean;
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

function showBrowserNotification(
  title: string,
  body: string,
  tag: string,
) {
  if (
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return;
  }

  new Notification(title, {
    body,
    tag,
  });
}

function getFlags(
  latest: ReturnType<typeof useLiveReadings>["latest"],
): AlertFlags {
  return {
    temperatura: Boolean(latest?.alerta_temp),
    humedad: Boolean(latest?.alerta_humedad),
    aire: Boolean(latest?.alerta_aire),
    luz: Boolean(latest?.alerta_luz),
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

  // Escuchar cualquier interacción de usuario en la ventana para desbloquear AudioContext si fue persistido
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

    // El clic del usuario permite desbloquear y probar audio en el navegador.
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

    // Primera lectura: guardar estado sin disparar alertas viejas.
    if (previousFlags.current === null) {
      previousFlags.current = currentFlags;
      lastReadingId.current = latest.id;
      return;
    }

    // Una fila de Supabase solo se procesa una vez.
    if (lastReadingId.current === latest.id) {
      return;
    }

    const previous = previousFlags.current;

    if (enabled) {
      if (
        currentFlags.temperatura &&
        !previous.temperatura
      ) {
        playBeep();

        showBrowserNotification(
          "EcoAhorro · Temperatura elevada",
          `Temperatura actual: ${
            latest.temperatura?.toFixed(1) ?? "—"
          } °C. Revisa ventilación o climatización.`,
          "ecoahorro-temperatura",
        );
      }

      if (
        currentFlags.humedad &&
        !previous.humedad
      ) {
        playBeep();

        showBrowserNotification(
          "EcoAhorro · Humedad elevada",
          `Humedad actual: ${
            latest.humedad?.toFixed(1) ?? "—"
          } %. Revisa las condiciones del ambiente.`,
          "ecoahorro-humedad",
        );
      }

      if (
        currentFlags.aire &&
        !previous.aire
      ) {
        playBeep();

        showBrowserNotification(
          "EcoAhorro · Cambio en calidad del aire",
          `Variación MQ-135: ${
            latest.calidad_aire?.toFixed(1) ?? "—"
          } %. Revisa ventilación y posibles fuentes.`,
          "ecoahorro-aire",
        );
      }

      if (
        currentFlags.luz &&
        !previous.luz
      ) {
        playBeep();

        showBrowserNotification(
          "EcoAhorro · Iluminación prolongada",
          `La iluminación lleva ${
            latest.segundos_luz_continua ?? 0
          } s activa. Revisa si continúa siendo necesaria.`,
          "ecoahorro-luz",
        );
      }
    }

    previousFlags.current = currentFlags;
    lastReadingId.current = latest.id;
  }, [latest, enabled]);

  if (!enabled) {
    return (
      <button
        type="button"
        onClick={activarNotificaciones}
        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-forest-200 bg-forest-50 px-3 py-2 text-xs font-bold text-forest-700 transition hover:bg-forest-100"
        title="Activar sonido y notificaciones"
      >
        <Bell className="h-4 w-4" />
        Activar alertas
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className="hidden items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 xl:flex"
        title={
          permission === "granted"
            ? "Sonido y notificaciones del navegador activadas"
            : "Sonido activado. El navegador no tiene permiso de notificaciones."
        }
      >
        {permission === "granted" ? (
          <BellRing className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}

        {permission === "granted"
          ? "Alertas activadas"
          : "Sonido activado"}
      </div>

      <button
        type="button"
        onClick={desactivarNotificaciones}
        className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
        title="Desactivar alertas en este dispositivo"
        aria-label="Desactivar alertas"
      >
        <BellOff className="h-4 w-4" />
      </button>
    </div>
  );
}
