export function jitter() {
  return Math.floor(Math.random() * 10) + 1;
}

export function normalizeBid(bid, currency) {
  return Math.max(0, Math.min(Math.floor(bid), currency));
}
