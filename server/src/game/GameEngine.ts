import type {
  AuctionState,
  BoardConfig,
  ClientIntent,
  Contract,
  ContractAccusation,
  GameState,
  Player,
  PlayerSessionId,
  ServerEvent,
  TradeAssets,
  TradeOffer,
} from "@morichup/shared";
import { computeAuctionTurnOrder } from "./AuctionEngine";
import { getTileAt, movePosition } from "./Board";
import { CardEngine, type Card, type CardDeckSource, type DeckName } from "./CardEngine";
import { eligibleVoters, isGuiltyVerdict, tallyVotes } from "./ContractEngine";
import { createInitialState } from "./GameState";
import { DiceEngine } from "./DiceEngine";
import {
  ACCUSATION_VOTE_WINDOW_SECONDS,
  CONTRACT_PENALTY,
  DOUBLES_TO_JAIL,
  JAIL_FINE,
  MAX_JAIL_ATTEMPTS,
} from "./GameRules";
import { computeRent, isPropertyLike } from "./Tile";
import { executeTrade, validateAssetsOwnership } from "./TradeEngine";
import { checkVictory } from "./VictoryEngine";

interface HeldCard {
  ownerId: PlayerSessionId;
  deck: DeckName;
  card: Card;
}

export interface DiceRoller {
  roll(): [number, number];
}

/**
 * Orchestratore authoritative: riceve un ClientIntent, valida contro lo stato
 * corrente, applica le regole e ritorna gli eventi generati. Deterministico a
 * parità di seed (dadi e mazzi carte) e sequenza di intent.
 */
export class GameEngine {
  private state: GameState;
  private dice: DiceRoller;
  private cardEngine: CardDeckSource;
  private pendingExtraRoll = false;
  private heldCards: HeldCard[] = [];
  private jailTileIndex: number;
  private tradeIdCounter = 0;
  private contractIdCounter = 0;
  private accusationIdCounter = 0;

  constructor(
    roomCode: string,
    board: BoardConfig,
    players: Player[],
    seed: number,
    overrides?: { dice?: DiceRoller; cardEngine?: CardDeckSource }
  ) {
    this.state = createInitialState(roomCode, board, players);
    this.dice = overrides?.dice ?? new DiceEngine(seed);
    this.cardEngine = overrides?.cardEngine ?? new CardEngine(seed + 1);
    this.jailTileIndex = board.tiles.findIndex((t) => t.type === "jail");
    if (this.jailTileIndex === -1) throw new Error('La mappa non ha una casella "jail"');
  }

  getState(): GameState {
    return this.state;
  }

  applyIntent(playerId: PlayerSessionId, intent: ClientIntent): ServerEvent[] {
    if (this.state.state === "GAME_OVER") throw new Error("La partita è terminata");

    // Trading e contratti sociali funzionano in qualsiasi momento, anche fuori
    // dal proprio turno (PRD §20): non passano dal controllo "è il tuo turno".
    switch (intent.type) {
      case "PROPOSE_TRADE":
        return this.handleProposeTrade(playerId, intent);
      case "COUNTER_TRADE":
        return this.handleCounterTrade(playerId, intent);
      case "ACCEPT_TRADE":
        return this.handleAcceptTrade(playerId, intent.tradeId);
      case "REJECT_TRADE":
        return this.handleRejectTrade(playerId, intent.tradeId);
      case "CANCEL_TRADE":
        return this.handleCancelTrade(playerId, intent.tradeId);
      case "REPORT_BROKEN_PROMISE":
        return this.handleReportBrokenPromise(playerId, intent.contractId);
      case "VOTE_ACCUSATION":
        return this.handleVoteAccusation(playerId, intent.accusationId, intent.vote);
      // Anche la trattativa del debito è svincolata dal turno: un giocatore in
      // debito (magari per una carta "Chairman" pagata fuori dal proprio turno)
      // deve potersi liberare in qualunque momento (PRD §29).
      case "SELL_PROPERTY_TO_BANK":
        return this.handleSellPropertyToBank(playerId, intent.tileId);
      case "DECLARE_BANKRUPTCY":
        return this.handleDeclareBankruptcy(playerId);
      // Le offerte d'asta seguono il turno interno all'asta, non quello di gioco.
      case "PLACE_BID":
        return this.handlePlaceBid(playerId, intent.amount);
      case "PASS_AUCTION":
        return this.handlePassAuction(playerId);
      case "START_PLAYER_AUCTION":
        return this.handleStartPlayerAuction(playerId, intent.tileId, intent.minimumBid);
    }

    if (playerId !== this.state.currentTurnPlayerId) {
      throw new Error("Non è il turno di questo giocatore");
    }
    const player = this.currentPlayer();

    switch (intent.type) {
      case "ROLL_DICE":
        return this.handleRollDice(player);
      case "PAY_BAIL":
        return this.handlePayBail(player);
      case "USE_JAIL_CARD":
        return this.handleUseJailCard(player);
      case "BUY_PROPERTY":
        return this.handleBuyProperty(player, intent.tileId);
      case "DECLINE_PROPERTY":
        return this.handleDeclineProperty(player, intent.tileId);
      case "END_TURN":
        return this.handleEndTurn(player);
      default:
        throw new Error("Intent non gestito in questa fase");
    }
  }

  /** Chiamato anche dall'esterno (SocketServer) quando scade la finestra di voto di un'accusa. */
  forceResolveAccusation(accusationId: string): ServerEvent[] {
    const accusation = this.state.accusations.find((a) => a.id === accusationId);
    if (!accusation || accusation.status !== "voting") return [];
    return this.resolveAccusation(accusation);
  }

  // --- Intent handlers ---------------------------------------------------

  private handleRollDice(player: Player): ServerEvent[] {
    if (this.state.state !== "ROLLING") throw new Error("Non è il momento di tirare i dadi");
    const events: ServerEvent[] = [];
    const [d1, d2] = this.dice.roll();
    const isDouble = d1 === d2;
    events.push({ type: "DICE_RESULT", playerId: player.sessionId, values: [d1, d2], isDouble });
    this.state.lastDiceRoll = [d1, d2];

    if (player.inJail) {
      if (isDouble) {
        player.inJail = false;
        player.jailTurns = 0;
        events.push({ type: "LEFT_JAIL", playerId: player.sessionId, method: "doubles" });
        events.push(...this.moveAndResolve(player, d1 + d2));
      } else {
        player.jailTurns++;
        if (player.jailTurns >= MAX_JAIL_ATTEMPTS) {
          const { events: payEvents } = this.payAmount(player, null, JAIL_FINE);
          events.push(...payEvents);
          player.inJail = false;
          player.jailTurns = 0;
          events.push({ type: "LEFT_JAIL", playerId: player.sessionId, method: "paid" });
          events.push(...this.moveAndResolve(player, d1 + d2));
        }
        // Se jailTurns < MAX_JAIL_ATTEMPTS: resta in prigione, nessun movimento questo turno.
      }
    } else if (isDouble) {
      player.consecutiveDoubles++;
      if (player.consecutiveDoubles >= DOUBLES_TO_JAIL) {
        player.consecutiveDoubles = 0;
        this.pendingExtraRoll = false;
        events.push(...this.sendToJail(player, "threeDoubles"));
      } else {
        this.pendingExtraRoll = true;
        events.push(...this.moveAndResolve(player, d1 + d2));
        // Se il movimento porta in prigione (casella Go To Jail), niente turno extra.
        if (player.inJail) this.pendingExtraRoll = false;
      }
    } else {
      player.consecutiveDoubles = 0;
      events.push(...this.moveAndResolve(player, d1 + d2));
    }

    this.finalizeAfterAction(events);
    return events;
  }

  private handlePayBail(player: Player): ServerEvent[] {
    if (this.state.state !== "ROLLING") {
      throw new Error("Puoi pagare la cauzione solo prima di tirare i dadi");
    }
    if (!player.inJail) throw new Error("Il giocatore non è in prigione");

    const events: ServerEvent[] = [];
    const { events: payEvents } = this.payAmount(player, null, JAIL_FINE);
    events.push(...payEvents);

    player.inJail = false;
    player.jailTurns = 0;
    events.push({ type: "LEFT_JAIL", playerId: player.sessionId, method: "paid" });
    // Se non bastavano i soldi resta comunque un debito da risolvere: blocca il turno.
    this.applyDebtBlockIfCurrentTurn(player);
    return events;
  }

  private handleUseJailCard(player: Player): ServerEvent[] {
    if (this.state.state !== "ROLLING") {
      throw new Error("Puoi usare la carta solo prima di tirare i dadi");
    }
    if (!player.inJail) throw new Error("Il giocatore non è in prigione");
    if (player.getOutOfJailFreeCards <= 0) {
      throw new Error('Nessuna carta "esci di prigione gratis" disponibile');
    }

    player.getOutOfJailFreeCards--;
    player.inJail = false;
    player.jailTurns = 0;

    const held = this.heldCards.find((h) => h.ownerId === player.sessionId);
    if (held) {
      this.heldCards.splice(this.heldCards.indexOf(held), 1);
      this.cardEngine.returnCard(held.deck, held.card);
    }

    return [{ type: "LEFT_JAIL", playerId: player.sessionId, method: "card" }];
  }

  private handleBuyProperty(player: Player, tileId: string): ServerEvent[] {
    const pending = this.state.pendingDecision;
    if (!pending || pending.type !== "buyOrDecline" || pending.tileId !== tileId) {
      throw new Error("Nessun acquisto in sospeso per questa casella");
    }
    const tile = this.state.board.tiles.find((t) => t.id === tileId);
    if (!tile || tile.ownerId != null) throw new Error("Casella non acquistabile");
    const price = tile.purchasePrice ?? 0;
    if (player.money < price) throw new Error("Fondi insufficienti");

    player.money -= price;
    tile.ownerId = player.sessionId;
    player.properties.push(tile.id);
    this.state.pendingDecision = null;

    return [{ type: "PROPERTY_PURCHASED", playerId: player.sessionId, tileId, price }];
  }

  private handleDeclineProperty(player: Player, tileId: string): ServerEvent[] {
    const pending = this.state.pendingDecision;
    if (!pending || pending.type !== "buyOrDecline" || pending.tileId !== tileId) {
      throw new Error("Nessuna decisione in sospeso per questa casella");
    }
    this.state.pendingDecision = null;
    const events: ServerEvent[] = [{ type: "PROPERTY_DECLINED", playerId: player.sessionId, tileId }];

    if (this.state.board.rules.auctionOnDecline) {
      const tile = this.state.board.tiles.find((t) => t.id === tileId);
      if (tile) events.push(...this.startAuction(tile));
    }
    return events;
  }

  private handleEndTurn(player: Player): ServerEvent[] {
    if (this.state.state !== "PLAYER_DECISION") throw new Error("Non puoi ancora terminare il turno");
    if (this.state.pendingDecision) throw new Error("Devi prima decidere se acquistare la proprietà");

    const extraTurn = this.pendingExtraRoll;
    const events: ServerEvent[] = [{ type: "TURN_ENDED", playerId: player.sessionId, extraTurn }];
    if (extraTurn) {
      this.pendingExtraRoll = false;
      this.state.state = "ROLLING";
    } else {
      this.advanceToNextPlayer();
    }
    return events;
  }

  // --- Trading -------------------------------------------------------------

  private handleProposeTrade(
    playerId: PlayerSessionId,
    intent: Extract<ClientIntent, { type: "PROPOSE_TRADE" }>
  ): ServerEvent[] {
    const from = this.findPlayer(playerId);
    const to = this.findPlayer(intent.toPlayerId);
    if (from.sessionId === to.sessionId) throw new Error("Non puoi proporre uno scambio a te stesso");
    if (from.status !== "active" || to.status !== "active") {
      throw new Error("Entrambi i giocatori devono essere attivi per scambiare");
    }
    this.assertOwnedAssets(from, intent.give);
    this.assertOwnedAssets(to, intent.receive);

    const trade: TradeOffer = {
      id: this.nextTradeId(),
      version: 1,
      fromPlayerId: from.sessionId,
      toPlayerId: to.sessionId,
      give: intent.give,
      receive: intent.receive,
      specialConditions: intent.specialConditions ?? "",
      status: "pending",
      createdAt: Date.now(),
    };
    this.state.trades.push(trade);
    return [{ type: "TRADE_PROPOSED", trade }];
  }

  private handleCounterTrade(
    playerId: PlayerSessionId,
    intent: Extract<ClientIntent, { type: "COUNTER_TRADE" }>
  ): ServerEvent[] {
    const trade = this.findTrade(intent.tradeId);
    if (trade.status !== "pending") throw new Error("Questa trattativa non è più attiva");
    if (playerId !== trade.toPlayerId) throw new Error("Solo il destinatario dell'offerta può controffrire");

    // Chi controfferisce ora "dà"; il proponente originale ora "riceve": i ruoli si scambiano.
    const from = this.findPlayer(playerId);
    const to = this.findPlayer(trade.fromPlayerId);
    this.assertOwnedAssets(from, intent.give);
    this.assertOwnedAssets(to, intent.receive);

    trade.version += 1;
    trade.fromPlayerId = from.sessionId;
    trade.toPlayerId = to.sessionId;
    trade.give = intent.give;
    trade.receive = intent.receive;
    trade.specialConditions = intent.specialConditions ?? "";
    trade.createdAt = Date.now();

    return [{ type: "TRADE_COUNTERED", trade }];
  }

  private handleAcceptTrade(playerId: PlayerSessionId, tradeId: string): ServerEvent[] {
    const trade = this.findTrade(tradeId);
    if (trade.status !== "pending") throw new Error("Questa trattativa non è più attiva");
    if (playerId !== trade.toPlayerId) throw new Error("Solo il destinatario dell'offerta corrente può accettarla");

    const giver = this.findPlayer(trade.fromPlayerId);
    const receiver = this.findPlayer(trade.toPlayerId);
    if (giver.status !== "active" || receiver.status !== "active") {
      throw new Error("Entrambi i giocatori devono essere attivi per completare lo scambio");
    }
    // Rivalidazione completa: lo stato può essere cambiato dalla proposta iniziale.
    this.assertOwnedAssets(giver, trade.give);
    this.assertOwnedAssets(receiver, trade.receive);

    executeTrade(this.state.board, giver, receiver, trade.give, trade.receive);
    trade.status = "accepted";
    this.state.trades = this.state.trades.filter((t) => t.id !== tradeId);

    const events: ServerEvent[] = [{ type: "TRADE_ACCEPTED", tradeId, byPlayerId: playerId }];
    // Il denaro incassato dallo scambio può bastare a coprire un debito pendente.
    events.push(...this.tryResolveDebts(giver));
    events.push(...this.tryResolveDebts(receiver));

    if (trade.specialConditions.trim()) {
      const contract: Contract = {
        id: this.nextContractId(),
        creatorId: trade.fromPlayerId,
        participants: [trade.fromPlayerId, trade.toPlayerId],
        text: trade.specialConditions.trim(),
        createdAt: Date.now(),
        relatedTradeId: trade.id,
        status: "active",
      };
      this.state.contracts.push(contract);
      events.push({ type: "CONTRACT_CREATED", contract });
    }
    return events;
  }

  private handleRejectTrade(playerId: PlayerSessionId, tradeId: string): ServerEvent[] {
    const trade = this.findTrade(tradeId);
    if (trade.status !== "pending") throw new Error("Questa trattativa non è più attiva");
    if (playerId !== trade.toPlayerId) throw new Error("Solo il destinatario dell'offerta corrente può rifiutarla");
    this.state.trades = this.state.trades.filter((t) => t.id !== tradeId);
    return [{ type: "TRADE_REJECTED", tradeId, byPlayerId: playerId }];
  }

  private handleCancelTrade(playerId: PlayerSessionId, tradeId: string): ServerEvent[] {
    const trade = this.findTrade(tradeId);
    if (trade.status !== "pending") throw new Error("Questa trattativa non è più attiva");
    if (playerId !== trade.fromPlayerId) throw new Error("Solo chi ha fatto l'ultima offerta può ritirarla");
    this.state.trades = this.state.trades.filter((t) => t.id !== tradeId);
    return [{ type: "TRADE_CANCELLED", tradeId }];
  }

  private assertOwnedAssets(player: Player, assets: TradeAssets): void {
    const error = validateAssetsOwnership(this.state.board, player, assets);
    if (error) throw new Error(error);
    if (player.money < assets.cash) throw new Error(`${player.nickname} non ha abbastanza denaro`);
  }

  // --- Contratti sociali -----------------------------------------------------

  private handleReportBrokenPromise(accuserId: PlayerSessionId, contractId: string): ServerEvent[] {
    const contract = this.findContract(contractId);
    if (contract.status !== "active") throw new Error("Questo contratto non è più attivo");
    if (!contract.participants.includes(accuserId)) {
      throw new Error("Solo le parti coinvolte nel contratto possono segnalarlo");
    }
    const accusedId = contract.participants.find((id) => id !== accuserId);
    if (!accusedId) throw new Error("Impossibile determinare l'accusato");

    contract.status = "disputed";
    const accusation: ContractAccusation = {
      id: this.nextAccusationId(),
      contractId,
      accuserId,
      accusedId,
      createdAt: Date.now(),
      deadline: Date.now() + ACCUSATION_VOTE_WINDOW_SECONDS * 1000,
      status: "voting",
      votes: {},
    };
    this.state.accusations.push(accusation);
    return [{ type: "PROMISE_REPORTED", accusation }];
  }

  private handleVoteAccusation(
    voterId: PlayerSessionId,
    accusationId: string,
    vote: "guilty" | "notGuilty"
  ): ServerEvent[] {
    const accusation = this.findAccusation(accusationId);
    if (accusation.status !== "voting") throw new Error("Questa votazione è già conclusa");
    const eligible = eligibleVoters(this.state.players, accusation.accuserId, accusation.accusedId);
    if (!eligible.includes(voterId)) throw new Error("Non hai diritto di voto su questa accusa");
    if (accusation.votes[voterId]) throw new Error("Hai già votato");

    accusation.votes[voterId] = vote;
    const events: ServerEvent[] = [{ type: "ACCUSATION_VOTE_CAST", accusationId, voterId }];

    const allVoted = eligible.every((id) => accusation.votes[id]);
    if (allVoted) events.push(...this.resolveAccusation(accusation));
    return events;
  }

  private resolveAccusation(accusation: ContractAccusation): ServerEvent[] {
    const guilty = isGuiltyVerdict(tallyVotes(accusation));
    accusation.status = guilty ? "guilty" : "notGuilty";

    const contract = this.state.contracts.find((c) => c.id === accusation.contractId);
    const events: ServerEvent[] = [];
    let penaltyAmount = 0;

    if (guilty) {
      penaltyAmount = CONTRACT_PENALTY;
      if (contract) contract.status = "disputed"; // resta "disputed": marca storica della violazione
      const accused = this.findPlayer(accusation.accusedId);
      const { events: payEvents } = this.payAmount(accused, null, CONTRACT_PENALTY);
      events.push(...payEvents);
    } else if (contract) {
      contract.status = "active"; // accusa respinta, la promessa resta valida
    }

    events.push({ type: "ACCUSATION_RESOLVED", accusationId: accusation.id, guilty, penaltyAmount });
    return events;
  }

  private findTrade(tradeId: string): TradeOffer {
    const trade = this.state.trades.find((t) => t.id === tradeId);
    if (!trade) throw new Error("Trattativa non trovata");
    return trade;
  }

  private findContract(contractId: string): Contract {
    const contract = this.state.contracts.find((c) => c.id === contractId);
    if (!contract) throw new Error("Contratto non trovato");
    return contract;
  }

  private findAccusation(accusationId: string): ContractAccusation {
    const accusation = this.state.accusations.find((a) => a.id === accusationId);
    if (!accusation) throw new Error("Accusa non trovata");
    return accusation;
  }

  private nextTradeId(): string {
    return `trade-${++this.tradeIdCounter}`;
  }

  private nextContractId(): string {
    return `contract-${++this.contractIdCounter}`;
  }

  private nextAccusationId(): string {
    return `accusation-${++this.accusationIdCounter}`;
  }

  // --- Movimento e risoluzione caselle ------------------------------------

  private moveAndResolve(player: Player, steps: number): ServerEvent[] {
    const board = this.state.board;
    const { from, to, passedGo } = movePosition(board, player.position, steps);
    player.position = to;
    const events: ServerEvent[] = [
      { type: "PLAYER_MOVED", playerId: player.sessionId, from, to, passedGo },
    ];
    if (passedGo) {
      player.money += board.rules.passingStartBonus;
      events.push(...this.tryResolveDebts(player));
    }
    events.push(...this.resolveLanding(player, to));
    return events;
  }

  private resolveLanding(player: Player, tileIndex: number): ServerEvent[] {
    const board = this.state.board;
    const tile = getTileAt(board, tileIndex);
    const events: ServerEvent[] = [];

    if (isPropertyLike(tile)) {
      if (tile.ownerId == null) {
        if (player.money >= (tile.purchasePrice ?? 0)) {
          this.state.pendingDecision = { type: "buyOrDecline", tileId: tile.id };
          events.push({ type: "PROPERTY_PURCHASE_OFFER", playerId: player.sessionId, tileId: tile.id });
        } else {
          // Fondi insufficienti: nessuna offerta d'acquisto, si passa eventualmente all'asta.
          events.push({ type: "PROPERTY_DECLINED", playerId: player.sessionId, tileId: tile.id });
          if (board.rules.auctionOnDecline) events.push(...this.startAuction(tile));
        }
      } else if (tile.ownerId !== player.sessionId && !tile.mortgaged) {
        const owner = this.findPlayer(tile.ownerId);
        const diceSum = this.state.lastDiceRoll ? this.state.lastDiceRoll[0] + this.state.lastDiceRoll[1] : 7;
        const rent = computeRent(board, tile, diceSum);
        const { events: payEvents, paid } = this.payAmount(player, owner, rent);
        events.push({
          type: "RENT_PAID",
          fromPlayerId: player.sessionId,
          toPlayerId: owner.sessionId,
          tileId: tile.id,
          amount: paid,
        });
        events.push(...payEvents);
      }
      return events;
    }

    switch (tile.type) {
      case "incomeTax":
      case "luxuryTax": {
        const { events: payEvents, paid } = this.payAmount(player, null, tile.amount ?? 0);
        events.push({ type: "TAX_PAID", playerId: player.sessionId, amount: paid });
        events.push(...payEvents);
        break;
      }
      case "chance":
        events.push(...this.drawAndApplyCard(player, "fortune"));
        break;
      case "communityChest":
        events.push(...this.drawAndApplyCard(player, "communityChest"));
        break;
      case "goToJail":
        events.push(...this.sendToJail(player, "tile"));
        break;
      default:
        // start, jail (just visiting), freeParking e i tile type non ancora usati
        // dalla mappa Classic: nessun effetto in Fase 2.
        break;
    }
    return events;
  }

  private drawAndApplyCard(player: Player, deck: DeckName): ServerEvent[] {
    const card = this.cardEngine.draw(deck);
    const events: ServerEvent[] = [{ type: "CARD_DRAWN", playerId: player.sessionId, deck, text: card.text }];
    const board = this.state.board;
    const total = board.tiles.length;

    switch (card.effect.kind) {
      case "moveToPosition": {
        const steps = ((card.effect.position - player.position) % total + total) % total;
        events.push(...this.moveAndResolve(player, steps));
        break;
      }
      case "moveRelative": {
        // Movimento all'indietro: mai bonus di passaggio dal Go, a differenza di moveToPosition.
        const from = player.position;
        const to = ((from + card.effect.steps) % total + total) % total;
        player.position = to;
        events.push({ type: "PLAYER_MOVED", playerId: player.sessionId, from, to, passedGo: false });
        events.push(...this.resolveLanding(player, to));
        break;
      }
      case "collect":
        player.money += card.effect.amount;
        events.push(...this.tryResolveDebts(player));
        break;
      case "pay": {
        const { events: payEvents } = this.payAmount(player, null, card.effect.amount);
        events.push(...payEvents);
        break;
      }
      case "payEachPlayer":
        for (const other of this.state.players) {
          if (other.sessionId === player.sessionId || other.status === "bankrupt") continue;
          const { events: payEvents } = this.payAmount(player, other, card.effect.amount);
          events.push(...payEvents);
          if (player.status === "bankrupt") break;
        }
        break;
      case "collectFromEachPlayer":
        for (const other of this.state.players) {
          if (other.sessionId === player.sessionId || other.status === "bankrupt") continue;
          const { events: payEvents } = this.payAmount(other, player, card.effect.amount);
          events.push(...payEvents);
        }
        break;
      case "goToJail":
        events.push(...this.sendToJail(player, "tile"));
        break;
      case "getOutOfJailFree":
        player.getOutOfJailFreeCards++;
        this.heldCards.push({ ownerId: player.sessionId, deck, card });
        break;
    }
    return events;
  }

  private sendToJail(player: Player, reason: "tile" | "threeDoubles"): ServerEvent[] {
    player.position = this.jailTileIndex;
    player.inJail = true;
    player.jailTurns = 0;
    player.consecutiveDoubles = 0;
    return [{ type: "SENT_TO_JAIL", playerId: player.sessionId, reason }];
  }

  /**
   * Trasferisce `amount` da payer a payee (o alla banca se payee è null).
   * Se payer non ha fondi sufficienti: paga subito solo ciò che ha (PRD §30)
   * e il resto diventa un debito pendente — il giocatore NON va in bancarotta
   * automaticamente. Deve prima provare a vendere proprietà alla banca
   * (SELL_PROPERTY_TO_BANK) o negoziare (Fase 4); la bancarotta scatta solo
   * se la dichiara esplicitamente (DECLARE_BANKRUPTCY), vedi PRD §28-31.
   */
  private payAmount(
    payer: Player,
    payee: Player | null,
    amount: number
  ): { events: ServerEvent[]; paid: number } {
    if (amount <= 0) return { events: [], paid: 0 };
    const paid = Math.min(amount, payer.money);
    payer.money -= paid;
    const events: ServerEvent[] = [];
    if (payee) {
      payee.money += paid;
      events.push(...this.tryResolveDebts(payee));
    }

    const shortfall = amount - paid;
    if (shortfall > 0) {
      payer.pendingDebts.push({ amount: shortfall, payeeId: payee?.sessionId ?? null });
      events.push({
        type: "DEBT_INCURRED",
        playerId: payer.sessionId,
        amount: shortfall,
        payeeId: payee?.sessionId ?? null,
      });
    }
    return { events, paid };
  }

  /** Salda i debiti pendenti (in ordine) finché il denaro disponibile basta. */
  private tryResolveDebts(player: Player): ServerEvent[] {
    if (player.pendingDebts.length === 0) return []; // niente da fare: non generare eventi fantasma
    while (player.pendingDebts.length > 0 && player.money >= player.pendingDebts[0].amount) {
      const debt = player.pendingDebts.shift()!;
      player.money -= debt.amount;
      if (debt.payeeId) {
        const payee = this.findPlayer(debt.payeeId);
        payee.money += debt.amount;
      }
    }
    if (player.pendingDebts.length > 0) return [];

    const events: ServerEvent[] = [{ type: "DEBT_RESOLVED", playerId: player.sessionId }];
    if (this.state.currentTurnPlayerId === player.sessionId && this.state.state === "DEBT_RESOLUTION") {
      this.state.state = "PLAYER_DECISION";
    }
    return events;
  }

  /** Se il debitore è il giocatore di turno, blocca ROLL_DICE/END_TURN finché non salda. */
  private applyDebtBlockIfCurrentTurn(player: Player): void {
    if (this.state.state === "GAME_OVER" || this.state.auction) return;
    if (this.state.currentTurnPlayerId === player.sessionId && player.pendingDebts.length > 0) {
      this.state.state = "DEBT_RESOLUTION";
    }
  }

  private handleSellPropertyToBank(playerId: PlayerSessionId, tileId: string): ServerEvent[] {
    const player = this.findPlayer(playerId);
    if (player.pendingDebts.length === 0) {
      throw new Error("Nessun debito da risolvere: non puoi vendere alla banca in questo momento");
    }
    const tile = this.state.board.tiles.find((t) => t.id === tileId);
    if (!tile || tile.ownerId !== playerId) throw new Error("Non possiedi questa proprietà");

    const sellPrice = Math.floor((tile.purchasePrice ?? 0) / 2);
    player.money += sellPrice;
    tile.ownerId = null;
    tile.houses = 0;
    tile.hotel = false;
    tile.mortgaged = false;
    player.properties = player.properties.filter((id) => id !== tileId);

    const events: ServerEvent[] = [{ type: "PROPERTY_SOLD_TO_BANK", playerId, tileId, amount: sellPrice }];
    events.push(...this.tryResolveDebts(player));
    return events;
  }

  private handleDeclareBankruptcy(playerId: PlayerSessionId): ServerEvent[] {
    const player = this.findPlayer(playerId);
    if (player.pendingDebts.length === 0) throw new Error("Non hai debiti da risolvere");
    if (player.status !== "active") throw new Error("Giocatore non attivo");

    // PRD §30: al creditore non è garantito il totale originario, solo la liquidità disponibile ora.
    for (const debt of player.pendingDebts) {
      const paid = Math.min(player.money, debt.amount);
      player.money -= paid;
      if (debt.payeeId) {
        const payee = this.findPlayer(debt.payeeId);
        payee.money += paid;
      }
    }
    player.pendingDebts = [];
    player.status = "bankrupt";
    for (const tileId of player.properties) {
      const tile = this.state.board.tiles.find((t) => t.id === tileId);
      if (tile) {
        tile.ownerId = null;
        tile.houses = 0;
        tile.hotel = false;
        tile.mortgaged = false;
      }
    }
    player.properties = [];

    const events: ServerEvent[] = [{ type: "PLAYER_BANKRUPT", playerId }];
    const winnerId = checkVictory(this.state.players);
    if (winnerId) {
      this.state.state = "GAME_OVER";
      this.state.winnerId = winnerId;
      events.push({ type: "GAME_OVER", winnerId });
    } else if (this.state.currentTurnPlayerId === playerId && this.state.state === "DEBT_RESOLUTION") {
      events.push({ type: "TURN_ENDED", playerId, extraTurn: false });
      this.pendingExtraRoll = false;
      this.advanceToNextPlayer();
    }
    return events;
  }

  // --- Aste ------------------------------------------------------------

  /** Asta della banca su una proprietà rifiutata (nessun venditore, nessun minimo). */
  private startAuction(tile: { id: string }): ServerEvent[] {
    return this.beginAuction(tile.id, null, 0, this.state.currentTurnPlayerId);
  }

  /** Un giocatore mette all'asta una propria proprietà con un prezzo minimo (PRD-adiacente,
   * richiesto esplicitamente): disponibile in qualsiasi momento, come il trading. */
  private handleStartPlayerAuction(playerId: PlayerSessionId, tileId: string, minimumBid: number): ServerEvent[] {
    if (this.state.auction) throw new Error("È già in corso un'altra asta");
    const player = this.findPlayer(playerId);
    if (player.status !== "active") throw new Error("Devi essere un giocatore attivo per avviare un'asta");
    const tile = this.state.board.tiles.find((t) => t.id === tileId);
    if (!tile || tile.ownerId !== playerId) throw new Error("Non possiedi questa proprietà");
    if (minimumBid < 0) throw new Error("Il prezzo minimo non può essere negativo");

    return this.beginAuction(tileId, playerId, Math.floor(minimumBid), playerId);
  }

  private beginAuction(
    tileId: string,
    sellerId: PlayerSessionId | null,
    minimumBid: number,
    startAfterId: PlayerSessionId | null
  ): ServerEvent[] {
    if (this.state.auction) return []; // difensivo: non dovrebbe mai capitare
    const turnOrder = computeAuctionTurnOrder(this.state.players, startAfterId).filter((id) => id !== sellerId);
    if (turnOrder.length === 0) {
      if (sellerId) throw new Error("Serve almeno un altro giocatore attivo per fare un'asta");
      return []; // asta della banca: nessun altro partecipante, la proprietà resta alla banca
    }

    const auction: AuctionState = {
      tileId,
      currentBid: 0,
      currentBidderId: null,
      turnOrder,
      turnIndex: 0,
      sellerId,
      minimumBid,
    };
    this.state.auction = auction;
    this.state.state = "AUCTION";
    return [{ type: "AUCTION_STARTED", tileId, turnOrder }];
  }

  private handlePlaceBid(playerId: PlayerSessionId, amount: number): ServerEvent[] {
    const auction = this.state.auction;
    if (!auction) throw new Error("Nessuna asta in corso");
    if (auction.turnOrder[auction.turnIndex] !== playerId) throw new Error("Non è il tuo turno d'asta");
    const player = this.findPlayer(playerId);
    if (amount <= auction.currentBid) throw new Error("L'offerta deve superare quella attuale");
    if (amount > player.money) throw new Error("Fondi insufficienti per questa offerta");

    auction.currentBid = amount;
    auction.currentBidderId = playerId;
    auction.turnIndex++;

    const events: ServerEvent[] = [{ type: "AUCTION_BID", playerId, amount }];
    events.push(...this.maybeEndAuction());
    return events;
  }

  private handlePassAuction(playerId: PlayerSessionId): ServerEvent[] {
    const auction = this.state.auction;
    if (!auction) throw new Error("Nessuna asta in corso");
    if (auction.turnOrder[auction.turnIndex] !== playerId) throw new Error("Non è il tuo turno d'asta");

    auction.turnIndex++;
    const events: ServerEvent[] = [{ type: "AUCTION_PASSED", playerId }];
    events.push(...this.maybeEndAuction());
    return events;
  }

  /** Asta a giro singolo (semplificazione Fase 5): un turno a testa, poi vince l'offerta più alta
   * (se è stata fatta almeno un'offerta e, per le aste tra giocatori, se supera il minimo). */
  private maybeEndAuction(): ServerEvent[] {
    const auction = this.state.auction;
    if (!auction || auction.turnIndex < auction.turnOrder.length) return [];

    const events: ServerEvent[] = [];
    const tile = this.state.board.tiles.find((t) => t.id === auction.tileId);
    const saleValid = auction.currentBidderId && tile && auction.currentBid >= auction.minimumBid;

    if (saleValid && auction.currentBidderId && tile) {
      const winner = this.findPlayer(auction.currentBidderId);
      winner.money -= auction.currentBid;
      tile.ownerId = winner.sessionId;
      winner.properties.push(tile.id);
      if (auction.sellerId) {
        const seller = this.findPlayer(auction.sellerId);
        seller.money += auction.currentBid;
        seller.properties = seller.properties.filter((id) => id !== tile.id);
        events.push(...this.tryResolveDebts(seller));
      }
      events.push({ type: "AUCTION_ENDED", tileId: auction.tileId, winnerId: winner.sessionId, amount: auction.currentBid });
    } else {
      // Nessuna offerta, o (asta tra giocatori) nessuna ha raggiunto il minimo: niente vendita.
      events.push({ type: "AUCTION_ENDED", tileId: auction.tileId, winnerId: null, amount: 0 });
    }
    this.state.auction = null;
    this.finalizeAfterAction(events);
    return events;
  }

  private finalizeAfterAction(events: ServerEvent[]): void {
    if (this.state.state === "GAME_OVER" || this.state.auction) return;
    const player = this.currentPlayer();
    if (player.pendingDebts.length > 0) {
      this.state.state = "DEBT_RESOLUTION";
    } else {
      this.state.state = "PLAYER_DECISION";
    }
  }

  private advanceToNextPlayer(): void {
    const players = this.state.players;
    const currentIndex = players.findIndex((p) => p.sessionId === this.state.currentTurnPlayerId);
    let nextIndex = currentIndex;
    for (let i = 0; i < players.length; i++) {
      nextIndex = (nextIndex + 1) % players.length;
      // Salta anche gli AFK (disconnessi oltre la finestra di riconnessione, Fase 3):
      // restano in partita con i loro asset ma non giocano finché non tornano.
      if (players[nextIndex].status !== "bankrupt" && players[nextIndex].status !== "afk") break;
    }
    const next = players[nextIndex];
    next.consecutiveDoubles = 0;
    this.state.currentTurnPlayerId = next.sessionId;
    this.state.state = "ROLLING";
  }

  private findPlayer(id: PlayerSessionId): Player {
    const player = this.state.players.find((p) => p.sessionId === id);
    if (!player) throw new Error(`Giocatore sconosciuto: ${id}`);
    return player;
  }

  private currentPlayer(): Player {
    return this.findPlayer(this.state.currentTurnPlayerId as PlayerSessionId);
  }
}
