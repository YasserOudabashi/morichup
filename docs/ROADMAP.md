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

## Fase 4 — Trading & contratti sociali ✅

- `TradeEngine`: validazione ownership/denaro e esecuzione dello scambio
  (cash + proprietà). `TradeOffer` con `id` stabile per tutta la
  negoziazione; una controfferta (`COUNTER_TRADE`) scambia i ruoli
  fromPlayer/toPlayer e incrementa `version`, rendendo automaticamente
  inattiva l'offerta precedente (nessuna race condition: un solo oggetto
  mutato in sequenza).
- Trading disponibile in qualsiasi momento, anche fuori dal proprio turno
  (PRD §20): gli intent di scambio bypassano il controllo "è il tuo turno"
  nel `GameEngine`.
- `ContractEngine`: un trade accettato con `specialConditions` non vuoto
  crea un `Contract` (promessa) tra le due parti. `REPORT_BROKEN_PROMISE`
  apre un'accusa; voto Guilty/Not Guilty riservato ai giocatori attivi
  esclusi accusatore e accusato, risolta quando tutti gli aventi diritto
  hanno votato oppure scade la finestra di 30s (fallback server-side in
  `SocketServer`, stesso pattern del turn timer). Verdetto Guilty → multa
  fissa di $100 alla banca (riusa `payAmount`, quindi anche la bancarotta
  per chi non può pagare è già gestita).
- UI: pannello "Trades" (You Give / You Receive, proprietà con checkbox,
  campo promessa) sempre accessibile dall'HUD di gioco, con controfferta
  pre-compilata; pannello "Promises" con segnalazione; card di accusa con
  conteggio voti in tempo reale. Stessa cura visiva delle schermate
  precedenti.
- 8 nuovi test automatici deterministici su trade/controfferte/accuse
  (incluso `forceResolveAccusation` per il timeout).
- Verificato con un test end-to-end reale a **3** browser Playwright: uno
  scambio in denaro con promessa fuori turno, sincronizzato su tutti i
  client; segnalazione della promessa infranta; voto dell'unico giocatore
  eleggibile; multa applicata e sincronizzata ovunque.

## Fase 5 — Bancarotta, debiti, aste, multi-mappa, tema scuro, deploy ✅

- Bancarotta vera con trattativa del debito (`pendingDebts`, vendita diretta
  alla banca, `DECLARE_BANKRUPTCY`), sistema aste completo (banca e
  giocatore-iniziato con prezzo minimo).
- 4 mappe (Classic/Extended/Fortune/Quick) selezionabili dall'host in lobby.
- Tema scuro di default, evidenziazione proprietà al hover, bandiere per
  ogni casella-nazione.
- Setup di deploy (client Vercel, server always-on separato) e fix del
  comando di produzione del server.

## Fasi 6-12 — vedi `docs/PRD_FASE6.md`

Le fasi seguenti sono state ripianificate con maggiore dettaglio (user
stories, requisiti puntuali, criteri di accettazione) in
`docs/PRD_FASE6.md`, che sostituisce gli stub sotto. Riepilogo rapido, in
ordine di implementazione consigliato:

- **Fase 6 — Costruzione di case e hotel**: priorità immediata, unica vera
  lacuna rispetto al game engine core già previsto dalla PRD originale (§13).
- **Fase 7 — Regole economiche opzionali**: ipoteca (opzionale, off di
  default), jackpot al Parcheggio Gratuito, modalità "quick game" a
  tempo/turni limitati.
- **Fase 8 — Feature sociali**: chat di stanza, modalità spettatore,
  rivincita a fine partita.
- **Fase 9 — Editor di mappe**: `MapValidator`, editor visuale, export/import
  JSON (già pianificata come Fase 7 nella versione precedente di questa
  roadmap, mai iniziata).
- **Fase 10 — Personalizzazione, UX, accessibilità**: supporto mobile reale,
  animazioni movimento/dadi, audio, notifica turno, avatar, accessibilità.
- **Fase 11 — Dati di partita**: cronologia e replay, salvati lato client
  (nessun database server-side).
- **Fase 12 — Infrastruttura & qualità**: test automatici lato client,
  pipeline CI, pulizia stanze abbandonate, stanze con password.

---

Le fasi 1–2 sono propedeutiche e senza rete: permettono di validare
regole e rendering prima di introdurre la complessità del multiplayer
real-time.
