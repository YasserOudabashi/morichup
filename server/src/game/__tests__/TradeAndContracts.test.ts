import { test } from "node:test";
import assert from "node:assert/strict";
import { GameEngine } from "../GameEngine";
import { buildTestBoard, buildTestPlayers, ScriptedDice } from "./testUtils";

function tileById(board: ReturnType<typeof buildTestBoard>, id: string) {
  const tile = board.tiles.find((t) => t.id === id);
  if (!tile) throw new Error(`tile ${id} non trovata`);
  return tile;
}

function newEngine(playerCount: number, setup?: (board: ReturnType<typeof buildTestBoard>) => void) {
  const board = buildTestBoard();
  setup?.(board);
  const players = buildTestPlayers(playerCount);
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([]) });
  return { board, players, engine };
}

test("propone e accetta uno scambio: proprietà contro denaro", () => {
  const { board, engine } = newEngine(2, (b) => {
    tileById(b, "t7").ownerId = "p0";
  });
  engine.getState().players[0].properties = ["t7"];

  const proposeEvents = engine.applyIntent("p0", {
    type: "PROPOSE_TRADE",
    toPlayerId: "p1",
    give: { cash: 0, propertyIds: ["t7"] },
    receive: { cash: 100, propertyIds: [] },
    specialConditions: "",
  });
  const proposed = proposeEvents.find((e) => e.type === "TRADE_PROPOSED");
  assert.ok(proposed);
  const tradeId = (proposed as any).trade.id;
  assert.equal(engine.getState().trades.length, 1);

  const acceptEvents = engine.applyIntent("p1", { type: "ACCEPT_TRADE", tradeId });
  assert.ok(acceptEvents.some((e) => e.type === "TRADE_ACCEPTED"));
  assert.equal(engine.getState().trades.length, 0);
  assert.equal(tileById(board, "t7").ownerId, "p1");
  assert.deepEqual(engine.getState().players[0].properties, []);
  assert.deepEqual(engine.getState().players[1].properties, ["t7"]);
  assert.equal(engine.getState().players[0].money, 1500 + 100);
  assert.equal(engine.getState().players[1].money, 1500 - 100);
});

test("una controfferta scambia i ruoli e la vecchia offerta smette di valere", () => {
  const { board, engine } = newEngine(2, (b) => {
    tileById(b, "t7").ownerId = "p0";
  });
  engine.getState().players[0].properties = ["t7"];

  const [proposed] = engine.applyIntent("p0", {
    type: "PROPOSE_TRADE",
    toPlayerId: "p1",
    give: { cash: 0, propertyIds: ["t7"] },
    receive: { cash: 100, propertyIds: [] },
    specialConditions: "",
  });
  const tradeId = (proposed as any).trade.id;

  const [countered] = engine.applyIntent("p1", {
    type: "COUNTER_TRADE",
    tradeId,
    give: { cash: 80, propertyIds: [] },
    receive: { cash: 0, propertyIds: ["t7"] },
    specialConditions: "",
  });
  const trade = (countered as any).trade;
  assert.equal(trade.version, 2);
  assert.equal(trade.fromPlayerId, "p1");
  assert.equal(trade.toPlayerId, "p0");

  // p1 non può più accettare/rifiutare la propria controfferta: tocca a p0 decidere.
  assert.throws(() => engine.applyIntent("p1", { type: "ACCEPT_TRADE", tradeId }));

  engine.applyIntent("p0", { type: "ACCEPT_TRADE", tradeId });
  assert.equal(tileById(board, "t7").ownerId, "p1");
  assert.equal(engine.getState().players[0].money, 1500 + 80);
  assert.equal(engine.getState().players[1].money, 1500 - 80);
});

test("rifiutare e ritirare un'offerta non trasferisce nulla", () => {
  const { board, engine } = newEngine(2, (b) => {
    tileById(b, "t7").ownerId = "p0";
  });
  engine.getState().players[0].properties = ["t7"];

  const [p1] = engine.applyIntent("p0", {
    type: "PROPOSE_TRADE",
    toPlayerId: "p1",
    give: { cash: 0, propertyIds: ["t7"] },
    receive: { cash: 100, propertyIds: [] },
    specialConditions: "",
  });
  const tradeId1 = (p1 as any).trade.id;
  engine.applyIntent("p1", { type: "REJECT_TRADE", tradeId: tradeId1 });
  assert.equal(engine.getState().trades.length, 0);
  assert.equal(tileById(board, "t7").ownerId, "p0");

  const [p2] = engine.applyIntent("p0", {
    type: "PROPOSE_TRADE",
    toPlayerId: "p1",
    give: { cash: 0, propertyIds: ["t7"] },
    receive: { cash: 100, propertyIds: [] },
    specialConditions: "",
  });
  const tradeId2 = (p2 as any).trade.id;
  engine.applyIntent("p0", { type: "CANCEL_TRADE", tradeId: tradeId2 });
  assert.equal(engine.getState().trades.length, 0);
  assert.equal(tileById(board, "t7").ownerId, "p0");
});

test("non si può proporre uno scambio con asset non posseduti o denaro insufficiente", () => {
  const { engine } = newEngine(2, (b) => {
    tileById(b, "t7").ownerId = "p1"; // non di p0
  });

  assert.throws(() =>
    engine.applyIntent("p0", {
      type: "PROPOSE_TRADE",
      toPlayerId: "p1",
      give: { cash: 0, propertyIds: ["t7"] },
      receive: { cash: 0, propertyIds: [] },
      specialConditions: "",
    })
  );

  assert.throws(() =>
    engine.applyIntent("p0", {
      type: "PROPOSE_TRADE",
      toPlayerId: "p1",
      give: { cash: 0, propertyIds: [] },
      receive: { cash: 999999, propertyIds: [] },
      specialConditions: "",
    })
  );
});

test("il trading funziona anche fuori dal proprio turno", () => {
  const { engine } = newEngine(3);
  // Il turno è di p2, ma p0 e p1 scambiano comunque tra loro.
  engine.getState().currentTurnPlayerId = "p2";

  const events = engine.applyIntent("p0", {
    type: "PROPOSE_TRADE",
    toPlayerId: "p1",
    give: { cash: 50, propertyIds: [] },
    receive: { cash: 0, propertyIds: [] },
    specialConditions: "",
  });
  assert.ok(events.some((e) => e.type === "TRADE_PROPOSED"));
  assert.equal(engine.getState().currentTurnPlayerId, "p2", "il turno di p2 non viene toccato dal trade");
});

test("una promessa infranta genera un contratto, poi un'accusa votata Guilty applica la multa", () => {
  const { engine } = newEngine(3, (b) => {
    tileById(b, "t7").ownerId = "p0";
  });
  engine.getState().players[0].properties = ["t7"];

  const [proposed] = engine.applyIntent("p0", {
    type: "PROPOSE_TRADE",
    toPlayerId: "p1",
    give: { cash: 0, propertyIds: ["t7"] },
    receive: { cash: 100, propertyIds: [] },
    specialConditions: "Non farò pagare rent su t7 per 3 giri",
  });
  const tradeId = (proposed as any).trade.id;
  const [, contractEvent] = engine.applyIntent("p1", { type: "ACCEPT_TRADE", tradeId });
  assert.equal(contractEvent.type, "CONTRACT_CREATED");
  const contractId = (contractEvent as any).contract.id;
  assert.equal((contractEvent as any).contract.participants.length, 2);

  const [reportEvent] = engine.applyIntent("p0", { type: "REPORT_BROKEN_PROMISE", contractId });
  assert.equal(reportEvent.type, "PROMISE_REPORTED");
  const accusationId = (reportEvent as any).accusation.id;
  assert.equal(engine.getState().contracts.find((c) => c.id === contractId)?.status, "disputed");

  // Solo p2 ha diritto di voto (p0 = accusatore, p1 = accusato).
  assert.throws(() => engine.applyIntent("p0", { type: "VOTE_ACCUSATION", accusationId, vote: "guilty" }));
  assert.throws(() => engine.applyIntent("p1", { type: "VOTE_ACCUSATION", accusationId, vote: "notGuilty" }));

  const moneyBefore = engine.getState().players[1].money;
  const voteEvents = engine.applyIntent("p2", { type: "VOTE_ACCUSATION", accusationId, vote: "guilty" });
  const resolved = voteEvents.find((e) => e.type === "ACCUSATION_RESOLVED");
  assert.ok(resolved);
  assert.equal((resolved as any).guilty, true);
  assert.equal((resolved as any).penaltyAmount, 100);
  assert.equal(engine.getState().players[1].money, moneyBefore - 100);
  assert.equal(engine.getState().contracts.find((c) => c.id === contractId)?.status, "disputed");
});

test("un'accusa respinta (Not Guilty) non applica alcuna penalità e riattiva il contratto", () => {
  const { engine } = newEngine(3, (b) => {
    tileById(b, "t7").ownerId = "p0";
  });
  engine.getState().players[0].properties = ["t7"];

  const [proposed] = engine.applyIntent("p0", {
    type: "PROPOSE_TRADE",
    toPlayerId: "p1",
    give: { cash: 0, propertyIds: ["t7"] },
    receive: { cash: 100, propertyIds: [] },
    specialConditions: "Promessa di prova",
  });
  const tradeId = (proposed as any).trade.id;
  const [, contractEvent] = engine.applyIntent("p1", { type: "ACCEPT_TRADE", tradeId });
  const contractId = (contractEvent as any).contract.id;
  const [reportEvent] = engine.applyIntent("p0", { type: "REPORT_BROKEN_PROMISE", contractId });
  const accusationId = (reportEvent as any).accusation.id;

  const moneyBefore = engine.getState().players[1].money;
  const voteEvents = engine.applyIntent("p2", { type: "VOTE_ACCUSATION", accusationId, vote: "notGuilty" });
  const resolved = voteEvents.find((e) => e.type === "ACCUSATION_RESOLVED");
  assert.equal((resolved as any).guilty, false);
  assert.equal(engine.getState().players[1].money, moneyBefore);
  assert.equal(engine.getState().contracts.find((c) => c.id === contractId)?.status, "active");
});

test("forceResolveAccusation (timeout) risolve senza voti come Not Guilty", () => {
  const { engine } = newEngine(3, (b) => {
    tileById(b, "t7").ownerId = "p0";
  });
  engine.getState().players[0].properties = ["t7"];

  const [proposed] = engine.applyIntent("p0", {
    type: "PROPOSE_TRADE",
    toPlayerId: "p1",
    give: { cash: 0, propertyIds: ["t7"] },
    receive: { cash: 100, propertyIds: [] },
    specialConditions: "Promessa di prova",
  });
  const tradeId = (proposed as any).trade.id;
  const [, contractEvent] = engine.applyIntent("p1", { type: "ACCEPT_TRADE", tradeId });
  const contractId = (contractEvent as any).contract.id;
  const [reportEvent] = engine.applyIntent("p0", { type: "REPORT_BROKEN_PROMISE", contractId });
  const accusationId = (reportEvent as any).accusation.id;

  const events = engine.forceResolveAccusation(accusationId);
  const resolved = events.find((e) => e.type === "ACCUSATION_RESOLVED");
  assert.equal((resolved as any).guilty, false);

  // Una seconda chiamata (accusa già risolta) non deve fare nulla.
  assert.deepEqual(engine.forceResolveAccusation(accusationId), []);
});
