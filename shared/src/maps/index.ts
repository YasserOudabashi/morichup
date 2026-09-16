import type { BoardConfig } from "../index";
import { classicBoard } from "./classic";
import { extendedBoard } from "./extended";
import { fortuneBoard } from "./fortune";
import { quickBoard } from "./quick";

export { classicBoard } from "./classic";
export { extendedBoard } from "./extended";
export { fortuneBoard } from "./fortune";
export { quickBoard } from "./quick";
export { coordFor, perimeterCount, cornerIndices, cornerTypeAt, CORNER_TYPES_IN_ORDER } from "./geometry";
export { validateBoard, type ValidationResult } from "./validator";

/** Registro delle mappe disponibili (Fase 5, esteso in Fase 9 con le mappe personalizzate di una stanza). */
export const AVAILABLE_MAPS: BoardConfig[] = [classicBoard, extendedBoard, fortuneBoard, quickBoard];

export function getMapById(id: string): BoardConfig {
  const board = AVAILABLE_MAPS.find((m) => m.id === id);
  return board ?? classicBoard;
}
