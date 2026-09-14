import type {
  BoardConfig,
  ClientIntent,
  GameState,
  Player,
  PlayerSessionId,
  ServerEvent,
} from "@morichup/shared";
import { getTileAt, movePosition } from "./Board";
import { CardEngine, type Card, type CardDeckSource, type DeckName } from "./CardEngine";
import { createInitialState } from "./GameState";
import { DiceEngine } from "./DiceEngine";
import { DOUBLES_TO_JAIL, JAIL_FINE, MAX_JAIL_ATTEMPTS } from "./GameRules";
import { computeRent, isPropertyLike } from "./Tile";
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
          if (player.status !== "bankrupt") {
            player.inJail = false;
            player.jailTurns = 0;
            events.push({ type: "LEFT_JAIL", playerId: player.sessionId, method: "paid" });
            events.push(...this.moveAndResolve(player, d1 + d2));
          }
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

    if (player.status === "bankrupt") {
      events.push({ type: "TURN_ENDED", playerId: player.sessionId, extraTurn: false });
      this.advanceToNextPlayer();
    } else {
      player.inJail = false;
      player.jailTurns = 0;
      events.push({ type: "LEFT_JAIL", playerId: player.sessionId, method: "paid" });
      // Resta in ROLLING: il giocatore tira comunque i dadi per muoversi questo turno.
    }
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
    return [{ type: "PROPERTY_DECLINED", playerId: player.sessionId, tileId }];
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

  // --- Movimento e risoluzione caselle ------------------------------------

  private moveAndResolve(player: Player, steps: number): ServerEvent[] {
    const board = this.state.board;
    const { from, to, passedGo } = movePosition(board, player.position, steps);
    player.position = to;
    const events: ServerEvent[] = [
      { type: "PLAYER_MOVED", playerId: player.sessionId, from, to, passedGo },
    ];
    if (passedGo) player.money += board.rules.passingStartBonus;
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
          // Fondi insufficienti: nessuna offerta d'acquisto (asta non attiva in Classic di default).
          events.push({ type: "PROPERTY_DECLINED", playerId: player.sessionId, tileId: tile.id });
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
   * Se payer non ha fondi sufficienti: paga solo ciò che ha (regola PRD §30)
   * e va immediatamente in bancarotta (regola semplificata di Fase 2 — il
   * BankruptcyEngine con DEBT_RESOLUTION completo arriva in Fase 5).
   */
  private payAmount(
    payer: Player,
    payee: Player | null,
    amount: number
  ): { events: ServerEvent[]; paid: number } {
    if (amount <= 0) return { events: [], paid: 0 };
    const paid = Math.min(amount, payer.money);
    payer.money -= paid;
    if (payee) payee.money += paid;

    const events: ServerEvent[] = [];
    if (paid < amount) {
      payer.status = "bankrupt";
      for (const tileId of payer.properties) {
        const tile = this.state.board.tiles.find((t) => t.id === tileId);
        if (tile) {
          tile.ownerId = null;
          tile.houses = 0;
          tile.hotel = false;
          tile.mortgaged = false;
        }
      }
      payer.properties = [];
      events.push({ type: "PLAYER_BANKRUPT", playerId: payer.sessionId });

      const winnerId = checkVictory(this.state.players);
      if (winnerId) {
        this.state.state = "GAME_OVER";
        this.state.winnerId = winnerId;
        events.push({ type: "GAME_OVER", winnerId });
      }
    }
    return { events, paid };
  }

  private finalizeAfterAction(events: ServerEvent[]): void {
    if (this.state.state === "GAME_OVER") return;
    const player = this.currentPlayer();
    if (player.status === "bankrupt") {
      events.push({ type: "TURN_ENDED", playerId: player.sessionId, extraTurn: false });
      this.pendingExtraRoll = false;
      this.advanceToNextPlayer();
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
