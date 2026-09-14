import { test } from "node:test";
import assert from "node:assert/strict";
import { computeRent, ownsFullGroup } from "../Tile";
import { buildTestBoard } from "./testUtils";

function tileById(board: ReturnType<typeof buildTestBoard>, id: string) {
  const tile = board.tiles.find((t) => t.id === id);
  if (!tile) throw new Error(`tile ${id} non trovata`);
  return tile;
}

test("rent base senza monopolio", () => {
  const board = buildTestBoard();
  const t7 = tileById(board, "t7"); // gruppo grp2, solo B1 posseduta
  t7.ownerId = "p0";
  assert.equal(computeRent(board, t7, 7), 15);
});

test("rent raddoppiato con monopolio (gruppo completo, 0 case)", () => {
  const board = buildTestBoard();
  const t7 = tileById(board, "t7");
  const t10 = tileById(board, "t10");
  t7.ownerId = "p0";
  t10.ownerId = "p0";
  assert.equal(ownsFullGroup(board, "p0", "grp2"), true);
  assert.equal(computeRent(board, t7, 7), 30);
});

test("ownsFullGroup è false se manca anche una sola proprietà del gruppo", () => {
  const board = buildTestBoard();
  tileById(board, "t7").ownerId = "p0";
  assert.equal(ownsFullGroup(board, "p0", "grp2"), false);
});

test("rent railroad raddoppia per ogni stazione aggiuntiva posseduta", () => {
  const board = buildTestBoard();
  const railroad = tileById(board, "t3");
  railroad.ownerId = "p0";
  assert.equal(computeRent(board, railroad, 7), 25); // 1 sola stazione sulla test board
});

test("rent utility dipende dalla somma dei dadi", () => {
  const board = buildTestBoard();
  const utility = tileById(board, "t8");
  utility.ownerId = "p0";
  assert.equal(computeRent(board, utility, 7), 28); // 1 utility posseduta -> x4
});
