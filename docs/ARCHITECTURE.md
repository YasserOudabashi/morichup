# Morichup — Architettura tecnica

## Panoramica

```
┌────────────────────┐        WebSocket (Socket.IO)        ┌────────────────────┐
│       client        │ ───────────────────────────────────▶ │       server        │
│  React + TS + Vite  │ ◀─────────────────────────────────── │ Node.js + TS        │
│  render + intent     │         state / events              │ authoritative engine │
└────────────────────┘                                       └────────────────────┘
          ▲                                                            │
          │                    shared types                           │
          └───────────────────────  shared/  ─────────────────────────┘
```

Regola assoluta: **il server è l'unica autorità**. Il client invia solo
`intent` (es. `ROLL_DICE`, `BUY_PROPERTY`, `SEND_TRADE_OFFER`), il server
valida, applica la regola, genera eventuale randomness, aggiorna lo stato e
fa broadcast. Il client anima ciò che riceve, non decide mai un risultato.

## Struttura del repository

```
morichup/
├── client/
│   └── src/
│       ├── components/     # board renderer, HUD, modali, map editor UI
│       ├── i18n/           # dizionari en/it + helper t()
│       └── styles/         # tema, palette, animazioni
├── server/
│   └── src/
│       ├── game/           # game engine authoritative (vedi sotto)
│       ├── lobby/          # room/lobby management, host system
│       ├── ws/             # Socket.IO server, gestione eventi/intent
│       └── maps/           # BoardConfig di default (classic.json, ...)
└── shared/
    └── src/                # tipi condivisi: GameState, eventi, intent, BoardConfig
```

## Game engine (`server/src/game/`)

| Modulo | Responsabilità |
|---|---|
| `GameEngine` | orchestratore: riceve intent validati, applica le regole, produce il nuovo `GameState` |
| `GameState` | stato immutabile/serializzabile dell'intera partita |
| `Player` | denaro, proprietà, posizione, stato (attivo/AFK/spectator/bankrupt) |
| `Board` / `Tile` | struttura della mappa, percorso, risoluzione casella |
| `DiceEngine` | generazione dadi server-side (seedabile per determinismo) |
| `CardEngine` | Chance / Community Chest, deck e pescate |
| `TradeEngine` | offerte, counter-offer, validazione, esecuzione scambio |
| `ContractEngine` | promesse sociali collegate ai trade, accuse, votazioni |
| `AuctionEngine` | asta server-authoritative dopo rifiuto acquisto |
| `BankruptcyEngine` | debito, liquidazione parziale, dichiarazione bancarotta |
| `VictoryEngine` | verifica condizioni di vittoria dopo ogni eliminazione |
| `GameRules` | configurazione della modalità (starting money, timer, asta on/off, ecc.) |

Il `GameEngine` deve essere **deterministico** a parità di input e random
seed — nessuna dipendenza da `Date.now()`/`Math.random()` non seedato
all'interno del motore.

## State machine

```
LOBBY → GAME_START → TURN_START → ROLLING → MOVING → TILE_RESOLUTION
→ PLAYER_DECISION → BUILDING/BUYING/OTHER → TURN_END → NEXT_TURN
```

Stati concorrenti (non bloccano il turno corrente quando le regole lo
consentono): `TRADING`. Stati che sospendono il turno: `AUCTION`,
`DEBT_RESOLUTION`, `BANKRUPTCY`, `PAUSED`. Stati terminali/di transizione:
`GAME_OVER`, `SPECTATING`.

## Comunicazione client ↔ server

Pattern intent/event, tipizzato in `shared/`:

```ts
// client → server (intent)
{ type: "ROLL_DICE" }
{ type: "BUY_PROPERTY", tileId }
{ type: "SEND_TRADE_OFFER", offer }

// server → client (broadcast)
{ type: "DICE_RESULT", values: [3, 4], playerId }
{ type: "STATE_UPDATE", state: GameState }
{ type: "PLAYER_DISCONNECTED", playerId, timeoutSeconds: 60 }
```

Ogni intent viene validato server-side contro lo stato corrente prima di
essere applicato (turno del giocatore giusto, fondi sufficienti, asset
posseduti, regole della modalità, ecc.).

## Map system

Nessuna board è hardcoded nei componenti React: ogni mappa è un
`BoardConfig` (id, name, version, width, height, tiles, rules, theme)
caricato dal server, validato da `MapValidator` prima dell'uso e inviato al
client per il rendering. Il Map Editor produce lo stesso formato JSON,
validato server-side prima di poter essere giocato (niente codice
arbitrario, XSS, valori impossibili).

## Reconnection

Il server identifica i giocatori tramite `playerSessionId` persistente
(non tramite socket id, che cambia ad ogni riconnessione). Alla
disconnessione lo stato del giocatore resta in memoria per 60s
(countdown broadcast a tutti); alla riconnessione con lo stesso
`playerSessionId` lo stato viene ricollegato al nuovo socket.

## Principi di sicurezza / validazione

- Mai fidarsi del payload client: ogni intent è rivalidato contro lo stato
  server-side corrente.
- Randomness (dadi, carte, aste, eventi) generata esclusivamente
  server-side.
- Import di mappe custom validato da `MapValidator` prima di qualunque uso
  in partita.
- Rate limiting su chat e azioni sociali (tomato, whisper) lato server.
