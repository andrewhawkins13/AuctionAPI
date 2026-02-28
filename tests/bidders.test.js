import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { marketBid } from "../src/bidders/market.js";
import { chaosBid } from "../src/bidders/chaos.js";
import { analyticalBid } from "../src/bidders/analytical.js";

const baseContext = {
  currency: 1000,
  currentRound: 1,
  totalRounds: 10,
  roundHistory: [],
};

describe("marketBid", () => {
  it("returns 0 when currency is 0", () => {
    assert.equal(marketBid({ ...baseContext, currency: 0 }), 0);
  });

  it("bids exactly 15 (plus jitter 1-10) on round 1", () => {
    for (let i = 0; i < 50; i++) {
      const bid = marketBid({ ...baseContext });
      assert.ok(bid >= 16 && bid <= 25, `Round 1 bid ${bid} should be 16-25 (15 + jitter 1-10)`);
    }
  });

  it("bids within 5-15% above previous winning bid", () => {
    const context = {
      ...baseContext,
      currentRound: 3,
      roundHistory: [
        { round: 1, winningBid: 100, winnerId: "player", bids: [], tiedWith: [] },
        { round: 2, winningBid: 200, winnerId: "player", bids: [], tiedWith: [] },
      ],
    };

    for (let i = 0; i < 50; i++) {
      const bid = marketBid(context);
      // 200 * 1.05 = 210, 200 * 1.15 = 230, + jitter 1-10 => 211-240, capped at 1000
      assert.ok(bid >= 211 && bid <= 240, `Bid ${bid} should be in range 211-240`);
    }
  });

  it("returns a positive integer <= currency", () => {
    for (let i = 0; i < 50; i++) {
      const bid = marketBid({ ...baseContext, currency: 500 });
      assert.ok(Number.isInteger(bid), `Bid ${bid} should be an integer`);
      assert.ok(bid >= 1, `Bid ${bid} should be >= 1`);
      assert.ok(bid <= 500, `Bid ${bid} should be <= currency 500`);
    }
  });

  it("returns at least 1 with low currency", () => {
    const bid = marketBid({ ...baseContext, currency: 1 });
    assert.equal(bid, 1);
  });
});

describe("chaosBid", () => {
  it("returns 0 when currency is 0", () => {
    assert.equal(chaosBid({ ...baseContext, currency: 0 }), 0);
  });

  it("produces a bimodal distribution", () => {
    const bids = [];
    for (let i = 0; i < 200; i++) {
      bids.push(chaosBid({ ...baseContext, currency: 1000 }));
    }

    const low = bids.filter((b) => b <= 150); // ~15% of 1000
    const high = bids.filter((b) => b >= 350); // ~35% of 1000

    // With 200 samples, we should see both clusters
    assert.ok(low.length > 10, `Expected >10 low bids, got ${low.length}`);
    assert.ok(high.length > 10, `Expected >10 high bids, got ${high.length}`);

    // Mid-range (150-350) should be rare — only jitter overlap
    const mid = bids.filter((b) => b > 150 && b < 350);
    assert.ok(mid.length < low.length, `Mid-range (${mid.length}) should be less than low cluster (${low.length})`);
  });

  it("returns a positive integer <= currency", () => {
    for (let i = 0; i < 50; i++) {
      const bid = chaosBid({ ...baseContext, currency: 500 });
      assert.ok(Number.isInteger(bid), `Bid ${bid} should be an integer`);
      assert.ok(bid >= 1, `Bid ${bid} should be >= 1`);
      assert.ok(bid <= 500, `Bid ${bid} should be <= currency 500`);
    }
  });

  it("returns at least 1 with low currency", () => {
    const bid = chaosBid({ ...baseContext, currency: 1 });
    assert.equal(bid, 1);
  });
});

describe("analyticalBid", () => {
  it("returns 0 when currency is 0", () => {
    assert.equal(analyticalBid({ ...baseContext, currency: 0 }), 0);
  });

  it("returns a positive integer <= currency", () => {
    for (let i = 0; i < 50; i++) {
      const bid = analyticalBid({ ...baseContext, currency: 500 });
      assert.ok(Number.isInteger(bid), `Bid ${bid} should be an integer`);
      assert.ok(bid >= 1, `Bid ${bid} should be >= 1`);
      assert.ok(bid <= 500, `Bid ${bid} should be <= currency 500`);
    }
  });

  it("increases bid when behind by 3+ properties", () => {
    const behindHistory = [
      { round: 1, winnerId: "player", winningBid: 100, bids: [], tiedWith: [] },
      { round: 2, winnerId: "player", winningBid: 100, bids: [], tiedWith: [] },
      { round: 3, winnerId: "player", winningBid: 100, bids: [], tiedWith: [] },
      { round: 4, winnerId: "player", winningBid: 100, bids: [], tiedWith: [] },
    ];

    const normalBids = [];
    const catchupBids = [];

    for (let i = 0; i < 100; i++) {
      normalBids.push(analyticalBid({ ...baseContext, currentRound: 5, roundHistory: [] }));
      catchupBids.push(analyticalBid({ ...baseContext, currentRound: 5, roundHistory: behindHistory }));
    }

    const normalAvg = normalBids.reduce((a, b) => a + b, 0) / normalBids.length;
    const catchupAvg = catchupBids.reduce((a, b) => a + b, 0) / catchupBids.length;

    assert.ok(catchupAvg > normalAvg, `Catch-up avg ${catchupAvg} should be > normal avg ${normalAvg}`);
  });

  it("returns at least 1 with low currency", () => {
    const bid = analyticalBid({ ...baseContext, currency: 1 });
    assert.equal(bid, 1);
  });
});
