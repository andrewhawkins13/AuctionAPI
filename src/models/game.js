import crypto from "node:crypto";
import { getBid } from "../bidders/index.js";

export const PLAYER_ID = "player";

export const PLAYERS = [
  {
    id: PLAYER_ID,
    name: "You",
    currency: 1000,
    type: "human",
    propertiesWon: [],
  },
  {
    id: "market-bot",
    name: "Market Mike",
    currency: 1000,
    type: "cpu",
    strategy: "market",
    propertiesWon: [],
  },
  {
    id: "chaos-bot",
    name: "Chaos Cleo",
    currency: 1000,
    type: "cpu",
    strategy: "chaos",
    propertiesWon: [],
  },
  {
    id: "analytical-bot",
    name: "Analytical Ada",
    currency: 1000,
    type: "cpu",
    strategy: "analytical",
    propertiesWon: [],
  },
]

const PROPERTIES = [
  "The Rusty Spoon Diner",
  "Sunset Pier Bungalow",
  "Haunted Victorian on Elm",
  "Downtown Parking Garage",
  "Abandoned Mall (with food court)",
  "Cliffside Lighthouse",
  "Penthouse Above the Taco Shop",
  "Swamp Adjacent Golf Course",
  "The Volcano View Estate",
  "Secret Underground Bunker",
];

const TOTAL_ROUNDS = 10;

// TODO: TTL eviction for stale games
export const games = new Map();

/** @returns {object} New game instance */
export function createGame() {
  const id = crypto.randomBytes(4).toString("hex");

  const game = {
    id,
    status: "in_progress",
    currentRound: 1,
    roundPhase: "bidding",
    players: JSON.parse(JSON.stringify(PLAYERS)),
    properties: PROPERTIES.map((name, i) => ({
      id: i + 1,
      name,
      round: i + 1,
      winningBid: null,
      winnerId: null,
    })),
    rounds: [],
  };

  games.set(id, game);
  return game;
}

/** @returns {object} Round result with bids, winnerId, winningBid, tiedWith */
export function resolveRound(game, playerBidAmount) {
  const round = game.currentRound;
  const property = game.properties[round - 1];

  const bids = [];

  bids.push({ playerId: PLAYER_ID, amount: playerBidAmount });

  for (const player of game.players) {
    if (player.type !== "cpu") continue;

    const context = {
      currency: player.currency,
      currentRound: round,
      totalRounds: TOTAL_ROUNDS,
      roundHistory: game.rounds,
      botId: player.id,
    };

    const amount = getBid(player.strategy, context);
    bids.push({ playerId: player.id, amount });
  }

  const maxBid = Math.max(...bids.map((b) => b.amount));

  let winnerId = null;
  let winningBid = 0;
  let tiedWith = [];

  if (maxBid > 0) {
    const topBidders = bids.filter((b) => b.amount === maxBid);

    if (topBidders.length > 1) {
      tiedWith = topBidders.map((b) => b.playerId);
    }

    const winner = topBidders[Math.floor(Math.random() * topBidders.length)];
    winnerId = winner.playerId;
    winningBid = maxBid;

    const winnerPlayer = game.players.find((p) => p.id === winnerId);
    winnerPlayer.currency -= winningBid;
    winnerPlayer.propertiesWon.push(property.name);

    property.winningBid = winningBid;
    property.winnerId = winnerId;
  }

  const roundResult = {
    round,
    propertyId: property.id,
    bids,
    winnerId,
    winningBid,
    tiedWith,
  };

  game.rounds.push(roundResult);
  game.roundPhase = "resolved";

  if (round >= TOTAL_ROUNDS) {
    game.status = "completed";
  } else {
    game.currentRound = round + 1;
    game.roundPhase = "bidding";
  }

  return roundResult;
}

/** @returns {object[]} Array of round results from auto-resolving remaining rounds */
export function autoResolveRemainingRounds(game) {
  const results = [];
  while (game.status !== "completed") {
    results.push(resolveRound(game, 0));
  }
  return results;
}

/** @returns {object} Final game results with winner, scoreboard, and rounds */
export function getResults(game) {
  const scoreboard = game.players
    .map((p) => ({
      id: p.id,
      name: p.name,
      propertiesWon: p.propertiesWon,
      propertyCount: p.propertiesWon.length,
      currencyRemaining: p.currency,
    }))
    .sort(
      (a, b) =>
        b.propertyCount - a.propertyCount ||
        b.currencyRemaining - a.currencyRemaining,
    );

  return {
    winner: scoreboard[0],
    scoreboard,
    rounds: game.rounds,
  };
}
