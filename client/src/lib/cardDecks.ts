/** Testi delle carte Fortuna/Cassa Comune, duplicati qui solo per l'anteprima
 * mazzo (click sulla casella): devono restare identici a quelli restituiti
 * dal server in CARD_DRAWN (server/src/game/CardEngine.ts), lo stesso identico
 * pattern già usato per bandiere/icone duplicate lato client. */
export const FORTUNE_CARD_TEXTS: string[] = [
  "Advance to Go (collect $200)",
  "Bank pays you a dividend of $50",
  "Go directly to Jail",
  "Get out of Jail free",
  "Pay poor tax of $15",
  "Take a trip to Osaka",
  "Go back 3 spaces",
  "You are elected Chairman — pay each player $50",
  "Lucky break! Next bankruptcy is forgiven, free of charge",
];

export const COMMUNITY_CHEST_CARD_TEXTS: string[] = [
  "Advance to Go (collect $200)",
  "Bank error in your favor — collect $200",
  "Doctor's fees — pay $50",
  "From sale of stock you get $50",
  "Get out of Jail free",
  "Go to Jail",
  "Holiday fund matures — collect $100",
  "It's your birthday — collect $10 from every player",
  "Life insurance matures: your next bankruptcy is forgiven",
];
