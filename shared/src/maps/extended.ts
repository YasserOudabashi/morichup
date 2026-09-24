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
    "type": "property",
    "name": "The Hague",
    "group": "brown",
    "groupColor": "#8b5a2b",
    "purchasePrice": 80,
    "baseRent": 5,
    "rentLevels": [
      26,
      75,
      226,
      362
    ],
    "houseCost": 45,
    "hotelCost": 45,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-5",
    "position": {
      "x": 5,
      "y": 0
    },
    "type": "incomeTax",
    "name": "Income Tax",
    "amount": 200
  },
  {
    "id": "tile-6",
    "position": {
      "x": 6,
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
    "id": "tile-7",
    "position": {
      "x": 7,
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
    "id": "tile-8",
    "position": {
      "x": 8,
      "y": 0
    },
    "type": "chance",
    "name": "Fortune"
  },
  {
    "id": "tile-9",
    "position": {
      "x": 9,
      "y": 0
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
    "id": "tile-10",
    "position": {
      "x": 10,
      "y": 0
    },
    "type": "property",
    "name": "Venice",
    "group": "lightBlue",
    "groupColor": "#7ec8e3",
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
    "id": "tile-11",
    "position": {
      "x": 11,
      "y": 0
    },
    "type": "property",
    "name": "Chiang Mai",
    "group": "teal",
    "groupColor": "#00897b",
    "purchasePrice": 130,
    "baseRent": 10,
    "rentLevels": [
      52,
      151,
      445,
      633
    ],
    "houseCost": 65,
    "hotelCost": 65,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-12",
    "position": {
      "x": 12,
      "y": 0
    },
    "type": "property",
    "name": "Phuket",
    "group": "teal",
    "groupColor": "#00897b",
    "purchasePrice": 130,
    "baseRent": 10,
    "rentLevels": [
      52,
      151,
      445,
      633
    ],
    "houseCost": 65,
    "hotelCost": 65,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-13",
    "position": {
      "x": 13,
      "y": 0
    },
    "type": "utility",
    "name": "Global Water Co.",
    "purchasePrice": 150,
    "baseRent": 4,
    "ownerId": null,
    "mortgaged": false
  },
  {
    "id": "tile-14",
    "position": {
      "x": 14,
      "y": 0
    },
    "type": "jail",
    "name": "Jail / Just Visiting"
  },
  {
    "id": "tile-15",
    "position": {
      "x": 14,
      "y": 1
    },
    "type": "property",
    "name": "Bangkok",
    "group": "teal",
    "groupColor": "#00897b",
    "purchasePrice": 150,
    "baseRent": 13,
    "rentLevels": [
      63,
      188,
      545,
      758
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
      "x": 14,
      "y": 2
    },
    "type": "property",
    "name": "Berlin",
    "group": "pink",
    "groupColor": "#e91e8c",
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
    "id": "tile-17",
    "position": {
      "x": 14,
      "y": 3
    },
    "type": "railroad",
    "name": "Airport - Africa",
    "purchasePrice": 200,
    "baseRent": 25,
    "ownerId": null,
    "mortgaged": false
  },
  {
    "id": "tile-18",
    "position": {
      "x": 14,
      "y": 4
    },
    "type": "property",
    "name": "Munich",
    "group": "pink",
    "groupColor": "#e91e8c",
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
    "id": "tile-19",
    "position": {
      "x": 14,
      "y": 5
    },
    "type": "property",
    "name": "Frankfurt",
    "group": "pink",
    "groupColor": "#e91e8c",
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
    "id": "tile-20",
    "position": {
      "x": 14,
      "y": 6
    },
    "type": "communityChest",
    "name": "Treasury"
  },
  {
    "id": "tile-21",
    "position": {
      "x": 14,
      "y": 7
    },
    "type": "property",
    "name": "London",
    "group": "orange",
    "groupColor": "#f5821f",
    "purchasePrice": 190,
    "baseRent": 17,
    "rentLevels": [
      86,
      243,
      665,
      892
    ],
    "houseCost": 90,
    "hotelCost": 90,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-22",
    "position": {
      "x": 14,
      "y": 8
    },
    "type": "property",
    "name": "Manchester",
    "group": "orange",
    "groupColor": "#f5821f",
    "purchasePrice": 190,
    "baseRent": 17,
    "rentLevels": [
      86,
      243,
      665,
      892
    ],
    "houseCost": 90,
    "hotelCost": 90,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-23",
    "position": {
      "x": 14,
      "y": 9
    },
    "type": "chance",
    "name": "Fortune"
  },
  {
    "id": "tile-24",
    "position": {
      "x": 14,
      "y": 10
    },
    "type": "property",
    "name": "Liverpool",
    "group": "orange",
    "groupColor": "#f5821f",
    "purchasePrice": 210,
    "baseRent": 20,
    "rentLevels": [
      98,
      277,
      751,
      964
    ],
    "houseCost": 110,
    "hotelCost": 110,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-25",
    "position": {
      "x": 14,
      "y": 11
    },
    "type": "railroad",
    "name": "Airport - South America",
    "purchasePrice": 200,
    "baseRent": 25,
    "ownerId": null,
    "mortgaged": false
  },
  {
    "id": "tile-26",
    "position": {
      "x": 14,
      "y": 12
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
    "id": "tile-27",
    "position": {
      "x": 14,
      "y": 13
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
    "id": "tile-28",
    "position": {
      "x": 14,
      "y": 14
    },
    "type": "freeParking",
    "name": "Free Parking"
  },
  {
    "id": "tile-29",
    "position": {
      "x": 13,
      "y": 14
    },
    "type": "property",
    "name": "Patras",
    "group": "red",
    "groupColor": "#e53935",
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
    "id": "tile-30",
    "position": {
      "x": 12,
      "y": 14
    },
    "type": "communityChest",
    "name": "Treasury"
  },
  {
    "id": "tile-31",
    "position": {
      "x": 11,
      "y": 14
    },
    "type": "property",
    "name": "Salvador",
    "group": "violet",
    "groupColor": "#8e24aa",
    "purchasePrice": 250,
    "baseRent": 24,
    "rentLevels": [
      121,
      355,
      890,
      1092
    ],
    "houseCost": 130,
    "hotelCost": 130,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-32",
    "position": {
      "x": 10,
      "y": 14
    },
    "type": "property",
    "name": "Brasilia",
    "group": "violet",
    "groupColor": "#8e24aa",
    "purchasePrice": 250,
    "baseRent": 24,
    "rentLevels": [
      121,
      355,
      890,
      1092
    ],
    "houseCost": 130,
    "hotelCost": 130,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-33",
    "position": {
      "x": 9,
      "y": 14
    },
    "type": "railroad",
    "name": "Airport - Europe",
    "purchasePrice": 200,
    "baseRent": 25,
    "ownerId": null,
    "mortgaged": false
  },
  {
    "id": "tile-34",
    "position": {
      "x": 8,
      "y": 14
    },
    "type": "property",
    "name": "Rio de Janeiro",
    "group": "violet",
    "groupColor": "#8e24aa",
    "purchasePrice": 270,
    "baseRent": 26,
    "rentLevels": [
      132,
      397,
      949,
      1153
    ],
    "houseCost": 130,
    "hotelCost": 130,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-35",
    "position": {
      "x": 7,
      "y": 14
    },
    "type": "chance",
    "name": "Fortune"
  },
  {
    "id": "tile-36",
    "position": {
      "x": 6,
      "y": 14
    },
    "type": "property",
    "name": "Seville",
    "group": "yellow",
    "groupColor": "#fdd835",
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
    "id": "tile-37",
    "position": {
      "x": 5,
      "y": 14
    },
    "type": "property",
    "name": "Valencia",
    "group": "yellow",
    "groupColor": "#fdd835",
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
    "id": "tile-38",
    "position": {
      "x": 4,
      "y": 14
    },
    "type": "utility",
    "name": "World Power Grid",
    "purchasePrice": 150,
    "baseRent": 4,
    "ownerId": null,
    "mortgaged": false
  },
  {
    "id": "tile-39",
    "position": {
      "x": 3,
      "y": 14
    },
    "type": "property",
    "name": "Madrid",
    "group": "yellow",
    "groupColor": "#fdd835",
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
    "id": "tile-40",
    "position": {
      "x": 2,
      "y": 14
    },
    "type": "property",
    "name": "Lyon",
    "group": "green",
    "groupColor": "#2e7d32",
    "purchasePrice": 310,
    "baseRent": 32,
    "rentLevels": [
      160,
      479,
      1089,
      1322
    ],
    "houseCost": 170,
    "hotelCost": 170,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-41",
    "position": {
      "x": 1,
      "y": 14
    },
    "type": "property",
    "name": "Marseille",
    "group": "green",
    "groupColor": "#2e7d32",
    "purchasePrice": 310,
    "baseRent": 32,
    "rentLevels": [
      160,
      479,
      1089,
      1322
    ],
    "houseCost": 170,
    "hotelCost": 170,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-42",
    "position": {
      "x": 0,
      "y": 14
    },
    "type": "goToJail",
    "name": "Go To Jail"
  },
  {
    "id": "tile-43",
    "position": {
      "x": 0,
      "y": 13
    },
    "type": "communityChest",
    "name": "Treasury"
  },
  {
    "id": "tile-44",
    "position": {
      "x": 0,
      "y": 12
    },
    "type": "property",
    "name": "Paris",
    "group": "green",
    "groupColor": "#2e7d32",
    "purchasePrice": 330,
    "baseRent": 37,
    "rentLevels": [
      177,
      526,
      1196,
      1446
    ],
    "houseCost": 170,
    "hotelCost": 170,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-45",
    "position": {
      "x": 0,
      "y": 11
    },
    "type": "railroad",
    "name": "Airport - Asia",
    "purchasePrice": 200,
    "baseRent": 25,
    "ownerId": null,
    "mortgaged": false
  },
  {
    "id": "tile-46",
    "position": {
      "x": 0,
      "y": 10
    },
    "type": "property",
    "name": "Osaka",
    "group": "darkBlue",
    "groupColor": "#1a237e",
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
    "id": "tile-47",
    "position": {
      "x": 0,
      "y": 9
    },
    "type": "chance",
    "name": "Fortune"
  },
  {
    "id": "tile-48",
    "position": {
      "x": 0,
      "y": 8
    },
    "type": "property",
    "name": "Yokohama",
    "group": "darkBlue",
    "groupColor": "#1a237e",
    "purchasePrice": 380,
    "baseRent": 50,
    "rentLevels": [
      220,
      644,
      1464,
      1756
    ],
    "houseCost": 170,
    "hotelCost": 170,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-49",
    "position": {
      "x": 0,
      "y": 7
    },
    "type": "incomeTax",
    "name": "Wealth Tax",
    "amount": 150
  },
  {
    "id": "tile-50",
    "position": {
      "x": 0,
      "y": 6
    },
    "type": "property",
    "name": "Tokyo",
    "group": "darkBlue",
    "groupColor": "#1a237e",
    "purchasePrice": 420,
    "baseRent": 61,
    "rentLevels": [
      254,
      739,
      1679,
      2004
    ],
    "houseCost": 170,
    "hotelCost": 170,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-51",
    "position": {
      "x": 0,
      "y": 5
    },
    "type": "utility",
    "name": "Interplanetary Net Co.",
    "purchasePrice": 150,
    "baseRent": 4,
    "ownerId": null,
    "mortgaged": false
  },
  {
    "id": "tile-52",
    "position": {
      "x": 0,
      "y": 4
    },
    "type": "communityChest",
    "name": "Treasury"
  },
  {
    "id": "tile-53",
    "position": {
      "x": 0,
      "y": 3
    },
    "type": "railroad",
    "name": "Airport - Oceania",
    "purchasePrice": 200,
    "baseRent": 25,
    "ownerId": null,
    "mortgaged": false
  },
  {
    "id": "tile-54",
    "position": {
      "x": 0,
      "y": 2
    },
    "type": "chance",
    "name": "Fortune"
  },
  {
    "id": "tile-55",
    "position": {
      "x": 0,
      "y": 1
    },
    "type": "luxuryTax",
    "name": "Luxury Tax",
    "amount": 150
  }
] as Tile[];

export const extendedBoard: BoardConfig = {
  id: "extended",
  name: "Extended",
  version: "0.1.0",
  width: 15,
  height: 15,
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
