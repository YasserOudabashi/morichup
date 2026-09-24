import { test } from "node:test";
import assert from "node:assert/strict";
import { GameEngine } from "../GameEngine";
import { buildTestBoard, buildTestPlayers, ScriptedDice } from "./testUtils";

function tileById(board: ReturnType<typeof buildTestBoard>, id: string) {
  const tile = board.tiles.find((t) => t.id === id);
  if (!tile) throw new Error(`tile ${id} non trovata`);
  return tile;
}

test("il rifiuto di una proprietà avvia l'asta della banca se la regola è attiva", () => {
  const board = buildTestBoard();
  board.rules.auctionOnDecline = true;
  const players = buildTestPlayers(3);
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([[3, 4]]) });

  engine.applyIntent("p0", { type: "ROLL_DICE" }); // atterra su t7, offerta d'acquisto
  const events = engine.applyIntent("p0", { type: "DECLINE_PROPERTY", tileId: "t7" });
  assert.ok(events.some((e) => e.type === "AUCTION_STARTED" && e.tileId === "t7"));
  assert.equal(engine.getState().state, "AUCTION");
  // Il decliner (p0) partecipa comunque: tutti e tre sono eleggibili a rilanciare.
  assert.deepEqual(engine.getState().auction?.eligibleBidderIds, ["p1", "p2", "p0"]);
});

test("asta libera: chiunque sia ancora eleggibile può rilanciare in qualsiasi momento, non solo 'a turno'", () => {
  const board = buildTestBoard();
  board.rules.auctionOnDecline = true;
  const players = buildTestPlayers(3);
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([[3, 4]]) });
  engine.applyIntent("p0", { type: "ROLL_DICE" });
  engine.applyIntent("p0", { type: "DECLINE_PROPERTY", tileId: "t7" });

  // p2 può rilanciare subito, prima ancora che p1 abbia fatto qualcosa: non c'è
  // più un ordine di turno da rispettare.
  const bidEvents = engine.applyIntent("p2", { type: "PLACE_BID", amount: 10 });
  assert.ok(bidEvents.some((e) => e.type === "AUCTION_BID"));
});

test("l'asta della banca assegna la proprietà al miglior offerente quando tutti passano", () => {
  const board = buildTestBoard();
  board.rules.auctionOnDecline = true;
  const players = buildTestPlayers(3);
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([[3, 4]]) });
  engine.applyIntent("p0", { type: "ROLL_DICE" });
  engine.applyIntent("p0", { type: "DECLINE_PROPERTY", tileId: "t7" });

  engine.applyIntent("p1", { type: "PLACE_BID", amount: 50 });
  engine.applyIntent("p2", { type: "PASS_AUCTION" });
  // p1 (il miglior offerente) deve poter passare anche lui senza perdere la propria
  // offerta già fatta: passare significa solo "non rilancio più", non "mi ritiro".
  const finalEvents = engine.applyIntent("p1", { type: "PASS_AUCTION" });
  const midway = engine.applyIntent("p0", { type: "PASS_AUCTION" });

  const ended = [...finalEvents, ...midway].find((e) => e.type === "AUCTION_ENDED");
  assert.ok(ended);
  assert.equal((ended as any).winnerId, "p1");
  assert.equal((ended as any).amount, 50);
  assert.equal(tileById(board, "t7").ownerId, "p1");
  assert.equal(engine.getState().players[1].money, 1500 - 50);
  assert.equal(engine.getState().auction, null);
  assert.equal(engine.getState().state, "PLAYER_DECISION"); // torna al flusso normale del turno di p0
});

test("un'asta della banca senza offerte lascia la proprietà libera", () => {
  const board = buildTestBoard();
  board.rules.auctionOnDecline = true;
  const players = buildTestPlayers(3);
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([[3, 4]]) });
  engine.applyIntent("p0", { type: "ROLL_DICE" });
  engine.applyIntent("p0", { type: "DECLINE_PROPERTY", tileId: "t7" });

  engine.applyIntent("p1", { type: "PASS_AUCTION" });
  engine.applyIntent("p2", { type: "PASS_AUCTION" });
  const finalEvents = engine.applyIntent("p0", { type: "PASS_AUCTION" });

  const ended = finalEvents.find((e) => e.type === "AUCTION_ENDED");
  assert.equal((ended as any).winnerId, null);
  assert.equal(tileById(board, "t7").ownerId, null);
});

test("un giocatore può mettere all'asta una propria proprietà con un prezzo minimo", () => {
  const board = buildTestBoard();
  const players = buildTestPlayers(3);
  tileById(board, "t7").ownerId = "p0";
  players[0].properties = ["t7"];
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([]) });

  const startEvents = engine.applyIntent("p0", { type: "START_PLAYER_AUCTION", tileId: "t7", minimumBid: 100 });
  assert.ok(startEvents.some((e) => e.type === "AUCTION_STARTED"));
  // Il venditore non partecipa alle offerte.
  assert.deepEqual(engine.getState().auction?.eligibleBidderIds, ["p1", "p2"]);
  assert.throws(() => engine.applyIntent("p0", { type: "PLACE_BID", amount: 200 }));

  engine.applyIntent("p1", { type: "PLACE_BID", amount: 150 });
  const finalEvents = engine.applyIntent("p2", { type: "PASS_AUCTION" });
  // p2 ha passato ma p1 (il miglior offerente) è ancora eleggibile: l'asta
  // non si chiude finché anche lui non passa o scade il tempo.
  assert.ok(!finalEvents.some((e) => e.type === "AUCTION_ENDED"));
  const endEvents = engine.forceEndAuction();

  const ended = endEvents.find((e) => e.type === "AUCTION_ENDED");
  assert.equal((ended as any).winnerId, "p1");
  assert.equal((ended as any).amount, 150);
  assert.equal(tileById(board, "t7").ownerId, "p1");
  assert.equal(engine.getState().players[0].money, 1500 + 150); // il ricavato va al venditore, non alla banca
  assert.deepEqual(engine.getState().players[0].properties, []);
});

test("se nessuna offerta raggiunge il minimo, la proprietà resta al venditore", () => {
  const board = buildTestBoard();
  const players = buildTestPlayers(3);
  tileById(board, "t7").ownerId = "p0";
  players[0].properties = ["t7"];
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([]) });

  engine.applyIntent("p0", { type: "START_PLAYER_AUCTION", tileId: "t7", minimumBid: 200 });
  engine.applyIntent("p1", { type: "PLACE_BID", amount: 120 }); // sotto il minimo
  engine.applyIntent("p2", { type: "PASS_AUCTION" });
  const finalEvents = engine.forceEndAuction();

  const ended = finalEvents.find((e) => e.type === "AUCTION_ENDED");
  assert.equal((ended as any).winnerId, null);
  assert.equal(tileById(board, "t7").ownerId, "p0");
  assert.equal(engine.getState().players[0].money, 1500); // nessun cambiamento
  assert.deepEqual(engine.getState().players[0].properties, ["t7"]);
});

test("non si può avviare un'asta su una proprietà non posseduta, né due aste insieme", () => {
  const board = buildTestBoard();
  const players = buildTestPlayers(3);
  tileById(board, "t7").ownerId = "p1";
  players[1].properties = ["t7"];
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([]) });

  assert.throws(() => engine.applyIntent("p0", { type: "START_PLAYER_AUCTION", tileId: "t7", minimumBid: 0 }));

  engine.applyIntent("p1", { type: "START_PLAYER_AUCTION", tileId: "t7", minimumBid: 0 });
  assert.throws(() => engine.applyIntent("p1", { type: "START_PLAYER_AUCTION", tileId: "t7", minimumBid: 0 }));
});

test("chi ha già passato non può più rilanciare né passare di nuovo", () => {
  const board = buildTestBoard();
  const players = buildTestPlayers(3);
  tileById(board, "t7").ownerId = "p0";
  players[0].properties = ["t7"];
  const engine = new GameEngine("room", board, players, 0, { dice: new ScriptedDice([]) });

  engine.applyIntent("p0", { type: "START_PLAYER_AUCTION", tileId: "t7", minimumBid: 0 });
  engine.applyIntent("p1", { type: "PASS_AUCTION" });
  assert.throws(() => engine.applyIntent("p1", { type: "PLACE_BID", amount: 10 }));
  assert.throws(() => engine.applyIntent("p1", { type: "PASS_AUCTION" }));
});
