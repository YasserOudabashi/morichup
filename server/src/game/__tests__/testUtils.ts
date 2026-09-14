import type { BoardConfig } from "@morichup/shared";
import type { Card, CardDeckSource, DeckName } from "../CardEngine";
import type { DiceRoller } from "../GameEngine";
import { createPlayer } from "../Player";

/** Dadi "scriptati": ritorna i tiri in sequenza fissa invece di generarli a caso. */
export class ScriptedDice implements DiceRoller {
  private index = 0;
  constructor(private rolls: [number, number][]) {}

  roll(): [number, number] {
    if (this.index >= this.rolls.length) {
      throw new Error("ScriptedDice: sequenza di tiri esaurita");
    }
    return this.rolls[this.index++];
  }
}

/** Mazzi carte "scriptati": pesca in ordine fisso invece che dal mazzo mescolato. */
export class ScriptedCards implements CardDeckSource {
  private queues: Record<DeckName, Card[]>;

  constructor(fortune: Card[] = [], communityChest: Card[] = []) {
    this.queues = { fortune: [...fortune], communityChest: [...communityChest] };
  }

  draw(deck: DeckName): Card {
    const card = this.queues[deck].shift();
    if (!card) throw new Error(`ScriptedCards: mazzo ${deck} esaurito`);
    return card;
  }

  returnCard(deck: DeckName, card: Card): void {
    this.queues[deck].push(card);
  }
}

export const NOOP_CARD: Card = { id: "noop", text: "Nessun effetto (carta di test)", effect: { kind: "collect", amount: 0 } };

/**
 * Board minimale di test: 12 caselle, così ogni somma di dadi non-doppia
 * (2-11) da posizione 0 atterra su un indice diverso senza giro del percorso,
 * rendendo i test facili da ragionare a mente.
 *
 *  0 start | 1 property A1 (grp) | 2 property A2 (grp) | 3 railroad R1
 *  4 incomeTax | 5 chance | 6 jail | 7 property B1 (grp2)
 *  8 utility U1 | 9 communityChest | 10 property B2 (grp2) | 11 goToJail
 */
export function buildTestBoard(): BoardConfig {
  const position = { x: 0, y: 0 };
  return {
    id: "test-board",
    name: "Test Board",
    version: "0.1.0",
    width: 4,
    height: 4,
    theme: "test",
    rules: {
      startingMoney: 1500,
      passingStartBonus: 200,
      minPlayers: 2,
      maxPlayers: 8,
      auctionOnDecline: false,
      turnTimerSeconds: "off",
    },
    tiles: [
      { id: "t0", type: "start", name: "Go", position },
      {
        id: "t1", type: "property", name: "A1", position, group: "grp", groupColor: "#000",
        purchasePrice: 100, baseRent: 10, rentLevels: [30, 60, 90, 120], houseCost: 50, hotelCost: 50,
        ownerId: null, houses: 0, hotel: false, mortgaged: false,
      },
      {
        id: "t2", type: "property", name: "A2", position, group: "grp", groupColor: "#000",
        purchasePrice: 100, baseRent: 10, rentLevels: [30, 60, 90, 120], houseCost: 50, hotelCost: 50,
        ownerId: null, houses: 0, hotel: false, mortgaged: false,
      },
      { id: "t3", type: "railroad", name: "R1", position, purchasePrice: 200, baseRent: 25, ownerId: null, mortgaged: false },
      { id: "t4", type: "incomeTax", name: "Tax", position, amount: 50 },
      { id: "t5", type: "chance", name: "Fortune", position },
      { id: "t6", type: "jail", name: "Jail / Just Visiting", position },
      {
        id: "t7", type: "property", name: "B1", position, group: "grp2", groupColor: "#111",
        purchasePrice: 150, baseRent: 15, ownerId: null, houses: 0, hotel: false, mortgaged: false,
      },
      { id: "t8", type: "utility", name: "U1", position, purchasePrice: 150, ownerId: null, mortgaged: false },
      { id: "t9", type: "communityChest", name: "Treasury", position },
      {
        id: "t10", type: "property", name: "B2", position, group: "grp2", groupColor: "#111",
        purchasePrice: 150, baseRent: 15, ownerId: null, houses: 0, hotel: false, mortgaged: false,
      },
      { id: "t11", type: "goToJail", name: "Go To Jail", position },
    ],
  };
}

export function buildTestPlayers(count: number, money = 1500) {
  const colors = ["#3d5af1", "#e91e8c", "#ffb703", "#2e7d32"];
  return Array.from({ length: count }, (_, i) => createPlayer(`p${i}`, `Player${i}`, colors[i], money));
}
