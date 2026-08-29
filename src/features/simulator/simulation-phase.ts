export type SimulationPhase = "ready" | "capturing" | "transmitting" | "analyzing" | "result" | "monitoring";

export const sequencePhases: SimulationPhase[] = ["capturing", "transmitting", "analyzing"];
export const runningPhases: SimulationPhase[] = [...sequencePhases, "monitoring"];

export const isRunningPhase = (phase: SimulationPhase) => runningPhases.includes(phase);
export const isSequencePhase = (phase: SimulationPhase) => sequencePhases.includes(phase);
