import { test } from "node:test";
import assert from "node:assert/strict";
import { GameEngine } from "../GameEngine";
import { buildTestBoard, buildTestPlayers, ScriptedDice } from "./testUtils";

// --- Fase 8, US-802: modalità spettatore -----------------------------------

test("addSpectator aggiunge un giocatore in stato 'spectator', mai due volte per la stessa sessione", () => {
  const board = buildTestBoard();
  const players = buildTestPlayers(2);
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([]) });

  engine.addSpectator("spec1", "Osservatore");
  assert.equal(engine.getState().players.length, 3);
  const spectator = engine.getState().players.find((p) => p.sessionId === "spec1");
  assert.equal(spectator?.status, "spectator");
  assert.equal(spectator?.money, 0);

  engine.addSpectator("spec1", "Osservatore"); // idempotente
  assert.equal(engine.getState().players.length, 3);
});

test("uno spettatore non riceve mai il turno", () => {
  const board = buildTestBoard();
  const players = buildTestPlayers(2);
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([[2, 4], [2, 4]]) });
  engine.addSpectator("spec1", "Osservatore");

  engine.applyIntent("p0", { type: "ROLL_DICE" });
  engine.applyIntent("p0", { type: "END_TURN" });
  assert.equal(engine.getState().currentTurnPlayerId, "p1"); // mai spec1

  engine.applyIntent("p1", { type: "ROLL_DICE" });
  engine.applyIntent("p1", { type: "END_TURN" });
  assert.equal(engine.getState().currentTurnPlayerId, "p0"); // torna a p0, salta spec1
});

test("uno spettatore non può inviare alcun intent di gioco: tutti gli intent restano rifiutati", () => {
  const board = buildTestBoard();
  const players = buildTestPlayers(2);
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([]) });
  engine.addSpectator("spec1", "Osservatore");

  assert.throws(() => engine.applyIntent("spec1", { type: "ROLL_DICE" }), /turno/);
  assert.throws(
    () => engine.applyIntent("spec1", { type: "PROPOSE_TRADE", toPlayerId: "p0", give: { cash: 0, propertyIds: [] }, receive: { cash: 0, propertyIds: [] }, specialConditions: "" }),
    /attivi/
  );
  assert.throws(() => engine.applyIntent("spec1", { type: "DECLARE_BANKRUPTCY" }), /debiti/);
  assert.throws(() => engine.applyIntent("spec1", { type: "SELL_PROPERTY_TO_BANK", tileId: "t1" }), /debito/);
});

test("uno spettatore non conta ai fini della vittoria per bancarotta altrui", () => {
  const board = buildTestBoard();
  const players = buildTestPlayers(2);
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([]) });
  engine.addSpectator("spec1", "Osservatore");

  engine.getState().players[1].pendingDebts = [{ amount: 10, payeeId: null }];
  engine.getState().players[1].status = "active";
  const events = engine.applyIntent("p1", { type: "DECLARE_BANKRUPTCY" });
  // Restano solo p0 (attivo) e spec1 (spettatore): p0 vince comunque, lo spettatore non blocca la vittoria.
  assert.ok(events.some((e) => e.type === "GAME_OVER" && e.winnerId === "p0"));
});
