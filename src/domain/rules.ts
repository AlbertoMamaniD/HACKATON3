import type { EcoAhorroConfig, EnvironmentStatus, RuleEvaluation, SimulationInput } from "./types";

export const evaluateTemperature = (value: number, wasAlert: boolean, config: EcoAhorroConfig) =>
  wasAlert ? value >= config.temperatureNormalCelsius : value >= config.temperatureAlertCelsius;

export const evaluateHumidity = (value: number, wasAlert: boolean, config: EcoAhorroConfig) =>
  wasAlert ? value >= config.humidityNormalPercent : value >= config.humidityAlertPercent;

export const evaluateAir = (value: number, config: EcoAhorroConfig): "normal" | "warning" | "alert" =>
  value >= config.airAlertPercent ? "alert" : value >= config.airWarningPercent ? "warning" : "normal";

const statusCopy: Record<EnvironmentStatus, Pick<RuleEvaluation, "title" | "explanation" | "recommendation">> = {
  normal: { title: "Funcionamiento normal", explanation: "Las condiciones están dentro de los umbrales configurados.", recommendation: "Mantener el monitoreo y los hábitos actuales." },
  warning: { title: "Condición para revisar", explanation: "Se observó un cambio que merece seguimiento.", recommendation: "Revisar el ambiente y favorecer ventilación si corresponde." },
  "potential-waste": { title: "Posible desperdicio", explanation: "No se detectó actividad mientras el ambiente mantiene consumo.", recommendation: "Apagar la iluminación y los equipos que no sean necesarios." },
  "environmental-alert": { title: "Alerta ambiental", explanation: "Una condición ambiental superó el umbral configurado.", recommendation: "Revisar ventilación y confort; contrastar con un instrumento profesional." },
  offline: { title: "Nodo desconectado", explanation: "El nodo simulado no está transmitiendo datos.", recommendation: "Comprobar alimentación y conectividad del nodo." },
  "sensor-error": { title: "Sensor con error", explanation: "La lectura simulada presenta una inconsistencia.", recommendation: "Revisar el sensor y no tomar decisiones con esta lectura." },
  "no-data": { title: "Sin datos", explanation: "No hay lecturas disponibles para evaluar.", recommendation: "Verificar la fuente de datos e intentar nuevamente." },
};

export const evaluateSimulation = (input: SimulationInput, config: EcoAhorroConfig, previous?: RuleEvaluation): RuleEvaluation => {
  const potentialWaste = !input.presenceDetected && input.powerWatts > config.minimumPowerWatts && input.minutesWithoutActivity >= config.toleranceMinutes;
  const unnecessaryLighting = !input.presenceDetected && input.lightOn && input.minutesWithoutActivity >= config.toleranceMinutes;
  const temperatureAlert = evaluateTemperature(input.temperatureCelsius, previous?.temperatureAlert ?? false, config);
  const humidityAlert = evaluateHumidity(input.humidityPercent, previous?.humidityAlert ?? false, config);
  const airLevel = evaluateAir(input.airChangePercent, config);

  let status: EnvironmentStatus = "normal";
  if (!input.nodeOnline) status = "offline";
  else if (input.sensorError) status = "sensor-error";
  else if (potentialWaste || unnecessaryLighting) status = "potential-waste";
  else if (temperatureAlert || humidityAlert || airLevel === "alert") status = "environmental-alert";
  else if (airLevel === "warning") status = "warning";

  return { status, potentialWaste, unnecessaryLighting, temperatureAlert, humidityAlert, airLevel, ...statusCopy[status] };
};

export const applyRecommendation = (input: SimulationInput, evaluation: RuleEvaluation): SimulationInput => {
  if (evaluation.status === "potential-waste") return { ...input, lightOn: false, powerWatts: 8 };
  if (evaluation.status === "environmental-alert" || evaluation.status === "warning") return { ...input, temperatureCelsius: 27.5, humidityPercent: 62, airChangePercent: 5 };
  if (evaluation.status === "offline") return { ...input, nodeOnline: true };
  if (evaluation.status === "sensor-error") return { ...input, sensorError: false };
  return input;
};
