import type {
  EcoAhorroConfig,
  EnvironmentStatus,
  RuleEvaluation,
  SimulationInput,
} from "./types";

export const evaluateAir = (
  value: number,
  config: EcoAhorroConfig,
): "normal" | "warning" | "alert" =>
  value >= config.airAlertPercent
    ? "alert"
    : value >= config.airWarningPercent
      ? "warning"
      : "normal";

export const evaluateWaterLeak = (
  waterFlowLpm: number,
  presenceDetected: boolean,
  minutesWithoutActivity: number,
  config: EcoAhorroConfig,
): boolean =>
  !presenceDetected &&
  waterFlowLpm >= config.waterLeakThresholdLpm &&
  minutesWithoutActivity >= 5;

const statusCopy: Record<
  EnvironmentStatus,
  Pick<RuleEvaluation, "title" | "explanation" | "recommendation">
> = {
  normal: {
    title: "Funcionamiento eficiente",
    explanation:
      "El consumo eléctrico, flujo de agua y calidad de aire se encuentran en rangos óptimos.",
    recommendation: "Mantener los hábitos sostenibles actuales.",
  },
  warning: {
    title: "Variación de gases detectable",
    explanation:
      "El sensor MQ-135 detectó una concentración moderada de gases respecto a la línea base.",
    recommendation: "Ventilar el ambiente y revisar artefactos a gas o combustión.",
  },
  "potential-waste": {
    title: "Desperdicio de recursos detectado",
    explanation:
      "Se detectó consumo eléctrico o iluminación continua en ausencia prolongada de personas.",
    recommendation:
      "Apagar equipos en modo reposo y luminarias en zonas desocupadas.",
  },
  "water-leak": {
    title: "Posible fuga o grifo abierto",
    explanation:
      "Existe un flujo constante de agua sin detección de presencia en la vivienda.",
    recommendation:
      "Cerrar grifos abiertos e inspeccionar posibles fugas en tuberías o sanitarios.",
  },
  "environmental-alert": {
    title: "Alerta crítica de gases (MQ-135)",
    explanation:
      "La concentración de gases y compuestos volátiles superó el umbral seguro.",
    recommendation:
      "Ventilar inmediatamente, evacuar la zona si es necesario e inspeccionar fuentes de emisión.",
  },
  offline: {
    title: "Nodo desconectado",
    explanation: "El nodo ESP32 no está transmitiendo telemetría.",
    recommendation: "Comprobar alimentación eléctrica y conexión WiFi del nodo.",
  },
  "sensor-error": {
    title: "Falla de sensor",
    explanation:
      "Se detectó una lectura inconsistente en los sensores de energía o caudal.",
    recommendation: "Revisar cableado y estado físico de los sensores.",
  },
  "no-data": {
    title: "Sin datos",
    explanation: "No hay lecturas registradas para procesar.",
    recommendation: "Comprobar la conexión del sistema.",
  },
};

export const evaluateSimulation = (
  input: SimulationInput,
  config: EcoAhorroConfig,
): RuleEvaluation => {
  const potentialWaste =
    !input.presenceDetected &&
    input.powerWatts > config.minimumPowerWatts &&
    input.minutesWithoutActivity >= config.toleranceMinutes;

  const waterWaste = evaluateWaterLeak(
    input.waterFlowLpm,
    input.presenceDetected,
    input.minutesWithoutActivity,
    config,
  );

  const unnecessaryLighting =
    !input.presenceDetected &&
    input.lightOn &&
    input.minutesWithoutActivity >= config.toleranceMinutes;

  const airLevel = evaluateAir(input.airChangePercent, config);

  let status: EnvironmentStatus = "normal";

  if (!input.nodeOnline) {
    status = "offline";
  } else if (input.sensorError) {
    status = "sensor-error";
  } else if (airLevel === "alert") {
    status = "environmental-alert";
  } else if (waterWaste) {
    status = "water-leak";
  } else if (potentialWaste || unnecessaryLighting) {
    status = "potential-waste";
  } else if (airLevel === "warning") {
    status = "warning";
  }

  return {
    status,
    potentialWaste,
    waterWaste,
    unnecessaryLighting,
    airLevel,
    ...statusCopy[status],
  };
};

export const applyRecommendation = (
  input: SimulationInput,
  evaluation: RuleEvaluation,
): SimulationInput => {
  let next = { ...input };

  // 1. Desperdicio eléctrico o iluminación
  if (evaluation.potentialWaste || evaluation.unnecessaryLighting) {
    next.powerWatts = Math.min(next.powerWatts, 12);
    next.lightOn = false;
    next.lightRaw = 750;
  }

  // 2. Fuga o desperdicio de agua
  if (evaluation.waterWaste) {
    next.waterFlowLpm = 0;
  }

  // 3. Gases / Calidad de aire
  if (evaluation.airLevel !== "normal") {
    next.airChangePercent = 2.5;
  }

  if (evaluation.status === "offline") {
    next.nodeOnline = true;
  }

  if (evaluation.status === "sensor-error") {
    next.sensorError = false;
  }

  return next;
};
