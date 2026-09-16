import { test } from "node:test";
import assert from "node:assert/strict";
import { coordFor, PLAYER_COLOR_PALETTE } from "@morichup/shared";
import type { BoardConfig, Tile } from "@morichup/shared";
import { LobbyManager } from "../LobbyManager";

/** Board minima 8x8 valida per i test della mappa personalizzata (Fase 9). */
function buildCustomBoard(id = "custom-test"): BoardConfig {
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
    id,
    name: "Custom Test",
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

function buildManager(now?: () => number) {
  const events: { code: string; events: unknown[] }[] = [];
  const manager = new LobbyManager((code, evts) => events.push({ code, events: evts }), now);
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

test("Fase 7: l'host può attivare le regole opzionali in lobby, applicate solo alla partita che parte", () => {
  const { manager } = buildManager();
  const room = manager.createRoom("s1", "Yasser", "sock1");
  manager.joinRoom(room.code, "s2", "Dany", "sock2");

  assert.throws(
    () => manager.setOptionalRules(room.code, "s2", { mortgageEnabled: true }),
    /host/
  );
  assert.throws(
    () => manager.setOptionalRules(room.code, "s1", { turnLimit: 0 }),
    /positivo/
  );

  manager.setOptionalRules(room.code, "s1", { mortgageEnabled: true, freeParkingJackpot: true, turnLimit: 40 });
  const roomState = manager.getRoomState(room.code);
  assert.deepEqual(roomState.optionalRules, {
    mortgageEnabled: true,
    freeParkingJackpot: true,
    turnLimit: 40,
    gameTimeLimitMinutes: null,
  });

  manager.startGame(room.code, "s1");
  const engineRules = manager.getEngine(room.code)!.getState().board.rules;
  assert.equal(engineRules.mortgageEnabled, true);
  assert.equal(engineRules.freeParkingJackpot, true);
  assert.equal(engineRules.turnLimit, 40);

  // Una seconda stanza sulla stessa mappa, mai toccata dalle regole opzionali della prima:
  // stesso bug di condivisione già risolto per houses/ownerId (vedi test più sotto), qui per rules.
  const room2 = manager.createRoom("a1", "Alice", "sockA1");
  manager.joinRoom(room2.code, "a2", "Bruno", "sockA2");
  manager.startGame(room2.code, "a1");
  const engine2Rules = manager.getEngine(room2.code)!.getState().board.rules;
  assert.equal(engine2Rules.mortgageEnabled, false);
  assert.equal(engine2Rules.turnLimit, undefined);
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

test("Fase 12, US-1204: una stanza con password richiede la password corretta per entrare", () => {
  const { manager } = buildManager();
  const room = manager.createRoom("s1", "Yasser", "sock1", undefined, "segreto");
  assert.equal(manager.getRoomState(room.code).hasPassword, true);

  assert.throws(() => manager.joinRoom(room.code, "s2", "Dany", "sock2", undefined, "sbagliata"), /Password errata/);
  assert.throws(() => manager.joinRoom(room.code, "s2", "Dany", "sock2"), /Password errata/);

  manager.joinRoom(room.code, "s2", "Dany", "sock2", undefined, "segreto");
  assert.equal(manager.getRoomState(room.code).players.length, 2);
});

test("Fase 12, US-1204: una stanza senza password non la richiede, e non appare nello stato pubblico", () => {
  const { manager } = buildManager();
  const room = manager.createRoom("s1", "Yasser", "sock1");
  assert.equal(manager.getRoomState(room.code).hasPassword, false);
  manager.joinRoom(room.code, "s2", "Dany", "sock2");
  assert.equal(manager.getRoomState(room.code).players.length, 2);
  assert.equal((manager.getRoomState(room.code) as unknown as Record<string, unknown>).password, undefined);
});

test("Fase 10, US-1005: il colore preferito viene rispettato se libero all'avvio", () => {
  const { manager } = buildManager();
  const room = manager.createRoom("s1", "Yasser", "sock1", PLAYER_COLOR_PALETTE[3]);
  manager.joinRoom(room.code, "s2", "Dany", "sock2", PLAYER_COLOR_PALETTE[1]);
  manager.startGame(room.code, "s1");
  const players = manager.getEngine(room.code)!.getState().players;
  assert.equal(players.find((p) => p.sessionId === "s1")?.color, PLAYER_COLOR_PALETTE[3]);
  assert.equal(players.find((p) => p.sessionId === "s2")?.color, PLAYER_COLOR_PALETTE[1]);
});

test("Fase 10, US-1005: due giocatori che vogliono lo stesso colore, solo il primo entrato lo tiene", () => {
  const { manager } = buildManager();
  const room = manager.createRoom("s1", "Yasser", "sock1", PLAYER_COLOR_PALETTE[0]);
  manager.joinRoom(room.code, "s2", "Dany", "sock2", PLAYER_COLOR_PALETTE[0]);
  manager.startGame(room.code, "s1");
  const players = manager.getEngine(room.code)!.getState().players;
  const colorS1 = players.find((p) => p.sessionId === "s1")?.color;
  const colorS2 = players.find((p) => p.sessionId === "s2")?.color;
  assert.equal(colorS1, PLAYER_COLOR_PALETTE[0]);
  assert.notEqual(colorS2, colorS1);
  assert.ok(PLAYER_COLOR_PALETTE.includes(colorS2!));
});

test("Fase 12, US-1203: lo sweep rimuove solo le stanze vuote da più della soglia configurata", () => {
  let current = 0;
  const shortManager = new LobbyManager(() => {}, () => current, 1000);

  const room = shortManager.createRoom("s1", "Yasser", "sock1");
  shortManager.joinRoom(room.code, "s2", "Dany", "sock2");

  // Tutti connessi: lo sweep non tocca nulla, qualunque sia il tempo trascorso.
  current = 10_000;
  assert.deepEqual(shortManager.sweepAbandonedRooms(), []);

  // s1 si disconnette, ma s2 resta: la stanza non è ancora vuota.
  shortManager.handleDisconnect("s1", "sock1");
  current = 10_500;
  assert.deepEqual(shortManager.sweepAbandonedRooms(), []);

  // Anche s2 si disconnette: ORA la stanza è vuota, il timer di abbandono riparte da qui.
  shortManager.handleDisconnect("s2", "sock2");
  current = 11_000; // solo 500ms dopo che l'ultimo giocatore si è disconnesso
  assert.deepEqual(shortManager.sweepAbandonedRooms(), []);

  current = 12_600; // oltre 1000ms dopo che la stanza è rimasta vuota
  assert.deepEqual(shortManager.sweepAbandonedRooms(), [room.code]);
  assert.throws(() => shortManager.getRoomState(room.code), /non trovata/);
});

test("Fase 12, US-1203: una riconnessione azzera il timer di abbandono", () => {
  let current = 0;
  const shortManager = new LobbyManager(() => {}, () => current, 1000);
  const room = shortManager.createRoom("s1", "Yasser", "sock1");
  shortManager.joinRoom(room.code, "s2", "Dany", "sock2");

  shortManager.handleDisconnect("s1", "sock1");
  shortManager.handleDisconnect("s2", "sock2");
  current = 500;
  shortManager.rejoin(room.code, "s1", "sock1-new");

  current = 2000; // oltre la soglia dall'istante in cui la stanza era rimasta vuota, ma s1 è tornato
  assert.deepEqual(shortManager.sweepAbandonedRooms(), []);
});

test("Fase 9, US-902: solo l'host può caricare una mappa personalizzata, e deve essere valida", () => {
  const { manager } = buildManager();
  const room = manager.createRoom("s1", "Yasser", "sock1");
  manager.joinRoom(room.code, "s2", "Dany", "sock2");

  const board = buildCustomBoard();
  assert.throws(() => manager.setCustomMap(room.code, "s2", board), /host/);

  const invalidBoard = buildCustomBoard();
  invalidBoard.tiles[3] = { ...invalidBoard.tiles[3], purchasePrice: undefined, group: undefined };
  assert.throws(() => manager.setCustomMap(room.code, "s1", invalidBoard), /non valida/);

  manager.setCustomMap(room.code, "s1", board);
  const roomState = manager.getRoomState(room.code);
  assert.equal(roomState.mapId, board.id);
  assert.deepEqual(roomState.customMap, {
    id: board.id,
    name: board.name,
    width: board.width,
    height: board.height,
    tileCount: board.tiles.length,
  });

  manager.startGame(room.code, "s1");
  const state = manager.getEngine(room.code)!.getState();
  assert.equal(state.board.id, board.id);
  assert.equal(state.board.tiles.length, board.tiles.length);
});

test("Fase 9, US-902: scegliere una mappa ufficiale abbandona quella personalizzata caricata", () => {
  const { manager } = buildManager();
  const room = manager.createRoom("s1", "Yasser", "sock1");
  manager.setCustomMap(room.code, "s1", buildCustomBoard());
  assert.ok(manager.getRoomState(room.code).customMap);

  manager.selectMap(room.code, "s1", "extended");
  const roomState = manager.getRoomState(room.code);
  assert.equal(roomState.mapId, "extended");
  assert.equal(roomState.customMap, null);
});

test("Fase 9, US-902: nessuna mappa personalizzata di default, non appare nello stato pubblico", () => {
  const { manager } = buildManager();
  const room = manager.createRoom("s1", "Yasser", "sock1");
  assert.equal(manager.getRoomState(room.code).customMap, null);
});
