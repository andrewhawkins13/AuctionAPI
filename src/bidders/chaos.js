/**
 * Chaos Cleo: bimodal coin-flip strategy.
 * Heads = 40-50% of currency, tails = 5-10%. Nothing in between.
 * @param {{ currency: number }} context
 * @returns {number} Bid amount
 */
export function chaosBid({ currency }) {
  if (currency <= 0) return 0;

  const coinFlip = Math.random() < 0.5;
  let bid;

  if (coinFlip) {
    // High: 40-50% of currency
    bid = Math.floor(currency * (0.4 + Math.random() * 0.1));
  } else {
    // Low: 5-10% of currency
    bid = Math.floor(currency * (0.05 + Math.random() * 0.05));
  }

  const jitter = Math.floor(Math.random() * 10) + 1;
  bid = Math.max(1, Math.min(bid + jitter, currency));
  return Math.floor(bid);
}
