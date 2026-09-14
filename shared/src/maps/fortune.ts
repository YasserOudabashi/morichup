import type { BoardConfig, Tile } from "../index";

// Generata da uno script di supporto (non versionato): vedi git log per i dettagli.
// I nomi/prezzi sono dati, non codice: modificabili qui senza toccare il renderer.
const tiles: Tile[] = [
  {
    "id": "tile-0",
    "position": {
      "x": 10,
      "y": 8
    },
    "type": "start",
    "name": "Go"
  },
  {
    "id": "tile-1",
    "position": {
      "x": 9,
      "y": 8
    },
    "type": "property",
    "name": "Argentina",
    "group": "violet",
    "groupColor": "#8e24aa",
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
    "id": "tile-2",
    "position": {
      "x": 8,
      "y": 8
    },
    "type": "chance",
    "name": "Fortune"
  },
  {
    "id": "tile-3",
    "position": {
      "x": 7,
      "y": 8
    },
    "type": "property",
    "name": "Chile",
    "group": "violet",
    "groupColor": "#8e24aa",
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
    "id": "tile-4",
    "position": {
      "x": 6,
      "y": 8
    },
    "type": "communityChest",
    "name": "Treasury"
  },
  {
    "id": "tile-5",
    "position": {
      "x": 5,
      "y": 8
    },
    "type": "property",
    "name": "Brazil",
    "group": "violet",
    "groupColor": "#8e24aa",
    "purchasePrice": 170,
    "baseRent": 14,
    "rentLevels": [
      41,
      61,
      82,
      102
    ],
    "houseCost": 85,
    "hotelCost": 85,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-6",
    "position": {
      "x": 4,
      "y": 8
    },
    "type": "incomeTax",
    "name": "Income Tax",
    "amount": 200
  },
  {
    "id": "tile-7",
    "position": {
      "x": 3,
      "y": 8
    },
    "type": "railroad",
    "name": "Airport - Americas",
    "purchasePrice": 200,
    "baseRent": 25,
    "ownerId": null,
    "mortgaged": false
  },
  {
    "id": "tile-8",
    "position": {
      "x": 2,
      "y": 8
    },
    "type": "chance",
    "name": "Fortune"
  },
  {
    "id": "tile-9",
    "position": {
      "x": 1,
      "y": 8
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
    "id": "tile-10",
    "position": {
      "x": 0,
      "y": 8
    },
    "type": "jail",
    "name": "Jail / Just Visiting"
  },
  {
    "id": "tile-11",
    "position": {
      "x": 0,
      "y": 7
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
    "id": "tile-12",
    "position": {
      "x": 0,
      "y": 6
    },
    "type": "communityChest",
    "name": "Treasury"
  },
  {
    "id": "tile-13",
    "position": {
      "x": 0,
      "y": 5
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
    "id": "tile-14",
    "position": {
      "x": 0,
      "y": 4
    },
    "type": "chance",
    "name": "Fortune"
  },
  {
    "id": "tile-15",
    "position": {
      "x": 0,
      "y": 3
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
    "id": "tile-16",
    "position": {
      "x": 0,
      "y": 2
    },
    "type": "utility",
    "name": "Global Water Co.",
    "purchasePrice": 150,
    "baseRent": 4,
    "ownerId": null,
    "mortgaged": false
  },
  {
    "id": "tile-17",
    "position": {
      "x": 0,
      "y": 1
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
    "id": "tile-18",
    "position": {
      "x": 0,
      "y": 0
    },
    "type": "freeParking",
    "name": "Free Parking"
  },
  {
    "id": "tile-19",
    "position": {
      "x": 1,
      "y": 0
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
      "x": 2,
      "y": 0
    },
    "type": "communityChest",
    "name": "Treasury"
  },
  {
    "id": "tile-21",
    "position": {
      "x": 3,
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
    "id": "tile-22",
    "position": {
      "x": 4,
      "y": 0
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
    "id": "tile-23",
    "position": {
      "x": 5,
      "y": 0
    },
    "type": "chance",
    "name": "Fortune"
  },
  {
    "id": "tile-24",
    "position": {
      "x": 6,
      "y": 0
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
    "id": "tile-25",
    "position": {
      "x": 7,
      "y": 0
    },
    "type": "communityChest",
    "name": "Treasury"
  },
  {
    "id": "tile-26",
    "position": {
      "x": 8,
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
    "id": "tile-27",
    "position": {
      "x": 9,
      "y": 0
    },
    "type": "chance",
    "name": "Fortune"
  },
  {
    "id": "tile-28",
    "position": {
      "x": 10,
      "y": 0
    },
    "type": "goToJail",
    "name": "Go To Jail"
  },
  {
    "id": "tile-29",
    "position": {
      "x": 10,
      "y": 1
    },
    "type": "communityChest",
    "name": "Treasury"
  },
  {
    "id": "tile-30",
    "position": {
      "x": 10,
      "y": 2
    },
    "type": "property",
    "name": "Japan",
    "group": "darkBlue",
    "groupColor": "#1a237e",
    "purchasePrice": 320,
    "baseRent": 26,
    "rentLevels": [
      77,
      115,
      154,
      192
    ],
    "houseCost": 160,
    "hotelCost": 160,
    "ownerId": null,
    "houses": 0,
    "hotel": false,
    "mortgaged": false
  },
  {
    "id": "tile-31",
    "position": {
      "x": 10,
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
    "id": "tile-32",
    "position": {
      "x": 10,
      "y": 4
    },
    "type": "chance",
    "name": "Fortune"
  },
  {
    "id": "tile-33",
    "position": {
      "x": 10,
      "y": 5
    },
    "type": "property",
    "name": "United States",
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
    "id": "tile-34",
    "position": {
      "x": 10,
      "y": 6
    },
    "type": "utility",
    "name": "World Power Grid",
    "purchasePrice": 150,
    "baseRent": 4,
    "ownerId": null,
    "mortgaged": false
  },
  {
    "id": "tile-35",
    "position": {
      "x": 10,
      "y": 7
    },
    "type": "luxuryTax",
    "name": "Luxury Tax",
    "amount": 120
  }
] as Tile[];

export const fortuneBoard: BoardConfig = {
  id: "fortune",
  name: "Fortune",
  version: "0.1.0",
  width: 11,
  height: 9,
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
