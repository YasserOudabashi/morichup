import { test } from "node:test";
import assert from "node:assert/strict";
import { classicBoard, coordFor, validateBoard } from "@morichup/shared";
import type { BoardConfig, Tile } from "@morichup/shared";

/** Board minima 8x8 valida, usata come base per i test che rompono un solo aspetto alla volta. */
function buildValidBoard(): BoardConfig {
  const width = 8;
  const height = 8;
  const count = 2 * width + 2 * height - 4;
  const tiles: Tile[] = Array.from({ length: count }, (_, i) => {
    const position = coordFor(i, width, height);
    if (i === 0) return { id: `t${i}`, type: "start" as const, name: "Go", position };
    if (i === width - 1) return { id: `t${i}`, type: "jail" as const, name: "Jail", position };
    if (i === width + height - 2) return { id: `t${i}`, type: "freeParking" as const, name: "Free Parking", position };
    if (i === 2 * width + height - 3) return { id: `t${i}`, type: "goToJail" as const, name: "Go To Jail", position };
    return {
      id: `t${i}`,
      type: "property" as const,
      name: `Property ${i}`,
      position,
      group: "grp",
      groupColor: "#ff0000",
      purchasePrice: 100,
      baseRent: 10,
    };
  });
  return {
    id: "test-custom",
    name: "Test Custom",
    version: "0.1.0",
    width,
    height,
    tiles,
    rules: {
      startingMoney: 1500,
      passingStartBonus: 200,
      minPlayers: 2,
      maxPlayers: 8,
      auctionOnDecline: false,
      turnTimerSeconds: "off" as const,
    },
  };
}

test("una mappa ufficiale (classic) è sempre valida", () => {
  const result = validateBoard(classicBoard);
  assert.deepEqual(result.errors, []);
  assert.equal(result.valid, true);
});

test("una board minimale generata dai helper di geometria è valida", () => {
  const result = validateBoard(buildValidBoard());
  assert.equal(result.valid, true);
});

test("dimensioni fuori dai limiti 8-15 vengono rifiutate", () => {
  const board = buildValidBoard();
  board.width = 7;
  const result = validateBoard(board);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("larghezza")));
});

test("un angolo del tipo sbagliato viene rifiutato", () => {
  const board = buildValidBoard();
  board.tiles[0] = { ...board.tiles[0], type: "property" };
  const result = validateBoard(board);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('indice 0')));
});

test("una casella di tipo angolo fuori posizione viene rifiutata", () => {
  const board = buildValidBoard();
  board.tiles[5] = { ...board.tiles[5], type: "jail" };
  const result = validateBoard(board);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("non è in una posizione d'angolo")));
});

test("posizioni duplicate vengono rifiutate", () => {
  const board = buildValidBoard();
  board.tiles[3] = { ...board.tiles[3], position: { ...board.tiles[4].position } };
  const result = validateBoard(board);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("Posizione duplicata")));
});

test("una proprietà senza prezzo o gruppo viene rifiutata", () => {
  const board = buildValidBoard();
  board.tiles[3] = { ...board.tiles[3], purchasePrice: undefined, group: undefined };
  const result = validateBoard(board);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("prezzo d'acquisto")));
  assert.ok(result.errors.some((e) => e.includes("gruppo")));
});

test("una tassa senza importo viene rifiutata", () => {
  const board = buildValidBoard();
  board.tiles[3] = { id: board.tiles[3].id, type: "incomeTax", name: "Tax", position: board.tiles[3].position };
  const result = validateBoard(board);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("importo positivo")));
});

test("un numero di caselle diverso dal perimetro atteso viene rifiutato", () => {
  const board = buildValidBoard();
  board.tiles.pop();
  const result = validateBoard(board);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("perimetro")));
});
