import { marketBid } from "./market.js";
import { chaosBid } from "./chaos.js";
import { analyticalBid } from "./analytical.js";

const strategies = {
  market: marketBid,
  chaos: chaosBid,
  analytical: analyticalBid,
};

export function jitter() {
  return Math.floor(Math.random() * 10) + 1;
}

export function normalizeBid(bid, currency) {
  return Math.max(0, Math.min(Math.floor(bid), currency));
}

export function getBid(strategy, context) {
  if (context.currency <= 0) return 0;

  return strategies[strategy](context);
}
