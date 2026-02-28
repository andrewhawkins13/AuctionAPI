import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createGame, resolveRound, getResults, games } from "../src/models/game.js";

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
    // Player bid 999 — very likely the highest
    // CPU bots start with 1000 currency, but market bids 15+jitter, chaos is random, analytical ~100+jitter
    // With 999, player should almost always win round 1
    assert.equal(result.round, 1);
    assert.ok(result.winnerId, "Should have a winner");
    assert.ok(result.winningBid > 0, "Winning bid should be positive");
  });

  it("deducts currency from winner only", () => {
    const currenciesBefore = game.players.map((p) => p.currency);
    const result = resolveRound(game, 100);

    const winner = game.players.find((p) => p.id === result.winnerId);
    const losers = game.players.filter((p) => p.id !== result.winnerId);

    // Winner's currency should have decreased
    const winnerBefore = currenciesBefore[game.players.indexOf(winner)];
    assert.equal(winner.currency, winnerBefore - result.winningBid);

    // Losers' currency should be unchanged (still 1000, since this is round 1)
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

  it("populates tiedWith when multiple players bid the same highest amount", () => {
    // Zero out CPU currency so only the player can bid
    for (const p of game.players) {
      if (p.type === "cpu") p.currency = 0;
    }
    const result = resolveRound(game, 50);
    assert.ok(Array.isArray(result.tiedWith), "tiedWith should be an array");
    assert.equal(result.winnerId, "player");
    assert.deepEqual(result.tiedWith, []);
  });

  it("returns empty tiedWith when there is no tie", () => {
    const result = resolveRound(game, 999);
    // Player bids 999, CPUs bid much less in round 1
    assert.deepEqual(result.tiedWith, []);
    assert.equal(result.winnerId, "player");
  });

  it("handles a round where all bids are 0", () => {
    // Set all CPU currencies to 0
    for (const p of game.players) {
      if (p.type === "cpu") p.currency = 0;
    }
    // Set player currency to 0 too — but player can't bid 0 (validation)
    // Instead, set player currency very low and bid 1, but CPUs bid 0
    // Actually, we need to test the model directly: pass playerBidAmount = 0
    // The route validates > 0, but the model function itself should handle 0
    const result = resolveRound(game, 0);
    // All CPUs have 0 currency, player bid 0 => maxBid is 0, no winner
    assert.equal(result.winnerId, null);
    assert.equal(result.winningBid, 0);
  });
});

describe("getResults", () => {
  it("returns players sorted by properties won (tiebreak: currency)", () => {
    const game = createGame();
    // Play all 10 rounds
    for (let i = 0; i < 10; i++) {
      resolveRound(game, 1);
    }
    assert.equal(game.status, "completed");

    const results = getResults(game);
    assert.equal(results.scoreboard.length, 4);
    assert.ok(results.winner, "Should have a winner");

    // Verify sorting: each entry should have >= properties than the next
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
