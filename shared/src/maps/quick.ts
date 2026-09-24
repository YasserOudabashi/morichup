import type { BoardConfig, Tile } from "../index";

// Generata da uno script di supporto (non versionato): vedi git log per i dettagli.
// I nomi/prezzi sono dati, non codice: modificabili qui senza toccare il renderer.
// Ogni gruppo colore = città di UN solo paese (Fase "redesign": prima erano paesi
// mescolati a caso nello stesso gruppo). Caselle disposte in senso orario a partire
// da "start" in alto a sinistra, come nel tabellone di riferimento.
const tiles: Tile[] = [
  {
    "id": "tile-0",
    "position": {
      "x": 0,
      "y": 0
    },
    "type": "start",
    "name": "Go"
  },
  {
    "id": "tile-1",
    "position": {
      "x": 1,
      "y": 0
    },
    "type": "property",
    "name": "Amsterdam",
    "group": "brown",
    "groupColor": "#8b5a2b",
    "purchasePrice": 60,
    "baseRent": 3,
    "rentLevels": [
      17,
      52,
      155,
      276
    ],
    "houseCost": 45,
    "hotelCost": 45,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-2",
    "position": {
      "x": 2,
      "y": 0
    },
    "type": "communityChest",
    "name": "Treasury"
  },
  {
    "id": "tile-3",
    "position": {
      "x": 3,
      "y": 0
    },
    "type": "property",
    "name": "Rotterdam",
    "group": "brown",
    "groupColor": "#8b5a2b",
    "purchasePrice": 60,
    "baseRent": 3,
    "rentLevels": [
      17,
      52,
      155,
      276
    ],
    "houseCost": 45,
    "hotelCost": 45,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-4",
    "position": {
      "x": 4,
      "y": 0
    },
    "type": "incomeTax",
    "name": "Income Tax",
    "amount": 150
  },
  {
    "id": "tile-5",
    "position": {
      "x": 5,
      "y": 0
    },
    "type": "railroad",
    "name": "Airport - Americas",
    "purchasePrice": 200,
    "baseRent": 25,
    "ownerId": null,
    "mortgaged": false
  },
  {
    "id": "tile-6",
    "position": {
      "x": 6,
      "y": 0
    },
    "type": "property",
    "name": "Rome",
    "group": "lightBlue",
    "groupColor": "#7ec8e3",
    "purchasePrice": 100,
    "baseRent": 7,
    "rentLevels": [
      35,
      99,
      297,
      449
    ],
    "houseCost": 45,
    "hotelCost": 45,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-7",
    "position": {
      "x": 7,
      "y": 0
    },
    "type": "jail",
    "name": "Jail / Just Visiting"
  },
  {
    "id": "tile-8",
    "position": {
      "x": 7,
      "y": 1
    },
    "type": "property",
    "name": "Milan",
    "group": "lightBlue",
    "groupColor": "#7ec8e3",
    "purchasePrice": 100,
    "baseRent": 7,
    "rentLevels": [
      35,
      99,
      297,
      449
    ],
    "houseCost": 45,
    "hotelCost": 45,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-9",
    "position": {
      "x": 7,
      "y": 2
    },
    "type": "chance",
    "name": "Fortune"
  },
  {
    "id": "tile-10",
    "position": {
      "x": 7,
      "y": 3
    },
    "type": "property",
    "name": "Berlin",
    "group": "pink",
    "groupColor": "#e91e8c",
    "purchasePrice": 140,
    "baseRent": 12,
    "rentLevels": [
      57,
      171,
      499,
      701
    ],
    "houseCost": 80,
    "hotelCost": 80,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-11",
    "position": {
      "x": 7,
      "y": 4
    },
    "type": "utility",
    "name": "Global Water Co.",
    "purchasePrice": 150,
    "baseRent": 4,
    "ownerId": null,
    "mortgaged": false
  },
  {
    "id": "tile-12",
    "position": {
      "x": 7,
      "y": 5
    },
    "type": "freeParking",
    "name": "Free Parking"
  },
  {
    "id": "tile-13",
    "position": {
      "x": 6,
      "y": 5
    },
    "type": "property",
    "name": "Munich",
    "group": "pink",
    "groupColor": "#e91e8c",
    "purchasePrice": 140,
    "baseRent": 12,
    "rentLevels": [
      57,
      171,
      499,
      701
    ],
    "houseCost": 80,
    "hotelCost": 80,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-14",
    "position": {
      "x": 5,
      "y": 5
    },
    "type": "communityChest",
    "name": "Treasury"
  },
  {
    "id": "tile-15",
    "position": {
      "x": 4,
      "y": 5
    },
    "type": "property",
    "name": "London",
    "group": "orange",
    "groupColor": "#f5821f",
    "purchasePrice": 180,
    "baseRent": 16,
    "rentLevels": [
      80,
      228,
      632,
      858
    ],
    "houseCost": 85,
    "hotelCost": 85,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-16",
    "position": {
      "x": 3,
      "y": 5
    },
    "type": "railroad",
    "name": "Airport - Europe",
    "purchasePrice": 200,
    "baseRent": 25,
    "ownerId": null,
    "mortgaged": false
  },
  {
    "id": "tile-17",
    "position": {
      "x": 2,
      "y": 5
    },
    "type": "property",
    "name": "Manchester",
    "group": "orange",
    "groupColor": "#f5821f",
    "purchasePrice": 180,
    "baseRent": 16,
    "rentLevels": [
      80,
      228,
      632,
      858
    ],
    "houseCost": 85,
    "hotelCost": 85,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-18",
    "position": {
      "x": 1,
      "y": 5
    },
    "type": "chance",
    "name": "Fortune"
  },
  {
    "id": "tile-19",
    "position": {
      "x": 0,
      "y": 5
    },
    "type": "goToJail",
    "name": "Go To Jail"
  },
  {
    "id": "tile-20",
    "position": {
      "x": 0,
      "y": 4
    },
    "type": "property",
    "name": "Athens",
    "group": "red",
    "groupColor": "#e53935",
    "purchasePrice": 220,
    "baseRent": 21,
    "rentLevels": [
      103,
      295,
      794,
      1000
    ],
    "houseCost": 120,
    "hotelCost": 120,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-21",
    "position": {
      "x": 0,
      "y": 3
    },
    "type": "communityChest",
    "name": "Treasury"
  },
  {
    "id": "tile-22",
    "position": {
      "x": 0,
      "y": 2
    },
    "type": "property",
    "name": "Thessaloniki",
    "group": "red",
    "groupColor": "#e53935",
    "purchasePrice": 220,
    "baseRent": 21,
    "rentLevels": [
      103,
      295,
      794,
      1000
    ],
    "houseCost": 120,
    "hotelCost": 120,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-23",
    "position": {
      "x": 0,
      "y": 1
    },
    "type": "chance",
    "name": "Fortune"
  }
] as Tile[];

export const quickBoard: BoardConfig = {
  id: "quick",
  name: "Quick",
  version: "0.1.0",
  width: 8,
  height: 6,
  tiles,
  rules: {
    "startingMoney": 1500,
    "passingStartBonus": 200,
    "minPlayers": 2,
    "maxPlayers": 8,
    "auctionOnDecline": false,
    "turnTimerSeconds": "off"
  },
  theme: "world-countries",
};
