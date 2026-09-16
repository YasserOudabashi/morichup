import { createRng } from "./DiceEngine";

export type CardEffect =
  | { kind: "moveToPosition"; position: number }
  | { kind: "moveRelative"; steps: number }
  | { kind: "collect"; amount: number }
  | { kind: "pay"; amount: number }
  | { kind: "payEachPlayer"; amount: number }
  | { kind: "collectFromEachPlayer"; amount: number }
  | { kind: "goToJail" }
  | { kind: "getOutOfJailFree" };

export interface Card {
  id: string;
  text: string;
  effect: CardEffect;
}

export type DeckName = "fortune" | "communityChest";

export interface CardDeckSource {
  draw(deck: DeckName): Card;
  returnCard(deck: DeckName, card: Card): void;
}

const FORTUNE_CARDS: Card[] = [
  { id: "fortune-advance-go", text: "Advance to Go (collect $200)", effect: { kind: "moveToPosition", position: 0 } },
  { id: "fortune-dividend", text: "Bank pays you a dividend of $50", effect: { kind: "collect", amount: 50 } },
  { id: "fortune-go-to-jail", text: "Go directly to Jail", effect: { kind: "goToJail" } },
  { id: "fortune-jail-free", text: "Get out of Jail free", effect: { kind: "getOutOfJailFree" } },
  { id: "fortune-poor-tax", text: "Pay poor tax of $15", effect: { kind: "pay", amount: 15 } },
  { id: "fortune-trip", text: "Take a trip to Osaka", effect: { kind: "moveToPosition", position: 37 } },
  { id: "fortune-back-3", text: "Go back 3 spaces", effect: { kind: "moveRelative", steps: -3 } },
  { id: "fortune-chairman", text: "You are elected Chairman — pay each player $50", effect: { kind: "payEachPlayer", amount: 50 } },
];

const COMMUNITY_CHEST_CARDS: Card[] = [
  { id: "chest-advance-go", text: "Advance to Go (collect $200)", effect: { kind: "moveToPosition", position: 0 } },
  { id: "chest-bank-error", text: "Bank error in your favor — collect $200", effect: { kind: "collect", amount: 200 } },
  { id: "chest-doctor", text: "Doctor's fees — pay $50", effect: { kind: "pay", amount: 50 } },
  { id: "chest-stock", text: "From sale of stock you get $50", effect: { kind: "collect", amount: 50 } },
  { id: "chest-jail-free", text: "Get out of Jail free", effect: { kind: "getOutOfJailFree" } },
  { id: "chest-go-to-jail", text: "Go to Jail", effect: { kind: "goToJail" } },
  { id: "chest-holiday", text: "Holiday fund matures — collect $100", effect: { kind: "collect", amount: 100 } },
  { id: "chest-birthday", text: "It's your birthday — collect $10 from every player", effect: { kind: "collectFromEachPlayer", amount: 10 } },
];

function shuffle<T>(items: T[], rng: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export class CardEngine {
  private decks: Record<DeckName, Card[]>;

  constructor(seed: number) {
    const rng = createRng(seed);
    this.decks = {
      fortune: shuffle(FORTUNE_CARDS, rng),
      communityChest: shuffle(COMMUNITY_CHEST_CARDS, rng),
    };
  }

  /** Pesca la carta in cima al mazzo. Le carte normali tornano in fondo; le "get out of jail
   * free" restano fuori dal mazzo finché non vengono restituite con returnCard(). */
  draw(deck: DeckName): Card {
    const pile = this.decks[deck];
    const card = pile.shift();
    if (!card) throw new Error(`Mazzo ${deck} esaurito`);
    if (card.effect.kind !== "getOutOfJailFree") {
      pile.push(card);
    }
    return card;
  }

  returnCard(deck: DeckName, card: Card): void {
    this.decks[deck].push(card);
  }
}
