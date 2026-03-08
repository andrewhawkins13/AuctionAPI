import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createGame, resolveRound, autoResolveRemainingRounds, getResults, games, PLAYER_ID } from "../src/models/game.js";

const EXPECTED_PROPERTIES = [
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

describe("createGame", () => {
  it("returns valid structure with 4 players and 10 properties", () => {
    const game = createGame();
    assert.equal(game.status, "in_progress");
    assert.equal(game.currentRound, 1);
    assert.equal(game.roundPhase, "bidding");
    assert.equal(game.players.length, 4);
    assert.equal(game.properties.length, 10);
    assert.equal(game.rounds.length, 0);
    assert.ok(game.id.length === 8, "ID should be 8 hex chars");
  });

  it("properties match the hardcoded list", () => {
    const game = createGame();
    const names = game.properties.map((p) => p.name);
    assert.deepEqual(names, EXPECTED_PROPERTIES);
  });

  it("stores the game in the games Map", () => {
    const game = createGame();
    assert.equal(games.get(game.id), game);
  });
});

describe("resolveRound", () => {
  let game;

  beforeEach(() => {
    game = createGame();
  });

  it("correctly identifies winner as highest bidder", () => {
    const result = resolveRound(game, 999);
    assert.equal(result.round, 1);
    assert.ok(result.winnerId, "Should have a winner");
    assert.ok(result.winningBid > 0, "Winning bid should be positive");
  });

  it("deducts currency from winner only", () => {
    const currenciesBefore = game.players.map((p) => p.currency);
    const result = resolveRound(game, 100);

    const winner = game.players.find((p) => p.id === result.winnerId);
    const losers = game.players.filter((p) => p.id !== result.winnerId);

    const winnerBefore = currenciesBefore[game.players.indexOf(winner)];
    assert.equal(winner.currency, winnerBefore - result.winningBid);

    for (const loser of losers) {
      assert.equal(loser.currency, 1000);
    }
  });

  it("advances round", () => {
    resolveRound(game, 100);
    assert.equal(game.currentRound, 2);
    assert.equal(game.roundPhase, "bidding");
  });

  it("sets status to completed after round 10", () => {
    for (let i = 0; i < 10; i++) {
      resolveRound(game, 1);
    }
    assert.equal(game.status, "completed");
  });

  it("accepts a $0 bid from the player", () => {
    const result = resolveRound(game, 0);
    const playerBid = result.bids.find((b) => b.playerId === PLAYER_ID);
    assert.equal(playerBid.amount, 0);
    assert.ok(result.winnerId !== PLAYER_ID, "Player should not win with a $0 bid");
    assert.ok(result.winningBid > 0, "A CPU should win");
  });

  it("returns empty tiedWith when only one player bids", () => {
    for (const p of game.players) {
      if (p.type === "cpu") p.currency = 0;
    }
    const result = resolveRound(game, 50);
    assert.ok(Array.isArray(result.tiedWith));
    assert.equal(result.winnerId, PLAYER_ID);
    assert.deepEqual(result.tiedWith, []);
  });

  it("populates tiedWith when multiple players bid the same highest amount", () => {
    for (const p of game.players) {
      if (p.type === "cpu") p.currency = p.id === "market-bot" ? 1 : 0;
    }
    const result = resolveRound(game, 1);
    assert.deepEqual(result.tiedWith, [PLAYER_ID, "market-bot"]);
    assert.ok([PLAYER_ID, "market-bot"].includes(result.winnerId));
    assert.equal(result.winningBid, 1);
  });

  it("returns empty tiedWith when there is no tie", () => {
    const result = resolveRound(game, 999);
    assert.deepEqual(result.tiedWith, []);
    assert.equal(result.winnerId, PLAYER_ID);
  });

  it("handles a round where all bids are 0 (no winner)", () => {
    for (const p of game.players) {
      if (p.type === "cpu") p.currency = 0;
    }
    const result = resolveRound(game, 0);
    assert.equal(result.winnerId, null);
    assert.equal(result.winningBid, 0);
    assert.equal(result.bids.length, 4);
    const property = game.properties[0];
    assert.equal(property.winningBid, null, "Property should remain unclaimed");
    assert.equal(property.winnerId, null);
  });
});

describe("autoResolveRemainingRounds", () => {
  it("completes the game and returns all round results", () => {
    const game = createGame();
    // Play 5 rounds manually
    for (let i = 0; i < 5; i++) {
      resolveRound(game, 1);
    }
    assert.equal(game.status, "in_progress");

    const results = autoResolveRemainingRounds(game);
    assert.equal(results.length, 5);
    assert.equal(game.status, "completed");
    assert.equal(game.rounds.length, 10);
  });

  it("returns empty array when game is already completed", () => {
    const game = createGame();
    for (let i = 0; i < 10; i++) {
      resolveRound(game, 1);
    }
    const results = autoResolveRemainingRounds(game);
    assert.equal(results.length, 0);
  });
});

describe("getResults", () => {
  it("returns players sorted by properties won (tiebreak: currency)", () => {
    const game = createGame();
    for (let i = 0; i < 10; i++) {
      resolveRound(game, 1);
    }
    assert.equal(game.status, "completed");

    const results = getResults(game);
    assert.equal(results.scoreboard.length, 4);
    assert.ok(results.winner, "Should have a winner");

    for (let i = 0; i < results.scoreboard.length - 1; i++) {
      const curr = results.scoreboard[i];
      const next = results.scoreboard[i + 1];
      if (curr.propertyCount === next.propertyCount) {
        assert.ok(curr.currencyRemaining >= next.currencyRemaining, "Tiebreak should be by currency");
      } else {
        assert.ok(curr.propertyCount > next.propertyCount, "Should be sorted by property count desc");
      }
    }
  });
});
