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

## Fase 2 — Game engine locale (no network)

- Implementazione `GameEngine`, `GameState`, `DiceEngine`, `Board`/`Tile`
  in `server/src/game/` con test unitari deterministici.
- Turn flow completo (roll → move → tile resolution → buy/decline → end
  turn) eseguibile in locale (in-memory, singolo processo).
- Ancora nessuna connessione WebSocket.

## Fase 3 — Multiplayer real-time

- Server Socket.IO: lobby, room code, join/create, host system.
- Collegamento client ↔ server con pattern intent/event authoritative.
- Reconnection system (60s, `playerSessionId`).
- Turn timer server-authoritative.

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
