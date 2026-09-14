# Morichup — Product Requirements Document

## 1. Visione

Versione browser moderna di Monopoly pensata per giocare con amici:
strategia economica, negoziazione, trading, caos sociale, partite
relativamente veloci, facile da imparare, difficile da padroneggiare.

Principio guida: **Classic Monopoly first. Custom chaos second.** — la
modalità Classic resta il più vicino possibile al Monopoly tradizionale; le
meccaniche aggiuntive (contratti sociali, eventi random, pomodori) sono
opzionali e vivono principalmente nelle modalità custom.

## 2. Design reference

UX/struttura ispirate a Richup.io (board centrale, HUD esterno, pannelli
laterali, colori chiari, animazioni rapide) ma con identità visiva
originale: nessun asset, logo, nome, testo o codice copiato.

## 3. Piattaforma

- Target iniziale: **desktop browser only** (Chrome, Edge, Firefox, Safari).
- Mobile/tablet: schermata "Desktop recommended" se il layout non è
  sufficientemente grande.
- Board responsive alle risoluzioni desktop, nessuno scroll globale di
  pagina durante il gameplay.

## 4. Lingue

- Lingua principale: **English**. Seconda lingua: **Italian**.
- i18n centralizzato (`t("game.rollDice")`), nessun testo hardcoded nei
  componenti.
- Copre: landing, lobby, impostazioni, partita, map editor, menu, modali,
  tooltip, errori, notifiche, chat di sistema, tutorial, game-over.
- Cambio lingua possibile in ogni momento. Mappe ufficiali localizzate;
  mappe utente in inglese (contenuto libero dell'utente).

## 5. Accesso senza registrazione

- Nessun account richiesto per giocare.
- Flusso: Website → nickname → main menu → create/join room → game.
- `playerSessionId` (UUID) persistente lato client (localStorage).
- Nickname modificabile prima di entrare in partita. Nessuna email/password/
  OAuth richiesta per il gameplay core.

## 6. Lobby

- **Create Game**: stanza privata, codice breve (`ABC123`) + link
  `https://DOMAIN/join/ABC123`, copiabile.
- **Join Game**: via codice o link diretto.
- Player count: 2–8 (consigliato 2–6), architettura deve supportare fino a 8.

## 7. Host system

L'host (creatore stanza) può: modificare impostazioni, mappa, modalità, max
giocatori, regole; avviare/pausare/riprendere la partita; espellere
giocatori in lobby; trasferire l'host; terminare la partita. Il server è
sempre l'autorità: il client non può auto-promuoversi host.

## 8. Reconnection

- Disconnessione → stato `PLAYER DISCONNECTED`, countdown 60s visibile a
  tutti ("Ivan disconnected — Reconnecting... 47s").
- Riconnessione con lo stesso session ID ripristina: posizione, denaro,
  proprietà, edifici, stato corrente, trade aperti compatibili, contratti,
  chat history disponibile, eventuale debito.
- Oltre i 60s: AFK/spectator o eliminazione secondo la regola configurata
  dalla partita. Decisione sempre server-side.

## 9. Server authoritative (regola assoluta)

Il server decide **tutto**: posizione, dadi, denaro, proprietà, rent,
acquisti, costruzioni, vendite, bancarotta, turni, aste, votazioni,
contratti, vittoria. Il client può solo **renderizzare stato** e **inviare
intent**:

```
client → ROLL_DICE
server → validate → generate dice result → update state → broadcast
client → animate
```

Tutta la randomness (dadi, carte, eventi, aste, teleport) è generata
server-side; il client riceve solo il risultato verificato.

## 10. Game engine

Motore separato dal frontend, deterministico a parità di input e random
seed. Moduli: `GameEngine`, `GameState`, `Player`, `Board`, `Tile`,
`TradeEngine`, `ContractEngine`, `BankruptcyEngine`, `AuctionEngine`,
`DiceEngine`, `CardEngine`, `VictoryEngine`, `GameRules`.

## 11. State machine

```
LOBBY → GAME_START → TURN_START → ROLLING → MOVING → TILE_RESOLUTION
→ PLAYER_DECISION → BUILDING/BUYING/OTHER → TURN_END → NEXT_TURN
```

Stati paralleli: `TRADING` (non blocca globalmente la partita — può
avvenire in parallelo al turno corrente quando le regole lo consentono),
`AUCTION`, `DEBT_RESOLUTION`, `BANKRUPTCY`, `PAUSED`, `GAME_OVER`,
`SPECTATING`.

## 12. Classic mode (default)

- Starting money: $1500, passing start: $200.
- Players: 2–8. Auction dopo rifiuto acquisto: OFF (configurabile).
- Turn timer configurabile. Vittoria: ultimo giocatore non bancarottato.
- Board 10×10, caselle sul perimetro, percorso ordinato univoco. Centro
  usato solo per elementi visuali secondari.
- Categorie caselle: Start/Go, Proprietà, Railroad/stazioni, Utilities,
  Chance, Community Chest, Income Tax, Luxury Tax, Jail/Just Visiting,
  Free Parking, Go To Jail — nomi e grafiche originali, comportamento
  classico.
- Economia volutamente semplice: Cash, Properties, Houses, Hotels, Rent,
  Taxes, Cards. Nessuna inflazione, prestiti complessi, banche
  commerciali, azioni, mercati finanziari, interessi o risorse multiple.

## 13. Property system

Campi: `id, name, type, group, purchasePrice, baseRent, rentLevels,
houseCost, hotelCost, ownerId, houses, hotel, mortgaged`.
Supporta acquisto, vendita, trading, costruzione, vendita edifici, rent,
gruppo/colore, mortgage opzionale (solo se la modalità lo abilita).

- **Purchase flow**: Property Card (name, price, rent, set) → Buy/Decline
  (o Buy/Decline→Auction se asta attiva, sempre server-authoritative).
- **Building**: solo nel proprio turno; acquisto/vendita case e hotel;
  azioni disponibili sempre dettate dal server secondo le regole della
  modalità.

## 14. Trading — feature sociale core

- Creabile in qualsiasi momento, anche fuori dal proprio turno.
- Contenuto: cash, properties, special cards, altri asset supportati, testo
  libero (special conditions).
- Destinatario: Accept / Reject / **Counter Offer** — ogni versione
  identificabile, la precedente diventa automaticamente inattiva quando
  parte una nuova controfferta. Nessuna race condition.
- **Validazione server-side obbligatoria**: presenza giocatori, possesso
  asset dichiarati, denaro sufficiente, proprietà non già scambiate,
  nessuna regola violata, giocatore non bancarottato, trade ancora valido.
  Mai fidarsi del payload client.

## 15. Contratti sociali (Promise)

Campo `Special Conditions` nel trade → testo di accordo sociale, **non**
eseguito automaticamente dal game engine, solo memorizzato:

```
Contract { id, creatorId, participants, text, createdAt, relatedTradeId, status }
status: ACTIVE | FULFILLED | DISPUTED | CANCELLED
```

- **Report Broken Promise** → notifica agli altri giocatori con voto
  Guilty/Not Guilty. Meccanica volutamente semplice e sociale, non un
  sistema giudiziario complesso.
- Votazione gestita dal server: un voto per giocatore eleggibile, risultato
  calcolato a fine timer o quando tutti hanno votato. Se Guilty → penalty
  configurabile (multa, trasferimento denaro, altro).

## 16. Chat

Global chat, whisper privato (`/whisper Nome` o via UI), reactions/emoji,
moderazione base (limite lunghezza messaggio, rate limit, anti-spam,
filtro profanità configurabile).

## 17. Tomato system

`Throw Tomato` — funzione puramente sociale/comica: animazione + eventuale
suono sull'avatar bersaglio, cooldown/rate limit, disattivabile nelle
impostazioni. Non altera in alcun modo il gameplay economico.

## 18. Bankruptcy / debt

Esempio guida: Player A ha $400, deve $1000 → il server trasferisce solo
$400 disponibili al creditore, A entra in `DEBT_RESOLUTION` con -$600.
Il giocatore può: Sell Property, Sell Buildings, Trade Assets. Turno
bloccato finché `debt <= 0` o il giocatore dichiara `Bankrupt`.

**Regola importante**: alla dichiarazione di bancarotta, al creditore non è
garantito automaticamente il totale originario — solo ciò che le regole
prevedono in quel momento. Comportamento da documentare esplicitamente nel
`GameEngine`.

Alla bancarotta: giocatore eliminato, asset distribuiti secondo le regole
della modalità, diventa Spectator (può leggere la partita e usare funzioni
sociali consentite, non influenza più l'economia). Vittoria verificata dopo
ogni eliminazione: un solo giocatore rimasto → `GAME_OVER`.

## 19. Turn system

```
TURN_START → azioni disponibili → ROLL → dice animation → server result
→ token movement animation → tile resolution → decisione richiesta
→ azioni opzionali (building/trading) → END_TURN → next player
```

Doubles ed extra turni configurabili. Turn timer: 15/30/45/60/90s o OFF,
sempre server-authoritative; se il giocatore non agisce, fallback action
appropriata (mai partita bloccata permanentemente per scheda chiusa).

## 20. Pause

Solo l'Host, se la modalità lo permette: ferma il turn timer, blocca azioni
economiche, mostra overlay, mantiene connessione, chat eventualmente
disponibile.

## 21. Map system

Completamente data-driven — nessuna board hardcoded nei componenti React.

```
BoardConfig { id, name, version, width, height, tiles, rules, theme }
```

- Dimensioni supportate: da 8×8 a 15×15.
- Tipi mappa: Classic (standard), Extended (fino a 15×15), Fortune (più
  eventi random), Custom (creata dall'utente). Architettura estendibile
  senza modificare il core engine.
- **Map Editor** visuale desktop: dimensione, tipo/proprietà/prezzo/rent/
  colore/nome/comportamento per casella, config carte e special tiles —
  solo tramite componenti supportati, nessuno scripting JS libero per
  l'utente.
- Tile types disponibili nell'editor: Property, Railroad, Utility, Start,
  Jail, Free Parking, Go To Jail, Chance, Community Chest, Tax, Penalty,
  Teleport, Casino, Roulette, Random Event, Custom Event (non tutte
  disponibili in Classic mode).
- Export/Import JSON, validato **server-side** (no codice arbitrario,
  script, XSS, SQL injection, valori impossibili, loop infiniti, proprietà
  inesistenti) tramite `MapValidator` (dimensioni, coordinate, connettività
  percorso, start tile valida, gruppi/prezzi/rent validi, riferimenti carte
  e teleport validi, ID duplicati, configurazioni impossibili). Errori
  comprensibili mostrati nell'editor.

## 22. Rendering & UX

- Renderer separato dal game engine: React + CSS Grid/Flexbox + SVG dove
  serve, niente 3D pesante.
- Token giocatore: colore, avatar, nickname; su caselle condivise si usano
  offset/stack/posizionamento circolare, mai sovrapposizione totale.
- Movimento animato tappa per tappa (mai teleport diretto alla
  destinazione).
- Dadi: animazione leggera, risultato deciso solo dal server (mai
  simulazione client-side come fonte di verità).
- HUD esterno al board (mai sopra), board sempre al centro dell'attenzione.

## 23. Fuori scope (esplicito)

Backend non-authoritative, simulazioni client-side dei risultati di gioco,
inflazione/prestiti/mercati finanziari nella modalità Classic, scripting
libero nel map editor, copia di asset/branding/testi di Richup.io o del
Monopoly ufficiale.
