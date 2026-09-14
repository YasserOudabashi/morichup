# Morichup — Roadmap a fasi

Ogni fase termina con verifica e approvazione esplicita prima di iniziare la
successiva (nessuna fase viene concatenata automaticamente).

## Fase 0 — Scaffolding ✅

- Repository, struttura cartelle, documentazione (PRD, architettura,
  roadmap).
- Scaffold `client` (React + TS + Vite) e `server` (Node + TS + Socket.IO)
  minimi, senza logica di gioco.
- Nessuna feature giocabile.

## Fase 1 — Board classica statica (single player, no network) ✅

- `BoardConfig` della mappa Classic: 40 caselle, griglia 11×11 (layout
  strutturale identico al Monopoly tradizionale), tema "paesi del mondo",
  in `shared/src/maps/classic.ts` — dato puro, nessuna logica hardcoded nei
  componenti.
- Board renderer React (griglia CSS Grid, caselle con gruppo/prezzo, token
  giocatore con offset per lo stacking) senza engine di gioco.
- HUD statico (player list con dati finti, nessuna azione ancora attiva).
- Notice "Desktop recommended" sotto i 900px, come da requisito piattaforma.
- Verificato visivamente in browser (screenshot desktop + mobile).

## Fase 2 — Game engine locale (no network) ✅

- `GameEngine` authoritative completo: dadi (seedabili), movimento, acquisto/
  rifiuto proprietà, rent (con raddoppio da monopolio, scaling stazioni/
  utility), tasse, mazzi Fortune/Treasury (8 carte ciascuno, con logica di
  ripesca e carte "esci di prigione gratis"), prigione (3 doppi consecutivi,
  casella Go To Jail, cauzione, carta, 3 tentativi fissi), doppi con turno
  extra, bancarotta semplificata (pagamento parziale poi eliminazione,
  proprietà tornano alla banca) e controllo vittoria.
- Pattern intent/event: `applyIntent(playerId, intent) -> ServerEvent[]`,
  stessa forma che userà la Fase 3 sopra WebSocket.
- 29 test automatici deterministici (`node --test`, dadi "scriptati" via
  dependency injection) su motore, dadi, carte, board e calcolo rent.
- Demo in console (`npm run simulate --workspace server -- [seed]`) che fa
  giocare 3 bot sulla vera board Classic stampando ogni evento — verificata
  a mano prima del commit.
- Ancora nessuna connessione WebSocket: tutto gira in un solo processo.

## Fase 3 — Multiplayer real-time ✅

- `LobbyManager` server-side: stanze in memoria, codice a 6 caratteri,
  create/join/rejoin, host system (avvio partita, kick in lobby, host
  trasferito automaticamente se chi crea la stanza si disconnette in lobby).
- `SocketServer` (Socket.IO, eventi tipizzati end-to-end via `shared/socket.ts`):
  collega `LobbyManager`/`GameEngine` al client con lo stesso pattern
  intent/event della Fase 2 (`game_intent` → `ServerEvent[]`).
- Riconnessione: `playerSessionId` persistente in `localStorage`, rientro
  automatico dopo reload (`rejoin`), finestra di 60s con countdown broadcast
  a tutti, conversione automatica in AFK oltre la finestra (skippato nei
  turni, mantiene gli asset).
- Turn timer server-authoritative per stanza: se nessuno agisce entro
  `turnTimerSeconds`, il server applica un fallback (tira/rifiuta/fine
  turno) — mai una partita bloccata.
- Client: schermate Landing → Main Menu → Lobby (con link di invito
  copiabile, lista giocatori, controlli host) → Game (board reale, pannello
  azioni contestuale, log eventi, barra del turn timer, overlay di game
  over), tutte curate visivamente e completamente i18n (EN/IT, switch a
  runtime anche in partita).
- Verificato con un test end-to-end reale: due contesti browser separati
  (Playwright) che creano/joinano una stanza, giocano un turno con
  sincronizzazione realtime confermata, e testano disconnessione +
  riconnessione automatica.

## Fase 4 — Trading & contratti sociali

- `TradeEngine`: offerte, counter-offer, validazione server-side.
- `ContractEngine`: promesse, report, votazione Guilty/Not Guilty.
- UI trading (You Give / You Receive / Special Conditions).

## Fase 5 — Bancarotta, aste, vittoria

- `BankruptcyEngine` (liquidazione parziale, debt resolution).
- `AuctionEngine`.
- `VictoryEngine` e game-over screen.

## Fase 6 — Chat & feature sociali

- Global chat, whisper, reactions, moderazione base.
- Tomato system.

## Fase 7 — Map system & editor

- `MapValidator`, export/import JSON.
- Map editor visuale (dimensioni 8×8–15×15, tile types completi).
- Modalità Extended / Fortune / Custom.

## Fase 8 — i18n completo, polish, deploy

- Dizionari EN/IT completi su tutte le superfici (menu, lobby, partita,
  editor, errori, notifiche).
- Animazioni movimento/dadi, polish UI/HUD.
- Deploy (Docker, VPS) — dettagli da definire quando si arriva a questa
  fase.

---

Le fasi 1–2 sono propedeutiche e senza rete: permettono di validare
regole e rendering prima di introdurre la complessità del multiplayer
real-time.
