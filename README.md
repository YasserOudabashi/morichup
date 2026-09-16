# Morichup

[![CI](https://github.com/YasserOudabashi/morichup/actions/workflows/ci.yml/badge.svg)](https://github.com/YasserOudabashi/morichup/actions/workflows/ci.yml)

Browser multiplayer economic game ispirato al gameplay classico di Monopoly e
all'esperienza UX di Richup.io, con identità visiva propria e sistemi sociali
aggiuntivi (trading, contratti, chat, pomodori).

> **Classic Monopoly first. Custom chaos second.**

Stato attuale: **scaffolding iniziale** — struttura del progetto e piano di
sviluppo. Nessuna feature di gioco è ancora implementata. Vedi
[`docs/ROADMAP.md`](docs/ROADMAP.md) per le fasi.

## Documentazione

- [`docs/PRD.md`](docs/PRD.md) — requisiti di prodotto completi
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — architettura tecnica
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — piano di sviluppo a fasi

## Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + TypeScript + Socket.IO (server authoritative)
- **Shared**: pacchetto `shared` con tipi condivisi tra client e server
- **Nessun database** nella fase iniziale — stato di gioco in memoria sul
  server (Classic mode non richiede persistenza cross-sessione)

## Struttura del repository

```
morichup/
├── client/     # React + TS + Vite — UI, board renderer, HUD, map editor
├── server/     # Node.js + TS + Socket.IO — game engine authoritative
├── shared/     # tipi TypeScript condivisi (GameState, eventi, ecc.)
└── docs/       # PRD, architettura, roadmap
```

## Sviluppo locale

Richiede Node.js 22+ (la suite di test del server usa i pattern glob di
`node --test`, non risolti correttamente su Node 20).

```bash
npm install

# terminale 1 — server
npm run dev:server

# terminale 2 — client
npm run dev:client
```

## Principi fondamentali

1. **Server authoritative**: il client non decide mai risultati di gioco
   (dadi, denaro, proprietà, turni...). Invia solo intent, riceve solo stato
   validato. Vedi `docs/ARCHITECTURE.md`.
2. **Classic mode first**: la modalità principale resta il più vicino
   possibile al Monopoly classico. Le meccaniche custom (contratti, eventi
   speciali) sono opzionali e modulari.
3. **Data-driven maps**: nessuna board è hardcoded nei componenti React. Le
   mappe sono descritte da `BoardConfig` e validate server-side.
4. **i18n centralizzato**: nessun testo hardcoded, tutto passa da `t(...)`.
