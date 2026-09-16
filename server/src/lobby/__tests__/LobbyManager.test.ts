import { test } from "node:test";
import assert from "node:assert/strict";
import { LobbyManager } from "../LobbyManager";

function buildManager() {
  const events: { code: string; events: unknown[] }[] = [];
  const manager = new LobbyManager((code, evts) => events.push({ code, events: evts }));
  return { manager, events };
}

test("creare una stanza genera un codice e l'host è il creatore", () => {
  const { manager } = buildManager();
  const room = manager.createRoom("s1", "Yasser", "sock1");
  assert.equal(room.code.length, 6);
  assert.equal(room.hostSessionId, "s1");
  assert.equal(room.status, "lobby");
  assert.equal(room.players.size, 1);
});

test("un secondo giocatore può entrare nella stanza", () => {
  const { manager } = buildManager();
  const room = manager.createRoom("s1", "Yasser", "sock1");
  manager.joinRoom(room.code, "s2", "Dany", "sock2");
  const state = manager.getRoomState(room.code);
  assert.equal(state.players.length, 2);
  assert.equal(state.players.find((p) => p.sessionId === "s2")?.isHost, false);
});

test("Fase 8, US-802: entrare in una stanza piena non è più un errore, si entra come spettatore", () => {
  const { manager } = buildManager();
  const room = manager.createRoom("s1", "Yasser", "sock1");
  for (let i = 2; i <= 8; i++) manager.joinRoom(room.code, `s${i}`, `Player${i}`, `sock${i}`);

  manager.joinRoom(room.code, "s9", "Extra", "sock9");
  const roomState = manager.getRoomState(room.code);
  const extra = roomState.players.find((p) => p.sessionId === "s9");
  assert.equal(extra?.isSpectator, true);
  // Uno spettatore in lobby non conta come giocatore: la partita parte comunque con gli 8 reali.
  manager.startGame(room.code, "s1");
  assert.equal(manager.getEngine(room.code)!.getState().players.length, 9); // 8 giocatori + 1 spettatore
  const spectatorInGame = manager.getEngine(room.code)!.getState().players.find((p) => p.sessionId === "s9");
  assert.equal(spectatorInGame?.status, "spectator");
});

test("solo l'host può avviare la partita, e servono abbastanza giocatori", () => {
  const { manager } = buildManager();
  const room = manager.createRoom("s1", "Yasser", "sock1");
  assert.throws(() => manager.startGame(room.code, "s1"), /almeno/);
  manager.joinRoom(room.code, "s2", "Dany", "sock2");
  assert.throws(() => manager.startGame(room.code, "s2"), /host/);
  manager.startGame(room.code, "s1");
  assert.equal(manager.getRoomState(room.code).status, "playing");
  assert.ok(manager.getEngine(room.code));
});

test("l'host può espellere un giocatore in lobby, non a partita iniziata", () => {
  const { manager } = buildManager();
  const room = manager.createRoom("s1", "Yasser", "sock1");
  manager.joinRoom(room.code, "s2", "Dany", "sock2");
  manager.kickPlayer(room.code, "s1", "s2");
  assert.equal(manager.getRoomState(room.code).players.length, 1);

  manager.joinRoom(room.code, "s3", "Marco", "sock3");
  manager.startGame(room.code, "s1");
  assert.throws(() => manager.kickPlayer(room.code, "s1", "s3"), /iniziata/);
});

test("se l'host esce dalla lobby, l'host passa a un altro giocatore", () => {
  const { manager } = buildManager();
  const room = manager.createRoom("s1", "Yasser", "sock1");
  manager.joinRoom(room.code, "s2", "Dany", "sock2");
  manager.leaveRoom(room.code, "s1");
  const state = manager.getRoomState(room.code);
  assert.equal(state.players.length, 1);
  assert.equal(state.players[0].isHost, true);
  assert.equal(state.players[0].sessionId, "s2");
});

test("gli intent di gioco passano dal GameEngine della stanza", () => {
  const { manager } = buildManager();
  const room = manager.createRoom("s1", "Yasser", "sock1");
  manager.joinRoom(room.code, "s2", "Dany", "sock2");
  manager.startGame(room.code, "s1");

  const state = manager.getEngine(room.code)!.getState();
  const events = manager.applyGameIntent(room.code, state.currentTurnPlayerId!, { type: "ROLL_DICE" });
  assert.ok(events.some((e) => e.type === "DICE_RESULT"));
});

test("disconnessione e riconnessione entro la finestra ripristinano il giocatore", () => {
  const { manager, events } = buildManager();
  const room = manager.createRoom("s1", "Yasser", "sock1");
  manager.joinRoom(room.code, "s2", "Dany", "sock2");
  manager.startGame(room.code, "s1");

  manager.handleDisconnect("s2", "sock2");
  assert.equal(manager.getRoomState(room.code).players.find((p) => p.sessionId === "s2")?.connected, false);
  assert.ok(events.some((e) => e.events.some((ev: any) => ev.type === "PLAYER_DISCONNECTED")));

  manager.rejoin(room.code, "s2", "sock2-new");
  assert.equal(manager.getRoomState(room.code).players.find((p) => p.sessionId === "s2")?.connected, true);
  assert.ok(events.some((e) => e.events.some((ev: any) => ev.type === "PLAYER_RECONNECTED")));
});

test("l'host può scegliere la mappa, e la partita parte su quella mappa", () => {
  const { manager } = buildManager();
  const room = manager.createRoom("s1", "Yasser", "sock1");
  manager.joinRoom(room.code, "s2", "Dany", "sock2");

  assert.throws(() => manager.selectMap(room.code, "s2", "extended"), /host/);
  assert.throws(() => manager.selectMap(room.code, "s1", "not-a-real-map"), /sconosciuta/);

  manager.selectMap(room.code, "s1", "extended");
  assert.equal(manager.getRoomState(room.code).mapId, "extended");

  manager.startGame(room.code, "s1");
  const state = manager.getEngine(room.code)!.getState();
  assert.equal(state.board.id, "extended");
  assert.equal(state.board.width, 15);
});

test("due partite sulla stessa mappa hanno board indipendenti (nessuno stato condiviso tra stanze)", () => {
  const { manager } = buildManager();

  const roomA = manager.createRoom("a1", "Alice", "sockA1");
  manager.joinRoom(roomA.code, "a2", "Bruno", "sockA2");
  manager.startGame(roomA.code, "a1");
  const engineA = manager.getEngine(roomA.code)!;
  const tileId = engineA.getState().board.tiles.find((t) => t.type === "property")!.id;
  engineA.getState().board.tiles.find((t) => t.id === tileId)!.ownerId = "a1";
  engineA.getState().board.tiles.find((t) => t.id === tileId)!.houses = 3;

  const roomB = manager.createRoom("b1", "Carla", "sockB1");
  manager.joinRoom(roomB.code, "b2", "Dario", "sockB2");
  manager.startGame(roomB.code, "b1");
  const engineB = manager.getEngine(roomB.code)!;

  const sameTileInB = engineB.getState().board.tiles.find((t) => t.id === tileId)!;
  assert.equal(sameTileInB.ownerId, null);
  assert.equal(sameTileInB.houses, 0);
});

test("Fase 8, US-802: entrare in una stanza a partita già iniziata entra subito come spettatore nel GameEngine", () => {
  const { manager } = buildManager();
  const room = manager.createRoom("s1", "Yasser", "sock1");
  manager.joinRoom(room.code, "s2", "Dany", "sock2");
  manager.startGame(room.code, "s1");

  manager.joinRoom(room.code, "s3", "Osservatore", "sock3");
  const roomState = manager.getRoomState(room.code);
  assert.equal(roomState.players.find((p) => p.sessionId === "s3")?.isSpectator, true);
  const engine = manager.getEngine(room.code)!;
  assert.equal(engine.getState().players.find((p) => p.sessionId === "s3")?.status, "spectator");
});

test("Fase 8, US-803: rivincita disponibile solo a fine partita, resetta lo stato mantenendo gli stessi giocatori", () => {
  const { manager } = buildManager();
  const room = manager.createRoom("s1", "Yasser", "sock1");
  manager.joinRoom(room.code, "s2", "Dany", "sock2");
  manager.startGame(room.code, "s1");

  assert.throws(() => manager.rematch(room.code, "s2"), /host/);
  assert.throws(() => manager.rematch(room.code, "s1"), /fine partita/);

  // Forza la fine partita per testare la transizione, senza dover giocare un'intera partita.
  manager.getEngine(room.code)!.getState().state = "GAME_OVER";
  manager.rematch(room.code, "s1");

  const roomState = manager.getRoomState(room.code);
  assert.equal(roomState.status, "lobby");
  assert.equal(roomState.players.length, 2);
  assert.equal(manager.getEngine(room.code), null);
});

test("Fase 8, US-801: la chat rispetta il rate limit e tronca i messaggi troppo lunghi", () => {
  const { manager } = buildManager();
  const room = manager.createRoom("s1", "Yasser", "sock1");
  manager.joinRoom(room.code, "s2", "Dany", "sock2");

  const first = manager.sendChatMessage(room.code, "s1", "Ciao a tutti!");
  assert.equal(first?.nickname, "Yasser");
  assert.equal(first?.text, "Ciao a tutti!");

  // Un secondo messaggio immediato dallo stesso giocatore viene scartato (rate limit).
  const second = manager.sendChatMessage(room.code, "s1", "Ancora io");
  assert.equal(second, null);

  // Un altro giocatore non è soggetto al rate limit di s1.
  const fromOther = manager.sendChatMessage(room.code, "s2", "Ciao Yasser");
  assert.equal(fromOther?.nickname, "Dany");

  // Un terzo giocatore, mai apparso prima in chat: nessun rate limit pregresso, testa solo il troncamento.
  manager.joinRoom(room.code, "s3", "Terzo", "sock3");
  const long = manager.sendChatMessage(room.code, "s3", "x".repeat(400));
  assert.equal(long?.text.length, 300);

  assert.throws(() => manager.sendChatMessage(room.code, "unknown-session", "ciao"), /non trovato/);
});
