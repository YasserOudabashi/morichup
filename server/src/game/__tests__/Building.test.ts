import { test } from "node:test";
import assert from "node:assert/strict";
import { GameEngine } from "../GameEngine";
import { computeRent } from "../Tile";
import { buildTestBoard, buildTestPlayers, ScriptedDice } from "./testUtils";

function tileById(board: ReturnType<typeof buildTestBoard>, id: string) {
  const tile = board.tiles.find((t) => t.id === id);
  if (!tile) throw new Error(`tile ${id} non trovata`);
  return tile;
}

function ownFullGroup(board: ReturnType<typeof buildTestBoard>, playerId: string) {
  tileById(board, "t1").ownerId = playerId;
  tileById(board, "t2").ownerId = playerId;
}

test("non si può costruire senza possedere l'intero gruppo colore", () => {
  const board = buildTestBoard();
  const players = buildTestPlayers(2);
  tileById(board, "t1").ownerId = "p0"; // solo t1, non t2
  players[0].properties = ["t1"];
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([]) });

  assert.throws(() => engine.applyIntent("p0", { type: "BUILD_HOUSE", tileId: "t1" }), /intero gruppo/);
});

test("costruire una casa: scala il denaro e alza il livello", () => {
  const board = buildTestBoard();
  const players = buildTestPlayers(2);
  ownFullGroup(board, "p0");
  players[0].properties = ["t1", "t2"];
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([]) });

  const events = engine.applyIntent("p0", { type: "BUILD_HOUSE", tileId: "t1" });
  assert.ok(events.some((e) => e.type === "HOUSE_BUILT" && e.tileId === "t1" && e.houses === 1));
  assert.equal(tileById(board, "t1").houses, 1);
  assert.equal(engine.getState().players[0].money, 1500 - 50); // houseCost = 50
});

test("regola even: non si può costruire una seconda casa finché l'altra proprietà del gruppo è indietro", () => {
  const board = buildTestBoard();
  const players = buildTestPlayers(2);
  ownFullGroup(board, "p0");
  players[0].properties = ["t1", "t2"];
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([]) });

  engine.applyIntent("p0", { type: "BUILD_HOUSE", tileId: "t1" }); // t1 -> 1 casa
  assert.throws(
    () => engine.applyIntent("p0", { type: "BUILD_HOUSE", tileId: "t1" }), // di nuovo t1, t2 è ancora a 0
    /non bilanciata/
  );

  // Su t2 invece va bene: era indietro.
  const events = engine.applyIntent("p0", { type: "BUILD_HOUSE", tileId: "t2" });
  assert.ok(events.some((e) => e.type === "HOUSE_BUILT" && e.tileId === "t2" && e.houses === 1));
});

test("costruire l'hotel richiede 4 case su tutte le proprietà del gruppo, poi consuma le case", () => {
  const board = buildTestBoard();
  const players = buildTestPlayers(2, 5000); // molti soldi: 2 propr. x 4 case x 50 = 400, +2 hotel x 50
  ownFullGroup(board, "p0");
  players[0].properties = ["t1", "t2"];
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([]) });

  // Porta entrambe a 4 case, alternando per rispettare la regola even.
  for (let i = 0; i < 4; i++) {
    engine.applyIntent("p0", { type: "BUILD_HOUSE", tileId: "t1" });
    engine.applyIntent("p0", { type: "BUILD_HOUSE", tileId: "t2" });
  }
  assert.equal(tileById(board, "t1").houses, 4);
  assert.equal(tileById(board, "t2").houses, 4);

  // L'hotel su t1 richiede che anche t2 sia già a 4 (lo è).
  const events = engine.applyIntent("p0", { type: "BUILD_HOUSE", tileId: "t1" });
  assert.ok(events.some((e) => e.type === "HOTEL_BUILT" && e.tileId === "t1"));
  assert.equal(tileById(board, "t1").hotel, true);
  assert.equal(tileById(board, "t1").houses, 0);

  assert.throws(() => engine.applyIntent("p0", { type: "BUILD_HOUSE", tileId: "t1" }), /già un hotel/);
});

test("vendere una casa rimborsa metà del costo e rispetta la regola even al contrario", () => {
  const board = buildTestBoard();
  const players = buildTestPlayers(2);
  ownFullGroup(board, "p0");
  players[0].properties = ["t1", "t2"];
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([]) });

  engine.applyIntent("p0", { type: "BUILD_HOUSE", tileId: "t1" });
  engine.applyIntent("p0", { type: "BUILD_HOUSE", tileId: "t2" });
  engine.applyIntent("p0", { type: "BUILD_HOUSE", tileId: "t1" }); // t1=2, t2=1

  // Non posso vendere da t2 (1 casa) finché t1 (2 case) non scende: vendita non bilanciata al contrario
  // in realtà t2 ha MENO case, quindi vendere da t2 è vietato: bisogna vendere dalla più costruita (t1).
  assert.throws(() => engine.applyIntent("p0", { type: "SELL_HOUSE", tileId: "t2" }), /non bilanciata/);

  const moneyBefore = engine.getState().players[0].money;
  const events = engine.applyIntent("p0", { type: "SELL_HOUSE", tileId: "t1" });
  assert.ok(events.some((e) => e.type === "HOUSE_SOLD" && e.tileId === "t1" && e.amount === 25));
  assert.equal(tileById(board, "t1").houses, 1);
  assert.equal(engine.getState().players[0].money, moneyBefore + 25);
});

test("BUILD_HOUSE è vietato fuori dal proprio turno, anche possedendo il gruppo", () => {
  const board = buildTestBoard();
  const players = buildTestPlayers(2);
  ownFullGroup(board, "p1");
  players[1].properties = ["t1", "t2"];
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([]) });

  assert.throws(() => engine.applyIntent("p1", { type: "BUILD_HOUSE", tileId: "t1" }), /turno/);
});

test("SELL_HOUSE fuori turno senza debiti è vietato; con un debito pendente è permesso", () => {
  const board = buildTestBoard();
  const players = buildTestPlayers(2);
  ownFullGroup(board, "p1");
  players[1].properties = ["t1", "t2"];
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([]) });
  // p1 costruisce sul proprio "turno virtuale": forziamo il turno per costruire, poi lo rimettiamo a p0.
  engine.getState().currentTurnPlayerId = "p1";
  engine.applyIntent("p1", { type: "BUILD_HOUSE", tileId: "t1" });
  engine.getState().currentTurnPlayerId = "p0";

  assert.throws(() => engine.applyIntent("p1", { type: "SELL_HOUSE", tileId: "t1" }), /turno/);

  engine.getState().players[1].pendingDebts = [{ amount: 10, payeeId: null }];
  const events = engine.applyIntent("p1", { type: "SELL_HOUSE", tileId: "t1" });
  assert.ok(events.some((e) => e.type === "HOUSE_SOLD"));
});

test("non si può vendere una proprietà alla banca o metterla all'asta se ha ancora case sopra", () => {
  const board = buildTestBoard();
  const players = buildTestPlayers(2);
  ownFullGroup(board, "p0");
  players[0].properties = ["t1", "t2"];
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([]) });
  engine.applyIntent("p0", { type: "BUILD_HOUSE", tileId: "t1" });

  engine.getState().players[0].pendingDebts = [{ amount: 10, payeeId: null }];
  assert.throws(
    () => engine.applyIntent("p0", { type: "SELL_PROPERTY_TO_BANK", tileId: "t1" }),
    /Vendi prima le case/
  );
  assert.throws(
    () => engine.applyIntent("p0", { type: "START_PLAYER_AUCTION", tileId: "t1", minimumBid: 0 }),
    /Vendi prima le case/
  );
});

test("computeRent usa rentLevels in base al numero di case e un moltiplicatore per l'hotel", () => {
  const board = buildTestBoard();
  const tile = tileById(board, "t1");
  tile.ownerId = "p0";

  tile.houses = 1;
  assert.equal(computeRent(board, tile, 0), 30);
  tile.houses = 4;
  assert.equal(computeRent(board, tile, 0), 120);
  tile.houses = 0;
  tile.hotel = true;
  assert.equal(computeRent(board, tile, 0), Math.round(120 * 1.5));
});
