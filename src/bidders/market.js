/**
 * Market Mike: anchors to previous winning bid + 5-15% increment.
 * Opens round 1 with a flat 15 to feel out the field.
 * @param {{ currency: number, currentRound: number, roundHistory: object[] }} context
 * @returns {number} Bid amount
 */
export function marketBid({ currency, currentRound, roundHistory }) {
  if (currency <= 0) return 0;

  let bid;

  if (currentRound === 1) {
    bid = 15;
  } else {
    const lastRound = roundHistory[roundHistory.length - 1];
    const increment = 1 + 0.05 + Math.random() * 0.1; // 5-15%
    bid = Math.floor(lastRound.winningBid * increment);
  }

  const jitter = Math.floor(Math.random() * 10) + 1;
  bid = Math.max(1, Math.min(bid + jitter, currency));
  return Math.floor(bid);
}
