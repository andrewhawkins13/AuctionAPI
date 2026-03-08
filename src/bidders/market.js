import { jitter, normalizeBid } from "./index.js";

/**
 * Market Mike: anchors to previous winning bid + 5-15% increment.
 * Opens round 1 with a flat 15 to feel out the field.
 * @param {{ currency: number, currentRound: number, roundHistory: object[] }} context
 * @returns {number} Bid amount
 */
export function marketBid({ currency, currentRound, roundHistory }) {
  let bid;

  if (currentRound === 1) {
    bid = 15;
  } else {
    const lastRound = roundHistory[roundHistory.length - 1];
    const increment = 1 + 0.05 + Math.random() * 0.1; // 5-15%
    bid = Math.floor(lastRound.winningBid * increment);
  }

  return normalizeBid(bid + jitter(), currency) || 1;
}
