import { marketBid } from "./market.js";
import { chaosBid } from "./chaos.js";
import { analyticalBid } from "./analytical.js";

const strategies = {
  market: marketBid,
  chaos: chaosBid,
  analytical: analyticalBid,
};

export function getBid(strategy, context) {
  return strategies[strategy](context);
}
