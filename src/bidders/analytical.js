/**
 * Analytical Ada: budget-proportional bidding with catch-up logic.
 * Base = currency / remaining rounds, +/- 20% variance, 1.3x if behind by 3+ properties.
 * @param {{ currency: number, currentRound: number, totalRounds: number, roundHistory: object[] }} context
 * @returns {number} Bid amount
 */
export function analyticalBid({ currency, currentRound, totalRounds, roundHistory }) {
  if (currency <= 0) return 0;

  const remaining = totalRounds - currentRound + 1;
  let base = currency / remaining;

  // +/- 20% variance
  const variance = 0.8 + Math.random() * 0.4;
  base *= variance;

  // Catch-up: if any opponent has 3+ more properties than this bot
  const myWins = roundHistory.filter((r) => r.winnerId === "analytical-bot").length;
  const opponentWins = {};
  for (const round of roundHistory) {
    if (round.winnerId && round.winnerId !== "analytical-bot") {
      opponentWins[round.winnerId] = (opponentWins[round.winnerId] || 0) + 1;
    }
  }
  for (const wins of Object.values(opponentWins)) {
    if (wins >= myWins + 3) {
      base *= 1.3;
      break;
    }
  }

  const jitter = Math.floor(Math.random() * 10) + 1;
  let bid = Math.max(1, Math.min(Math.floor(base) + jitter, currency));
  return bid;
}
