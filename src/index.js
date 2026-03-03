import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import gameRoutes from "./routes/game.js";

const app = new Hono();

app.use("*", cors());

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/", gameRoutes);

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

serve({ fetch: app.fetch, port: 3000 }, () => {
  console.log("Auction API running on http://localhost:3000");
  console.log("Routes:");
  console.log("  GET  /health        Health check");
  console.log("  POST /games         Create a new game");
  console.log("  GET  /games/:id     Get game state");
  console.log("  POST /games/:id/bid Place a bid");
  console.log("  GET  /games/:id/results  Get final results");
});
