import { test } from "node:test";
import assert from "node:assert/strict";
import { GameEngine } from "../GameEngine";
import { buildTestBoard, buildTestPlayers, ScriptedDice } from "./testUtils";

function tileById(board: ReturnType<typeof buildTestBoard>, id: string) {
  const tile = board.tiles.find((t) => t.id === id);
  if (!tile) throw new Error(`tile ${id} non trovata`);
  return tile;
}

test("acquisto di una proprietà libera e fine turno", () => {
  const board = buildTestBoard();
  const players = buildTestPlayers(2);
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([[3, 4]]) });

  const rollEvents = engine.applyIntent("p0", { type: "ROLL_DICE" });
  assert.ok(rollEvents.some((e) => e.type === "PROPERTY_PURCHASE_OFFER"));
  assert.equal(engine.getState().pendingDecision?.tileId, "t7");

  const buyEvents = engine.applyIntent("p0", { type: "BUY_PROPERTY", tileId: "t7" });
  assert.ok(buyEvents.some((e) => e.type === "PROPERTY_PURCHASED"));
  assert.equal(tileById(board, "t7").ownerId, "p0");
  assert.equal(engine.getState().players[0].money, 1500 - 150);
  assert.equal(engine.getState().pendingDecision, null);

  const endEvents = engine.applyIntent("p0", { type: "END_TURN" });
  assert.deepEqual(
    endEvents.find((e) => e.type === "TURN_ENDED"),
    { type: "TURN_ENDED", playerId: "p0", extraTurn: false }
  );
  assert.equal(engine.getState().currentTurnPlayerId, "p1");
  assert.equal(engine.getState().state, "ROLLING");
});

test("rifiuto di una proprietà libera", () => {
  const board = buildTestBoard();
  const players = buildTestPlayers(2);
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([[3, 4]]) });

  engine.applyIntent("p0", { type: "ROLL_DICE" });
  const declineEvents = engine.applyIntent("p0", { type: "DECLINE_PROPERTY", tileId: "t7" });
  assert.ok(declineEvents.some((e) => e.type === "PROPERTY_DECLINED"));
  assert.equal(tileById(board, "t7").ownerId, null);
  assert.equal(engine.getState().pendingDecision, null);

  engine.applyIntent("p0", { type: "END_TURN" });
  assert.equal(engine.getState().currentTurnPlayerId, "p1");
});

test("pagamento del rent quando si atterra su una proprietà altrui", () => {
  const board = buildTestBoard();
  const players = buildTestPlayers(2);
  const engine = new GameEngine("room", board, players, 0, {
    dice: new ScriptedDice([
      [3, 4], // p0: atterra su t7 e lo compra
      [3, 4], // p1: atterra sulla stessa casella, ora di proprietà di p0
    ]),
  });

  engine.applyIntent("p0", { type: "ROLL_DICE" });
  engine.applyIntent("p0", { type: "BUY_PROPERTY", tileId: "t7" });
  engine.applyIntent("p0", { type: "END_TURN" });

  const rentEvents = engine.applyIntent("p1", { type: "ROLL_DICE" });
  const rentPaid = rentEvents.find((e) => e.type === "RENT_PAID");
  assert.ok(rentPaid);
  assert.equal((rentPaid as { amount: number }).amount, 15);
  assert.equal(engine.getState().players[1].money, 1500 - 15);
  assert.equal(engine.getState().players[0].money, 1500 - 150 + 15);
});

test("passare dal Go assegna il bonus", () => {
  const board = buildTestBoard();
  const players = buildTestPlayers(2);
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([[1, 3]]) });
  engine.getState().players[0].position = 10;

  const events = engine.applyIntent("p0", { type: "ROLL_DICE" });
  const moved = events.find((e) => e.type === "PLAYER_MOVED");
  assert.deepEqual(moved, { type: "PLAYER_MOVED", playerId: "p0", from: 10, to: 2, passedGo: true });
  // t2 è una proprietà libera: viene solo offerta in acquisto, non comprata qui.
  assert.equal(engine.getState().players[0].money, 1500 + 200);
});

test("un doppio concede un turno extra allo stesso giocatore", () => {
  const board = buildTestBoard();
  const players = buildTestPlayers(2);
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([[2, 2]]) });

  const rollEvents = engine.applyIntent("p0", { type: "ROLL_DICE" });
  assert.deepEqual(rollEvents[0], { type: "DICE_RESULT", playerId: "p0", values: [2, 2], isDouble: true });

  const endEvents = engine.applyIntent("p0", { type: "END_TURN" });
  assert.deepEqual(
    endEvents.find((e) => e.type === "TURN_ENDED"),
    { type: "TURN_ENDED", playerId: "p0", extraTurn: true }
  );
  assert.equal(engine.getState().currentTurnPlayerId, "p0");
  assert.equal(engine.getState().state, "ROLLING");
});

test("tre doppi consecutivi mandano in prigione e annullano il turno extra", () => {
  const board = buildTestBoard();
  const players = buildTestPlayers(2);
  const engine = new GameEngine("room", board, players, 0, {
    dice: new ScriptedDice([
      [1, 1], // consec=1, da 0 atterra su t2 (property libera)
      [2, 2], // consec=2, da 2 atterra su t6 (jail/just visiting, nessun effetto)
      [3, 3], // consec=3 -> prigione, nessun movimento
    ]),
  });

  engine.applyIntent("p0", { type: "ROLL_DICE" });
  engine.applyIntent("p0", { type: "DECLINE_PROPERTY", tileId: "t2" });
  engine.applyIntent("p0", { type: "END_TURN" }); // extraTurn true, resta p0

  engine.applyIntent("p0", { type: "ROLL_DICE" }); // atterra su jail/just visiting, nessuna decisione
  engine.applyIntent("p0", { type: "END_TURN" }); // extraTurn true, resta p0

  const thirdRoll = engine.applyIntent("p0", { type: "ROLL_DICE" });
  assert.ok(thirdRoll.some((e) => e.type === "SENT_TO_JAIL" && e.reason === "threeDoubles"));
  assert.equal(engine.getState().players[0].inJail, true);
  assert.equal(engine.getState().players[0].position, 6); // indice della casella jail sulla test board

  const endEvents = engine.applyIntent("p0", { type: "END_TURN" });
  assert.deepEqual(
    endEvents.find((e) => e.type === "TURN_ENDED"),
    { type: "TURN_ENDED", playerId: "p0", extraTurn: false }
  );
  assert.equal(engine.getState().currentTurnPlayerId, "p1", "niente turno extra dopo la prigione");
});

test("atterrare sulla casella Go To Jail manda in prigione", () => {
  const board = buildTestBoard();
  const players = buildTestPlayers(2);
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([[1, 2]]) });
  engine.getState().players[0].position = 8; // 8 + 3 = 11 = "Go To Jail"

  const events = engine.applyIntent("p0", { type: "ROLL_DICE" });
  assert.ok(events.some((e) => e.type === "SENT_TO_JAIL" && e.reason === "tile"));
  assert.equal(engine.getState().players[0].inJail, true);
  assert.equal(engine.getState().players[0].position, 6);
});

test("pagare la cauzione libera dalla prigione nello stesso turno", () => {
  const board = buildTestBoard();
  const players = buildTestPlayers(2);
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([[1, 2]]) });
  const player = engine.getState().players[0];
  player.inJail = true;
  player.jailTurns = 1;
  player.position = 6; // indice della casella jail sulla test board

  const events = engine.applyIntent("p0", { type: "PAY_BAIL" });
  assert.ok(events.some((e) => e.type === "LEFT_JAIL" && e.method === "paid"));
  assert.equal(player.inJail, false);
  assert.equal(player.money, 1500 - 50);
  assert.equal(engine.getState().state, "ROLLING");

  // Ora può tirare normalmente.
  const rollEvents = engine.applyIntent("p0", { type: "ROLL_DICE" });
  assert.ok(rollEvents.some((e) => e.type === "PLAYER_MOVED"));
});

test("usare la carta 'esci di prigione gratis' libera senza pagare", () => {
  const board = buildTestBoard();
  const players = buildTestPlayers(2);
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([]) });
  const player = engine.getState().players[0];
  player.inJail = true;
  player.position = 6; // indice della casella jail sulla test board
  player.getOutOfJailFreeCards = 1;

  const events = engine.applyIntent("p0", { type: "USE_JAIL_CARD" });
  assert.ok(events.some((e) => e.type === "LEFT_JAIL" && e.method === "card"));
  assert.equal(player.inJail, false);
  assert.equal(player.getOutOfJailFreeCards, 0);
  assert.equal(player.money, 1500, "usare la carta non costa denaro");
});

test("tre tentativi falliti in prigione forzano il pagamento della cauzione", () => {
  // Ogni tentativo in prigione occupa un turno intero di p0: come nel Monopoly
  // vero, tra un tentativo e l'altro gioca l'avversario.
  const board = buildTestBoard();
  const players = buildTestPlayers(2);
  const engine = new GameEngine("room", board, players, 0, {
    dice: new ScriptedDice([
      [1, 2], // p0 tentativo 1: non doppio, resta in prigione
      [1, 3], // p1: atterra su incomeTax (t4), nessuna decisione
      [1, 4], // p0 tentativo 2: non doppio, resta in prigione
      [3, 5], // p1: giro completo, atterra di nuovo su Go
      [1, 3], // p0 tentativo 3: non doppio -> pagamento forzato + movimento
    ]),
  });
  const player = engine.getState().players[0];
  player.inJail = true;
  player.position = 6; // indice della casella jail sulla test board

  engine.applyIntent("p0", { type: "ROLL_DICE" });
  assert.equal(player.inJail, true);
  assert.equal(player.jailTurns, 1);
  engine.applyIntent("p0", { type: "END_TURN" });

  engine.applyIntent("p1", { type: "ROLL_DICE" });
  engine.applyIntent("p1", { type: "END_TURN" });

  engine.applyIntent("p0", { type: "ROLL_DICE" });
  assert.equal(player.inJail, true);
  assert.equal(player.jailTurns, 2);
  engine.applyIntent("p0", { type: "END_TURN" });

  engine.applyIntent("p1", { type: "ROLL_DICE" });
  engine.applyIntent("p1", { type: "END_TURN" });

  const thirdEvents = engine.applyIntent("p0", { type: "ROLL_DICE" });
  assert.ok(thirdEvents.some((e) => e.type === "LEFT_JAIL" && e.method === "paid"));
  assert.equal(player.inJail, false);
  assert.equal(player.money, 1500 - 50);
});

test("debito parziale: chi non può pagare tutto il rent resta bloccato in DEBT_RESOLUTION", () => {
  const board = buildTestBoard();
  const players = buildTestPlayers(2);
  tileById(board, "t7").ownerId = "p0";
  players[0].properties = ["t7"];
  players[1].money = 5;

  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([[3, 4]]) });
  // Forziamo il turno di p1 (di norma inizierebbe p0).
  engine.getState().currentTurnPlayerId = "p1";

  const events = engine.applyIntent("p1", { type: "ROLL_DICE" });
  assert.ok(events.some((e) => e.type === "DEBT_INCURRED" && e.playerId === "p1" && e.amount === 10));
  assert.equal(engine.getState().players[1].money, 0);
  assert.equal(engine.getState().players[0].money, 1500 + 5); // il creditore riceve subito quel poco che c'è (PRD §30)
  assert.equal(engine.getState().state, "DEBT_RESOLUTION");
  assert.deepEqual(engine.getState().players[1].pendingDebts, [{ amount: 10, payeeId: "p0" }]);

  // Bloccato: non può tirare né finire il turno finché non salda.
  assert.throws(() => engine.applyIntent("p1", { type: "ROLL_DICE" }));
  assert.throws(() => engine.applyIntent("p1", { type: "END_TURN" }));
});

test("bancarotta: chi non può saldare il debito può dichiararla esplicitamente, e si controlla la vittoria", () => {
  const board = buildTestBoard();
  const players = buildTestPlayers(2);
  tileById(board, "t7").ownerId = "p0";
  players[0].properties = ["t7"];
  players[1].money = 5;

  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([[3, 4]]) });
  engine.getState().currentTurnPlayerId = "p1";
  engine.applyIntent("p1", { type: "ROLL_DICE" }); // incorre nel debito, vedi test sopra

  const events = engine.applyIntent("p1", { type: "DECLARE_BANKRUPTCY" });
  assert.ok(events.some((e) => e.type === "PLAYER_BANKRUPT" && e.playerId === "p1"));
  assert.ok(events.some((e) => e.type === "GAME_OVER" && e.winnerId === "p0"));

  assert.equal(engine.getState().players[1].status, "bankrupt");
  assert.equal(engine.getState().players[1].money, 0);
  assert.deepEqual(engine.getState().players[1].pendingDebts, []);
  assert.equal(engine.getState().players[0].money, 1500 + 5); // niente di più: non c'era altro da dare
  assert.equal(engine.getState().state, "GAME_OVER");
  assert.equal(engine.getState().winnerId, "p0");
});

test("vendere una proprietà alla banca copre il debito e sblocca il turno", () => {
  const board = buildTestBoard();
  const players = buildTestPlayers(2);
  tileById(board, "t7").ownerId = "p0"; // rent 15, pagata da p1
  players[0].properties = ["t7"];
  tileById(board, "t2").ownerId = "p1"; // p1 possiede una proprietà da vendere (prezzo 100 -> 50 alla banca)
  players[1].properties = ["t2"];
  players[1].money = 5;

  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([[3, 4]]) });
  engine.getState().currentTurnPlayerId = "p1";
  engine.applyIntent("p1", { type: "ROLL_DICE" }); // debito di 10

  const sellEvents = engine.applyIntent("p1", { type: "SELL_PROPERTY_TO_BANK", tileId: "t2" });
  assert.ok(sellEvents.some((e) => e.type === "PROPERTY_SOLD_TO_BANK" && e.amount === 50));
  assert.ok(sellEvents.some((e) => e.type === "DEBT_RESOLVED"));
  assert.equal(engine.getState().players[1].pendingDebts.length, 0);
  assert.equal(tileById(board, "t2").ownerId, null);
  assert.equal(engine.getState().state, "PLAYER_DECISION");

  // Ora può finire il turno normalmente.
  const endEvents = engine.applyIntent("p1", { type: "END_TURN" });
  assert.ok(endEvents.some((e) => e.type === "TURN_ENDED"));
});

test("validazione: non si può agire fuori dal proprio turno", () => {
  const board = buildTestBoard();
  const players = buildTestPlayers(2);
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([[3, 4]]) });
  assert.throws(() => engine.applyIntent("p1", { type: "ROLL_DICE" }));
});

test("validazione: non si può tirare i dadi due volte nello stesso momento", () => {
  const board = buildTestBoard();
  const players = buildTestPlayers(2);
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([[1, 2], [1, 2]]) });
  engine.applyIntent("p0", { type: "ROLL_DICE" }); // atterra su t3 (railroad libera) -> pending decision
  assert.throws(() => engine.applyIntent("p0", { type: "ROLL_DICE" }));
});

test("validazione: non si può finire il turno con una decisione in sospeso", () => {
  const board = buildTestBoard();
  const players = buildTestPlayers(2);
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([[3, 4]]) });
  engine.applyIntent("p0", { type: "ROLL_DICE" });
  assert.throws(() => engine.applyIntent("p0", { type: "END_TURN" }));
});

test("validazione: non si può comprare senza un'offerta attiva", () => {
  const board = buildTestBoard();
  const players = buildTestPlayers(2);
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([]) });
  assert.throws(() => engine.applyIntent("p0", { type: "BUY_PROPERTY", tileId: "t7" }));
});
