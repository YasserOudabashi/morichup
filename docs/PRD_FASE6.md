# Morichup — PRD Fasi 6-12 (post Fase 5)

Le Fasi 0-5 (scaffold, board, game engine, multiplayer, trading/contratti,
bancarotta/debiti/aste) sono complete e mergiate su `main`. Questo documento
sostituisce gli stub di Fase 6-8 in `docs/ROADMAP.md` con un piano dettagliato
per tutto il lavoro rimasto, riorganizzato in 7 fasi più piccole e coerenti.

Principi tecnici invariati per tutto questo lavoro (vedi `docs/ARCHITECTURE.md`):
server authoritative (il client invia solo `ClientIntent`, il server valida/
applica/fa broadcast di `ServerEvent[]`), nessun database (stato in memoria,
si perde al riavvio del server), i18n centralizzato via `t()` (EN/IT, zero
testo hardcoded), test deterministici (`node --test`, dadi/mazzi "scriptati").
Ogni fase termina con verifica e approvazione esplicita prima della successiva,
come per le Fasi 0-5.

## Ordine di implementazione consigliato

| # | Fase | Perché in questo ordine |
|---|------|--------------------------|
| 1 | **Fase 6 — Costruzione case/hotel** ✅ | Unica vera lacuna rispetto al motore di gioco *core* già previsto dalla PRD originale (§13); senza building, "Classic Monopoly first" non è ancora vero. Tutto il resto è feature aggiuntiva, non correzione di uno scope mancante. |
| 2 | **Fase 6.5 — Visual core** | Riprioritizzata sopra le Fasi 7-9 su richiesta esplicita: il gameplay (P0) è completo e testato, ma manca il "game feel" — dadi senza animazione, pedina che teletrasporta, proprietario poco leggibile. Vedi sotto. |
| 3 | Fase 7 — Regole economiche opzionali | Estende naturalmente il lavoro appena fatto su building/economia (ipoteca, jackpot, quick game), stessa area di codice (`GameEngine`, `GameRules`). |
| 4 | Fase 8 — Feature sociali | Chat, whisper, lancio di pomodori, voting UI dedicata per le promesse, spettatore, rivincita — usa pattern già rodati (bypass del turno, pannelli client) da Fase 4. |
| 5 | Fase 9 — Editor di mappe | Dipende da un game engine e da un set di regole ormai stabili (building incluso) prima di esporre un editor che li deve rispettare tutti. |
| 6 | Fase 10 — Personalizzazione, UX, accessibilità | Mobile, audio, avatar, notifiche turno, accessibilità: polish che non blocca nessun'altra fase. |
| 7 | Fase 11 — Dati di partita | Ha senso solo dopo che il set di eventi/regole è stabile (altrimenti cronologia e statistiche vanno riscritte). |
| 8 | Fase 12 — Infrastruttura & qualità | Test client, CI, cleanup stanze, stanze con password, developer mode: si accumulano in parallelo o alla fine. |

---

## Fase 6.5 — Visual core

### Introduzione

Il gameplay è server-authoritative e completo, ma "sembra" statico: nessuna
animazione dei dadi, la pedina salta direttamente da una casella all'altra
invece di percorrerle, il proprietario di una casella non si vede a colpo
d'occhio. Questa fase copre esattamente quei punti, in ordine di priorità
dichiarata (dadi > movimento > ownership > case/hotel > action area).
Nessuna di queste modifiche cambia lo stato di gioco: animano eventi che il
server ha già deciso, mai lo anticipano né lo inventano lato client.

### Sotto-fasi

1. **Animazione dadi** (priorità più alta): due dadi visibili, animazione di
   "tumble" avviata alla ricezione dell'evento `DICE_RESULT`, si ferma sui
   valori reali mandati dal server. Mai un valore inventato lato client.
2. **Movimento casella-per-casella**: la pedina attraversa ogni casella
   intermedia tra `from` e `to` (evento `PLAYER_MOVED`, con gestione del giro
   quando `passedGo`), invece di teletrasportarsi. Richiede di spostare il
   rendering dei token da "dentro ogni Tile" a un livello assoluto sopra la
   griglia, con un nodo DOM persistente per giocatore (necessario per poter
   animare una transizione CSS reale).
3. **Ownership visualization**: bordo/tint colorato del proprietario sempre
   visibile sulla casella, non solo tramite hover.
4. **Leggibilità case/hotel**: le icone già aggiunte in Fase 6 sono piccole;
   vanno ingrandite/rese a contrasto più alto, con una piccola animazione
   alla costruzione/vendita.
5. **Action area e turn indicator**: il pulsante Roll/azione corrente deve
   essere il punto focale quando è il proprio turno; il cambio di turno deve
   avere un feedback visivo chiaro (non solo testo "Waiting for X").

Ogni sotto-fase viene implementata, verificata (build + Playwright) e
committata separatamente, con lo stesso ritmo delle fasi precedenti.

### Non-Goals

- Nessuna riscrittura dello stack (resta Vite+React+Socket.IO+Express, in
  memoria — deciso esplicitamente: il brief permette di mantenere uno stack
  esistente "ragionevole").
- Nessun asset audio in questa fase (l'architettura resta "audio-ready": i
  punti di aggancio per i suoni — roll, acquisto, rent, turno — vanno
  lasciati ovvi nel codice, ma i file audio arrivano solo in Fase 10 se
  richiesti).

---

## Fase 6 — Costruzione di case e hotel

### Introduzione

Il modello dati (`Tile.houseCost`, `hotelCost`, `houses`, `hotel`,
`rentLevels`) e la PRD originale (§13: "Building: solo nel proprio turno;
acquisto/vendita case e hotel") prevedono già questa meccanica, ma il motore
non la implementa: nessun `ClientIntent` esiste per costruire, `computeRent`
non ha mai un `houses > 0` da leggere. È il pezzo di Monopoly classico più
importante ancora mancante.

### Goals

- Un giocatore che possiede l'intero gruppo colore può costruire case (fino a
  4) e poi un hotel (che sostituisce le 4 case) su ognuna delle sue proprietà
  di quel gruppo, solo nel proprio turno.
- Il rent riflette il numero di case/hotel (`rentLevels[houses-1]` per le
  case, un valore dedicato per l'hotel).
- Building "even": non si può costruire una terza casa su una proprietà se
  le altre del gruppo ne hanno ancora 0 o 1 (differenza massima di 1 casa tra
  le proprietà dello stesso gruppo) — regola classica del Monopoly, evita che
  un giocatore concentri tutto il rent su una sola casella.
- Si possono vendere case/hotel alla banca a metà del costo di costruzione,
  con lo stesso vincolo "even" al contrario.

### User Stories

#### US-601: Costruire una casa
**Descrizione:** Come giocatore che possiede l'intero gruppo colore, voglio
costruire una casa su una mia proprietà nel mio turno, per aumentare il rent
che gli altri mi pagano.

**Criteri di accettazione:**
- [ ] Nuovo `ClientIntent`: `{ type: "BUILD_HOUSE", tileId }`.
- [ ] Il server rifiuta se: non è il turno del giocatore, il giocatore non
  possiede l'intera color-group, la proprietà ha già 4 case o un hotel, il
  giocatore non ha abbastanza denaro per `houseCost`, la regola "even" non è
  rispettata (questa proprietà avrebbe più di 1 casa in più di quella col
  minimo nel gruppo).
- [ ] Successo: `tile.houses++`, `player.money -= houseCost`, evento
  `HOUSE_BUILT { playerId, tileId, houses }`.
- [ ] Test automatico: costruzione valida, e ognuno dei rifiuti sopra come
  test separato.

#### US-602: Costruire un hotel
**Descrizione:** Come giocatore con 4 case su una proprietà, voglio poterla
convertire in hotel, per il rent massimo.

**Criteri di accettazione:**
- [ ] `BUILD_HOUSE` sulla stessa proprietà quando `houses === 4` costruisce
  l'hotel invece (stesso intent, non uno nuovo): `tile.hotel = true`,
  `tile.houses = 0`, `player.money -= hotelCost`.
- [ ] Vincolo "even" per l'hotel: tutte le altre proprietà del gruppo devono
  avere già 4 case (o hotel) prima di poter costruire l'hotel su questa.
- [ ] Evento `HOTEL_BUILT { playerId, tileId }`.
- [ ] Test automatico su costruzione valida e sul vincolo "even".

#### US-603: Vendere case/hotel alla banca
**Descrizione:** Come giocatore, voglio poter vendere case/hotel per fare
liquidità (anche per risolvere un debito, riusando `SELL_PROPERTY_TO_BANK`
solo dopo aver liberato la proprietà da edifici).

**Criteri di accettazione:**
- [ ] Nuovo `ClientIntent`: `{ type: "SELL_HOUSE", tileId }`.
- [ ] Un hotel venduto torna a 4 case (non si perde tutto in un colpo);
  un'ulteriore vendita toglie una casa alla volta.
- [ ] Prezzo di vendita: metà di `houseCost`/`hotelCost`, accreditato subito
  (`player.money += ...`).
- [ ] Stesso vincolo "even" al contrario: non si può vendere una casa se
  altre proprietà del gruppo ne hanno di meno.
- [ ] Disponibile anche fuori dal proprio turno se il giocatore ha debiti
  pendenti (bypassa il controllo turno, come `SELL_PROPERTY_TO_BANK`), per
  restare coerente con la Fase 5.
- [ ] Evento `HOUSE_SOLD { playerId, tileId, amount }`.
- [ ] Test automatico su vendita valida, vincolo "even", e sblocco di un
  debito tramite vendita di case.

#### US-604: Il rent riflette gli edifici
**Descrizione:** Come giocatore che atterra su una proprietà con case/hotel,
voglio pagare il rent corretto in base al livello di sviluppo.

**Criteri di accettazione:**
- [ ] `computeRent` in `Tile.ts` usa `rentLevels[tile.houses - 1]` quando
  `houses > 0`, un valore dedicato quando `tile.hotel === true` (già presente
  come ultimo elemento di `rentLevels` o campo separato — allineare al dato
  già generato nelle mappe esistenti).
  Nota: rileggere `shared/src/maps/*.ts` prima di sviluppare per confermare quanti
  elementi ha oggi `rentLevels` per ogni proprietà e se serve estendere il
  generatore mappe con un livello aggiuntivo per l'hotel.
- [ ] Test automatico: rent con 0/1/2/3/4 case e con hotel.

#### US-605: UI di costruzione
**Descrizione:** Come giocatore, voglio un modo semplice per vedere quali
proprietà posso sviluppare e costruire/vendere case da lì.

**Criteri di accettazione:**
- [ ] Nel pannello "Le tue proprietà" (già esistente in `SocialPanel.tsx`),
  ogni proprietà che fa parte di un gruppo interamente posseduto mostra il
  numero di case attuali (icone 🏠 ripetute o testo "2/4 case") e, solo nel
  proprio turno, pulsanti "Costruisci" / "Vendi" con il prezzo.
- [ ] Le caselle sulla board (`Tile.tsx`) mostrano visivamente case/hotel
  (icone piccole, stile coerente col resto della board — riusare l'approccio
  già usato per le bandiere).
- [ ] Nuove chiavi i18n EN/IT per tutti i testi sopra.
- [ ] Verificato in browser (Playwright, come per debiti/aste): un giocatore
  con un gruppo completo costruisce case fino a 4, poi un hotel, vede il rent
  aumentare quando un altro giocatore ci atterra sopra.

### Functional Requirements

- FR-601: `ClientIntent` guadagna `BUILD_HOUSE { tileId }` e
  `SELL_HOUSE { tileId }`.
- FR-602: entrambi passano dal controllo "è il tuo turno" tranne quando il
  giocatore ha `pendingDebts.length > 0` (stesso bypass di
  `SELL_PROPERTY_TO_BANK`).
- FR-603: building/selling richiede possesso dell'intero color-group (tutte
  le tile con lo stesso `group` hanno `ownerId === playerId`), nessuna
  proprietà del gruppo ipotecata (se la Fase 7 introduce l'ipoteca) e nessuna
  in corso d'asta.
- FR-604: regola "even": `max(houses del gruppo) - min(houses del gruppo) <= 1`
  deve restare vera dopo ogni build/sell (contando l'hotel come 5 "livelli"
  ai fini del confronto, o secondo la convenzione scelta in fase di sviluppo
  — da fissare leggendo prima il dato reale delle mappe).
- FR-605: `computeRent` (in `server/src/game/Tile.ts`) usa il livello di
  case/hotel per calcolare il rent dovuto.
- FR-606: gli eventi `HOUSE_BUILT`, `HOTEL_BUILT`, `HOUSE_SOLD` vengono
  aggiunti a `ServerEvent` e resi leggibili in `EventLog.tsx`.

### Non-Goals

- Niente limite globale di case/hotel disponibili "in banca" (le edizioni da
  tavolo hanno un numero fisso di pezzi; qui semplificato, sempre disponibili).
- Nessun impatto sul valore di vendita della proprietà nuda (resta
  `purchasePrice / 2`, invariato dalla Fase 5) — solo case/hotel hanno un
  proprio prezzo di vendita separato.

### Technical Considerations

- Riusare `payAmount`/`tryResolveDebts` per la vendita di case durante una
  situazione di debito, esattamente come già fa `handleSellPropertyToBank`.
- Verificare se `rentLevels` nei dati mappa esistenti (`shared/src/maps/*.ts`)
  ha già abbastanza livelli per 4 case + hotel prima di scrivere
  `computeRent`; se manca un livello, va rigenerato il dato (non a mano:
  aggiornare lo script/generatore usato per crearli, se esiste, altrimenti
  editarli in modo consistente su tutte e 4 le mappe).

### Success Metrics

- Una partita a 2+ giocatori giocata fino in fondo può includere almeno un
  ciclo completo build→hotel→vendita, verificato end-to-end.

---

## Fase 7 — Regole economiche opzionali

### Introduzione

Tre aggiunte economiche che estendono le regole Classic senza intaccarle di
default: ipoteca (mai voluta come default in Fase 5, ma richiesta ora come
opzione), regole "house rule" comuni (jackpot al Parcheggio Gratuito), e
varianti "quick game" con limiti di tempo/turni.

### User Stories

#### US-701: Attivare/disattivare l'ipoteca in lobby
**Descrizione:** Come host, voglio poter abilitare l'ipoteca delle proprietà
per la partita che sto per creare, restando disattivata di default.

**Criteri di accettazione:**
- [ ] `GameRules` guadagna `mortgageEnabled: boolean` (default `false`).
- [ ] Toggle in `Lobby.tsx`, visibile solo all'host, accanto al selettore
  mappa.
- [ ] Quando `false`, tutto resta come oggi (solo vendita diretta).

#### US-702: Ipotecare una proprietà
**Descrizione:** Come giocatore in una partita con ipoteca attiva, voglio
ipotecare una proprietà per liquidità immediata senza perderla del tutto.

**Criteri di accettazione:**
- [ ] Nuovo intent `MORTGAGE_PROPERTY { tileId }`: incassa metà
  `purchasePrice`, imposta `tile.mortgaged = true`; la proprietà smette di
  generare rent finché resta ipotecata; richiede zero case/hotel sopra
  (vanno vendute prima).
- [ ] Nuovo intent `UNMORTGAGE_PROPERTY { tileId }`: ripaga metà prezzo più
  un interesse fisso (10%, valore in `GameRules`), `tile.mortgaged = false`.
- [ ] Se `mortgageEnabled === false`, entrambi gli intent vengono rifiutati.
- [ ] Test automatico su entrambi i percorsi, incluso il rifiuto quando
  disattivata.

#### US-703: Jackpot al Parcheggio Gratuito
**Descrizione:** Come host, voglio poter attivare la regola per cui tasse e
multe vanno in un piatto raccolto da chi atterra su Free Parking.

**Criteri di accettazione:**
- [ ] `GameRules` guadagna `freeParkingJackpot: boolean` (default `false`).
- [ ] Quando attiva, ogni pagamento verso la banca (`payAmount` con
  `payee: null`) alimenta un `state.jackpotAmount` invece di sparire; chi
  atterra su Free Parking lo incassa e lo azzera.
- [ ] Toggle in Lobby, visibile in HUD quando attivo (importo accumulato).
- [ ] Test automatico: tasse/multe che si accumulano, incasso su Free
  Parking, azzeramento.

#### US-704: Modalità "quick game"
**Descrizione:** Come host, voglio poter impostare un limite di turni o di
tempo totale, per partite più brevi con amici che hanno poco tempo.

**Criteri di accettazione:**
- [ ] `GameRules` guadagna `turnLimit?: number` e `gameTimeLimitMinutes?: number`
  (entrambi opzionali, nessuno attivo di default).
- [ ] Al raggiungimento del limite, vince chi ha il patrimonio netto più alto
  (cash + proprietà/case al valore nominale, non a metà prezzo) invece di
  aspettare l'ultimo giocatore non bancarottato; evento `GAME_OVER` con un
  campo che distingue "vittoria per bancarotta altrui" da "vittoria a tempo/turni".
- [ ] Toggle + input numerico in Lobby.
- [ ] Test automatico sul calcolo del vincitore a limite raggiunto.

### Functional Requirements

- FR-701: tre nuovi flag opzionali in `GameRules`, tutti `false`/assenti di
  default — nessuna modifica di comportamento per chi non li attiva.
- FR-702: `MORTGAGE_PROPERTY`/`UNMORTGAGE_PROPERTY` bypassano il controllo
  turno solo per la disattivazione (ripagare un'ipoteca dovrebbe essere
  sempre possibile, anche fuori turno, per liberarsi rapidamente da un
  debito); l'attivazione resta nel proprio turno.
- FR-703: il jackpot è un contatore su `GameState`, azzerato e trasferito
  solo tramite `resolveLanding` sulla casella Free Parking.
- FR-704: il controllo limite-turni/tempo va valutato in `advanceToNextPlayer`
  (turni) e con un controllo lato server ad ogni evento (tempo), non lato
  client.

### Non-Goals

- Niente aste per le proprietà ipotecate (restano semplicemente "congelate"
  finché il proprietario non le riscatta).
- Nessuna combinazione complessa tra jackpot e regole di bancarotta esistenti
  oltre a "il jackpot è un pagamento verso payee: null come un altro".

---

## Fase 8 — Feature sociali

### Introduzione

Chat, spettatori e rivincita: il layer sociale attorno alla partita, oltre a
trading/contratti già esistenti.

### User Stories

#### US-801: Chat di stanza
**Descrizione:** Come giocatore, voglio scrivere messaggi visibili a tutti
nella stanza, per coordinarmi/scherzare durante la partita.

**Criteri di accettazione:**
- [ ] Nuovo evento socket `chat_message` (client→server: `{code, text}`;
  server→client broadcast: `{playerId, nickname, text, timestamp}`), non un
  `ClientIntent`/`ServerEvent` del `GameEngine` (la chat non è stato di
  gioco, non deve essere replicata/validata dal motore).
- [ ] Rate limit server-side minimo (es. max 1 messaggio/secondo per
  giocatore) per evitare spam accidentale.
- [ ] Testo troncato a una lunghezza massima (es. 300 caratteri), sanitizzato
  come testo semplice (nessun HTML/markdown eseguito).
- [ ] UI: pannello chat nel game screen (nuovo componente `ChatPanel.tsx`),
  scroll automatico sull'ultimo messaggio, funziona anche in lobby.
- [ ] Verificato in browser con 2+ contesti Playwright: messaggio scritto da
  A appare su B in tempo reale.

#### US-802: Modalità spettatore
**Descrizione:** Come persona con un link a una stanza già piena o già in
partita, voglio poter guardare senza giocare.

**Criteri di accettazione:**
- [ ] `joinRoom` accetta uno spettatore quando la stanza è piena o già
  `playing`: il giocatore entra con `status: "spectator"` (già nel tipo,
  mai usato) invece di essere rifiutato.
- [ ] Uno spettatore vede la board e l'HUD in sola lettura: nessun
  `ActionPanel`, nessuna possibilità di inviare intent di gioco (il server
  li rifiuta comunque, ma il client non li offre nemmeno).
- [ ] Uno spettatore può comunque scrivere in chat (separata o taggata
  "spettatore", scelta di design da confermare in fase di sviluppo).
- [ ] Test automatico lato server: uno spettatore che tenta un
  `ClientIntent` di gioco viene rifiutato.

#### US-803: Rivincita a fine partita
**Descrizione:** Come gruppo di giocatori a fine partita, vogliamo poter
iniziarne subito un'altra senza ricreare la stanza da capo.

**Criteri di accettazione:**
- [ ] Nell'overlay di game-over, un pulsante "Rivincita" (solo host) che
  resetta lo stato: nuovi `Player` con `startingMoney`, board pulita,
  `status: "lobby"`, stessi giocatori/stessa stanza.
- [ ] Gli altri giocatori vedono automaticamente la lobby riapparire (stesso
  meccanismo di `room_state` già esistente).
- [ ] Test automatico: dopo `GAME_OVER`, `REMATCH` (nuovo intent lobby, non
  di gioco) riporta la stanza a `status: "lobby"` con giocatori invariati e
  un nuovo `GameEngine`.

### Functional Requirements

- FR-801: la chat vive in `SocketServer.ts`/`LobbyManager`, non in
  `GameEngine` (nessun impatto sul determinismo del motore di gioco).
- FR-802: lo stato `"spectator"` va escluso ovunque il codice oggi filtra
  per giocatori "attivi" ai fini di turno/voto/asta (`eligibleVoters`,
  `computeAuctionTurnOrder`, `advanceToNextPlayer` già escludono status
  diversi da "active": verificare che "spectator" sia coperto dagli stessi
  filtri, non serve introdurne di nuovi se già scritti come "status !== active").
- FR-803: `REMATCH` è un evento di `LobbyManager`, non del `GameEngine` (crea
  una nuova istanza di `GameEngine`, non muta quella esistente).

### Non-Goals

- Niente messaggi privati/whisper tra due giocatori in questa fase (solo
  chat di stanza pubblica) — eventuale estensione futura.
- Nessuna moderazione automatica (filtro parolacce, ban) in questa fase.

---

## Fase 9 — Editor di mappe personalizzate

*(Già pianificata come Fase 7 nella roadmap originale, mai iniziata; qui solo
rinumerata per coerenza con questo documento.)*

### Introduzione

Un editor visuale che genera un `BoardConfig` valido, riusando la stessa
board renderer già esistente per le 4 mappe ufficiali.

### User Stories

#### US-901: Creare una mappa da zero
**Descrizione:** Come utente, voglio disegnare una board personalizzata
(dimensioni, caselle, gruppi/colori, prezzi) senza scrivere codice.

**Criteri di accettazione:**
- [ ] Editor visuale: griglia dimensionabile (8×8–15×15, coerente col
  generatore `coordFor` già esistente), click su una cella per assegnarle
  tipo/nome/gruppo/prezzo tramite un form laterale.
- [ ] Validazione (`MapValidator`, nuovo modulo in `shared/`): esattamente 4
  angoli geometrici corretti (riusa la logica già scritta per verificare le
  4 mappe ufficiali in fase di generazione), nessuna posizione duplicata,
  ogni proprietà ha i campi richiesti dal suo `type`.
- [ ] Verificato in browser: una mappa creata nell'editor è effettivamente
  giocabile end-to-end (crea partita, selezionala, gioca un turno).

#### US-902: Salvare/condividere una mappa
**Descrizione:** Come utente, voglio esportare la mia mappa e importarne una
creata da altri.

**Criteri di accettazione:**
- [ ] Export/import come file JSON (`BoardConfig` serializzato), nessun
  salvataggio server-side persistente (coerente con "nessun database": le
  mappe custom vivono nel browser di chi le ha create, `localStorage` +
  export/import file, non un registro condiviso).
- [ ] Un host può caricare una mappa custom (file JSON) al posto di
  scegliere una delle 4 ufficiali, validata prima di essere accettata.

### Functional Requirements

- FR-901: `MapValidator.validate(board: BoardConfig): {valid: boolean, errors: string[]}`
  in `shared/src/maps/validator.ts`, riusato sia dall'editor client sia dal
  server quando riceve `select_map` con una mappa custom.
- FR-902: il server deve validare comunque qualsiasi `BoardConfig` custom
  ricevuto prima di avviare una partita — mai fidarsi del client anche qui.

### Non-Goals

- Nessun "marketplace" di mappe condivise tra utenti in questa fase (solo
  file JSON locali).

---

## Fase 10 — Personalizzazione, UX, accessibilità

### Introduzione

Cinque aggiunte di rifinitura che migliorano l'esperienza senza toccare le
regole di gioco: mobile, animazioni, audio, avatar, accessibilità.

### User Stories

#### US-1001: Supporto mobile reale
**Descrizione:** Come giocatore su telefono/tablet, voglio poter giocare
invece di vedere solo l'avviso "usa desktop".

**Criteri di accettazione:**
- [ ] Layout responsive sotto i 900px: HUD e pannello azioni diventano
  schede/tab invece di colonne fisse laterali, board scalata a piena
  larghezza.
- [ ] Touch: nessuna interazione che dipende da hover (es. l'evidenziazione
  proprietà su hover del nome giocatore, Fase "tema scuro", va affiancata da
  un tap esplicito su mobile).
- [ ] Verificato in browser con viewport mobile (Playwright device
  emulation).

#### US-1002: Animazioni di movimento e dadi
**Descrizione:** Come giocatore, voglio vedere la pedina muoversi casella
per casella e i dadi "tirare" visivamente, invece di un salto istantaneo.

**Criteri di accettazione:**
- [ ] Il token si sposta con una transizione CSS/JS casella-per-casella
  lungo il percorso (non un salto diretto alla destinazione), rispettando il
  giro del percorso quando passa da Go.
- [ ] Piccola animazione dei due dadi al tiro (CSS keyframes, no asset
  esterni pesanti).
- [ ] Le animazioni non bloccano la ricezione di nuovi `ServerEvent` (se
  arriva un evento mentre l'animazione precedente è in corso, si accoda o si
  interrompe in modo pulito — da decidere in fase di sviluppo).

#### US-1003: Audio
**Descrizione:** Come giocatore, voglio effetti sonori per le azioni
principali e un toggle per disattivarli.

**Criteri di accettazione:**
- [ ] Suoni per: tiro dadi, acquisto proprietà, pagamento rent, turno che
  inizia, bancarotta.
- [ ] Toggle mute/volume persistito in `localStorage`, visibile nella
  topbar.
- [ ] Asset audio leggeri (pochi KB ciascuno), nessuna libreria esterna
  pesante.

#### US-1004: Notifica quando tocca a te
**Descrizione:** Come giocatore con la tab in background, voglio essere
avvisato quando torna il mio turno.

**Criteri di accettazione:**
- [ ] Cambio del `document.title` (es. "🎲 Tocca a te! — Morichup") quando
  `currentTurnPlayerId === sessionId` e la tab non è a fuoco, ripristinato al
  focus.
- [ ] Notifica sonora breve opzionale (riusa il toggle audio di US-1003).
- [ ] Richiesta di permesso per le notifiche browser nativa solo su
  interazione esplicita dell'utente (mai automatica al caricamento).

#### US-1005: Avatar/personalizzazione giocatore
**Descrizione:** Come giocatore, voglio poter scegliere un colore/icona per
il mio token oltre a quello assegnato automaticamente.

**Criteri di accettazione:**
- [ ] Selettore colore (da una palette fissa, per garantire contrasto col
  tema scuro) nella schermata Landing/Lobby, salvato in `localStorage` e
  inviato al server in `create_room`/`join_room`.
- [ ] Se due giocatori scelgono lo stesso colore, il server assegna
  comunque colori univoci (fallback alla palette automatica esistente).

#### US-1006: Accessibilità
**Descrizione:** Come giocatore che usa tastiera o screen reader, voglio
poter usare l'app.

**Criteri di accettazione:**
- [ ] Tutti i pulsanti/azioni raggiungibili via tab, focus visibile
  (outline), nessuna trap di focus nei modali (`TradeModal` già usa un
  overlay cliccabile per chiudere: aggiungere anche `Escape` e gestione
  focus in ingresso/uscita).
- [ ] Contrasto colori del tema scuro verificato (WCAG AA) per testo
  principale e pulsanti.
- [ ] Elementi puramente decorativi (bandiere, icone case/hotel) già marcati
  `aria-hidden` dove applicabile (pattern già usato per le bandiere in
  Fase "tema scuro").

### Functional Requirements

- FR-1001: breakpoint responsive definito in `theme.css`, testato almeno a
  375px (mobile stretto) e 768px (tablet).
- FR-1002/1003: nessuna nuova dipendenza esterna pesante (animazioni via CSS
  transitions/keyframes, audio via elementi `<audio>` nativi).

### Non-Goals

- Nessuna vera app nativa/PWA installabile in questa fase.
- Nessun sistema di achievement/reward legato agli avatar.

---

## Fase 11 — Dati di partita

### Introduzione

Statistiche e cronologia — utili solo una volta che eventi e regole sono
stabili (dipendenza dichiarata nell'ordine di implementazione).

### User Stories

#### US-1101: Cronologia partite giocate
**Descrizione:** Come giocatore, voglio vedere un riepilogo delle mie ultime
partite (vittorie, durata, numero giocatori).

**Criteri di accettazione:**
- [ ] Salvataggio **locale** (localStorage, coerente con "nessun database
  server-side" e "nessuna registrazione utente"): ogni client tiene la
  propria cronologia, non condivisa tra dispositivi.
- [ ] Alla fine di ogni partita (`GAME_OVER`), il client aggiunge una riga:
  data, mappa giocata, numero giocatori, vinta/persa, durata.
- [ ] Schermata "Cronologia" accessibile dal menu principale.

#### US-1102: Replay mossa-per-mossa
**Descrizione:** Come giocatore, voglio poter rivedere gli eventi di una
partita conclusa in ordine, per rivivere i momenti clou.

**Criteri di accettazione:**
- [ ] Il client salva (localStorage, stesso principio di US-1101) la lista
  completa di `ServerEvent` ricevuti durante la partita in cui era presente.
- [ ] Un semplice player (avanti/indietro/play automatico a velocità
  regolabile) rilegge quella lista mostrando board ed `EventLog` come
  durante la partita reale, senza connessione al server.

### Functional Requirements

- FR-1101: nessuna persistenza server-side per cronologia/replay — resta
  tutto lato client, per non introdurre un database che il progetto ha
  esplicitamente evitato finora.
- FR-1102: la lista eventi già transita dal client (`EventLog.tsx` la
  consuma in tempo reale); serve solo accumularla per l'intera partita
  invece di troncarla a 40 elementi come fa oggi `useGameConnection`.

### Non-Goals

- Nessuna classifica globale/tra giocatori diversi (richiederebbe un backend
  con identità persistenti, fuori scope).

---

## Fase 12 — Infrastruttura & qualità

### Introduzione

Lavoro che non è una feature per i giocatori ma protegge tutto il resto:
test, CI, pulizia stanze, stanze protette da password.

### User Stories

#### US-1201: Test automatici lato client
**Descrizione:** Come sviluppatore, voglio test automatici sui componenti
client critici, per non affidarmi solo a verifiche manuali con Playwright ad
ogni modifica.

**Criteri di accettazione:**
- [ ] Setup Vitest + Testing Library nel workspace `client` (nuova
  dipendenza dev, coerente con l'uso di Vite già presente).
- [ ] Almeno: `DebtPanel`, `AuctionPanel`, `Tile` (bandiere/highlight),
  `Lobby` (selettore mappa) coperti da test di rendering con dati finti.
- [ ] `npm test` alla root lancia sia i test server sia quelli client.

#### US-1202: Pipeline CI
**Descrizione:** Come sviluppatore, voglio che build e test girino
automaticamente ad ogni push/PR, senza doverli lanciare a mano.

**Criteri di accettazione:**
- [ ] `.github/workflows/ci.yml`: su push e PR verso `main`, esegue
  `npm install`, `npm run build`, `npm test` (server + client una volta
  pronto US-1201).
- [ ] Badge di stato nel `README.md`.

#### US-1203: Pulizia stanze abbandonate
**Descrizione:** Come gestore del server, voglio che le stanze senza
giocatori connessi da molto tempo vengano rimosse dalla memoria, per evitare
una crescita illimitata dello stato.

**Criteri di accettazione:**
- [ ] `LobbyManager` tiene traccia dell'ultimo momento in cui una stanza ha
  avuto almeno un giocatore connesso; un timer periodico (es. ogni 5 minuti)
  rimuove le stanze inattive da più di una soglia configurabile (es. 2 ore).
- [ ] Non rimuove mai una stanza con almeno un giocatore ancora connesso,
  indipendentemente dallo stato della partita.
- [ ] Test automatico con timer "scriptato" (stesso pattern dei dadi
  scriptati), non con `setTimeout` reali nei test.

#### US-1204: Stanze con password
**Descrizione:** Come host, voglio poter proteggere la mia stanza con una
password oltre al codice, per stanze semi-pubbliche (es. condivise in un
gruppo grande) dove non voglio che chiunque abbia il codice possa entrare.

**Criteri di accettazione:**
- [ ] Campo password opzionale in `create_room`; se impostata, `join_room`/
  `rejoin` la richiedono e il server la valida prima di far entrare il
  giocatore.
- [ ] Password mai esposta nel `RoomState` broadcast (solo un booleano
  `hasPassword`).
- [ ] UI: campo opzionale in creazione stanza, prompt password nel flusso di
  join quando la stanza la richiede.

### Functional Requirements

- FR-1201: i test client seguono lo stesso principio dei test server —
  deterministici, nessuna dipendenza da timing reale o rete.
- FR-1202: la pipeline CI non deve richiedere segreti/credenziali (nessun
  deploy automatico in questa fase, solo build+test).
- FR-1203: il cleanup è un side-effect di `LobbyManager`, mai distruttivo per
  una stanza con connessioni attive.

### Non-Goals

- Nessun rate-limiting/anti-abuse generale sul server in questa fase (oltre
  al rate-limit minimo della chat in Fase 8) — fuori scope, da valutare
  solo se il gioco viene esposto pubblicamente su larga scala.

---

## Success Metrics (complessivo)

- Ogni fase merge-abile in una PR separata, con build verde e test verdi,
  come per le Fasi 0-5.
- Nessuna fase successiva rompe i test delle fasi precedenti (regressione
  zero, verificata dalla suite `node --test` completa ad ogni fase).

## Open Questions

- Fase 6 (US-604): quanti livelli ha oggi `rentLevels` nei dati mappa
  esistenti? Va confermato leggendo il codice prima di iniziare, non
  assunto qui.
- Fase 7 (US-704): il calcolo "patrimonio netto" per la vittoria a
  tempo/turni conta le case/hotel al prezzo pieno o a metà (valore di
  liquidazione)? Da decidere prima di scrivere il test.
- Fase 8 (US-802): la chat degli spettatori è unificata con quella dei
  giocatori o separata/taggata? Impatta lo schema dell'evento `chat_message`.
- Fase 10 (US-1002): comportamento esatto quando un nuovo `ServerEvent`
  arriva mentre un'animazione di movimento precedente è ancora in corso
  (accoda vs. interrompe) — da prototipare prima di fissare il requisito.
