import type { BoardConfig } from "../index";
import { classicBoard } from "./classic";
import { extendedBoard } from "./extended";
import { fortuneBoard } from "./fortune";
import { quickBoard } from "./quick";

export { classicBoard } from "./classic";
export { extendedBoard } from "./extended";
export { fortuneBoard } from "./fortune";
export { quickBoard } from "./quick";

/** Registro delle mappe disponibili (Fase 5): niente editor ancora, solo selezione in lobby. */
export const AVAILABLE_MAPS: BoardConfig[] = [classicBoard, extendedBoard, fortuneBoard, quickBoard];

export function getMapById(id: string): BoardConfig {
  const board = AVAILABLE_MAPS.find((m) => m.id === id);
  return board ?? classicBoard;
}
