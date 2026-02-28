import { Hono } from "hono";
import { createGame, games, resolveRound, getResults } from "../models/game.js";

const app = new Hono();

app.post("/games", (c) => {
  const game = createGame();
  return c.json({ gameId: game.id, game }, 201);
});

app.get("/games/:id", (c) => {
  const game = games.get(c.req.param("id"));
  if (!game) return c.json({ error: "Game not found" }, 404);

  return c.json(game);
});

app.post("/games/:id/bid", async (c) => {
  const game = games.get(c.req.param("id"));
  if (!game) return c.json({ error: "Game not found" }, 404);

  if (game.status === "completed") {
    return c.json({ error: "Game already completed" }, 409);
  }

  if (game.roundPhase === "resolved") {
    return c.json({ error: "Round already resolved" }, 409);
  }

  const body = await c.req.json();
  const { amount } = body;

  if (amount === undefined || amount === null) {
    return c.json({ error: "Missing bid amount" }, 400);
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    return c.json({ error: "Bid must be a positive integer" }, 400);
  }

  const player = game.players.find((p) => p.id === "player");
  if (amount > player.currency) {
    return c.json({ error: "Bid exceeds available currency" }, 400);
  }

  const roundResult = resolveRound(game, amount);
  return c.json({ round: roundResult, game });
});

app.get("/games/:id/results", (c) => {
  const game = games.get(c.req.param("id"));
  if (!game) return c.json({ error: "Game not found" }, 404);

  if (game.status !== "completed") {
    return c.json({ error: "Game still in progress" }, 409);
  }

  return c.json(getResults(game));
});

export default app;
