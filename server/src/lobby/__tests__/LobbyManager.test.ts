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

test("non si può entrare in una stanza piena", () => {
  const { manager } = buildManager();
  const room = manager.createRoom("s1", "Yasser", "sock1");
  for (let i = 2; i <= 8; i++) manager.joinRoom(room.code, `s${i}`, `Player${i}`, `sock${i}`);
  assert.throws(() => manager.joinRoom(room.code, "s9", "Extra", "sock9"), /piena/);
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
