import { test } from "node:test";
import assert from "node:assert/strict";
import { GameEngine } from "../GameEngine";
import { buildTestBoard, buildTestPlayers, ScriptedDice } from "./testUtils";

function tileById(board: ReturnType<typeof buildTestBoard>, id: string) {
  const tile = board.tiles.find((t) => t.id === id);
  if (!tile) throw new Error(`tile ${id} non trovata`);
  return tile;
}

// --- Fase 7, US-701/702: ipoteca opzionale -------------------------------

test("MORTGAGE_PROPERTY è rifiutato se la regola non è attiva", () => {
  const board = buildTestBoard(); // mortgageEnabled assente -> false
  const players = buildTestPlayers(2);
  tileById(board, "t1").ownerId = "p0";
  players[0].properties = ["t1"];
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([]) });

  assert.throws(() => engine.applyIntent("p0", { type: "MORTGAGE_PROPERTY", tileId: "t1" }), /ipoteca non è attiva/);
});

test("ipotecare una proprietà incassa metà prezzo e sospende il rent; riscattarla lo ripristina", () => {
  const board = buildTestBoard();
  board.rules.mortgageEnabled = true;
  const players = buildTestPlayers(2);
  tileById(board, "t2").ownerId = "p0";
  players[0].properties = ["t2"];
  // t2 ha purchasePrice 100: ipoteca = 50, riscatto = 50 * 1.10 = 55.
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([[1, 1], [1, 1]]) });

  const moneyBeforeMortgage = engine.getState().players[0].money;
  const mortgageEvents = engine.applyIntent("p0", { type: "MORTGAGE_PROPERTY", tileId: "t2" });
  assert.ok(mortgageEvents.some((e) => e.type === "PROPERTY_MORTGAGED" && e.tileId === "t2" && e.amount === 50));
  assert.equal(tileById(board, "t2").mortgaged, true);
  assert.equal(engine.getState().players[0].money, moneyBeforeMortgage + 50);

  // Con la proprietà ipotecata, atterrarci sopra non genera rent.
  engine.getState().currentTurnPlayerId = "p1";
  const moneyBeforeLanding = engine.getState().players[1].money;
  engine.applyIntent("p1", { type: "ROLL_DICE" }); // somma 2 -> t2
  assert.equal(engine.getState().players[1].money, moneyBeforeLanding);

  // Riscatto: sempre permesso, anche se ora è il turno di p1.
  const moneyBeforeUnmortgage = engine.getState().players[0].money;
  const unmortgageEvents = engine.applyIntent("p0", { type: "UNMORTGAGE_PROPERTY", tileId: "t2" });
  assert.ok(unmortgageEvents.some((e) => e.type === "PROPERTY_UNMORTGAGED" && e.tileId === "t2" && e.amount === 55));
  assert.equal(tileById(board, "t2").mortgaged, false);
  assert.equal(engine.getState().players[0].money, moneyBeforeUnmortgage - 55);
});

test("non si può ipotecare con case sopra, né vendere alla banca o mettere all'asta una proprietà ipotecata", () => {
  const board = buildTestBoard();
  board.rules.mortgageEnabled = true;
  const players = buildTestPlayers(2);
  tileById(board, "t1").ownerId = "p0";
  tileById(board, "t2").ownerId = "p0";
  players[0].properties = ["t1", "t2"];
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([]) });

  engine.applyIntent("p0", { type: "BUILD_HOUSE", tileId: "t1" });
  assert.throws(() => engine.applyIntent("p0", { type: "MORTGAGE_PROPERTY", tileId: "t1" }), /Vendi prima le case/);

  engine.applyIntent("p0", { type: "MORTGAGE_PROPERTY", tileId: "t2" });
  engine.getState().players[0].pendingDebts = [{ amount: 10, payeeId: null }];
  assert.throws(
    () => engine.applyIntent("p0", { type: "SELL_PROPERTY_TO_BANK", tileId: "t2" }),
    /Riscatta prima l'ipoteca/
  );
  engine.getState().players[0].pendingDebts = [];
  assert.throws(
    () => engine.applyIntent("p0", { type: "START_PLAYER_AUCTION", tileId: "t2", minimumBid: 0 }),
    /Riscatta prima l'ipoteca/
  );
});

// --- Fase 7, US-703: jackpot al Parcheggio Gratuito -----------------------

test("le tasse alimentano il jackpot solo se la regola è attiva, incassato da chi atterra su Free Parking", () => {
  const board = buildTestBoard();
  board.rules.freeParkingJackpot = true;
  tileById(board, "t9").type = "freeParking"; // riusa la casella di test come Free Parking
  const players = buildTestPlayers(2);
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([[1, 3], [4, 5]]) });

  engine.applyIntent("p0", { type: "ROLL_DICE" }); // somma 4 -> incomeTax (50): va nel jackpot
  assert.equal(engine.getState().jackpotAmount, 50);
  assert.equal(engine.getState().players[0].money, 1500 - 50);

  engine.applyIntent("p0", { type: "END_TURN" });
  const events = engine.applyIntent("p1", { type: "ROLL_DICE" }); // somma 9 -> t9 Free Parking
  assert.ok(events.some((e) => e.type === "JACKPOT_WON" && e.playerId === "p1" && e.amount === 50));
  assert.equal(engine.getState().jackpotAmount, 0);
  assert.equal(engine.getState().players[1].money, 1500 + 50);
});

test("senza la regola attiva, le tasse non si accumulano nel jackpot (comportamento invariato)", () => {
  const board = buildTestBoard(); // freeParkingJackpot assente -> false
  const players = buildTestPlayers(2);
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([[1, 3]]) });

  engine.applyIntent("p0", { type: "ROLL_DICE" }); // somma 4 -> incomeTax
  assert.equal(engine.getState().jackpotAmount, 0);
});

// --- Fase 7, US-704: modalità "quick game" ---------------------------------

test("turnLimit termina la partita a favore del patrimonio netto più alto", () => {
  const board = buildTestBoard();
  board.rules.turnLimit = 1;
  const players = buildTestPlayers(2);
  players[0].money = 2000; // patrimonio netto più alto di p1 (1500)
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([[2, 4]]) });

  engine.applyIntent("p0", { type: "ROLL_DICE" }); // somma 6 -> jail (di passaggio, nessun effetto)
  const events = engine.applyIntent("p0", { type: "END_TURN" });

  assert.ok(events.some((e) => e.type === "GAME_OVER" && e.winnerId === "p0" && e.reason === "turnLimit"));
  assert.equal(engine.getState().state, "GAME_OVER");
  assert.equal(engine.getState().winReason, "turnLimit");
});

test("gameTimeLimitMinutes termina la partita quando il tempo è scaduto", () => {
  const board = buildTestBoard();
  board.rules.gameTimeLimitMinutes = 10;
  const players = buildTestPlayers(2);
  players[1].money = 3000; // p1 ha il patrimonio netto più alto
  const startedAt = 1_000_000;
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([]), startedAt });

  assert.deepEqual(engine.checkTimeLimit(startedAt + 5 * 60_000), []);
  assert.equal(engine.getState().state, "ROLLING");

  const events = engine.checkTimeLimit(startedAt + 10 * 60_000);
  assert.ok(events.some((e) => e.type === "GAME_OVER" && e.winnerId === "p1" && e.reason === "timeLimit"));
  assert.equal(engine.getState().winReason, "timeLimit");
});

test("un intent inviato dopo la scadenza del tempo termina la partita invece di essere applicato", () => {
  const board = buildTestBoard();
  board.rules.gameTimeLimitMinutes = 1;
  const players = buildTestPlayers(2);
  const startedAt = Date.now() - 2 * 60_000; // limite già scaduto all'avvio del test
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([]), startedAt });

  const events = engine.applyIntent("p0", { type: "ROLL_DICE" });
  assert.ok(events.some((e) => e.type === "GAME_OVER" && e.reason === "timeLimit"));
  assert.ok(!events.some((e) => e.type === "DICE_RESULT")); // il ROLL_DICE non è stato processato
});
