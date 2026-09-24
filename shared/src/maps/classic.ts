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
    "groupColor": "#e8741e",
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
    "groupColor": "#e8741e",
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
    "amount": 200
  },
  {
    "id": "tile-5",
    "position": {
      "x": 5,
      "y": 0
    },
    "type": "railroad",
    "name": "JFK Airport",
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
    "groupColor": "#009246",
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
    "type": "chance",
    "name": "Fortune"
  },
  {
    "id": "tile-8",
    "position": {
      "x": 8,
      "y": 0
    },
    "type": "property",
    "name": "Milan",
    "group": "lightBlue",
    "groupColor": "#009246",
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
      "x": 9,
      "y": 0
    },
    "type": "property",
    "name": "Venice",
    "group": "lightBlue",
    "groupColor": "#009246",
    "purchasePrice": 120,
    "baseRent": 9,
    "rentLevels": [
      46,
      132,
      392,
      566
    ],
    "houseCost": 55,
    "hotelCost": 55,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-10",
    "position": {
      "x": 10,
      "y": 0
    },
    "type": "jail",
    "name": "Jail / Just Visiting"
  },
  {
    "id": "tile-11",
    "position": {
      "x": 10,
      "y": 1
    },
    "type": "property",
    "name": "Berlin",
    "group": "pink",
    "groupColor": "#e0b400",
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
    "id": "tile-12",
    "position": {
      "x": 10,
      "y": 2
    },
    "type": "utility",
    "name": "Water Company",
    "purchasePrice": 150,
    "baseRent": 4,
    "ownerId": null,
    "mortgaged": false
  },
  {
    "id": "tile-13",
    "position": {
      "x": 10,
      "y": 3
    },
    "type": "property",
    "name": "Munich",
    "group": "pink",
    "groupColor": "#e0b400",
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
      "x": 10,
      "y": 4
    },
    "type": "property",
    "name": "Frankfurt",
    "group": "pink",
    "groupColor": "#e0b400",
    "purchasePrice": 160,
    "baseRent": 14,
    "rentLevels": [
      69,
      201,
      574,
      791
    ],
    "houseCost": 85,
    "hotelCost": 85,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-15",
    "position": {
      "x": 10,
      "y": 5
    },
    "type": "railroad",
    "name": "CAI Airport",
    "purchasePrice": 200,
    "baseRent": 25,
    "ownerId": null,
    "mortgaged": false
  },
  {
    "id": "tile-16",
    "position": {
      "x": 10,
      "y": 6
    },
    "type": "property",
    "name": "London",
    "group": "orange",
    "groupColor": "#1b3a78",
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
    "id": "tile-17",
    "position": {
      "x": 10,
      "y": 7
    },
    "type": "communityChest",
    "name": "Treasury"
  },
  {
    "id": "tile-18",
    "position": {
      "x": 10,
      "y": 8
    },
    "type": "property",
    "name": "Manchester",
    "group": "orange",
    "groupColor": "#1b3a78",
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
    "id": "tile-19",
    "position": {
      "x": 10,
      "y": 9
    },
    "type": "property",
    "name": "Liverpool",
    "group": "orange",
    "groupColor": "#1b3a78",
    "purchasePrice": 200,
    "baseRent": 18,
    "rentLevels": [
      92,
      260,
      708,
      928
    ],
    "houseCost": 100,
    "hotelCost": 100,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-20",
    "position": {
      "x": 10,
      "y": 10
    },
    "type": "freeParking",
    "name": "Free Parking"
  },
  {
    "id": "tile-21",
    "position": {
      "x": 9,
      "y": 10
    },
    "type": "property",
    "name": "Athens",
    "group": "red",
    "groupColor": "#2e74b5",
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
    "id": "tile-22",
    "position": {
      "x": 8,
      "y": 10
    },
    "type": "chance",
    "name": "Fortune"
  },
  {
    "id": "tile-23",
    "position": {
      "x": 7,
      "y": 10
    },
    "type": "property",
    "name": "Thessaloniki",
    "group": "red",
    "groupColor": "#2e74b5",
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
    "id": "tile-24",
    "position": {
      "x": 6,
      "y": 10
    },
    "type": "property",
    "name": "Patras",
    "group": "red",
    "groupColor": "#2e74b5",
    "purchasePrice": 240,
    "baseRent": 23,
    "rentLevels": [
      115,
      334,
      862,
      1063
    ],
    "houseCost": 130,
    "hotelCost": 130,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-25",
    "position": {
      "x": 5,
      "y": 10
    },
    "type": "railroad",
    "name": "CDG Airport",
    "purchasePrice": 200,
    "baseRent": 25,
    "ownerId": null,
    "mortgaged": false
  },
  {
    "id": "tile-26",
    "position": {
      "x": 4,
      "y": 10
    },
    "type": "property",
    "name": "Seville",
    "group": "yellow",
    "groupColor": "#b01c22",
    "purchasePrice": 260,
    "baseRent": 25,
    "rentLevels": [
      126,
      376,
      919,
      1120
    ],
    "houseCost": 130,
    "hotelCost": 130,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-27",
    "position": {
      "x": 3,
      "y": 10
    },
    "type": "property",
    "name": "Valencia",
    "group": "yellow",
    "groupColor": "#b01c22",
    "purchasePrice": 260,
    "baseRent": 25,
    "rentLevels": [
      126,
      376,
      919,
      1120
    ],
    "houseCost": 130,
    "hotelCost": 130,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-28",
    "position": {
      "x": 2,
      "y": 10
    },
    "type": "utility",
    "name": "Electric Company",
    "purchasePrice": 150,
    "baseRent": 4,
    "ownerId": null,
    "mortgaged": false
  },
  {
    "id": "tile-29",
    "position": {
      "x": 1,
      "y": 10
    },
    "type": "property",
    "name": "Madrid",
    "group": "yellow",
    "groupColor": "#b01c22",
    "purchasePrice": 280,
    "baseRent": 28,
    "rentLevels": [
      139,
      417,
      983,
      1193
    ],
    "houseCost": 140,
    "hotelCost": 140,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-30",
    "position": {
      "x": 0,
      "y": 10
    },
    "type": "goToJail",
    "name": "Go To Jail"
  },
  {
    "id": "tile-31",
    "position": {
      "x": 0,
      "y": 9
    },
    "type": "property",
    "name": "Lyon",
    "group": "green",
    "groupColor": "#3b63a8",
    "purchasePrice": 300,
    "baseRent": 30,
    "rentLevels": [
      152,
      457,
      1050,
      1275
    ],
    "houseCost": 165,
    "hotelCost": 165,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-32",
    "position": {
      "x": 0,
      "y": 8
    },
    "type": "property",
    "name": "Marseille",
    "group": "green",
    "groupColor": "#3b63a8",
    "purchasePrice": 300,
    "baseRent": 30,
    "rentLevels": [
      152,
      457,
      1050,
      1275
    ],
    "houseCost": 165,
    "hotelCost": 165,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-33",
    "position": {
      "x": 0,
      "y": 7
    },
    "type": "communityChest",
    "name": "Treasury"
  },
  {
    "id": "tile-34",
    "position": {
      "x": 0,
      "y": 6
    },
    "type": "property",
    "name": "Paris",
    "group": "green",
    "groupColor": "#3b63a8",
    "purchasePrice": 320,
    "baseRent": 34,
    "rentLevels": [
      168,
      502,
      1143,
      1384
    ],
    "houseCost": 170,
    "hotelCost": 170,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-35",
    "position": {
      "x": 0,
      "y": 5
    },
    "type": "railroad",
    "name": "NRT Airport",
    "purchasePrice": 200,
    "baseRent": 25,
    "ownerId": null,
    "mortgaged": false
  },
  {
    "id": "tile-36",
    "position": {
      "x": 0,
      "y": 4
    },
    "type": "chance",
    "name": "Fortune"
  },
  {
    "id": "tile-37",
    "position": {
      "x": 0,
      "y": 3
    },
    "type": "property",
    "name": "Osaka",
    "group": "darkBlue",
    "groupColor": "#c41e3a",
    "purchasePrice": 350,
    "baseRent": 42,
    "rentLevels": [
      194,
      573,
      1304,
      1570
    ],
    "houseCost": 170,
    "hotelCost": 170,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-38",
    "position": {
      "x": 0,
      "y": 2
    },
    "type": "luxuryTax",
    "name": "Luxury Tax",
    "amount": 100
  },
  {
    "id": "tile-39",
    "position": {
      "x": 0,
      "y": 1
    },
    "type": "property",
    "name": "Yokohama",
    "group": "darkBlue",
    "groupColor": "#c41e3a",
    "purchasePrice": 400,
    "baseRent": 56,
    "rentLevels": [
      237,
      692,
      1571,
      1880
    ],
    "houseCost": 170,
    "hotelCost": 170,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  }
] as Tile[];

export const classicBoard: BoardConfig = {
  id: "classic",
  name: "Classic",
  version: "0.2.0",
  width: 11,
  height: 11,
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
