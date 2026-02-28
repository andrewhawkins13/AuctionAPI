import { marketBid } from "./market.js";
import { chaosBid } from "./chaos.js";
import { analyticalBid } from "./analytical.js";

const strategies = {
  market: marketBid,
  chaos: chaosBid,
  analytical: analyticalBid,
};

/**
 * Get a bid from the named strategy.
 * @param {string} strategy - One of "market", "chaos", "analytical"
 * @param {object} context - Bidder context (currency, currentRound, totalRounds, roundHistory)
 * @returns {number} Bid amount
 */
export function getBid(strategy, context) {
  return strategies[strategy](context);
}
