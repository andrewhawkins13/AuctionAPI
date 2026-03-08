import { jitter, normalizeBid } from "./utils.js";

/**
 * Analytical Ada: budget-proportional bidding with catch-up logic.
 * Base = currency / remaining rounds, +/- 20% variance, 1.3x if behind by 3+ properties.
 * @param {{ currency: number, currentRound: number, totalRounds: number, roundHistory: object[], botId: string }} context
 * @returns {number} Bid amount
 */
export function analyticalBid({ currency, currentRound, totalRounds, roundHistory, botId }) {
  const remaining = totalRounds - currentRound + 1;
  let base = currency / remaining;

  // +/- 20% variance
  const variance = 0.8 + Math.random() * 0.4;
  base *= variance;

  // Catch-up: if any opponent has 3+ more properties than this bot
  let myWins = 0;
  const opponentWins = {};
  for (const round of roundHistory) {
    if (!round.winnerId) continue;
    if (round.winnerId === botId) {
      myWins++;
    } else {
      opponentWins[round.winnerId] = (opponentWins[round.winnerId] || 0) + 1;
    }
  }
  for (const wins of Object.values(opponentWins)) {
    if (wins >= myWins + 3) {
      base *= 1.3;
      break;
    }
  }

  return normalizeBid(base + jitter(), currency) || Math.min(1, Math.max(0, currency));
}
