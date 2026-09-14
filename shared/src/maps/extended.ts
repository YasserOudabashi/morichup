import type { BoardConfig, Tile } from "../index";

// Generata da uno script di supporto (non versionato): vedi git log per i dettagli.
// I nomi/prezzi sono dati, non codice: modificabili qui senza toccare il renderer.
const tiles: Tile[] = [
  {
    "id": "tile-0",
    "position": {
      "x": 14,
      "y": 14
    },
    "type": "start",
    "name": "Go"
  },
  {
    "id": "tile-1",
    "position": {
      "x": 13,
      "y": 14
    },
    "type": "property",
    "name": "Nepal",
    "group": "brown",
    "groupColor": "#8b5a2b",
    "purchasePrice": 60,
    "baseRent": 5,
    "rentLevels": [
      14,
      22,
      29,
      36
    ],
    "houseCost": 30,
    "hotelCost": 30,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-2",
    "position": {
      "x": 12,
      "y": 14
    },
    "type": "communityChest",
    "name": "Treasury"
  },
  {
    "id": "tile-3",
    "position": {
      "x": 11,
      "y": 14
    },
    "type": "property",
    "name": "Bhutan",
    "group": "brown",
    "groupColor": "#8b5a2b",
    "purchasePrice": 60,
    "baseRent": 5,
    "rentLevels": [
      14,
      22,
      29,
      36
    ],
    "houseCost": 30,
    "hotelCost": 30,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-4",
    "position": {
      "x": 10,
      "y": 14
    },
    "type": "property",
    "name": "Mongolia",
    "group": "brown",
    "groupColor": "#8b5a2b",
    "purchasePrice": 80,
    "baseRent": 6,
    "rentLevels": [
      19,
      29,
      38,
      48
    ],
    "houseCost": 40,
    "hotelCost": 40,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-5",
    "position": {
      "x": 9,
      "y": 14
    },
    "type": "incomeTax",
    "name": "Income Tax",
    "amount": 200
  },
  {
    "id": "tile-6",
    "position": {
      "x": 8,
      "y": 14
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
      "y": 14
    },
    "type": "property",
    "name": "Vietnam",
    "group": "lightBlue",
    "groupColor": "#7ec8e3",
    "purchasePrice": 100,
    "baseRent": 8,
    "rentLevels": [
      24,
      36,
      48,
      60
    ],
    "houseCost": 50,
    "hotelCost": 50,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-8",
    "position": {
      "x": 6,
      "y": 14
    },
    "type": "chance",
    "name": "Fortune"
  },
  {
    "id": "tile-9",
    "position": {
      "x": 5,
      "y": 14
    },
    "type": "property",
    "name": "Cambodia",
    "group": "lightBlue",
    "groupColor": "#7ec8e3",
    "purchasePrice": 100,
    "baseRent": 8,
    "rentLevels": [
      24,
      36,
      48,
      60
    ],
    "houseCost": 50,
    "hotelCost": 50,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-10",
    "position": {
      "x": 4,
      "y": 14
    },
    "type": "property",
    "name": "Laos",
    "group": "lightBlue",
    "groupColor": "#7ec8e3",
    "purchasePrice": 120,
    "baseRent": 10,
    "rentLevels": [
      29,
      43,
      58,
      72
    ],
    "houseCost": 60,
    "hotelCost": 60,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-11",
    "position": {
      "x": 3,
      "y": 14
    },
    "type": "property",
    "name": "Thailand",
    "group": "teal",
    "groupColor": "#00897b",
    "purchasePrice": 130,
    "baseRent": 10,
    "rentLevels": [
      31,
      47,
      62,
      78
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
      "x": 2,
      "y": 14
    },
    "type": "property",
    "name": "Philippines",
    "group": "teal",
    "groupColor": "#00897b",
    "purchasePrice": 130,
    "baseRent": 10,
    "rentLevels": [
      31,
      47,
      62,
      78
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
      "x": 1,
      "y": 14
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
      "x": 0,
      "y": 14
    },
    "type": "jail",
    "name": "Jail / Just Visiting"
  },
  {
    "id": "tile-15",
    "position": {
      "x": 0,
      "y": 13
    },
    "type": "property",
    "name": "Indonesia",
    "group": "teal",
    "groupColor": "#00897b",
    "purchasePrice": 150,
    "baseRent": 12,
    "rentLevels": [
      36,
      54,
      72,
      90
    ],
    "houseCost": 75,
    "hotelCost": 75,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-16",
    "position": {
      "x": 0,
      "y": 12
    },
    "type": "property",
    "name": "Mexico",
    "group": "pink",
    "groupColor": "#e91e8c",
    "purchasePrice": 160,
    "baseRent": 13,
    "rentLevels": [
      38,
      58,
      77,
      96
    ],
    "houseCost": 80,
    "hotelCost": 80,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-17",
    "position": {
      "x": 0,
      "y": 11
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
      "x": 0,
      "y": 10
    },
    "type": "property",
    "name": "Peru",
    "group": "pink",
    "groupColor": "#e91e8c",
    "purchasePrice": 160,
    "baseRent": 13,
    "rentLevels": [
      38,
      58,
      77,
      96
    ],
    "houseCost": 80,
    "hotelCost": 80,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-19",
    "position": {
      "x": 0,
      "y": 9
    },
    "type": "property",
    "name": "Colombia",
    "group": "pink",
    "groupColor": "#e91e8c",
    "purchasePrice": 180,
    "baseRent": 14,
    "rentLevels": [
      43,
      65,
      86,
      108
    ],
    "houseCost": 90,
    "hotelCost": 90,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-20",
    "position": {
      "x": 0,
      "y": 8
    },
    "type": "communityChest",
    "name": "Treasury"
  },
  {
    "id": "tile-21",
    "position": {
      "x": 0,
      "y": 7
    },
    "type": "property",
    "name": "Turkey",
    "group": "orange",
    "groupColor": "#f5821f",
    "purchasePrice": 190,
    "baseRent": 15,
    "rentLevels": [
      46,
      68,
      91,
      114
    ],
    "houseCost": 95,
    "hotelCost": 95,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-22",
    "position": {
      "x": 0,
      "y": 6
    },
    "type": "property",
    "name": "Greece",
    "group": "orange",
    "groupColor": "#f5821f",
    "purchasePrice": 190,
    "baseRent": 15,
    "rentLevels": [
      46,
      68,
      91,
      114
    ],
    "houseCost": 95,
    "hotelCost": 95,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-23",
    "position": {
      "x": 0,
      "y": 5
    },
    "type": "chance",
    "name": "Fortune"
  },
  {
    "id": "tile-24",
    "position": {
      "x": 0,
      "y": 4
    },
    "type": "property",
    "name": "Portugal",
    "group": "orange",
    "groupColor": "#f5821f",
    "purchasePrice": 210,
    "baseRent": 17,
    "rentLevels": [
      50,
      76,
      101,
      126
    ],
    "houseCost": 105,
    "hotelCost": 105,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-25",
    "position": {
      "x": 0,
      "y": 3
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
      "x": 0,
      "y": 2
    },
    "type": "property",
    "name": "Egypt",
    "group": "red",
    "groupColor": "#e53935",
    "purchasePrice": 220,
    "baseRent": 18,
    "rentLevels": [
      53,
      79,
      106,
      132
    ],
    "houseCost": 110,
    "hotelCost": 110,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-27",
    "position": {
      "x": 0,
      "y": 1
    },
    "type": "property",
    "name": "Morocco",
    "group": "red",
    "groupColor": "#e53935",
    "purchasePrice": 220,
    "baseRent": 18,
    "rentLevels": [
      53,
      79,
      106,
      132
    ],
    "houseCost": 110,
    "hotelCost": 110,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-28",
    "position": {
      "x": 0,
      "y": 0
    },
    "type": "freeParking",
    "name": "Free Parking"
  },
  {
    "id": "tile-29",
    "position": {
      "x": 1,
      "y": 0
    },
    "type": "property",
    "name": "Kenya",
    "group": "red",
    "groupColor": "#e53935",
    "purchasePrice": 240,
    "baseRent": 19,
    "rentLevels": [
      58,
      86,
      115,
      144
    ],
    "houseCost": 120,
    "hotelCost": 120,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-30",
    "position": {
      "x": 2,
      "y": 0
    },
    "type": "communityChest",
    "name": "Treasury"
  },
  {
    "id": "tile-31",
    "position": {
      "x": 3,
      "y": 0
    },
    "type": "property",
    "name": "Argentina",
    "group": "violet",
    "groupColor": "#8e24aa",
    "purchasePrice": 250,
    "baseRent": 20,
    "rentLevels": [
      60,
      90,
      120,
      150
    ],
    "houseCost": 125,
    "hotelCost": 125,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-32",
    "position": {
      "x": 4,
      "y": 0
    },
    "type": "property",
    "name": "Chile",
    "group": "violet",
    "groupColor": "#8e24aa",
    "purchasePrice": 250,
    "baseRent": 20,
    "rentLevels": [
      60,
      90,
      120,
      150
    ],
    "houseCost": 125,
    "hotelCost": 125,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-33",
    "position": {
      "x": 5,
      "y": 0
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
      "x": 6,
      "y": 0
    },
    "type": "property",
    "name": "Brazil",
    "group": "violet",
    "groupColor": "#8e24aa",
    "purchasePrice": 270,
    "baseRent": 22,
    "rentLevels": [
      65,
      97,
      130,
      162
    ],
    "houseCost": 135,
    "hotelCost": 135,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-35",
    "position": {
      "x": 7,
      "y": 0
    },
    "type": "chance",
    "name": "Fortune"
  },
  {
    "id": "tile-36",
    "position": {
      "x": 8,
      "y": 0
    },
    "type": "property",
    "name": "Spain",
    "group": "yellow",
    "groupColor": "#fdd835",
    "purchasePrice": 280,
    "baseRent": 22,
    "rentLevels": [
      67,
      101,
      134,
      168
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
      "x": 9,
      "y": 0
    },
    "type": "property",
    "name": "Italy",
    "group": "yellow",
    "groupColor": "#fdd835",
    "purchasePrice": 280,
    "baseRent": 22,
    "rentLevels": [
      67,
      101,
      134,
      168
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
      "x": 10,
      "y": 0
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
      "x": 11,
      "y": 0
    },
    "type": "property",
    "name": "Poland",
    "group": "yellow",
    "groupColor": "#fdd835",
    "purchasePrice": 300,
    "baseRent": 24,
    "rentLevels": [
      72,
      108,
      144,
      180
    ],
    "houseCost": 150,
    "hotelCost": 150,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-40",
    "position": {
      "x": 12,
      "y": 0
    },
    "type": "property",
    "name": "Germany",
    "group": "green",
    "groupColor": "#2e7d32",
    "purchasePrice": 310,
    "baseRent": 25,
    "rentLevels": [
      74,
      112,
      149,
      186
    ],
    "houseCost": 155,
    "hotelCost": 155,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-41",
    "position": {
      "x": 13,
      "y": 0
    },
    "type": "property",
    "name": "France",
    "group": "green",
    "groupColor": "#2e7d32",
    "purchasePrice": 310,
    "baseRent": 25,
    "rentLevels": [
      74,
      112,
      149,
      186
    ],
    "houseCost": 155,
    "hotelCost": 155,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-42",
    "position": {
      "x": 14,
      "y": 0
    },
    "type": "goToJail",
    "name": "Go To Jail"
  },
  {
    "id": "tile-43",
    "position": {
      "x": 14,
      "y": 1
    },
    "type": "communityChest",
    "name": "Treasury"
  },
  {
    "id": "tile-44",
    "position": {
      "x": 14,
      "y": 2
    },
    "type": "property",
    "name": "United Kingdom",
    "group": "green",
    "groupColor": "#2e7d32",
    "purchasePrice": 330,
    "baseRent": 26,
    "rentLevels": [
      79,
      119,
      158,
      198
    ],
    "houseCost": 165,
    "hotelCost": 165,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-45",
    "position": {
      "x": 14,
      "y": 3
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
      "x": 14,
      "y": 4
    },
    "type": "property",
    "name": "Japan",
    "group": "darkBlue",
    "groupColor": "#1a237e",
    "purchasePrice": 350,
    "baseRent": 28,
    "rentLevels": [
      84,
      126,
      168,
      210
    ],
    "houseCost": 175,
    "hotelCost": 175,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-47",
    "position": {
      "x": 14,
      "y": 5
    },
    "type": "chance",
    "name": "Fortune"
  },
  {
    "id": "tile-48",
    "position": {
      "x": 14,
      "y": 6
    },
    "type": "property",
    "name": "United States",
    "group": "darkBlue",
    "groupColor": "#1a237e",
    "purchasePrice": 380,
    "baseRent": 30,
    "rentLevels": [
      91,
      137,
      182,
      228
    ],
    "houseCost": 190,
    "hotelCost": 190,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-49",
    "position": {
      "x": 14,
      "y": 7
    },
    "type": "incomeTax",
    "name": "Wealth Tax",
    "amount": 150
  },
  {
    "id": "tile-50",
    "position": {
      "x": 14,
      "y": 8
    },
    "type": "property",
    "name": "Canada",
    "group": "darkBlue",
    "groupColor": "#1a237e",
    "purchasePrice": 420,
    "baseRent": 34,
    "rentLevels": [
      101,
      151,
      202,
      252
    ],
    "houseCost": 210,
    "hotelCost": 210,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-51",
    "position": {
      "x": 14,
      "y": 9
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
      "x": 14,
      "y": 10
    },
    "type": "communityChest",
    "name": "Treasury"
  },
  {
    "id": "tile-53",
    "position": {
      "x": 14,
      "y": 11
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
      "x": 14,
      "y": 12
    },
    "type": "chance",
    "name": "Fortune"
  },
  {
    "id": "tile-55",
    "position": {
      "x": 14,
      "y": 13
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
    startingMoney: 1500,
    passingStartBonus: 200,
    minPlayers: 2,
    maxPlayers: 8,
    auctionOnDecline: false,
    turnTimerSeconds: "off",
  },
  theme: "world-countries",
};
