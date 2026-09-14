import { test } from "node:test";
import assert from "node:assert/strict";
import { movePosition } from "../Board";
import { buildTestBoard } from "./testUtils";

const board = buildTestBoard(); // 12 caselle

test("movimento in avanti senza giro del percorso", () => {
  const result = movePosition(board, 0, 5);
  assert.equal(result.to, 5);
  assert.equal(result.passedGo, false);
});

test("il giro del percorso fa scattare passedGo", () => {
  const result = movePosition(board, 10, 4);
  assert.equal(result.to, (10 + 4) % 12);
  assert.equal(result.passedGo, true);
});

test("atterrare esattamente su Go conta come passedGo", () => {
  const result = movePosition(board, 6, 6);
  assert.equal(result.to, 0);
  assert.equal(result.passedGo, true);
});
